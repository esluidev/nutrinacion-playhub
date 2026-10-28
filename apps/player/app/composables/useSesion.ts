// Sesión de la gestión de Player: solo el superadmin (el equipo de Nutrinación) entra a
// construir, probar y publicar el contenido. Usa Supabase Auth con las mismas cuentas que
// Admin; un usuario sin `superadmin` no pasa de la entrada. El runner no pide sesión.

export interface UsuarioPlayer {
  nombre: string
  email: string
}

export function useSesion() {
  const usuario = useState<UsuarioPlayer | null>('player-usuario', () => null)
  const cargada = useState('player-sesion-cargada', () => false)

  // Lee la sesión guardada y comprueba en la base que sea superadmin.
  async function cargar() {
    if (cargada.value) return
    cargada.value = true
    usuario.value = null
    if (!isSupabaseConfigured()) return

    const supabase = useSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre, apellido, email, superadmin')
      .eq('usuario_id', user.id)
      .maybeSingle()

    if (!perfil?.superadmin) {
      await supabase.auth.signOut()
      return
    }
    usuario.value = {
      nombre: [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || (perfil.email ?? user.email ?? ''),
      email: perfil.email ?? user.email ?? '',
    }
  }

  /** Devuelve el error para mostrar, o null si entró. */
  async function entrar(email: string, password: string): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      return 'Player no tiene Supabase configurado (NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_ANON_KEY).'
    }
    const { error } = await useSupabaseClient().auth.signInWithPassword({ email: email.trim(), password })
    if (error) return 'Correo o contraseña incorrectos.'
    cargada.value = false
    await cargar()
    return usuario.value ? null : 'Player es solo para el equipo de Nutrinación (superadmin).'
  }

  async function salir() {
    if (isSupabaseConfigured()) await useSupabaseClient().auth.signOut()
    usuario.value = null
    await navigateTo('/entrar')
  }

  return { usuario, cargar, entrar, salir }
}
