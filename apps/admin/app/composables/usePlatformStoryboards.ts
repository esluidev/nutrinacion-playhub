import type { Enums } from '~/utils/db'
import type { Localized } from '~/utils/types'
import { urlDePlayer } from '~/composables/useStoryboards'

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de storyboards — consola del operador (Platform, solo superadmin), SOLO PARA VER.
//
// Todo lo del storyboard se cambia en Player (decisión 013): lo registra y actualiza desde su JSON
// (`sincronizar_storyboard`), lo publica (estado, países y organización), escribe su guía del
// educador (`guias` y `guia_escenas`) y lo elimina. Aquí se ve la lista, el detalle y la guía.
// ─────────────────────────────────────────────────────────────────────────────

export type EstadoPublicacion = Enums<'estado_publicacion'>

export interface StoryboardFila {
  id: number
  clave: string
  slug: string
  version_build: string | null
  titulo: Localized
  categoria: string
  subcategoria: string | null
  edicion: string
  enfoques_salud: string[]
  idiomas: string[]
  duracion_min: number | null
  numero_escenas: number
  estado_publicacion: EstadoPublicacion
  paises_disponibles: string[]
  organizacion_id: number | null
  organizaciones: { id: number, nombre: string } | null
}

// La guía de una escena: los campos de la plantilla de la guía, en su orden.
const SECCIONES_GUIA = [
  'verbo', 'subtitulo', 'descripcion', 'objetivo', 'pedagogia', 'preguntas', 'psicologia',
  'cientifico', 'no_hace', 'consejos', 'mecanica', 'material',
] as const

export type SeccionGuia = typeof SECCIONES_GUIA[number]
export const seccionesGuia = SECCIONES_GUIA

export type EscenaFila = {
  id: number
  orden: number
  carpeta: string
  titulo: Localized
} & Record<SeccionGuia, Localized | null>

/** La cabecera de la guía del educador (tabla `guias`). */
export interface GuiaCabecera {
  id: number
  version: string | null
  descripcion: Localized | null
  objetivo: Localized | null
  publico: Localized | null
  adaptado_a: Localized | null
}

export interface StoryboardDetalle extends StoryboardFila {
  guia: GuiaCabecera | null
  escenas: EscenaFila[]
}

const SELECT_FILA = `
  id, clave, slug, version_build, titulo, categoria, subcategoria, edicion, enfoques_salud, idiomas,
  duracion_min, numero_escenas, estado_publicacion, paises_disponibles, organizacion_id,
  organizaciones ( id, nombre )
`

/** La carpeta de la categoría en el runner de Player: ALIMENTACION → alimentacion. */
export const carpetaDeCategoria = (categoria: string) => categoria.toLowerCase().replace(/_/g, '-')

/** Donde se cambia un storyboard: su detalle en la gestión de Player, o la guía de una escena. */
export function urlGestionEnPlayer(playerUrl: string, categoria: string, slug: string, escena?: string): string {
  const detalle = `${playerUrl.replace(/\/+$/, '')}/storyboards/${carpetaDeCategoria(categoria)}/${slug}`
  return escena ? `${detalle}/guia/${escena}` : detalle
}

export function usePlatformStoryboards() {
  // El cliente se resuelve POR LLAMADA: construirlo en el cuerpo hace que invocar el
  // composable ya lance en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  // Buscar: por slug y por el título en cada idioma de las apps. Filtrar: estado, categoría e idioma.
  async function listStoryboards(opts: { q?: string, estado?: string, categoria?: string, idioma?: string, page?: number } = {}) {
    if (!isSupabaseConfigured()) return { data: [] as StoryboardFila[], total: 0 }
    const [from, to] = rangoDePagina(opts.page ?? 1)
    let query = supabase()
      .from('storyboards')
      .select(SELECT_FILA, { count: 'exact' })
      .order('slug')
      .range(from, to)

    if (opts.estado && opts.estado !== 'todos') query = query.eq('estado_publicacion', opts.estado as EstadoPublicacion)
    if (opts.categoria && opts.categoria !== 'todos') query = query.eq('categoria', opts.categoria as Enums<'categoria_storyboard'>)
    if (opts.idioma && opts.idioma !== 'todos') query = query.contains('idiomas', [opts.idioma as Enums<'idioma'>])
    if (opts.q) {
      const q = opts.q.replace(/[%,()]/g, ' ').trim()
      query = query.or(`slug.ilike.%${q}%,titulo->>es.ilike.%${q}%,titulo->>en.ilike.%${q}%`)
    }

    const { data, count } = await query
    return { data: ((data as unknown) as StoryboardFila[] | null) ?? [], total: count ?? 0 }
  }

  async function getStoryboard(id: number): Promise<StoryboardDetalle | null> {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase()
      .from('storyboards')
      .select(`
        ${SELECT_FILA},
        guia:guias ( id, version, descripcion, objetivo, publico, adaptado_a,
          escenas:guia_escenas ( id, orden, carpeta, titulo, ${SECCIONES_GUIA.join(', ')} ) )
      `)
      .eq('id', id)
      .maybeSingle()

    if (!data) return null
    const fila = (data as unknown) as StoryboardFila & { guia: (GuiaCabecera & { escenas: EscenaFila[] }) | null }
    const { guia, ...storyboard } = fila
    const { escenas = [], ...cabecera } = guia ?? {}
    return {
      ...storyboard,
      guia: guia ? (cabecera as GuiaCabecera) : null,
      escenas: [...escenas].sort((a, b) => a.orden - b.orden),
    }
  }

  // La URL de Player vive en `configuracion` (clave `player_url`): Admin arma los enlaces de
  // «Probar» con ella, sin acoplarse a un host (`urlDePlayer`, también en la vista previa).
  const getPlayerUrl = urlDePlayer

  return {
    listStoryboards,
    getStoryboard,
    getPlayerUrl,
  }
}
