// Audiencias de la organización activa (`grupos_audiencia`, tarea 021, 0004): a quién se atiende
// («Parvulario 6», «Público general»), independiente del lugar. Solo el nombre es obligatorio; las
// edades y la descripción son opcionales (tarea 023: sin la edición, que repetía las edades). No lleva número de niños: lo da el cierre de
// cada taller. Una audiencia abierta (público general, una feria) cuenta asistencias y no alcance, y
// su cierre no pide niñas y niños. Con talleres no se borra: se desactiva (`activo = false`). En
// pantalla se llama «Audiencia»; «Grupo» sigue siendo el de educadores.
export interface Audiencia {
  id: number
  nombre: string
  edadDesde: number | null
  edadHasta: number | null
  descripcion: string
  abierto: boolean
  // «Público general», la que trae la organización (tarea 023): fija, solo se le cambia el nombre.
  fija: boolean
  activo: boolean
  talleres: number
}

export interface DatosAudiencia {
  nombre: string
  edadDesde: string
  edadHasta: string
  descripcion: string
  abierto: boolean
  // Inactiva: no sale al programar un taller; se cambia al editarla (tarea 023).
  activo: boolean
}

export function datosAudienciaVacios(): DatosAudiencia {
  return { nombre: '', edadDesde: '', edadHasta: '', descripcion: '', abierto: false, activo: true }
}

const DEMO_AUDIENCIAS: Audiencia[] = [
  { id: 1, nombre: '2.º B', edadDesde: 7, edadHasta: 8, descripcion: '', abierto: false, fija: false, activo: true, talleres: 1 },
  { id: 2, nombre: 'Público general', edadDesde: null, edadHasta: null, descripcion: '', abierto: true, fija: true, activo: true, talleres: 0 },
]

interface AudienciaRow {
  id: number
  nombre: string
  edad_desde: number | null
  edad_hasta: number | null
  descripcion: string | null
  abierto: boolean
  publico_general: boolean
  activo: boolean
  workshops: { count: number }[]
}

/** Lo que falta o no cuadra antes de guardar (la clave de i18n del aviso), o null. */
export function validarDatosAudiencia(d: DatosAudiencia): string | null {
  if (!d.nombre.trim()) return 'audiences.nameRequired'
  const desde = d.edadDesde ? Number(d.edadDesde) : null
  const hasta = d.edadHasta ? Number(d.edadHasta) : null
  if ((desde !== null && (desde < 0 || desde > 120)) || (hasta !== null && (hasta < 0 || hasta > 120))) return 'audiences.ageRange'
  if (desde !== null && hasta !== null && hasta < desde) return 'audiences.ageOrder'
  return null
}

function normalizar(d: DatosAudiencia) {
  return {
    nombre: d.nombre.trim(),
    edad_desde: d.edadDesde ? Number(d.edadDesde) : null,
    edad_hasta: d.edadHasta ? Number(d.edadHasta) : null,
    descripcion: d.descripcion.trim() || null,
    abierto: d.abierto,
    activo: d.activo,
  }
}

// La última lectura de la lista, compartida por todas las piezas que la usan (utils/alDia.ts).
const lectura = lecturaNueva()

export function useAudiencias() {
  const demo = !isSupabaseConfigured()
  const { orgActiva } = useContexto()
  const { t } = useT()

  const state = useState<{ orgId: number | null, audiencias: Audiencia[], loading: boolean }>(
    'audiencias-data',
    () => ({ orgId: null, audiencias: demo ? DEMO_AUDIENCIAS : [], loading: false }),
  )

  async function leer() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    // Solo la primera lectura de una organización se ve cargando: volver a leer no tapa lo que ya se ve.
    if (state.value.orgId !== oid) state.value.loading = true
    const { data } = await useSupabaseClient().from('grupos_audiencia')
      .select('id, nombre, edad_desde, edad_hasta, descripcion, abierto, publico_general, activo, workshops ( count )')
      .eq('organizacion_id', oid)
      .order('nombre')
    state.value.audiencias = (((data as unknown) as AudienciaRow[] | null) ?? []).map(a => ({
      id: a.id,
      nombre: a.nombre,
      edadDesde: a.edad_desde,
      edadHasta: a.edad_hasta,
      descripcion: a.descripcion ?? '',
      abierto: a.abierto,
      fija: a.publico_general,
      activo: a.activo,
      talleres: a.workshops[0]?.count ?? 0,
    }))
    state.value.orgId = oid
    state.value.loading = false
  }

  // Leer y anotar cuándo; al entrar a la página y al volver a la pestaña, otra vez si hace falta (utils/alDia.ts).
  const refresh = () => leerAnotando(lectura, leer)
  if (!demo) useAlDia(lectura, () => state.value.orgId, refresh)

  const audiencias = computed(() => state.value.audiencias)
  const audienciasActivas = computed(() => state.value.audiencias.filter(a => a.activo))
  const loading = computed(() => state.value.loading)

  function getAudiencia(id: number | null | undefined) {
    return id ? state.value.audiencias.find(a => a.id === id) ?? null : null
  }

  async function crear(datos: DatosAudiencia): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: null, error: null }
    if (!orgActiva.value) return { id: null, error: t('ctx.noOrgActive') }
    const { data, error } = await useSupabaseClient().from('grupos_audiencia')
      .insert({ ...normalizar(datos), organizacion_id: orgActiva.value.id })
      .select('id')
      .single()
    await refresh()
    return { id: data?.id ?? null, error: error?.message ?? null }
  }

  async function actualizar(id: number, datos: DatosAudiencia) {
    if (demo) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('grupos_audiencia').update(normalizar(datos)).eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  async function eliminar(id: number) {
    if (demo) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('grupos_audiencia').delete().eq('id', id)
    await refresh()
    return { error: error ? t('audiences.deleteBlocked') : null }
  }

  return { audiencias, audienciasActivas, loading, refresh, getAudiencia, crear, actualizar, eliminar }
}
