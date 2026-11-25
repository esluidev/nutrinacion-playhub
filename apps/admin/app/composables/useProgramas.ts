// Programas de la organización activa (tarea 021, 0004): para qué y cuándo. Un programa junta
// talleres sueltos y jornadas, que caen en sus fechas (la base lo exige, también al acortarlo). Es
// opcional: un taller puede no tener programa. Con talleres no se borra. Dentro de una jornada, el
// taller toma el programa de ella. Lo gestionan quienes operan la organización (RLS).
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'

export interface Programa {
  id: number
  nombre: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  talleres: number
  jornadas: number
}

export interface DatosPrograma {
  nombre: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
}

export function datosProgramaVacios(): DatosPrograma {
  return { nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '' }
}

/** Lo que falta o no cuadra antes de guardar (la clave de i18n del aviso), o null. */
export function validarDatosPrograma(d: DatosPrograma): string | null {
  if (!d.nombre.trim()) return 'programs.nameRequired'
  if (!d.fecha_inicio || !d.fecha_fin) return 'programs.datesRequired'
  if (d.fecha_fin < d.fecha_inicio) return 'programs.datesOrder'
  return null
}

// En qué momento está, por sus fechas: por venir (cielo), en curso (sol, como «hoy») o terminado
// (lima, como lo cerrado).
export type EstadoPrograma = 'por_venir' | 'en_curso' | 'terminado'
export function estadoPrograma(p: Pick<Programa, 'fecha_inicio' | 'fecha_fin'>, hoy: string): EstadoPrograma {
  if (hoy < p.fecha_inicio) return 'por_venir'
  if (hoy > p.fecha_fin) return 'terminado'
  return 'en_curso'
}
export const TONO_PROGRAMA: Record<EstadoPrograma, UiTone> = { por_venir: 'sky', en_curso: 'sun', terminado: 'lime' }

const DEMO_PROGRAMAS: Programa[] = [
  { id: 1, nombre: 'Crecer sano', descripcion: 'Tres meses de alimentación en la zona centro.', fecha_inicio: hoyLocal(-30), fecha_fin: hoyLocal(60), talleres: 3, jornadas: 1 },
]

export interface ResumenPrograma {
  resumen: { previstos: number, realizados: number, cancelados: number, sin_realizar: number, asistencias: number, minutos: number }
  alcance: { total: number, ninas: number, ninos: number }
  pares: { grupo_audiencia_id: number, lugar_id: number, previstas: number, recibidas: number, ninas: number | null, ninos: number | null }[]
}

interface ProgramaRow {
  id: number
  nombre: string
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string
  workshops: { count: number }[]
  jornadas: { count: number }[]
}

// La última lectura de la lista, compartida por todas las piezas que la usan (utils/alDia.ts).
const lectura = lecturaNueva()

export function useProgramas() {
  const demo = !isSupabaseConfigured()
  const { orgActiva } = useContexto()
  const { t } = useT()

  const state = useState<{ orgId: number | null, programas: Programa[], loading: boolean }>(
    'programas-data',
    () => ({ orgId: null, programas: demo ? DEMO_PROGRAMAS : [], loading: false }),
  )

  async function leer() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    // Solo la primera lectura de una organización se ve cargando: volver a leer no tapa lo que ya se ve.
    if (state.value.orgId !== oid) state.value.loading = true
    const { data } = await useSupabaseClient().from('programas')
      .select('id, nombre, descripcion, fecha_inicio, fecha_fin, workshops ( count ), jornadas ( count )')
      .eq('organizacion_id', oid)
      .order('fecha_inicio', { ascending: false })
    state.value.programas = (((data as unknown) as ProgramaRow[] | null) ?? []).map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin,
      talleres: p.workshops[0]?.count ?? 0,
      jornadas: p.jornadas[0]?.count ?? 0,
    }))
    state.value.orgId = oid
    state.value.loading = false
  }

  // Leer y anotar cuándo; al entrar a la página y al volver a la pestaña, otra vez si hace falta (utils/alDia.ts).
  const refresh = () => leerAnotando(lectura, leer)
  if (!demo) useAlDia(lectura, () => state.value.orgId, refresh)

  const programas = computed(() => state.value.programas)
  const loading = computed(() => state.value.loading)

  function getPrograma(id: number | null | undefined) {
    return id ? state.value.programas.find(p => p.id === id) ?? null : null
  }

  function normalizar(d: DatosPrograma) {
    return { nombre: d.nombre.trim(), descripcion: d.descripcion.trim() || null, fecha_inicio: d.fecha_inicio, fecha_fin: d.fecha_fin }
  }

  async function crear(datos: DatosPrograma): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: null, error: null }
    if (!orgActiva.value) return { id: null, error: t('ctx.noOrgActive') }
    const { data, error } = await useSupabaseClient().from('programas')
      .insert({ ...normalizar(datos), organizacion_id: orgActiva.value.id })
      .select('id')
      .single()
    await refresh()
    return { id: data?.id ?? null, error: error?.message ?? null }
  }

  // Si las fechas nuevas dejan fuera algún taller, la base lo rechaza con su mensaje.
  async function actualizar(id: number, datos: DatosPrograma) {
    if (demo) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('programas').update(normalizar(datos)).eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  // Solo el que no tiene talleres ni jornadas; si no, la base lo rechaza.
  async function eliminar(id: number) {
    if (demo) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('programas').delete().eq('id', id)
    await refresh()
    return { error: error ? t('programs.deleteBlocked') : null }
  }

  // Lo que dice el reporte del programa (`reporte_talleres`, 0005): el resumen, el alcance y, por
  // cada audiencia en cada lugar, cuántas sesiones recibió de las previstas. La ficha muestra esto; el
  // reporte completo es su propia vista.
  async function resumen(p: Pick<Programa, 'id' | 'fecha_inicio' | 'fecha_fin'>): Promise<ResumenPrograma | null> {
    if (demo || !orgActiva.value) return null
    const { data } = await useSupabaseClient().rpc('reporte_talleres', {
      p_organizacion_id: orgActiva.value.id,
      p_desde: p.fecha_inicio,
      p_hasta: p.fecha_fin,
      p_programa_id: p.id,
    })
    return (data as unknown) as ResumenPrograma | null
  }

  return { programas, loading, refresh, getPrograma, crear, actualizar, eliminar, resumen }
}
