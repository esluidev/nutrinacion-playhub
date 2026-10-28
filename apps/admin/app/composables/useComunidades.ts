// Comunidades de una organización: el nivel donde ocurre TODA la operación (educadores ligados,
// talleres, colaboradores y participantes). Sin al menos una, un admin no puede hacer nada.
// Cada comunidad está en un país de su licencia (lo exige la base): decide qué storyboards usa.
//
// Quién puede qué lo decide el RLS (0002): leer = superadmin, admin de la org o colaborador
// asignado; escribir = superadmin o admin de la org dueña (el `with check` impide crear una
// comunidad en una org ajena). Aquí no se re-valida: se confía en la base.

export interface DatosComunidad {
  nombre: string
  descripcion: string
  correo: string
  telefono: string
  pais: string
  organizacion_id: number
}

export interface ComunidadFila {
  id: number
  nombre: string
  descripcion: string | null
  correo: string | null
  telefono: string | null
  pais: string | null
  organizacion_id: number
  created_at: string
  educadores: { count: number }[]
  colaboradores: { count: number }[]
  participantes: { count: number }[]
}

function normalizar(p: DatosComunidad) {
  return {
    nombre: p.nombre.trim(),
    descripcion: p.descripcion.trim() || null,
    correo: p.correo.trim() || null,
    telefono: p.telefono.trim() || null,
    pais: p.pais,
    organizacion_id: p.organizacion_id,
  }
}

export function useComunidades() {
  // El cliente se resuelve POR LLAMADA, no al invocar el composable: `utils/supabase.ts`
  // lanza si faltan las env vars, así que construirlo aquí hacía que bastara con llamar a
  // este composable para tumbar la página en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  // Los educadores ligados (comunidad_educadores), sus colaboradores y sus participantes (perfiles
  // del hogar que se unieron con su código). OJO: el conteo de educadores incluye los ligados
  // inactivos; `useEducators` los muestra como «Inactivo».
  async function listPorOrg(organizacionId: number) {
    if (!isSupabaseConfigured()) return [] as ComunidadFila[]
    const { data } = await supabase()
      .from('comunidades')
      .select('id, nombre, descripcion, correo, telefono, pais, organizacion_id, created_at, educadores:comunidad_educadores ( count ), colaboradores:comunidad_colaboradores ( count ), participantes:comunidad_participantes ( count )')
      .eq('organizacion_id', organizacionId)
      .order('nombre')
    return (data as unknown as ComunidadFila[] | null) ?? []
  }

  async function get(id: number) {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase().from('comunidades').select('*').eq('id', id).maybeSingle()
    return data
  }

  async function create(payload: DatosComunidad) {
    if (!isSupabaseConfigured()) return { id: null as number | null, error: null as string | null }
    const { data, error } = await supabase()
      .from('comunidades').insert(normalizar(payload)).select('id').single()
    return { id: (data?.id as number) ?? null, error: error?.message ?? null }
  }

  async function update(id: number, payload: DatosComunidad) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('comunidades').update(normalizar(payload)).eq('id', id)
    return { error: error?.message ?? null }
  }

  // Lo que se lleva el borrado en cascada: conteos REALES para que la confirmación
  // le diga la verdad al admin antes de destruir nada.
  async function resumenBorrado(id: number) {
    if (!isSupabaseConfigured()) return { educadores: 0, grupos: 0, talleres: 0, colaboradores: 0, participantes: 0 }
    const head = { count: 'exact' as const, head: true }
    const [educadores, grupos, talleres, colaboradores, participantes] = await Promise.all([
      supabase().from('comunidad_educadores').select('id', head).eq('comunidad_id', id),
      supabase().from('educador_grupos').select('id', head).eq('comunidad_id', id),
      supabase().from('workshops').select('id', head).eq('comunidad_id', id),
      supabase().from('comunidad_colaboradores').select('id', head).eq('comunidad_id', id),
      supabase().from('comunidad_participantes').select('id', head).eq('comunidad_id', id),
    ])
    return {
      educadores: educadores.count ?? 0,
      grupos: grupos.count ?? 0,
      talleres: talleres.count ?? 0,
      colaboradores: colaboradores.count ?? 0,
      participantes: participantes.count ?? 0,
    }
  }

  // La FK de `comunidades` en organizaciones es `on delete restrict` hacia arriba, pero hacia
  // abajo cascadea: borrar una comunidad se lleva sus grupos, sus talleres y el vínculo con sus
  // educadores y participantes (los educadores siguen en la organización).
  async function remove(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('comunidades').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  // ── Participantes y su código (app del hogar, 0009) ─────────────────────────
  // Los perfiles del hogar que se unieron con el código: la base solo deja ver nombre, género y
  // edad (nunca la cuenta, sus intereses ni su avance).
  async function participantes(id: number) {
    if (!isSupabaseConfigured()) return [] as { id: number, nombre: string, genero: 'NINO' | 'NINA', edad: number, unidoEn: string }[]
    const { data } = await supabase()
      .from('comunidad_participantes')
      .select('id, unido_en, perfil:hogar_perfiles ( nombre, genero, anio_nacimiento )')
      .eq('comunidad_id', id)
      .order('unido_en', { ascending: false })
    const anio = new Date().getFullYear()
    type Fila = { id: number, unido_en: string, perfil: { nombre: string, genero: 'NINO' | 'NINA', anio_nacimiento: number } | null }
    return ((data as unknown as Fila[] | null) ?? [])
      .filter(f => f.perfil)
      .map(f => ({ id: f.id, nombre: f.perfil!.nombre, genero: f.perfil!.genero, edad: anio - f.perfil!.anio_nacimiento, unidoEn: f.unido_en }))
  }

  // Quitar a un participante (p. ej., alguien que no es de la comunidad). Conviene cambiar el
  // código después: si no, puede volver a unirse.
  async function quitarParticipante(participanteId: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('comunidad_participantes').delete().eq('id', participanteId)
    return { error: error?.message ?? null }
  }

  // Genera (o cambia) el código para unirse: el anterior deja de admitir altas; los participantes siguen.
  async function generarCodigoAcceso(id: number) {
    if (!isSupabaseConfigured()) return { codigo: '000000', error: null as string | null }
    const { data, error } = await supabase().rpc('comunidad_generar_codigo_acceso', { p_comunidad_id: id })
    return { codigo: (data as string | null) ?? null, error: error?.message ?? null }
  }

  return { listPorOrg, get, create, update, remove, resumenBorrado, participantes, quitarParticipante, generarCodigoAcceso }
}
