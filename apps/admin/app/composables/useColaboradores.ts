// Colaboradores de la comunidad activa sobre Supabase: quiénes pueden operarla desde el
// admin. La invitación real la emite el admin de la org (RLS 0005/0006: role COLABORADOR
// de sus comunidades); el INSERT dispara el Database Webhook → correo.

export interface ColaboradorFila {
  id: number
  activo: boolean
  created_at: string
  nombre: string
  email: string
  initials: string
  avatarBg: string
}

export interface InvitacionColabPendiente {
  id: number
  email: string | null
  expira_en: string | null
  created_at: string
}

const AVATAR_COLORS = ['bg-violet-600', 'bg-cyan-600', 'bg-amber-600', 'bg-emerald-600', 'bg-rose-600'] as const

const DEMO_COLABORADORES: ColaboradorFila[] = [
  { id: 1, activo: true, created_at: '2026-06-01T00:00:00Z', nombre: 'Mariana González', email: 'mariana@nutrinacion.com', initials: 'MG', avatarBg: AVATAR_COLORS[0] },
  { id: 2, activo: false, created_at: '2026-05-12T00:00:00Z', nombre: 'Diego Ramírez', email: 'diego@nutrinacion.com', initials: 'DR', avatarBg: AVATAR_COLORS[1] },
]

interface ColaboradorRow {
  id: number
  activo: boolean
  created_at: string
  perfil: { id: number, nombre: string | null, apellido: string | null, email: string | null } | null
}

export function useColaboradores() {
  const demo = !isSupabaseConfigured()
  const { comunidadActiva, orgActiva } = useContexto()

  const state = useState<{ comunidadId: number | null, colaboradores: ColaboradorFila[], loading: boolean }>(
    'colaboradores-data',
    () => ({ comunidadId: null, colaboradores: demo ? DEMO_COLABORADORES : [], loading: false }),
  )

  async function refresh() {
    if (demo) return
    const cid = comunidadActiva.value?.id
    if (!cid) return
    state.value.loading = true
    const { data } = await useSupabaseClient()
      .from('colaboradores')
      .select('id, activo, created_at, perfil:perfiles ( id, nombre, apellido, email )')
      .eq('comunidad_id', cid)
      .order('created_at')
    state.value.colaboradores = (((data as unknown) as ColaboradorRow[] | null) ?? []).map((c) => {
      const nombre = [c.perfil?.nombre, c.perfil?.apellido].filter(Boolean).join(' ').trim()
        || c.perfil?.email || '—'
      return {
        id: c.id,
        activo: c.activo,
        created_at: c.created_at,
        nombre,
        email: c.perfil?.email ?? '—',
        initials: nombre.split(' ').slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase() || '?',
        avatarBg: AVATAR_COLORS[c.id % AVATAR_COLORS.length]!,
      }
    })
    state.value.comunidadId = cid
    state.value.loading = false
  }

  if (import.meta.client && !demo) {
    const cid = comunidadActiva.value?.id ?? null
    if (cid && state.value.comunidadId !== cid && !state.value.loading) refresh()
  }

  const colaboradores = computed(() => state.value.colaboradores)
  const loading = computed(() => state.value.loading)

  // Desactivar corta el acceso sin borrar historial; se puede reactivar.
  async function setActivo(id: number, activo: boolean) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('colaboradores').update({ activo }).eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  async function listInvitacionesPendientes(): Promise<InvitacionColabPendiente[]> {
    if (demo || !comunidadActiva.value) return []
    const { data } = await useSupabaseClient()
      .from('invitaciones')
      .select('id, email, expira_en, created_at')
      .eq('comunidad_id', comunidadActiva.value.id)
      .eq('role', 'COLABORADOR')
      .eq('estado', 'PENDIENTE')
      .order('created_at', { ascending: false })
    return (data as InvitacionColabPendiente[] | null) ?? []
  }

  async function invitar(payload: { email: string, idioma: string, expira_en: string | null }) {
    if (demo) return { error: null }
    if (!comunidadActiva.value || !orgActiva.value) return { error: 'Sin comunidad activa' }
    const { error } = await useSupabaseClient().from('invitaciones').insert({
      organizacion_id: orgActiva.value.id,
      comunidad_id: comunidadActiva.value.id,
      role: 'COLABORADOR',
      email: payload.email || null,
      idioma: payload.idioma,
      expira_en: payload.expira_en,
    })
    return { error: error?.message ?? null }
  }

  return { colaboradores, loading, refresh, setActivo, listInvitacionesPendientes, invitar }
}
