import type { Enums } from '~/utils/db'
// Colaboradores de la organización activa sobre Supabase (organizacion_colaboradores): quiénes
// operan la organización sin administrarla. Los invita y los activa o desactiva un administrador
// (RLS 0005). La invitación sale por correo al crearla y su enlace se puede copiar (decisión 012).

export interface ColaboradorFila {
  id: number
  activo: boolean
  created_at: string
  nombre: string
  email: string
  initials: string
}

export interface InvitacionPendiente {
  id: number
  token: string
  email: string | null
  nombre: string | null
  apellido: string | null
  expira_en: string | null
  created_at: string
  correo_enviado_en: string | null
  correo_error: string | null
}

const DEMO_COLABORADORES: ColaboradorFila[] = [
  { id: 1, activo: true, created_at: '2026-06-01T00:00:00Z', nombre: 'Mariana González', email: 'mariana@nutrinacion.com', initials: 'MG' },
  { id: 2, activo: false, created_at: '2026-05-12T00:00:00Z', nombre: 'Diego Ramírez', email: 'diego@nutrinacion.com', initials: 'DR' },
]

interface ColaboradorRow {
  id: number
  activo: boolean
  created_at: string
  perfil: { id: number, nombre: string | null, apellido: string | null, email: string | null } | null
}

export function useColaboradores() {
  const demo = !isSupabaseConfigured()
  const { orgActiva } = useContexto()
  const { t } = useT()

  const state = useState<{ orgId: number | null, colaboradores: ColaboradorFila[], loading: boolean }>(
    'colaboradores-data',
    () => ({ orgId: null, colaboradores: demo ? DEMO_COLABORADORES : [], loading: false }),
  )

  async function refresh() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    state.value.loading = true
    const { data } = await useSupabaseClient()
      .from('organizacion_colaboradores')
      .select('id, activo, created_at, perfil:perfiles ( id, nombre, apellido, email )')
      .eq('organizacion_id', oid)
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
      }
    })
    state.value.orgId = oid
    state.value.loading = false
  }

  if (import.meta.client && !demo) {
    const oid = orgActiva.value?.id ?? null
    if (oid && state.value.orgId !== oid && !state.value.loading) refresh()
  }

  const colaboradores = computed(() => state.value.colaboradores)
  const loading = computed(() => state.value.loading)

  // Desactivar corta el acceso sin borrar historial; se puede reactivar.
  async function setActivo(id: number, activo: boolean) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('organizacion_colaboradores').update({ activo }).eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  // Con su token y el estado del correo: así la lista ofrece «Copiar enlace» y «Reenviar correo» a
  // quien aún no entró.
  async function listInvitacionesPendientes(): Promise<InvitacionPendiente[]> {
    if (demo || !orgActiva.value) return []
    const { data } = await useSupabaseClient()
      .from('invitaciones')
      .select('id, token, email, nombre, apellido, expira_en, created_at, correo_enviado_en, correo_error')
      .eq('organizacion_id', orgActiva.value.id)
      .eq('role', 'COLABORADOR')
      .eq('estado', 'PENDIENTE')
      .order('created_at', { ascending: false })
    return (data as InvitacionPendiente[] | null) ?? []
  }

  // Devuelve id y token: la página la envía por correo y muestra el enlace para copiarlo.
  async function invitar(payload: { email: string, nombre: string, apellido: string, idioma: string, expira_en: string | null }): Promise<{ id: number | null, token: string | null, error: string | null }> {
    if (demo) return { id: 0, token: 'demo', error: null }
    if (!orgActiva.value) return { id: null, token: null, error: t('ctx.noOrgActive') }
    const { data, error } = await useSupabaseClient().from('invitaciones').insert({
      organizacion_id: orgActiva.value.id,
      role: 'COLABORADOR',
      email: payload.email || null,
      nombre: payload.nombre.trim() || null,
      apellido: payload.apellido.trim() || null,
      idioma: payload.idioma as Enums<'idioma'>,
      expira_en: payload.expira_en,
    }).select('id, token').single()
    return { id: data?.id ?? null, token: data?.token ?? null, error: error?.message ?? null }
  }

  async function revocarInvitacion(id: number) {
    if (demo) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('invitaciones').update({ estado: 'REVOCADA' }).eq('id', id)
    return { error: error?.message ?? null }
  }

  return { colaboradores, loading, refresh, setActivo, listInvitacionesPendientes, invitar, revocarInvitacion }
}
