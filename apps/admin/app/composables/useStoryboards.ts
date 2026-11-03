// Catálogo de storyboards que la ORGANIZACIÓN activa puede usar, sobre Supabase.
// Disponible = PUBLICADO y (estándar en alguno de los países donde opera, o personalizado suyo).
// La RLS ya lo decide así (0005: `paises_opero()`): aquí solo se pide lo publicado y se acota a
// la organización activa (lo personalizado de otra que también opero no se mezcla).
// ADAPTADOR: la UI consume títulos y textos ya resueltos al locale actual; la guía por escena se
// sirve tal cual la escribió Player (texto enriquecido). En dev sin Supabase, filas demo.

import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import { uiAreaOf, type UiArea } from '@playhub/ui/app/utils/ui-tones'
import type { Localized } from '~/utils/types'

// La URL de Player (`configuracion.player_url`), para ver un storyboard en su runner. En
// desarrollo, si está vacía, la de este equipo en el puerto de Player; por Tailscale, el nombre de
// este equipo (equipo-local). Como `urlDeEducators`.
export async function urlDePlayer(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const { data } = await useSupabaseClient().from('configuracion').select('valor').eq('clave', 'player_url').maybeSingle()
  const url = (data?.valor ?? '').trim() || (import.meta.dev ? 'http://localhost:3001' : '')
  return url ? urlEnEsteEquipo(url.replace(/\/+$/, '')) : null
}

export interface StoryboardScene {
  id: number
  carpeta: string             // la carpeta de la escena en Player: la clave de su guía en el runner
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
  slug: string                // la carpeta del storyboard en Player (con `area`, la URL del runner)
  title: string
  description: string
  category: string           // su área educativa (alimentación, actividad física, …), traducida
  area?: UiArea              // la categoría (storyboards.categoria): tiñe con data-area
  // Pertenencia: público = del catálogo base, sin organización dueña (storyboards.organizacion_id
  // nulo). Personalizado = hecho para la organización. No es un nivel de pago: el acceso lo
  // dan los países donde opera.
  pertenencia: 'publico' | 'personalizado'
  targetAge: string
  duration: string
  scenesCount: number
  objective: string           // guía general (texto enriquecido)
  publico: string             // la edición, con las palabras de la organización
  languages: string[]         // idiomas del contenido: el taller elige uno
  scenes: StoryboardScene[]   // solo en el detalle (fetchDetalle)
}

const DEMO_STORYBOARDS: Storyboard[] = [
  { id: 1, slug: 'los-frijoles-magicos', title: 'Los Frijoles Mágicos', description: 'Descubre el poder de los frijoles y cómo nos ayudan a crecer fuertes.', category: 'Alimentación', pertenencia: 'publico', targetAge: 'Infantil · 4–8', duration: '30 min', area: 'alimentacion', scenesCount: 7, objective: 'Conocer las leguminosas y su valor nutricional.', publico: '', languages: ['es'], scenes: [] },
  { id: 2, slug: 'piernas-fuertes', title: 'Piernas Fuertes', description: 'Actividad física divertida para fortalecer el cuerpo.', category: 'Actividad física', pertenencia: 'publico', targetAge: 'Infantil · 4–8', duration: '25 min', area: 'actividad-fisica', scenesCount: 6, objective: 'Fomentar el movimiento diario.', publico: '', languages: ['es'], scenes: [] },
  { id: 3, slug: 'la-sopa-de-verduras', title: 'La Sopa de Verduras', description: 'Reconocer y calmar emociones con una historia cálida.', category: 'Salud emocional', pertenencia: 'personalizado', targetAge: 'Infantil · 4–8', duration: '30 min', area: 'salud-emocional', scenesCount: 6, objective: 'Reconocer, calmar y expresar emociones.', publico: '', languages: ['es'], scenes: [] },
]

// El contenido viene como jsonb Localized: se resuelve al locale actual con fallback a es.
function loc(valor: Localized | null | undefined, locale: string): string {
  if (!valor) return ''
  return valor[locale] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

interface StoryboardRow {
  id: number
  slug: string
  titulo: Localized
  categoria: string
  edicion: string
  duracion_min: number | null
  numero_escenas: number
  idiomas: string[]
  organizacion_id: number | null
  guia: { descripcion: Localized | null, objetivo: Localized | null, publico: Localized | null } | null
}

type CampoGuia = 'verbo' | 'subtitulo' | 'descripcion' | 'objetivo' | 'pedagogia' | 'preguntas' | 'psicologia'
  | 'cientifico' | 'no_hace' | 'consejos' | 'mecanica' | 'material'
type EscenaRow = { id: number, orden: number, carpeta: string, titulo: Localized } & Record<CampoGuia, Localized | null>

const SELECT_STORYBOARD = `
  id, slug, titulo, categoria, edicion, duracion_min, numero_escenas, idiomas, organizacion_id,
  guia:guias ( descripcion, objetivo, publico )
`

export function useStoryboards() {
  const demo = !isSupabaseConfigured()
  const { t, locale } = useT()
  const { orgActiva } = useContexto()

  const state = useState<{ orgId: number | null, storyboards: Storyboard[], loading: boolean }>(
    'storyboards-data',
    () => ({ orgId: null, storyboards: demo ? DEMO_STORYBOARDS : [], loading: false }),
  )

  function mapRow(row: StoryboardRow): Storyboard {
    return {
      id: row.id,
      slug: row.slug,
      title: loc(row.titulo, locale.value),
      description: loc(row.guia?.descripcion, locale.value),
      category: t(`catalogo.categoria.${row.categoria}`),
      pertenencia: row.organizacion_id ? 'personalizado' : 'publico',
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

  async function refresh() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    state.value.loading = true

    // Público (sin organización dueña) o personalizado de ESTA organización; la RLS ya filtró los
    // estándar por los países donde opera.
    const { data } = await useSupabaseClient()
      .from('storyboards')
      .select(SELECT_STORYBOARD)
      .eq('estado_publicacion', 'PUBLICADO')
      .or(`organizacion_id.is.null,organizacion_id.eq.${oid}`)
      .order('id')

    state.value.storyboards = (((data as unknown) as StoryboardRow[] | null) ?? []).map(mapRow)
    state.value.orgId = oid
    state.value.loading = false
  }

  if (import.meta.client && !demo) {
    const oid = orgActiva.value?.id ?? null
    if (oid && state.value.orgId !== oid && !state.value.loading) refresh()
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
      .select(`${SELECT_STORYBOARD}, guia_completa:guias ( escenas:guia_escenas ( id, orden, carpeta, titulo, verbo, subtitulo, descripcion, objetivo, pedagogia, preguntas, psicologia, cientifico, no_hace, consejos, mecanica, material ) )`)
      .eq('id', id)
      .maybeSingle()
    if (!data) return null

    const row = (data as unknown) as StoryboardRow & { guia_completa: { escenas: EscenaRow[] } | null }
    const sb = mapRow(row)
    sb.scenes = [...(row.guia_completa?.escenas ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map(e => ({
        id: e.id,
        carpeta: e.carpeta,
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
