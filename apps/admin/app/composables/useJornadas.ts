// Jornadas de la organización (0004, decisión 011): dónde y cuándo se va, un lugar y uno o varios
// días. No hay un área para crearlas: se crean o se eligen al programar un taller (JornadaSelector,
// en el asistente y en el detalle del taller), y se editan o se borran desde su panel en el
// planificador. Sus talleres caen en sus días y heredan su lugar. Una jornada existe mientras tiene
// talleres: cuando el último se borra o sale de ella, la base la borra sola. La gestionan quienes
// operan la organización (administradores y colaboradores; la RLS lo exige igual).
import type { JornadaResumen } from '~/utils/jornadas'
import { lugarDelTaller } from '~/utils/jornadas'

export interface JornadaFila extends JornadaResumen {
  descripcion: string | null
  organizacion_id: number
  created_at: string
  workshops: { count: number }[]
}

export interface DatosJornada {
  nombre: string
  ubicacion: string
  fecha_inicio: string
  fecha_fin: string     // vacío = un solo día
  descripcion: string
}

export function datosJornadaVacios(fecha = ''): DatosJornada {
  return { nombre: '', ubicacion: '', fecha_inicio: fecha, fecha_fin: fecha, descripcion: '' }
}

// La respuesta a «¿Es parte de una jornada?» al programar un taller (JornadaSelector): suelto, una
// jornada en curso (`jornadaId`) o una nueva (`nueva`, que se crea al guardar el taller).
export type ModoJornada = 'suelto' | 'existente' | 'nueva'
export interface EleccionJornada {
  modo: ModoJornada
  jornadaId: number | null
  nueva: DatosJornada
}

export function eleccionJornada(jornadaId: number | null = null): EleccionJornada {
  return { modo: jornadaId ? 'existente' : 'suelto', jornadaId, nueva: datosJornadaVacios() }
}

function normalizar(d: DatosJornada) {
  return {
    nombre: d.nombre.trim(),
    ubicacion: d.ubicacion.trim(),
    fecha_inicio: d.fecha_inicio,
    fecha_fin: d.fecha_fin || d.fecha_inicio,   // un solo día si no se dice hasta cuándo
    descripcion: d.descripcion.trim() || null,
  }
}

// Lo que falta o no cuadra antes de guardar (la clave de i18n del aviso), o null si está bien.
export function validarDatosJornada(d: DatosJornada): string | null {
  if (!d.nombre.trim()) return 'planner.jNameRequired'
  if (!d.ubicacion.trim()) return 'planner.jLocationRequired'
  if (!d.fecha_inicio) return 'planner.jDateRequired'
  if (d.fecha_fin && d.fecha_fin < d.fecha_inicio) return 'planner.jDatesOrder'
  return null
}

const SELECT = 'id, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin, organizacion_id, created_at, workshops ( count )'

export function useJornadas() {
  // El cliente se resuelve POR LLAMADA: construirlo en el cuerpo tumba la página en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  async function listar(organizacionId: number): Promise<JornadaFila[]> {
    if (!isSupabaseConfigured()) return []
    const { data } = await supabase()
      .from('jornadas')
      .select(SELECT)
      .eq('organizacion_id', organizacionId)
      .order('fecha_inicio', { ascending: true })
    return ((data as unknown) as JornadaFila[] | null) ?? []
  }

  async function crear(organizacionId: number, datos: DatosJornada): Promise<{ id: number | null, error: string | null }> {
    if (!isSupabaseConfigured()) return { id: null, error: null }
    const { data, error } = await supabase().from('jornadas')
      .insert({ ...normalizar(datos), organizacion_id: organizacionId })
      .select('id')
      .single()
    return { id: data?.id ?? null, error: error?.message ?? null }
  }

  // Si las fechas nuevas dejan fuera algún taller, la base lo rechaza con su mensaje (0004).
  async function actualizar(id: number, datos: DatosJornada) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').update(normalizar(datos)).eq('id', id)
    return { error: error?.message ?? null }
  }

  // Ampliar sus días para que quepa un taller (el asistente y el detalle lo confirman antes).
  async function cambiarDias(id: number, dias: { fecha_inicio: string, fecha_fin: string }) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').update(dias).eq('id', id)
    return { error: error?.message ?? null }
  }

  // Borrarla a mano deja sus talleres sueltos (`on delete set null`). Antes, cada uno que aún se
  // puede tocar (no archivado) se queda con el lugar completo («Sede central · Aula 3A»): suelto,
  // su `ubicacion` es su lugar y no solo el detalle.
  async function eliminar(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const [{ data: jornada }, { data: talleres }] = await Promise.all([
      supabase().from('jornadas').select('ubicacion').eq('id', id).maybeSingle(),
      supabase().from('workshops').select('id, ubicacion').eq('jornada_id', id).neq('estado', 'ARCHIVADO'),
    ])
    if (jornada) {
      for (const w of talleres ?? []) {
        const lugar = lugarDelTaller(w, jornada)
        if (lugar === (w.ubicacion ?? '')) continue
        const { error } = await supabase().from('workshops').update({ ubicacion: lugar || null }).eq('id', w.id)
        if (error) return { error: error.message }
      }
    }
    const { error } = await supabase().from('jornadas').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  // Deshacer una jornada recién creada si el taller que iba a llevar no se pudo guardar: solo si
  // sigue sin talleres (una jornada vacía no se vería en ninguna parte).
  async function descartarSiVacia(id: number) {
    if (!isSupabaseConfigured()) return
    const { count } = await supabase().from('workshops').select('id', { count: 'exact', head: true }).eq('jornada_id', id)
    if (count === 0) await supabase().from('jornadas').delete().eq('id', id)
  }

  return { listar, crear, actualizar, cambiarDias, eliminar, descartarSiVacia }
}
