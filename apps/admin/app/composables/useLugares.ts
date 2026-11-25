// Lugares y comunidades de la organización activa (tarea 021, 0004). Un lugar es un sitio concreto
// donde se dan talleres (escuela, centro, plaza); lo de dentro («Aula 3A») es el espacio del taller.
// Una comunidad agrupa los lugares de un mismo territorio (un barrio, un municipio, una aldea) para el
// reporte por territorio. Se gestiona en su pestaña de Lugares (tarea 023: crear, elegir sus lugares,
// editar y eliminar) o se elige o crea desde el lugar; existe aunque no agrupe ninguno y, al
// eliminarla, sus lugares quedan sin comunidad. Con talleres, un lugar no se borra: se desactiva
// (`activo = false`) y deja de salir al programar. Los gestionan quienes operan la
// organización (la RLS lo exige igual). Una lista por organización, compartida por «Nuevo Taller», la
// jornada y la página de Lugares.

export interface Comunidad {
  id: number
  nombre: string
}

export interface Lugar {
  id: number
  nombre: string
  activo: boolean
  comunidadId: number | null
  comunidad: string           // el nombre de su comunidad, '' si no tiene
  talleres: number            // cuántos talleres lo usan (los retira en vez de borrarlo)
}

// La comunidad que se elige al dar de alta o editar un lugar: ninguna, una existente o una nueva
// (se crea al guardar el lugar).
export interface EleccionComunidad {
  comunidadId: number | null
  nueva: string
}

const DEMO_COMUNIDADES: Comunidad[] = [{ id: 1, nombre: 'Zona centro' }]
const DEMO_LUGARES: Lugar[] = [
  { id: 1, nombre: 'Centro Comunitario', activo: true, comunidadId: 1, comunidad: 'Zona centro', talleres: 2 },
  { id: 2, nombre: 'Escuela Primaria Norte', activo: true, comunidadId: null, comunidad: '', talleres: 1 },
]

interface LugarRow {
  id: number
  nombre: string
  activo: boolean
  comunidad_id: number | null
  comunidad: { id: number, nombre: string } | null
  workshops: { count: number }[]
}

/** «Escuela Rural N.º 2 · San Isidro»: el lugar y, si la tiene, su comunidad. */
export function nombreConComunidad(l: Pick<Lugar, 'nombre' | 'comunidad'>): string {
  return [l.nombre, l.comunidad].filter(Boolean).join(' · ')
}

// La última lectura de la lista, compartida por todas las piezas que la usan (utils/alDia.ts).
const lectura = lecturaNueva()

export function useLugares() {
  const demo = !isSupabaseConfigured()
  const { orgActiva } = useContexto()
  const { t } = useT()

  const state = useState<{ orgId: number | null, lugares: Lugar[], comunidades: Comunidad[], loading: boolean }>(
    'lugares-data',
    () => ({ orgId: null, lugares: demo ? DEMO_LUGARES : [], comunidades: demo ? DEMO_COMUNIDADES : [], loading: false }),
  )

  async function leer() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    // Solo la primera lectura de una organización se ve cargando: volver a leer no tapa lo que ya se ve.
    if (state.value.orgId !== oid) state.value.loading = true
    const supabase = useSupabaseClient()
    const [{ data: lugares }, { data: comunidades }] = await Promise.all([
      supabase.from('lugares')
        .select('id, nombre, activo, comunidad_id, comunidad:comunidades ( id, nombre ), workshops ( count )')
        .eq('organizacion_id', oid)
        .order('nombre'),
      supabase.from('comunidades').select('id, nombre').eq('organizacion_id', oid).order('nombre'),
    ])
    state.value.lugares = (((lugares as unknown) as LugarRow[] | null) ?? []).map(l => ({
      id: l.id,
      nombre: l.nombre,
      activo: l.activo,
      comunidadId: l.comunidad_id,
      comunidad: l.comunidad?.nombre ?? '',
      talleres: l.workshops[0]?.count ?? 0,
    }))
    state.value.comunidades = comunidades ?? []
    state.value.orgId = oid
    state.value.loading = false
  }

  // Leer y anotar cuándo; al entrar a la página y al volver a la pestaña, otra vez si hace falta (utils/alDia.ts).
  const refresh = () => leerAnotando(lectura, leer)
  if (!demo) useAlDia(lectura, () => state.value.orgId, refresh)

  const lugares = computed(() => state.value.lugares)
  const comunidades = computed(() => state.value.comunidades)
  const lugaresActivos = computed(() => state.value.lugares.filter(l => l.activo))
  const loading = computed(() => state.value.loading)

  function getLugar(id: number | null | undefined) {
    return id ? state.value.lugares.find(l => l.id === id) ?? null : null
  }

  // La comunidad elegida, creándola si es nueva. Devuelve su id (null = sin comunidad).
  async function resolverComunidad(e: EleccionComunidad): Promise<{ id: number | null, error: string | null }> {
    const nueva = e.nueva.trim()
    if (!nueva) return { id: e.comunidadId, error: null }
    if (!orgActiva.value) return { id: null, error: t('ctx.noOrgActive') }
    const ya = state.value.comunidades.find(c => c.nombre.toLowerCase() === nueva.toLowerCase())
    if (ya) return { id: ya.id, error: null }
    const { data, error } = await useSupabaseClient().from('comunidades')
      .insert({ nombre: nueva, organizacion_id: orgActiva.value.id })
      .select('id')
      .single()
    return { id: data?.id ?? null, error: error?.message ?? null }
  }

  async function crear(datos: { nombre: string, comunidad: EleccionComunidad }): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: null, error: null }
    if (!orgActiva.value) return { id: null, error: t('ctx.noOrgActive') }
    const c = await resolverComunidad(datos.comunidad)
    if (c.error) return { id: null, error: c.error }
    const { data, error } = await useSupabaseClient().from('lugares')
      .insert({ nombre: datos.nombre.trim(), comunidad_id: c.id, organizacion_id: orgActiva.value.id })
      .select('id')
      .single()
    await refresh()
    return { id: data?.id ?? null, error: error?.message ?? null }
  }

  // Con `activo`, también su estado (se cambia al editarlo; inactivo no sale al programar).
  async function actualizar(id: number, datos: { nombre: string, comunidad: EleccionComunidad, activo?: boolean }) {
    if (demo) return { error: null as string | null }
    const c = await resolverComunidad(datos.comunidad)
    if (c.error) return { error: c.error }
    const { error } = await useSupabaseClient().from('lugares')
      .update({ nombre: datos.nombre.trim(), comunidad_id: c.id, ...(datos.activo === undefined ? {} : { activo: datos.activo }) })
      .eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  // ── Las comunidades, en su pestaña ──────────────────────────────────────────
  // Ya hay una con ese nombre (sin mayúsculas ni espacios de más), sin contar `salvo`.
  function comunidadRepetida(nombre: string, salvo?: number) {
    const n = nombre.trim().toLowerCase()
    return state.value.comunidades.some(c => c.id !== salvo && c.nombre.trim().toLowerCase() === n)
  }

  // Los lugares de la comunidad pasan a ser exactamente `lugarIds`: los nuevos entran (si estaban en otra, salen de
  // ella) y los que ya no están quedan sin comunidad.
  async function ponerLugares(comunidadId: number, lugarIds: number[]) {
    const supabase = useSupabaseClient()
    const salen = state.value.lugares.filter(l => l.comunidadId === comunidadId && !lugarIds.includes(l.id)).map(l => l.id)
    if (lugarIds.length) {
      const { error } = await supabase.from('lugares').update({ comunidad_id: comunidadId }).in('id', lugarIds)
      if (error) return error.message
    }
    if (salen.length) {
      const { error } = await supabase.from('lugares').update({ comunidad_id: null }).in('id', salen)
      if (error) return error.message
    }
    return null
  }

  async function crearComunidad(nombre: string, lugarIds: number[]): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: null, error: null }
    if (!orgActiva.value) return { id: null, error: t('ctx.noOrgActive') }
    if (comunidadRepetida(nombre)) return { id: null, error: t('places.communityExists') }
    const { data, error } = await useSupabaseClient().from('comunidades')
      .insert({ nombre: nombre.trim(), organizacion_id: orgActiva.value.id })
      .select('id')
      .single()
    if (error || !data) return { id: null, error: error?.message ?? null }
    const e = await ponerLugares(data.id, lugarIds)
    await refresh()
    return { id: data.id, error: e }
  }

  async function actualizarComunidad(id: number, nombre: string, lugarIds: number[]) {
    if (demo) return { error: null as string | null }
    if (comunidadRepetida(nombre, id)) return { error: t('places.communityExists') }
    const { error } = await useSupabaseClient().from('comunidades').update({ nombre: nombre.trim() }).eq('id', id)
    if (error) return { error: error.message }
    const e = await ponerLugares(id, lugarIds)
    await refresh()
    return { error: e }
  }

  // Sus lugares quedan sin comunidad (la clave de `lugares`); los talleres no cambian.
  async function eliminarComunidad(id: number) {
    if (demo) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('comunidades').delete().eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  // Solo el que no tiene talleres; con talleres, la base lo rechaza (se desactiva).
  async function eliminar(id: number) {
    if (demo) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('lugares').delete().eq('id', id)
    await refresh()
    return { error: error ? t('places.deleteBlocked') : null }
  }

  return {
    lugares, comunidades, lugaresActivos, loading, refresh, getLugar, crear, actualizar, eliminar,
    crearComunidad, actualizarComunidad, eliminarComunidad,
  }
}
