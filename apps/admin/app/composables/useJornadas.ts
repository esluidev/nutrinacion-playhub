// Jornadas de la organización (0004): reúnen workshops de sus comunidades alrededor de un enfoque
// de salud, entre dos fechas. Las ven quienes ven la organización; las gestionan sus admins (RLS).
import type { Enums } from '~/utils/db'

export type EnfoqueSalud = Enums<'enfoque_salud'>

export interface JornadaFila {
  id: number
  nombre: string
  descripcion: string | null
  enfoque_salud: EnfoqueSalud | null
  fecha_inicio: string | null
  fecha_fin: string | null
  organizacion_id: number
  created_at: string
  workshops: { count: number }[]
}

export interface DatosJornada {
  nombre: string
  descripcion: string
  enfoque_salud: EnfoqueSalud | null
  fecha_inicio: string
  fecha_fin: string
}

function normalizar(d: DatosJornada) {
  return {
    nombre: d.nombre.trim(),
    descripcion: d.descripcion.trim() || null,
    enfoque_salud: d.enfoque_salud,
    fecha_inicio: d.fecha_inicio || null,
    fecha_fin: d.fecha_fin || null,
  }
}

export function useJornadas() {
  // El cliente se resuelve POR LLAMADA: construirlo en el cuerpo tumba la página en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  async function listar(organizacionId: number): Promise<JornadaFila[]> {
    if (!isSupabaseConfigured()) return []
    const { data } = await supabase()
      .from('jornadas')
      .select('id, nombre, descripcion, enfoque_salud, fecha_inicio, fecha_fin, organizacion_id, created_at, workshops ( count )')
      .eq('organizacion_id', organizacionId)
      .order('fecha_inicio', { ascending: false, nullsFirst: false })
    return (data as unknown as JornadaFila[] | null) ?? []
  }

  async function crear(organizacionId: number, datos: DatosJornada) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').insert({ ...normalizar(datos), organizacion_id: organizacionId })
    return { error: error?.message ?? null }
  }

  async function actualizar(id: number, datos: DatosJornada) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').update(normalizar(datos)).eq('id', id)
    return { error: error?.message ?? null }
  }

  // Sus workshops se quedan, sin jornada (`on delete set null`).
  async function eliminar(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('jornadas').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  return { listar, crear, actualizar, eliminar }
}
