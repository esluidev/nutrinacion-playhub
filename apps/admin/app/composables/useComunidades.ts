// Comunidades de una organización: el nivel donde ocurre TODA la operación (educadores,
// talleres, colaboradores). Sin al menos una, un admin no puede hacer nada — `comunidad_id` es
// NOT NULL en esas tablas.
//
// Quién puede qué lo decide el RLS (0002): leer = superadmin, admin de la org o colaborador
// asignado; escribir = superadmin o admin de la org dueña (el `with check` impide crear una
// comunidad en una org ajena). Aquí no se re-valida: se confía en la base.

export interface DatosComunidad {
  nombre: string
  descripcion: string
  correo: string
  telefono: string
  pais: string | null
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
}

function normalizar(p: DatosComunidad) {
  return {
    nombre: p.nombre.trim(),
    descripcion: p.descripcion.trim() || null,
    correo: p.correo.trim() || null,
    telefono: p.telefono.trim() || null,
    pais: p.pais || null,
    organizacion_id: p.organizacion_id,
  }
}

export function useComunidades() {
  // El cliente se resuelve POR LLAMADA, no al invocar el composable: `utils/supabase.ts`
  // lanza si faltan las env vars, así que construirlo aquí hacía que bastara con llamar a
  // este composable para tumbar la página en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  // OJO: `educadores ( count )` cuenta también los borrados lógicos, mientras que
  // `useEducators` los descarta con `.is('deleted_at', null)`. Hoy no diverge porque la app
  // todavía no puede borrar educadores; cuando exista esa acción hay que filtrar el recurso
  // embebido aquí y comprobar con datos reales que las comunidades sin educadores siguen
  // apareciendo (el filtro no debe volver el join un INNER).
  async function listPorOrg(organizacionId: number) {
    if (!isSupabaseConfigured()) return [] as ComunidadFila[]
    const { data } = await supabase()
      .from('comunidades')
      .select('id, nombre, descripcion, correo, telefono, pais, organizacion_id, created_at, educadores ( count ), colaboradores ( count )')
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
    if (!isSupabaseConfigured()) return { educadores: 0, grupos: 0, talleres: 0, colaboradores: 0 }
    const head = { count: 'exact' as const, head: true }
    const [educadores, grupos, talleres, colaboradores] = await Promise.all([
      supabase().from('educadores').select('id', head).eq('comunidad_id', id),
      supabase().from('grupos').select('id', head).eq('comunidad_id', id),
      supabase().from('talleres').select('id', head).eq('comunidad_id', id),
      supabase().from('colaboradores').select('id', head).eq('comunidad_id', id),
    ])
    return {
      educadores: educadores.count ?? 0,
      grupos: grupos.count ?? 0,
      talleres: talleres.count ?? 0,
      colaboradores: colaboradores.count ?? 0,
    }
  }

  // La FK de `comunidades` en organizaciones es `on delete restrict` hacia arriba, pero hacia
  // abajo cascadea: borrar una comunidad se lleva sus educadores, grupos y talleres.
  async function remove(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('comunidades').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  return { listPorOrg, get, create, update, remove, resumenBorrado }
}
