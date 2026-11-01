import type { AuthUser, InvitacionInfo, Organizacion, Perfil } from '~/utils/types'

// Los rechazos de Supabase Auth al fijar una contraseña, en el idioma de la interfaz.
function errorDePassword(error: { code?: string, message: string }) {
  const { t } = useT()
  if (error.code === 'same_password') return t('perfil.pwSame')
  if (error.code === 'weak_password') return t('auth.invite.pwShort')
  return error.message
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => true)

  // Resuelve la sesion actual → perfil + contexto (organizaciones que administro o donde colaboro).
  // Un usuario de Auth sin perfil = registro incompleto: no se considera autenticado.
  async function fetchUser() {
    if (!isSupabaseConfigured()) {
      loading.value = false
      return
    }

    const supabase = useSupabaseClient()

    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()

      if (error || !authUser) {
        user.value = null
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('usuario_id', authUser.id)
        .maybeSingle<Perfil>()

      if (!perfil) {
        user.value = null
        return
      }

      // Idioma de UI = idioma del perfil (es/en).
      useLocale().value = perfil.idioma === 'en' ? 'en' : 'es'

      // Superficie de acceso: las organizaciones que administro y aquellas donde soy colaborador
      // activo, cada una por su tabla de pertenencia (decisión 011). La organización viene
      // embebida porque el switcher la nombra. El superadmin no tiene acceso por serlo: debajo
      // de Platform solo ve lo suyo (la RLS lo filtra igual).
      const [{ data: adminRows }, { data: colabRows }] = await Promise.all([
        supabase.from('organizacion_administradores').select('titular, organizaciones(*)').eq('perfil_id', perfil.id),
        supabase.from('organizacion_colaboradores').select('organizaciones(*)').eq('perfil_id', perfil.id).eq('activo', true),
      ])

      const admin = ((adminRows as { titular: boolean, organizaciones: Organizacion }[] | null) ?? [])
        .filter(r => r.organizaciones)
      const colabora = ((colabRows as { organizaciones: Organizacion }[] | null) ?? [])
        .filter(r => r.organizaciones)

      user.value = {
        id: authUser.id,
        email: authUser.email!,
        perfil,
        organizaciones: admin.map(r => r.organizaciones),
        colaboraEn: colabora.map(r => r.organizaciones),
        titularDe: admin.filter(r => r.titular).map(r => r.organizaciones.id),
      }
    }
    catch {
      user.value = null
    }
    finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (!error && data.user) {
      await fetchUser()
    }

    return { data, error }
  }

  async function signOut() {
    const supabase = useSupabaseClient()
    await supabase.auth.signOut()
    user.value = null
    navigateTo('/login')
  }

  // Valida un token de invitacion (Edge Function con service role: el RLS impide leer
  // `invitaciones` a un visitante anonimo).
  async function validateInvitation(token: string): Promise<{ info: InvitacionInfo | null, error: string | null }> {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.functions.invoke('canjear-invitacion', {
      body: { action: 'validar', token },
    })

    if (error) return { info: null, error: 'No se pudo validar la invitacion. Intenta de nuevo.' }
    if (!data?.ok) return { info: null, error: data?.error || 'La invitacion no es valida.' }
    return { info: data.invitacion as InvitacionInfo, error: null }
  }

  // Canjea la invitacion: la Edge Function crea la cuenta de Auth + el perfil y enlaza a la
  // organizacion (como administrador o colaborador); luego iniciamos sesion con las credenciales
  // recien definidas.
  async function redeemInvitation(payload: {
    token: string
    email: string
    password: string
    nombre: string
    apellido: string
  }): Promise<{ error: string | null }> {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.functions.invoke('canjear-invitacion', {
      body: { action: 'canjear', ...payload },
    })

    if (error) return { error: 'No se pudo completar el registro. Intenta de nuevo.' }
    if (!data?.ok) return { error: data?.error || 'No se pudo completar el registro.' }

    const { error: signInError } = await signIn(payload.email, payload.password)
    return { error: signInError ? signInError.message : null }
  }

  // ── Mi cuenta ────────────────────────────────────────────────────────────────
  // El perfil propio: la base solo deja cambiar nombre, apellido, avatar e idioma (grant por columna).
  async function actualizarPerfil(datos: { nombre: string, apellido: string, idioma: 'es' | 'en' }) {
    if (!user.value) return { error: 'Sin sesión' }
    const { error } = await useSupabaseClient().from('perfiles').update({
      nombre: datos.nombre.trim() || null,
      apellido: datos.apellido.trim() || null,
      idioma: datos.idioma,
    }).eq('id', user.value.perfil.id)
    if (!error) await fetchUser()
    return { error: error?.message ?? null }
  }

  // Cambiar la contraseña pide la actual: se comprueba entrando con ella antes de cambiarla.
  async function cambiarPassword(actual: string, nueva: string): Promise<{ error: 'actual' | string | null }> {
    if (!user.value) return { error: 'Sin sesión' }
    const supabase = useSupabaseClient()
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.value.email, password: actual })
    if (e1) return { error: 'actual' }
    const { error } = await supabase.auth.updateUser({ password: nueva })
    return { error: error ? errorDePassword(error) : null }
  }

  // Admin no envía correos (decisión 009): el titular o soporte genera el enlace para elegir otra
  // contraseña y lo comparte. Quién puede lo decide la base (`recuperacion_autorizar`, 0011).
  async function generarEnlaceRecuperacion(email: string): Promise<{ enlace: string | null, error: string | null }> {
    if (!isSupabaseConfigured()) return { enlace: `${window.location.origin}/restablecer?token_hash=demo`, error: null }
    const { data, error } = await useSupabaseClient().functions.invoke('enlace-recuperacion', {
      body: { email: email.trim() },
    })
    if (error) return { enlace: null, error: 'No se pudo generar el enlace. Intenta de nuevo.' }
    if (!data?.ok) return { enlace: null, error: data?.error || 'No se pudo generar el enlace.' }
    return { enlace: `${window.location.origin}/restablecer?token_hash=${encodeURIComponent(data.token_hash)}`, error: null }
  }

  // /restablecer canjea el token del enlace al guardar, no al abrirlo: abre la sesión de esa cuenta
  // (sustituye la que hubiera en el navegador). Sirve una vez; vencido o usado, falla.
  async function canjearEnlaceRecuperacion(tokenHash: string): Promise<{ error: string | null }> {
    const { error } = await useSupabaseClient().auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
    return { error: error?.message ?? null }
  }

  // Con la sesión del enlace ya canjeado, la nueva contraseña.
  async function restablecerPassword(nueva: string) {
    const { error } = await useSupabaseClient().auth.updateUser({ password: nueva })
    return { error: error ? errorDePassword(error) : null }
  }

  return {
    user, loading, fetchUser, signIn, signOut, validateInvitation, redeemInvitation,
    actualizarPerfil, cambiarPassword, generarEnlaceRecuperacion, canjearEnlaceRecuperacion, restablecerPassword,
  }
}
