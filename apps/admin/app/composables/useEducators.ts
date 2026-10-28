// Equipo de la comunidad activa sobre Supabase: los educadores ligados a ella
// (comunidad_educadores) y sus grupos (educador_grupos). El educador es de la organización
// (0004): darlo de alta en una comunidad lo crea en la organización si no existía y lo liga.
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
}

export interface Educator {
  id: number
  nombre: string
  initials: string
  profesion: string
  email: string
  telefono: string
  estado: 'activo' | 'inactivo'
  // El acceso a Educators: con PIN, con la activación pendiente o sin código todavía.
  acceso: 'pin' | 'pendiente' | 'sin-codigo'
  grupo: string            // primer grupo (chip de la card); '' si no está en ninguno
  grupos: string[]         // todos (la membresía real es N:M)
  grupoIds: number[]
  talleres: number
}

const DEMO_EDUCATORS: Educator[] = [
  { id: 1, nombre: 'Maria Lopez Hernandez', initials: 'ML', profesion: 'Nutrióloga', email: 'maria.lopez@nutrinacion.org', telefono: '+52 55 1234 5678', estado: 'activo', acceso: 'pin', grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 8 },
  { id: 2, nombre: 'Carlos Ramirez Torres', initials: 'CR', profesion: 'Educador en Salud', email: 'carlos.ramirez@nutrinacion.org', telefono: '+52 55 2345 6789', estado: 'activo', acceso: 'pin', grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 5 },
  { id: 3, nombre: 'Ana Torres Gutierrez', initials: 'AT', profesion: 'Psicóloga Infantil', email: 'ana.torres@nutrinacion.org', telefono: '+52 55 3456 7890', estado: 'activo', acceso: 'pin', grupo: 'Zona Sur', grupos: ['Zona Sur'], grupoIds: [2], talleres: 6 },
  { id: 4, nombre: 'Pedro Sanchez Morales', initials: 'PS', profesion: 'Chef Educativo', email: 'pedro.sanchez@nutrinacion.org', telefono: '+52 55 4567 8901', estado: 'activo', acceso: 'pin', grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 4 },
]

const DEMO_GROUPS: EducatorGroup[] = [
  { id: 1, nombre: 'Zona Norte', descripcion: 'Educadores asignados a escuelas y centros comunitarios de la zona norte', miembros: 3, estado: 'activo' },
  { id: 2, nombre: 'Zona Sur', descripcion: 'Equipo dedicado a talleres en comunidades rurales del sur', miembros: 1, estado: 'activo' },
]

interface LigaRow {
  activo: boolean
  educador: {
    id: number
    nombre: string
    apellido: string | null
    correo: string | null
    telefono: string | null
    profesion: string | null
    activo: boolean
    deleted_at: string | null
    tiene_pin: boolean
    activacion_pendiente: boolean
    educador_grupo_miembros: { comunidad_id: number, grupo: { id: number, nombre: string } | null }[]
  } | null
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

    const [{ data: ligaRows }, { data: grupoRows }, { data: asignaciones }] = await Promise.all([
      supabase
        .from('comunidad_educadores')
        .select(`
          activo,
          educador:educadores (
            id, nombre, apellido, correo, telefono, profesion, activo, deleted_at, tiene_pin, activacion_pendiente,
            educador_grupo_miembros ( comunidad_id, grupo:educador_grupos ( id, nombre ) )
          )
        `)
        .eq('comunidad_id', cid),
      supabase
        .from('educador_grupos')
        .select('id, nombre, descripcion, activo, miembros:educador_grupo_miembros ( count )')
        .eq('comunidad_id', cid)
        .order('nombre'),
      // Los workshops de cada educador en ESTA comunidad (puede estar en otras).
      supabase.from('workshop_educadores').select('educador_id').eq('comunidad_id', cid),
    ])

    const talleres = new Map<number, number>()
    for (const a of asignaciones ?? []) talleres.set(a.educador_id, (talleres.get(a.educador_id) ?? 0) + 1)

    state.value.educators = (((ligaRows as unknown) as LigaRow[] | null) ?? [])
      .filter((l): l is LigaRow & { educador: NonNullable<LigaRow['educador']> } => !!l.educador && !l.educador.deleted_at)
      .map(({ activo, educador: e }) => {
        const grupos = e.educador_grupo_miembros
          .filter(g => g.comunidad_id === cid)
          .map(g => g.grupo)
          .filter((g): g is { id: number, nombre: string } => !!g)
        return {
          id: e.id,
          nombre: `${e.nombre} ${e.apellido ?? ''}`.trim(),
          initials: iniciales(e.nombre, e.apellido),
          profesion: e.profesion ?? '—',
          email: e.correo ?? '—',
          telefono: e.telefono ?? '—',
          estado: activo && e.activo ? 'activo' : 'inactivo',
          acceso: e.tiene_pin ? 'pin' : e.activacion_pendiente ? 'pendiente' : 'sin-codigo',
          grupo: grupos[0]?.nombre ?? '',
          grupos: grupos.map(g => g.nombre),
          grupoIds: grupos.map(g => g.id),
          talleres: talleres.get(e.id) ?? 0,
        } satisfies Educator
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    state.value.groups = (((grupoRows as unknown) as GrupoRow[] | null) ?? []).map(g => ({
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion ?? '',
      miembros: g.miembros?.[0]?.count ?? 0,
      estado: g.activo ? 'activo' : 'inactivo',
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
    const comunidadId = comunidadActiva.value.id
    const correo = datos.correo.trim().toLowerCase()

    // El educador es de la organización: si ya existe con ese correo (en otra de sus
    // comunidades), solo se liga a esta; si no, se crea.
    const { data: existente } = await supabase
      .from('educadores')
      .select('id')
      .eq('organizacion_id', comunidadActiva.value.organizacionId)
      .ilike('correo', correo)
      .is('deleted_at', null)
      .maybeSingle()

    let educadorId = existente?.id ?? null
    if (!educadorId) {
      const { data, error } = await supabase
        .from('educadores')
        .insert({
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim() || null,
          correo,
          telefono: datos.telefono.trim() || null,
          profesion: datos.profesion.trim() || null,
          organizacion_id: comunidadActiva.value.organizacionId,
        })
        .select('id')
        .single()
      if (error) return { error: error.message }
      educadorId = data.id
    }

    const { error: eLiga } = await supabase
      .from('comunidad_educadores')
      .upsert({ educador_id: educadorId, comunidad_id: comunidadId, activo: true }, { onConflict: 'educador_id,comunidad_id' })
    if (eLiga) return { error: eLiga.message }

    const data = { id: educadorId }
    if (datos.grupoId) {
      const { error: e2 } = await supabase
        .from('educador_grupo_miembros')
        .insert({ educador_grupo_id: datos.grupoId, educador_id: data.id, comunidad_id: comunidadActiva.value.id })
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
      .from('educador_grupos')
      .insert({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim() || null,
        comunidad_id: comunidadActiva.value.id,
      })
      .select('id')
      .single()
    if (error) return { error: error.message }
    if (datos.educadorIds.length) {
      const comunidadId = comunidadActiva.value.id
      const { error: e2 } = await supabase
        .from('educador_grupo_miembros')
        .insert(datos.educadorIds.map(id => ({ educador_grupo_id: data.id, educador_id: id, comunidad_id: comunidadId })))
      if (e2) return { error: e2.message }
    }
    await refresh()
    return { error: null }
  }

  // Activo o inactivo EN ESTA comunidad (comunidad_educadores.activo). Inactivo: no se le asignan
  // workshops nuevos y la comunidad sale de su Educators; los que ya tenía asignados los sigue viendo.
  async function cambiarActivo(educadorId: number, activo: boolean) {
    if (demo) return { error: null }
    if (!comunidadActiva.value) return { error: 'Sin comunidad activa' }
    const { error } = await useSupabaseClient().from('comunidad_educadores')
      .update({ activo }).eq('educador_id', educadorId).eq('comunidad_id', comunidadActiva.value.id)
    await refresh()
    return { error: error?.message ?? null }
  }

  // El código de activación de Educators (6 dígitos, 0006): con él, el educador elige su PIN la
  // primera vez. La base lo devuelve una sola vez y guarda solo su hash; generar otro borra su PIN
  // y cierra sus sesiones (sirve también si lo olvidó).
  async function generarCodigo(educadorId: number): Promise<{ codigo: string | null, error: string | null }> {
    if (demo) return { codigo: '000000', error: null }
    const { data, error } = await useSupabaseClient().rpc('educador_generar_codigo', { p_educador_id: educadorId })
    return { codigo: data ?? null, error: error?.message ?? null }
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
    generarCodigo,
    cambiarActivo,
  }
}
