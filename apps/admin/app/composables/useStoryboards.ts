// Catálogo de storyboards que la COMUNIDAD activa puede usar, sobre Supabase.
// Visible = PUBLICADO y (estándar, o personalizado de la org activa), filtrado por país
// de la comunidad EN LA APP (paises vacío = global). ADAPTADOR: la UI consume títulos y
// textos ya resueltos al locale actual; la guía por escena se sirve tal cual la escribió
// Player (texto enriquecido). En dev sin Supabase, filas demo.

import { uiAreaOf, type UiArea } from '@playhub/ui/app/utils/ui-tones'
import type { Localized } from '~/utils/types'

export interface StoryboardScene {
  id: number
  title: string
  verb: string
  subtitle: string
  description: string
  objective: string
  // Guía de la escena (guia_escenas): los campos de la plantilla de la guía.
  pedagogia: string
  preguntas: string
  psicologia: string
  cientifico: string
  noHace: string
  consejos: string
  mecanica: string
  material: string
}

export interface Storyboard {
  id: number
  title: string
  description: string
  category: string           // su área educativa (alimentación, actividad física, …), traducida
  area?: UiArea              // la categoría (storyboards.categoria): tiñe con data-area
  // Pertenencia: PÚBLICO = del catálogo base, sin organización dueña (storyboards.organizacion_id
  // nulo). PERSONALIZADO = hecho para una organización. No es un nivel de pago: el acceso lo
  // da la licencia.
  pertenencia: 'Público' | 'Personalizado'
  targetAge: string
  duration: string
  scenesCount: number
  objective: string           // guía general (texto enriquecido)
  publico: string             // la edición, con las palabras de la organización
  languages: string[]         // idiomas del contenido: el taller elige uno
  scenes: StoryboardScene[]   // solo en el detalle (fetchDetalle)
}

const DEMO_STORYBOARDS: Storyboard[] = [
  { id: 1, title: 'Los Frijoles Mágicos', description: 'Descubre el poder de los frijoles y cómo nos ayudan a crecer fuertes.', category: 'Alimentación', pertenencia: 'Público', targetAge: 'Kids', duration: '30 min', area: 'alimentacion', scenesCount: 7, objective: 'Conocer las leguminosas y su valor nutricional.', publico: '', languages: ['es'], scenes: [] },
  { id: 2, title: 'Piernas Fuertes', description: 'Actividad física divertida para fortalecer el cuerpo.', category: 'Actividad física', pertenencia: 'Público', targetAge: 'Kids', duration: '25 min', area: 'actividad-fisica', scenesCount: 6, objective: 'Fomentar el movimiento diario.', publico: '', languages: ['es'], scenes: [] },
  { id: 3, title: 'La Sopa de Verduras', description: 'Reconocer y calmar emociones con una historia cálida.', category: 'Salud emocional', pertenencia: 'Personalizado', targetAge: 'Kids', duration: '30 min', area: 'salud-emocional', scenesCount: 6, objective: 'Reconocer, calmar y expresar emociones.', publico: '', languages: ['es'], scenes: [] },
]

// El contenido viene como jsonb Localized: se resuelve al locale actual con fallback a es.
function loc(valor: Localized | null | undefined, locale: string): string {
  if (!valor) return ''
  return valor[locale] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

interface StoryboardRow {
  id: number
  titulo: Localized
  categoria: string
  edicion: string
  duracion_min: number | null
  numero_escenas: number
  idiomas: string[]
  paises_disponibles: string[]
  organizacion_id: number | null
  guia: { descripcion: Localized | null, objetivo: Localized | null, publico: Localized | null } | null
}

type CampoGuia = 'verbo' | 'subtitulo' | 'descripcion' | 'objetivo' | 'pedagogia' | 'preguntas' | 'psicologia'
  | 'cientifico' | 'no_hace' | 'consejos' | 'mecanica' | 'material'
type EscenaRow = { id: number, orden: number, titulo: Localized } & Record<CampoGuia, Localized | null>

const SELECT_STORYBOARD = `
  id, titulo, categoria, edicion, duracion_min, numero_escenas, idiomas, paises_disponibles, organizacion_id,
  guia:guias ( descripcion, objetivo, publico )
`

export function useStoryboards() {
  const demo = !isSupabaseConfigured()
  const { t, locale } = useT()
  const { orgActiva, comunidadActiva } = useContexto()
  const { user } = useAuth()

  const state = useState<{ comunidadId: number | null, storyboards: Storyboard[], loading: boolean }>(
    'storyboards-data',
    () => ({ comunidadId: null, storyboards: demo ? DEMO_STORYBOARDS : [], loading: false }),
  )

  function mapRow(row: StoryboardRow): Storyboard {
    return {
      id: row.id,
      title: loc(row.titulo, locale.value),
      description: loc(row.guia?.descripcion, locale.value),
      category: t(`catalogo.categoria.${row.categoria}`),
      pertenencia: row.organizacion_id ? 'Personalizado' : 'Público',
      targetAge: t(`catalogo.edicion.${row.edicion}`),
      duration: row.duracion_min ? `${row.duracion_min} min` : '—',
      area: uiAreaOf(row.categoria),
      scenesCount: row.numero_escenas,
      objective: loc(row.guia?.objetivo, locale.value),
      publico: loc(row.guia?.publico, locale.value),
      languages: row.idiomas,
      scenes: [],
    }
  }

  // País de la comunidad activa (vive en la superficie de acceso de useAuth).
  function paisComunidad(): string | null {
    const cid = comunidadActiva.value?.id
    return user.value?.comunidades.find(c => c.id === cid)?.pais ?? null
  }

  async function refresh() {
    if (demo) return
    const cid = comunidadActiva.value?.id
    if (!cid) return
    state.value.loading = true

    let query = useSupabaseClient()
      .from('storyboards')
      .select(SELECT_STORYBOARD)
      .eq('estado_publicacion', 'PUBLICADO')
    // Público (sin organización dueña) o personalizado de MI organización.
    query = orgActiva.value
      ? query.or(`organizacion_id.is.null,organizacion_id.eq.${orgActiva.value.id}`)
      : query.is('organizacion_id', null)

    const { data } = await query.order('id')

    // Disponibilidad por país: Player elige los países al publicar; la comunidad debe estar en la lista
    // (la base lo exige también al programar).
    const pais = paisComunidad()
    const filas = (((data as unknown) as StoryboardRow[] | null) ?? [])
      .filter(row => !!pais && row.paises_disponibles.includes(pais))

    state.value.storyboards = filas.map(mapRow)
    state.value.comunidadId = cid
    state.value.loading = false
  }

  if (import.meta.client && !demo) {
    const cid = comunidadActiva.value?.id ?? null
    if (cid && state.value.comunidadId !== cid && !state.value.loading) refresh()
  }

  const storyboards = computed(() => state.value.storyboards)
  const loading = computed(() => state.value.loading)

  function getStoryboard(id: number) {
    return storyboards.value.find(sb => sb.id === id)
  }

  // Detalle con escenas y guía pedagógica completa.
  async function fetchDetalle(id: number): Promise<Storyboard | null> {
    if (demo) return getStoryboard(id) ?? null
    const { data } = await useSupabaseClient()
      .from('storyboards')
      .select(`${SELECT_STORYBOARD}, guia_completa:guias ( escenas:guia_escenas ( id, orden, titulo, verbo, subtitulo, descripcion, objetivo, pedagogia, preguntas, psicologia, cientifico, no_hace, consejos, mecanica, material ) )`)
      .eq('id', id)
      .maybeSingle()
    if (!data) return null

    const row = (data as unknown) as StoryboardRow & { guia_completa: { escenas: EscenaRow[] } | null }
    const sb = mapRow(row)
    sb.scenes = [...(row.guia_completa?.escenas ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map(e => ({
        id: e.id,
        title: loc(e.titulo, locale.value),
        verb: loc(e.verbo, locale.value),
        subtitle: loc(e.subtitulo, locale.value),
        description: loc(e.descripcion, locale.value),
        objective: loc(e.objetivo, locale.value),
        pedagogia: loc(e.pedagogia, locale.value),
        preguntas: loc(e.preguntas, locale.value),
        psicologia: loc(e.psicologia, locale.value),
        cientifico: loc(e.cientifico, locale.value),
        noHace: loc(e.no_hace, locale.value),
        consejos: loc(e.consejos, locale.value),
        mecanica: loc(e.mecanica, locale.value),
        material: loc(e.material, locale.value),
      }))
    return sb
  }


  return {
    storyboards,
    loading,
    refresh,
    getStoryboard,
    fetchDetalle,
  }
}
