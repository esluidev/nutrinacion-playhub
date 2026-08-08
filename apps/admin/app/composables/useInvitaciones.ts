import type { RealtimeChannel } from '@supabase/supabase-js'

// Bandeja de invitaciones de la persona autenticada: las dirigidas a SU correo.
//
// Una invitación a un correo que YA tiene cuenta no se canjea por link: aparece aquí y se
// acepta/rechaza estando dentro de la app (no hay identidad que probar, ya estás autenticado).
// El link con token es solo para quien todavía no tiene cuenta.
//
// El filtro por correo lo aplica el RLS (0005); el `.eq()` de aquí es por claridad y para no
// traer de más, no es la barrera de seguridad. Responder va por Edge Function: con el RLS
// actual el cliente no puede insertar sus propias pertenencias, y no debería poder.

export interface InvitacionMia {
  id: number
  token: string
  role: string
  estado: string
  expira_en: string | null
  created_at: string
  organizaciones: { id: number, nombre: string } | null
  comunidades: { id: number, nombre: string } | null
}

const SELECT = `
  id, token, role, estado, expira_en, created_at,
  organizaciones ( id, nombre ),
  comunidades ( id, nombre )
`

// Canal de Realtime único para toda la app: un RealtimeChannel no es estado serializable,
// así que no puede vivir en `useState`. La app es SPA con un solo cliente de Supabase.
let canal: RealtimeChannel | null = null

export function useInvitaciones() {
  // El cliente se resuelve POR LLAMADA, no al invocar el composable: `utils/supabase.ts`
  // lanza si faltan las env vars, así que construirlo aquí hacía que bastara con llamar a
  // este composable para tumbar la página en dev sin Supabase.
  const supabase = () => useSupabaseClient()
  const { t } = useT()

  // Compartido: el indicador del header y la página leen el mismo estado.
  const pendientes = useState<InvitacionMia[]>('invitaciones-pendientes', () => [])

  function vigente(i: InvitacionMia) {
    return i.estado === 'PENDIENTE' && (!i.expira_en || new Date(i.expira_en).getTime() > Date.now())
  }

  // Cómo se lee una invitación. Vive aquí porque la usan el dropdown del header y la bandeja.
  function titulo(i: InvitacionMia) {
    return i.role === 'ADMIN'
      ? t('inbox.toAdmin', { org: i.organizaciones?.nombre ?? '—' })
      : t('inbox.toCollab', { com: i.comunidades?.nombre ?? '—' })
  }

  // Para colaborador, da el contexto de a qué organización pertenece esa comunidad.
  function subtitulo(i: InvitacionMia) {
    const rol = i.role === 'ADMIN' ? t('auth.invite.roleAdmin') : t('auth.invite.roleCollab')
    return i.role === 'ADMIN' ? rol : `${rol} · ${i.organizaciones?.nombre ?? ''}`
  }

  async function listMias(): Promise<InvitacionMia[]> {
    const { user } = useAuth()
    const email = user.value?.email
    if (!email || !isSupabaseConfigured()) return []

    const { data } = await supabase()
      .from('invitaciones')
      .select(SELECT)
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })

    return (data as unknown as InvitacionMia[] | null) ?? []
  }

  // Solo las accionables: pendientes y sin vencer. Alimenta el contador del header.
  async function refreshPendientes() {
    const todas = await listMias()
    pendientes.value = todas.filter(vigente)
    return pendientes.value
  }

  async function responder(token: string, accion: 'aceptar' | 'rechazar') {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { data, error } = await supabase().functions.invoke('canjear-invitacion', {
      body: { action: accion, token },
    })

    if (error) return { error: 'No se pudo responder la invitación. Intenta de nuevo.' }
    if (!data?.ok) return { error: (data?.error as string) || 'No se pudo responder la invitación.' }

    // Aceptar cambia a qué organizaciones/comunidades tienes acceso → recargar el contexto.
    if (accion === 'aceptar') await useAuth().fetchUser()
    await refreshPendientes()
    return { error: null }
  }

  // ── Realtime (migración 0010) ────────────────────────────────────────────────
  // Te invitan con la sesión abierta y el sobre del header lo refleja al instante, sin
  // recargar. El canal es UNO para toda la app (SPA, un solo cliente): por eso vive a nivel
  // de módulo y no en `useState` — un RealtimeChannel no es estado serializable.
  //
  // El filtro por correo es la clave: sin él llegarían también las invitaciones de las orgs
  // que administro (el RLS las permite) y el contador del sobre —que es "las MÍAS"— se
  // recalcularía por eventos que no le tocan.
  async function suscribir(email: string) {
    if (canal || !isSupabaseConfigured() || !email) return
    canal = useSupabaseClient()
      .channel('invitaciones-propias')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invitaciones', filter: `email=eq.${email.toLowerCase()}` },
        () => { refreshPendientes() },
      )
      .subscribe()
  }

  async function desuscribir() {
    if (!canal) return
    const anterior = canal
    canal = null
    await useSupabaseClient().removeChannel(anterior)
  }

  return { pendientes, vigente, titulo, subtitulo, listMias, refreshPendientes, responder, suscribir, desuscribir }
}
