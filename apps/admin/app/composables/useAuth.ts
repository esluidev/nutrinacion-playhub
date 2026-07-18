import type { AuthUser, ComunidadConOrg, InvitacionInfo, Organizacion, Perfil } from '~/utils/types'

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => true)

  // Resuelve la sesion actual → perfil + contexto (organizaciones propias, comunidades accesibles).
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

      // Superficie de acceso. Las comunidades las filtra el RLS (0002): devuelve las de las orgs
      // que administro + aquellas donde soy colaborador activo. Traemos la org embebida porque el
      // switcher agrupa por organización, y de una donde solo colaboro no sabríamos el nombre.
      // `colaboradores` se consulta aparte para distinguir CÓMO llego a cada comunidad: por
      // administrar su organización o por estar asignado a ella.
      const [{ data: adminRows }, { data: comunidades }, { data: colabRows }] = await Promise.all([
        supabase.from('organizacion_administradores').select('organizaciones(*)').eq('perfil_id', perfil.id),
        supabase.from('comunidades').select('*, organizaciones ( id, nombre )'),
        supabase.from('colaboradores').select('comunidad_id').eq('perfil_id', perfil.id).eq('activo', true),
      ])

      user.value = {
        id: authUser.id,
        email: authUser.email!,
        perfil,
        organizaciones: ((adminRows as { organizaciones: Organizacion }[] | null) ?? [])
          .map(r => r.organizaciones).filter(Boolean),
        comunidades: (comunidades as unknown as ComunidadConOrg[]) ?? [],
        colaboraEn: ((colabRows as { comunidad_id: number }[] | null) ?? []).map(r => r.comunidad_id),
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
  // organizacion/comunidad; luego iniciamos sesion con las credenciales recien definidas.
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

  return { user, loading, fetchUser, signIn, signOut, validateInvitation, redeemInvitation }
}
