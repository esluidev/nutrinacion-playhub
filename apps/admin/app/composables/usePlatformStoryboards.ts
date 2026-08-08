import type { StoryboardMetadata } from '~/utils/metadataStoryboard'
import type { Localized } from '~/utils/types'

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de storyboards — consola del operador (Platform, solo superadmin).
//
// Acá vive TODA la administración: alta (pegando la metadata que produce Studio), estado
// de publicación, guía pedagógica por escena, duración, países y propiedad. Studio no
// escribe nunca; la migración 0009 además cierra la escritura a superadmin en la base.
//
// Lo BUILD-OWNED (clave, slug, nº de escenas, idiomas, tipo/categoría/audiencia, carpetas)
// llega por metadata y NO se edita a mano: si admin pudiera declarar un idioma que el
// contenido no tiene, el educador abriría un taller que no puede leer.
// ─────────────────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 20

export interface StoryboardFila {
  id: number
  clave: string
  slug: string
  titulo: Localized
  estado: string
  numero_escenas: number
  idiomas: string[]
  duracion_min: number | null
  organizacion_id: number | null
  organizaciones: { id: number, nombre: string } | null
  tipo: { codigo: string, nombre: Localized } | null
  categoria: { codigo: string, nombre: Localized } | null
  audiencia: { codigo: string, nombre: Localized } | null
}

export interface EscenaFila {
  id: number
  orden: number
  folder: string
  titulo: Localized
  descripcion: Localized | null
  objetivo: Localized | null
  pedagogia: Localized | null
  psicologia: Localized | null
  cientifico: Localized | null
  consejos: Localized | null
  mecanica: Localized | null
}

export interface StoryboardDetalle extends StoryboardFila {
  descripcion: Localized
  objetivo: Localized | null
  bibliografia: Localized | null
  portada: string | null
  paises: string[]
  escenas: EscenaFila[]
}

/** Campos que el superadmin sí escribe a mano. */
export interface DatosEditoriales {
  titulo: Localized
  descripcion: Localized
  objetivo: Localized | null
  bibliografia: Localized | null
  estado: string
  duracion_min: number | null
  portada: string | null
  paises: string[]
  organizacion_id: number | null
}

const SELECT_FILA = `
  id, clave, slug, titulo, estado, numero_escenas, idiomas, duracion_min, organizacion_id,
  organizaciones ( id, nombre ),
  tipo:tipos_storyboard ( codigo, nombre ),
  categoria:categorias_storyboard ( codigo, nombre ),
  audiencia:edades_audiencia ( codigo, nombre )
`

const SECCIONES_GUIA = [
  'descripcion', 'objetivo', 'pedagogia', 'psicologia', 'cientifico', 'consejos', 'mecanica',
] as const

export type SeccionGuia = typeof SECCIONES_GUIA[number]
export const seccionesGuia = SECCIONES_GUIA

function rango(page: number): [number, number] {
  const from = (page - 1) * PAGE_SIZE
  return [from, from + PAGE_SIZE - 1]
}

export function usePlatformStoryboards() {
  // El cliente se resuelve POR LLAMADA: construirlo en el cuerpo hace que invocar el
  // composable ya lance en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  async function listStoryboards(opts: { q?: string, estado?: string, tipo?: string, page?: number } = {}) {
    if (!isSupabaseConfigured()) return { data: [] as StoryboardFila[], total: 0 }
    const [from, to] = rango(opts.page ?? 1)
    let query = supabase()
      .from('storyboards')
      .select(SELECT_FILA, { count: 'exact' })
      .order('slug')
      .range(from, to)

    if (opts.estado && opts.estado !== 'todos') query = query.eq('estado', opts.estado)
    if (opts.tipo && opts.tipo !== 'todos') query = query.eq('tipos_storyboard.codigo', opts.tipo)
    if (opts.q) query = query.ilike('slug', `%${opts.q}%`)

    const { data, count } = await query
    return { data: ((data as unknown) as StoryboardFila[] | null) ?? [], total: count ?? 0 }
  }

  async function getStoryboard(id: number): Promise<StoryboardDetalle | null> {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase()
      .from('storyboards')
      .select(`
        ${SELECT_FILA}, descripcion, objetivo, bibliografia, portada, paises,
        escenas:storyboard_escenas (
          id, orden, folder, titulo,
          descripcion, objetivo, pedagogia, psicologia, cientifico, consejos, mecanica
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (!data) return null
    const detalle = (data as unknown) as StoryboardDetalle
    detalle.escenas = [...(detalle.escenas ?? [])].sort((a, b) => a.orden - b.orden)
    return detalle
  }

  /** ¿Ya hay una fila con esa clave? El alta es idempotente por `clave` (unique). */
  async function existeClave(clave: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false
    const { count } = await supabase()
      .from('storyboards')
      .select('id', { count: 'exact', head: true })
      .eq('clave', clave)
    return (count ?? 0) > 0
  }

  /**
   * Resuelve los códigos de la metadata a los ids de los catálogos.
   * La categoría se busca POR TIPO: `categorias_storyboard` es unique(tipo_id, codigo) y
   * PREVENCION existe bajo ALIMENTACION y bajo ACTIVIDAD_FISICA como filas distintas.
   */
  async function resolverCodigos(meta: StoryboardMetadata) {
    const db = supabase()

    const { data: tipo } = await db
      .from('tipos_storyboard').select('id').eq('codigo', meta.tipo_codigo).maybeSingle()
    if (!tipo) return { ids: null, error: `El tipo "${meta.tipo_codigo}" no existe en el catálogo.` }
    const tipo_id = (tipo as { id: number }).id

    const { data: audiencia } = await db
      .from('edades_audiencia').select('id').eq('codigo', meta.audiencia_codigo).maybeSingle()
    if (!audiencia) return { ids: null, error: `La audiencia "${meta.audiencia_codigo}" no existe en el catálogo.` }

    let categoria_id: number | null = null
    if (meta.categoria_codigo) {
      const { data: categoria } = await db
        .from('categorias_storyboard').select('id')
        .eq('codigo', meta.categoria_codigo)
        .eq('tipo_id', tipo_id)
        .maybeSingle()
      if (!categoria) {
        return { ids: null, error: `La categoría "${meta.categoria_codigo}" no existe bajo el tipo "${meta.tipo_codigo}".` }
      }
      categoria_id = (categoria as { id: number }).id
    }

    return {
      ids: { tipo_id, categoria_id, audiencia_id: (audiencia as { id: number }).id },
      error: null,
    }
  }

  /** Alta: crea la fila y sus escenas a partir de la metadata + lo editorial. */
  async function registrar(meta: StoryboardMetadata, editorial: DatosEditoriales) {
    if (!isSupabaseConfigured()) return { id: null as number | null, error: null as string | null }

    if (await existeClave(meta.clave)) {
      return { id: null, error: 'Ese storyboard ya está registrado.' }
    }

    const { ids, error: errorCodigos } = await resolverCodigos(meta)
    if (!ids) return { id: null, error: errorCodigos }

    const { data, error } = await supabase()
      .from('storyboards')
      .insert({
        clave: meta.clave,
        slug: meta.slug,
        titulo: editorial.titulo,
        descripcion: editorial.descripcion,
        objetivo: editorial.objetivo,
        bibliografia: editorial.bibliografia,
        estado: editorial.estado,
        duracion_min: editorial.duracion_min,
        portada: editorial.portada,
        paises: editorial.paises,
        organizacion_id: editorial.organizacion_id,
        numero_escenas: meta.numero_escenas,
        idiomas: meta.idiomas,
        ...ids,
      })
      .select('id')
      .single()

    if (error) return { id: null, error: error.message }
    const storyboardId = (data as { id: number }).id

    // Las escenas nacen solo con lo del build; la guía se escribe después, escena por escena.
    if (meta.escenas.length) {
      const { error: errorEscenas } = await supabase()
        .from('storyboard_escenas')
        .insert(meta.escenas.map(e => ({
          storyboard_id: storyboardId,
          orden: e.orden,
          folder: e.folder,
          titulo: e.titulo,
        })))
      if (errorEscenas) return { id: storyboardId, error: `El storyboard se creó pero sus escenas no: ${errorEscenas.message}` }
    }

    return { id: storyboardId, error: null }
  }

  async function actualizarEditorial(id: number, datos: DatosEditoriales) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('storyboards').update({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      objetivo: datos.objetivo,
      bibliografia: datos.bibliografia,
      estado: datos.estado,
      duracion_min: datos.duracion_min,
      portada: datos.portada,
      paises: datos.paises,
      organizacion_id: datos.organizacion_id,
    }).eq('id', id)
    return { error: error?.message ?? null }
  }

  // `null` limpia la sección: dejarla vacía en el formulario debe poder borrar lo guardado.
  async function actualizarGuia(escenaId: number, guia: Partial<Record<SeccionGuia, Localized | null>>) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('storyboard_escenas').update(guia).eq('id', escenaId)
    return { error: error?.message ?? null }
  }

  async function eliminar(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    // `talleres.storyboard_id` es ON DELETE RESTRICT: la base frena si ya se usó en un taller.
    const { error } = await supabase().from('storyboards').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  /**
   * Resincroniza lo BUILD-OWNED repegando la metadata (el caso típico: Studio agregó un
   * idioma o una escena). Solo toca lo que dicta el build; lo editorial y las guías ya
   * escritas quedan intactas. La `clave` tiene que coincidir con la fila: pegar la metadata
   * de OTRO storyboard es el error más peligroso de esta pantalla y se rechaza primero.
   *
   * Escenas: se casan por `folder`. Las existentes conservan su fila (y su guía), las
   * nuevas se insertan, y las que ya no están en el build se borran junto con su guía —
   * si la escena no existe, su guía no tiene qué describir.
   */
  async function sincronizarBuild(id: number, clave: string, meta: StoryboardMetadata) {
    if (!isSupabaseConfigured()) return { error: null as string | null }

    if (meta.clave !== clave) {
      return { error: 'Esa metadata es de OTRO storyboard: la clave no coincide con este registro.' }
    }

    const { ids, error: errorCodigos } = await resolverCodigos(meta)
    if (!ids) return { error: errorCodigos }

    const db = supabase()

    const { error: errorSb } = await db.from('storyboards').update({
      slug: meta.slug,
      numero_escenas: meta.numero_escenas,
      idiomas: meta.idiomas,
      ...ids,
    }).eq('id', id)
    if (errorSb) return { error: errorSb.message }

    const { data: actuales } = await db
      .from('storyboard_escenas')
      .select('id, folder, orden')
      .eq('storyboard_id', id)
    const filas = ((actuales as unknown) as { id: number, folder: string, orden: number }[] | null) ?? []
    const porFolder = new Map(filas.map(f => [f.folder, f]))
    const foldersBuild = new Set(meta.escenas.map(e => e.folder))

    // 1) Fuera las escenas que el build ya no tiene.
    const sobrantes = filas.filter(f => !foldersBuild.has(f.folder)).map(f => f.id)
    if (sobrantes.length) {
      const { error } = await db.from('storyboard_escenas').delete().in('id', sobrantes)
      if (error) return { error: error.message }
    }

    // 2) `orden` es unique(storyboard_id, orden): si el build reordenó, actualizar en una
    //    pasada puede chocar con un orden todavía ocupado. Primera pasada a un rango alto
    //    libre (+1000) y segunda al valor final — con ~7 escenas son pocas llamadas.
    const conservadas = meta.escenas.filter(e => porFolder.has(e.folder))
    for (const escena of conservadas) {
      const fila = porFolder.get(escena.folder)!
      const { error } = await db.from('storyboard_escenas')
        .update({ orden: fila.orden + 1000 }).eq('id', fila.id)
      if (error) return { error: error.message }
    }
    for (const escena of conservadas) {
      const fila = porFolder.get(escena.folder)!
      const { error } = await db.from('storyboard_escenas')
        .update({ orden: escena.orden, titulo: escena.titulo }).eq('id', fila.id)
      if (error) return { error: error.message }
    }

    // 3) Las escenas nuevas nacen sin guía, como en el alta.
    const nuevas = meta.escenas.filter(e => !porFolder.has(e.folder))
    if (nuevas.length) {
      const { error } = await db.from('storyboard_escenas').insert(
        nuevas.map(e => ({ storyboard_id: id, orden: e.orden, folder: e.folder, titulo: e.titulo })),
      )
      if (error) return { error: error.message }
    }

    return { error: null }
  }

  // La URL pública del runner de Studio vive en `configuracion` (studio_url): admin arma
  // los links de "Probar" con ella, sin acoplarse a un host.
  async function getStudioUrl(): Promise<string | null> {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase()
      .from('configuracion').select('valor').eq('clave', 'studio_url').maybeSingle()
    const url = (data as { valor: string } | null)?.valor ?? null
    return url ? url.replace(/\/$/, '') : null
  }

  return {
    listStoryboards,
    getStoryboard,
    existeClave,
    resolverCodigos,
    registrar,
    actualizarEditorial,
    actualizarGuia,
    sincronizarBuild,
    getStudioUrl,
    eliminar,
  }
}
