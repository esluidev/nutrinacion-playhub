// Lo que una organización ofrece en la app del hogar (0009): temarios (storyboards agrupados bajo
// un tema) y publicaciones (un storyboard o un temario, para toda la organización o para una
// comunidad, desde una fecha). Solo los ven sus participantes; lo público es de Nutrinación.
//
// Quién puede qué lo decide la RLS: los admins de la organización, todo; quien opera una
// comunidad, los temarios y publicaciones de esa comunidad. La base comprueba además que cada
// storyboard esté publicado y sea estándar o de la organización.
import type { Localized } from '~/utils/types'

export interface StoryboardElegible {
  id: number
  titulo: Localized
  categoria: string
  edicion: string
}

export interface TemarioFila {
  id: number
  titulo: Localized
  descripcion: Localized | null
  comunidad_id: number | null
  comunidad: { nombre: string } | null
  storyboards: { orden: number, storyboard: StoryboardElegible | null }[]
}

export interface PublicacionFila {
  id: number
  disponible_desde: string
  comunidad_id: number | null
  comunidad: { nombre: string } | null
  storyboard: StoryboardElegible | null
  temario: { id: number, titulo: Localized } | null
}

export interface DatosTemario {
  titulo: Localized
  descripcion: Localized | null
  comunidadId: number | null           // null = de toda la organización
  storyboardIds: number[]              // en orden
}

export interface DatosPublicacion {
  comunidadId: number | null           // null = para todas sus comunidades
  storyboardId: number | null
  temarioId: number | null
  disponibleDesde: string              // YYYY-MM-DD; hoy = ya
}

const SB = 'id, titulo, categoria, edicion'

export function usePublicaciones() {
  const supabase = () => useSupabaseClient()

  // Lo de la organización y, si se da una comunidad, solo lo que la alcanza (de toda la org o suyo).
  async function listar(organizacionId: number, comunidadId: number | null = null) {
    if (!isSupabaseConfigured()) return { temarios: [] as TemarioFila[], publicaciones: [] as PublicacionFila[] }
    let qt = supabase()
      .from('temarios')
      .select(`id, titulo, descripcion, comunidad_id, comunidad:comunidades ( nombre ),
               storyboards:temario_storyboards ( orden, storyboard:storyboards ( ${SB} ) )`)
      .eq('organizacion_id', organizacionId)
      .neq('estado_publicacion', 'ARCHIVADO')
      .order('created_at', { ascending: false })
    let qp = supabase()
      .from('organizacion_publicaciones')
      .select(`id, disponible_desde, comunidad_id, comunidad:comunidades ( nombre ),
               storyboard:storyboards ( ${SB} ), temario:temarios ( id, titulo )`)
      .eq('organizacion_id', organizacionId)
      .order('disponible_desde', { ascending: false })
    if (comunidadId) {
      qt = qt.or(`comunidad_id.is.null,comunidad_id.eq.${comunidadId}`)
      qp = qp.or(`comunidad_id.is.null,comunidad_id.eq.${comunidadId}`)
    }
    const [{ data: temarios }, { data: publicaciones }] = await Promise.all([qt, qp])
    const ordenar = (t: TemarioFila) => ({ ...t, storyboards: [...t.storyboards].sort((a, b) => a.orden - b.orden) })
    return {
      temarios: ((temarios as unknown as TemarioFila[] | null) ?? []).map(ordenar),
      publicaciones: (publicaciones as unknown as PublicacionFila[] | null) ?? [],
    }
  }

  // Los storyboards que la organización puede ofrecer: publicados, estándar o suyos.
  async function storyboardsElegibles(organizacionId: number): Promise<StoryboardElegible[]> {
    if (!isSupabaseConfigured()) return []
    const { data } = await supabase()
      .from('storyboards')
      .select(SB)
      .eq('estado_publicacion', 'PUBLICADO')
      .or(`organizacion_id.is.null,organizacion_id.eq.${organizacionId}`)
      .order('id')
    return (data as unknown as StoryboardElegible[] | null) ?? []
  }

  // Crea o edita un temario con sus storyboards en orden (se reescriben enteros).
  async function guardarTemario(organizacionId: number, datos: DatosTemario, id: number | null = null) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const fila = { titulo: datos.titulo, descripcion: datos.descripcion }
    let temarioId = id
    if (temarioId) {
      const { error } = await supabase().from('temarios').update(fila).eq('id', temarioId)
      if (error) return { error: error.message }
      const { error: e2 } = await supabase().from('temario_storyboards').delete().eq('temario_id', temarioId)
      if (e2) return { error: e2.message }
    }
    else {
      const { data, error } = await supabase()
        .from('temarios')
        .insert({ ...fila, estado_publicacion: 'PUBLICADO', organizacion_id: organizacionId, comunidad_id: datos.comunidadId })
        .select('id')
        .single()
      if (error) return { error: error.message }
      temarioId = data.id
    }
    if (datos.storyboardIds.length) {
      const { error } = await supabase().from('temario_storyboards').insert(
        datos.storyboardIds.map((storyboardId, i) => ({ temario_id: temarioId!, storyboard_id: storyboardId, orden: i + 1 })))
      if (error) return { error: error.message }
    }
    return { error: null }
  }

  // Borrar un temario retira también sus publicaciones (cascada).
  async function eliminarTemario(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('temarios').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  async function publicar(organizacionId: number, datos: DatosPublicacion) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const hoy = new Date().toLocaleDateString('en-CA')
    const { error } = await supabase().from('organizacion_publicaciones').insert({
      organizacion_id: organizacionId,
      comunidad_id: datos.comunidadId,
      storyboard_id: datos.storyboardId,
      temario_id: datos.temarioId,
      // Hoy = desde ya; otro día = desde el comienzo de ese día.
      disponible_desde: datos.disponibleDesde && datos.disponibleDesde > hoy
        ? new Date(`${datos.disponibleDesde}T00:00:00`).toISOString()
        : new Date().toISOString(),
    })
    return { error: error?.message ?? null }
  }

  // Retirar: deja de verse en casa.
  async function retirar(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('organizacion_publicaciones').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  // El perfil público de la organización (lo ven las familias en «Unirme»).
  async function getPerfilPublico(organizacionId: number) {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase()
      .from('organizaciones').select('perfil_publico, descripcion_publica, logo').eq('id', organizacionId).maybeSingle()
    return data as { perfil_publico: boolean, descripcion_publica: Localized | null, logo: string | null } | null
  }

  async function guardarPerfilPublico(organizacionId: number, datos: { publico: boolean, descripcion: Localized | null, logo: string }) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().rpc('organizacion_actualizar_perfil_publico', {
      p_organizacion_id: organizacionId,
      p_publico: datos.publico,
      p_descripcion: datos.descripcion as never,
      p_logo: datos.logo,
    })
    return { error: error?.message ?? null }
  }

  return { listar, storyboardsElegibles, guardarTemario, eliminarTemario, publicar, retirar, getPerfilPublico, guardarPerfilPublico }
}
