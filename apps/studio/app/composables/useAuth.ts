import type { AuthUser } from '~/types/auth'

// ─────────────────────────────────────────────────────────────────────────────
// Auth real contra Supabase, restringida a SUPERADMIN.
//
// Studio es la herramienta interna del equipo Nutrinación: acá no entran usuarios de una
// comunidad. La puerta es `perfiles.superadmin`; quien no lo sea queda fuera aunque su cuenta
// sea válida (se cierra la sesión en el acto para no dejarla a medias).
//
// Studio SOLO LEE de la base: el registro y la administración del catálogo viven en
// admin/Platform (tarea 030), y la escritura además está cerrada por RLS (migración 0009).
//
// El runner (`/play/**`) queda FUERA de esta protección — lo abre la app de educadores en un
// webview, sin sesión. Ese guard vive en `middleware/auth.global.ts`.
// ─────────────────────────────────────────────────────────────────────────────

interface PerfilRow {
  nombre: string | null
  apellido: string | null
  email: string | null
  superadmin: boolean
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => true)

  // Resuelve la sesión de Supabase a un usuario de Studio. Sin sesión, sin perfil o sin
  // superadmin ⇒ `user` queda en null y el middleware manda al login.
  async function fetchUser() {
    loading.value = true
    try {
      if (!isSupabaseConfigured()) {
        user.value = null
        return
      }

      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        user.value = null
        return
      }

      const { data } = await supabase
        .from('perfiles')
        .select('nombre, apellido, email, superadmin')
        .eq('usuario_id', session.user.id)
        .maybeSingle()

      const perfil = data as PerfilRow | null
      if (!perfil?.superadmin) {
        user.value = null
        return
      }

      const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ').trim()
      user.value = {
        id: session.user.id,
        email: perfil.email ?? session.user.email ?? '',
        name: nombre || perfil.email || session.user.email || 'Studio',
      }
    }
    catch {
      user.value = null
    }
    finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase no está configurado en esta instancia de Studio.' }
    }

    // MISMO mensaje para credenciales malas y para cuenta sin permiso, a propósito: si el
    // rechazo por permiso dijera algo distinto, confirmaría que el correo existe y que la
    // contraseña era correcta, y de paso delataría que esto es un panel de administración.
    const RECHAZO = 'No pudimos iniciar sesión con esos datos.'

    const supabase = useSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: RECHAZO }

    await fetchUser()

    // Sesión válida pero sin permiso: se cierra (si no, el middleware la rechazaría en cada
    // navegación) y se responde exactamente igual que ante una contraseña equivocada.
    if (!user.value) {
      await supabase.auth.signOut()
      return { error: RECHAZO }
    }

    return { error: null }
  }

  async function signOut() {
    if (isSupabaseConfigured()) {
      await useSupabaseClient().auth.signOut()
    }
    user.value = null
    await navigateTo('/login')
  }

  return { user, loading, fetchUser, signIn, signOut }
}
