// Equipo de la comunidad activa (educadores + grupos) sobre Supabase.
// ADAPTADOR: la UI consume las mismas formas de siempre (Educator/EducatorGroup, con
// initials/colores calculados aquí); la fuente es la base. En dev sin Supabase se sirven
// filas demo. La carga es perezosa y por comunidad: al invocarse con un contexto distinto
// al último cargado, se refresca solo.

export interface EducatorGroup {
  id: number
  nombre: string
  descripcion: string
  miembros: number
  estado: 'activo' | 'inactivo'
  iconBg: string
  iconColor: string
}

export interface Educator {
  id: number
  nombre: string
  initials: string
  profesion: string
  email: string
  telefono: string
  estado: 'activo' | 'inactivo'
  grupo: string            // primer grupo (chip de la card)
  grupos: string[]         // todos (la membresía real es N:M)
  grupoIds: number[]
  talleres: number
  avatarBg: string
  accentColor: string
}

// Paleta determinista por id: el mismo educador siempre luce igual.
const AVATAR_COLORS = ['bg-emerald-600', 'bg-blue-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'] as const
const ACCENT_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'] as const
const GROUP_STYLES = [
  { iconBg: 'bg-brand-primary-50', iconColor: 'text-brand-primary-600' },
  { iconBg: 'bg-brand-secondary-50', iconColor: 'text-brand-secondary-600' },
  { iconBg: 'bg-brand-purple-50', iconColor: 'text-brand-purple-600' },
] as const

const DEMO_EDUCATORS: Educator[] = [
  { id: 1, nombre: 'Maria Lopez Hernandez', initials: 'ML', profesion: 'Nutrióloga', email: 'maria.lopez@nutrinacion.org', telefono: '+52 55 1234 5678', estado: 'activo', grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 8, avatarBg: AVATAR_COLORS[0], accentColor: ACCENT_COLORS[0] },
  { id: 2, nombre: 'Carlos Ramirez Torres', initials: 'CR', profesion: 'Educador en Salud', email: 'carlos.ramirez@nutrinacion.org', telefono: '+52 55 2345 6789', estado: 'activo', grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 5, avatarBg: AVATAR_COLORS[1], accentColor: ACCENT_COLORS[1] },
  { id: 3, nombre: 'Ana Torres Gutierrez', initials: 'AT', profesion: 'Psicóloga Infantil', email: 'ana.torres@nutrinacion.org', telefono: '+52 55 3456 7890', estado: 'activo', grupo: 'Zona Sur', grupos: ['Zona Sur'], grupoIds: [2], talleres: 6, avatarBg: AVATAR_COLORS[2], accentColor: ACCENT_COLORS[2] },
  { id: 4, nombre: 'Pedro Sanchez Morales', initials: 'PS', profesion: 'Chef Educativo', email: 'pedro.sanchez@nutrinacion.org', telefono: '+52 55 4567 8901', estado: 'activo', grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 4, avatarBg: AVATAR_COLORS[3], accentColor: ACCENT_COLORS[3] },
]

const DEMO_GROUPS: EducatorGroup[] = [
  { id: 1, nombre: 'Zona Norte', descripcion: 'Educadores asignados a escuelas y centros comunitarios de la zona norte', miembros: 3, estado: 'activo', ...GROUP_STYLES[0] },
  { id: 2, nombre: 'Zona Sur', descripcion: 'Equipo dedicado a talleres en comunidades rurales del sur', miembros: 1, estado: 'activo', ...GROUP_STYLES[1] },
]

interface EducadorRow {
  id: number
  nombre: string
  apellido: string | null
  correo: string | null
  telefono: string | null
  profesion: string | null
  activo: boolean
  grupos_educadores: { grupos: { id: number, nombre: string } | null }[]
  asignaciones: { count: number }[]
}

interface GrupoRow {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  miembros: { count: number }[]
}

function iniciales(nombre: string, apellido: string | null) {
  return `${nombre.charAt(0)}${(apellido ?? '').charAt(0)}`.toUpperCase() || '?'
}

export function useEducators() {
  const demo = !isSupabaseConfigured()
  const { comunidadActiva } = useContexto()

  const state = useState<{ comunidadId: number | null, educators: Educator[], groups: EducatorGroup[], loading: boolean }>(
    'educators-data',
    () => ({ comunidadId: null, educators: demo ? DEMO_EDUCATORS : [], groups: demo ? DEMO_GROUPS : [], loading: false }),
  )

  async function refresh() {
    if (demo) return
    const cid = comunidadActiva.value?.id
    if (!cid) return
    state.value.loading = true
    const supabase = useSupabaseClient()

    const [{ data: eduRows }, { data: grupoRows }] = await Promise.all([
      supabase
        .from('educadores')
        .select(`
          id, nombre, apellido, correo, telefono, profesion, activo,
          grupos_educadores ( grupos ( id, nombre ) ),
          asignaciones:taller_asignaciones_educadores ( count )
        `)
        .eq('comunidad_id', cid)
        .is('deleted_at', null)
        .order('nombre'),
      supabase
        .from('grupos')
        .select('id, nombre, descripcion, activo, miembros:grupos_educadores ( count )')
        .eq('comunidad_id', cid)
        .order('nombre'),
    ])

    state.value.educators = (((eduRows as unknown) as EducadorRow[] | null) ?? []).map((e) => {
      const grupos = e.grupos_educadores.map(g => g.grupos).filter((g): g is { id: number, nombre: string } => !!g)
      return {
        id: e.id,
        nombre: `${e.nombre} ${e.apellido ?? ''}`.trim(),
        initials: iniciales(e.nombre, e.apellido),
        profesion: e.profesion ?? '—',
        email: e.correo ?? '—',
        telefono: e.telefono ?? '—',
        estado: e.activo ? 'activo' : 'inactivo',
        grupo: grupos[0]?.nombre ?? '—',
        grupos: grupos.map(g => g.nombre),
        grupoIds: grupos.map(g => g.id),
        talleres: e.asignaciones?.[0]?.count ?? 0,
        avatarBg: AVATAR_COLORS[e.id % AVATAR_COLORS.length]!,
        accentColor: ACCENT_COLORS[e.id % ACCENT_COLORS.length]!,
      }
    })

    state.value.groups = (((grupoRows as unknown) as GrupoRow[] | null) ?? []).map(g => ({
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion ?? '',
      miembros: g.miembros?.[0]?.count ?? 0,
      estado: g.activo ? 'activo' : 'inactivo',
      ...GROUP_STYLES[g.id % GROUP_STYLES.length]!,
    }))

    state.value.comunidadId = cid
    state.value.loading = false
  }

  // Carga perezosa: al entrar con una comunidad distinta a la última cargada.
  if (import.meta.client && !demo) {
    const cid = comunidadActiva.value?.id ?? null
    if (cid && state.value.comunidadId !== cid && !state.value.loading) refresh()
  }

  const educators = computed(() => state.value.educators)
  const groups = computed(() => state.value.groups)
  const loading = computed(() => state.value.loading)

  const activeEducators = computed(() => educators.value.filter(e => e.estado === 'activo'))
  const activeGroups = computed(() => groups.value.filter(g => g.estado === 'activo'))

  function getEducator(id: number) {
    return educators.value.find(e => e.id === id)
  }

  function getGroup(id: number) {
    return groups.value.find(g => g.id === id)
  }

  function getGroupMembers(groupName: string) {
    return activeEducators.value.filter(e => e.grupos.includes(groupName))
  }

  // ── Escritura ───────────────────────────────────────────────────────────────
  async function createEducador(datos: {
    nombre: string
    apellido: string
    correo: string
    telefono: string
    profesion: string
    grupoId?: number | null
  }) {
    if (demo) return { error: null }
    if (!comunidadActiva.value) return { error: 'Sin comunidad activa' }
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('educadores')
      .insert({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim() || null,
        correo: datos.correo.trim() || null,
        telefono: datos.telefono.trim() || null,
        profesion: datos.profesion.trim() || null,
        comunidad_id: comunidadActiva.value.id,
      })
      .select('id')
      .single()
    if (error) return { error: error.message }
    if (datos.grupoId) {
      const { error: e2 } = await supabase
        .from('grupos_educadores')
        .insert({ grupo_id: datos.grupoId, educador_id: data.id as number })
      if (e2) return { error: e2.message }
    }
    await refresh()
    return { error: null }
  }

  async function createGrupo(datos: { nombre: string, descripcion: string, educadorIds: number[] }) {
    if (demo) return { error: null }
    if (!comunidadActiva.value) return { error: 'Sin comunidad activa' }
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('grupos')
      .insert({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim() || null,
        comunidad_id: comunidadActiva.value.id,
      })
      .select('id')
      .single()
    if (error) return { error: error.message }
    if (datos.educadorIds.length) {
      const { error: e2 } = await supabase
        .from('grupos_educadores')
        .insert(datos.educadorIds.map(id => ({ grupo_id: data.id as number, educador_id: id })))
      if (e2) return { error: e2.message }
    }
    await refresh()
    return { error: null }
  }

  return {
    educators,
    groups,
    loading,
    activeEducators,
    activeGroups,
    getEducator,
    getGroup,
    getGroupMembers,
    refresh,
    createEducador,
    createGrupo,
  }
}
