// Jornadas de la organización (0004, decisión 011): dónde y cuándo se va, un lugar (de la lista de lugares, tarea 021),
// uno o varios días y, si es parte de uno, su programa. Tienen su sección (`/organizacion/jornadas`, tarea 023): se
// crean ahí, antes de sus talleres, y existen aunque todavía no tengan ninguno. Al programar un taller solo se eligen
// («Pertenece a» en «Nuevo Taller» y en el detalle del taller, que es la misma tarjeta). Sus talleres caen en sus días y toman su lugar (lo
// pone la base; si ya se dio alguno, la jornada no cambia de lugar). La gestionan quienes operan la organización
// (administradores y colaboradores; la RLS lo exige igual).
//
// La lista es una sola para toda la app (la sección, el planificador, «Nuevo Taller» y el detalle del taller) y se
// mantiene al día como las demás (utils/alDia.ts). Cada cambio la vuelve a leer.
import type { JornadaResumen } from '~/utils/jornadas'

export interface JornadaFila extends JornadaResumen {
  lugar_id: number
  programa_id: number | null
  descripcion: string | null
  organizacion_id: number
  created_at: string
  workshops: { count: number }[]
}

export interface DatosJornada {
  nombre: string
  lugarId: number | null
  programaId: number | null
  fecha_inicio: string
  fecha_fin: string     // vacío = un solo día
  descripcion: string
}

export function datosJornadaVacios(fecha = '', programaId: number | null = null): DatosJornada {
  return { nombre: '', lugarId: null, programaId, fecha_inicio: fecha, fecha_fin: fecha, descripcion: '' }
}

/** Los datos de una jornada guardada, para editarla. */
export function datosDeJornada(j: JornadaFila): DatosJornada {
  return { nombre: j.nombre, lugarId: j.lugar_id, programaId: j.programa_id, fecha_inicio: j.fecha_inicio, fecha_fin: j.fecha_fin, descripcion: j.descripcion ?? '' }
}

function normalizar(d: DatosJornada) {
  return {
    nombre: d.nombre.trim(),
    lugar_id: d.lugarId as number,
    programa_id: d.programaId,
    fecha_inicio: d.fecha_inicio,
    fecha_fin: d.fecha_fin || d.fecha_inicio,   // un solo día si no se dice hasta cuándo
    descripcion: d.descripcion.trim() || null,
  }
}

// Lo que falta o no cuadra antes de guardar (la clave de i18n del aviso), o null si está bien.
export function validarDatosJornada(d: DatosJornada): string | null {
  if (!d.nombre.trim()) return 'planner.jNameRequired'
  if (!d.lugarId) return 'planner.jLocationRequired'
  if (!d.fecha_inicio) return 'planner.jDateRequired'
  if (d.fecha_fin && d.fecha_fin < d.fecha_inicio) return 'planner.jDatesOrder'
  return null
}

const SELECT = 'id, nombre, descripcion, lugar_id, programa_id, lugar:lugares ( nombre ), fecha_inicio, fecha_fin, organizacion_id, created_at, workshops ( count )'

// La fila con el nombre de su lugar como `ubicacion` (lo que muestran el planificador y las listas).
export function filaDeJornada(row: Omit<JornadaFila, 'ubicacion'> & { lugar: { nombre: string } | null }): JornadaFila {
  const { lugar, ...resto } = row
  return { ...resto, ubicacion: lugar?.nombre ?? '' }
}

/** Cuántos talleres tiene. */
export const talleresDeJornada = (j: Pick<JornadaFila, 'workshops'>) => j.workshops[0]?.count ?? 0

// La última lectura de la lista, compartida por todas las piezas que la usan (utils/alDia.ts).
const lectura = lecturaNueva()

export function useJornadas() {
  const demo = !isSupabaseConfigured()
  const { orgActiva } = useContexto()
  // El cliente se resuelve POR LLAMADA: construirlo en el cuerpo tumba la página en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  const state = useState<{ orgId: number | null, jornadas: JornadaFila[], loading: boolean }>(
    'jornadas-data',
    () => ({ orgId: null, jornadas: [], loading: false }),
  )

  /** Las jornadas de una organización, por fecha de inicio (sin guardarlas: el inicio las cuenta). */
  async function listar(organizacionId: number): Promise<JornadaFila[]> {
    if (demo) return []
    const { data } = await supabase()
      .from('jornadas')
      .select(SELECT)
      .eq('organizacion_id', organizacionId)
      .order('fecha_inicio', { ascending: true })
    return (((data as unknown) as Parameters<typeof filaDeJornada>[0][] | null) ?? []).map(filaDeJornada)
  }

  async function leer() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    // Solo la primera lectura de una organización se ve cargando: volver a leer no tapa lo que ya se ve.
    if (state.value.orgId !== oid) state.value.loading = true
    const lista = await listar(oid)
    state.value = { orgId: oid, jornadas: lista, loading: false }
  }
  // Leer y anotar cuándo; al entrar a la página y al volver a la pestaña, otra vez si hace falta (utils/alDia.ts).
  const refresh = () => leerAnotando(lectura, leer)
  if (!demo) useAlDia(lectura, () => state.value.orgId, refresh)

  const jornadas = computed(() => state.value.jornadas)
  const loading = computed(() => state.value.loading)
  const getJornada = (id: number | null | undefined) => (id ? state.value.jornadas.find(j => j.id === id) ?? null : null)

  async function crear(datos: DatosJornada): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: null, error: null }
    const oid = orgActiva.value?.id
    if (!oid) return { id: null, error: null }
    const { data, error } = await supabase().from('jornadas')
      .insert({ ...normalizar(datos), organizacion_id: oid })
      .select('id')
      .single()
    if (!error) await refresh()
    return { id: data?.id ?? null, error: error?.message ?? null }
  }

  // Si las fechas nuevas dejan fuera algún taller, la base lo rechaza con su mensaje (0004).
  async function actualizar(id: number, datos: DatosJornada) {
    if (demo) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').update(normalizar(datos)).eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  // Ampliar sus días para que quepa un taller («Nuevo Taller» y el detalle lo confirman antes).
  async function cambiarDias(id: number, dias: { fecha_inicio: string, fecha_fin: string }) {
    if (demo) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').update(dias).eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  // Borrarla deja sus talleres sueltos (`on delete set null`), con su lugar, su espacio y su programa: la base no los
  // toca.
  async function eliminar(id: number) {
    if (demo) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').delete().eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  return { jornadas, loading, refresh, getJornada, listar, crear, actualizar, cambiarDias, eliminar }
}
