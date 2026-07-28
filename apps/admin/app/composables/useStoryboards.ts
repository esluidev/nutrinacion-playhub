// Catálogo de storyboards que la COMUNIDAD activa puede usar, sobre Supabase.
// Visible = PUBLICADO y (estándar, o personalizado de la org activa), filtrado por país
// de la comunidad EN LA APP (paises vacío = global). ADAPTADOR: la UI consume títulos y
// textos ya resueltos al locale actual; la guía por escena se sirve tal cual la escribió
// Studio (texto enriquecido). En dev sin Supabase, filas demo.

import type { Localized } from '~/utils/types'

export interface StoryboardScene {
  id: number
  title: string
  description: string
  objective: string
  // Guía pedagógica real (secciones de storyboard_escenas), texto enriquecido por idioma.
  pedagogia: string
  psicologia: string
  cientifico: string
  consejos: string
  mecanica: string
}

export interface Storyboard {
  id: number
  title: string
  description: string
  category: string           // tipo de storyboard (alimentación, actividad física, …)
  plan: 'Estándar' | 'Personalizado'
  targetAge: string
  duration: string
  coverBg: string
  scenesCount: number
  objective: string           // guía general (texto enriquecido)
  bibliografia: string
  scenes: StoryboardScene[]   // solo en el detalle (fetchDetalle)
}

const COVER_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-400',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
] as const

const DEMO_STORYBOARDS: Storyboard[] = [
  { id: 1, title: 'Los Frijoles Mágicos', description: 'Descubre el poder de los frijoles y cómo nos ayudan a crecer fuertes.', category: 'Alimentación', plan: 'Estándar', targetAge: 'Kids', duration: '30 min', coverBg: COVER_COLORS[0], scenesCount: 7, objective: 'Conocer las leguminosas y su valor nutricional.', bibliografia: '', scenes: [] },
  { id: 2, title: 'Piernas Fuertes', description: 'Actividad física divertida para fortalecer el cuerpo.', category: 'Actividad física', plan: 'Estándar', targetAge: 'Kids', duration: '25 min', coverBg: COVER_COLORS[1], scenesCount: 6, objective: 'Fomentar el movimiento diario.', bibliografia: '', scenes: [] },
  { id: 3, title: 'La Sopa de Verduras', description: 'Reconocer y calmar emociones con una historia cálida.', category: 'Salud emocional', plan: 'Personalizado', targetAge: 'Kids', duration: '30 min', coverBg: COVER_COLORS[2], scenesCount: 6, objective: 'Reconocer, calmar y expresar emociones.', bibliografia: '', scenes: [] },
]

// El contenido viene como jsonb Localized: se resuelve al locale actual con fallback a es.
function loc(valor: Localized | null | undefined, locale: string): string {
  if (!valor) return ''
  return valor[locale] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

interface StoryboardRow {
  id: number
  titulo: Localized
  descripcion: Localized
  objetivo: Localized | null
  bibliografia: Localized | null
  duracion_min: number | null
  numero_escenas: number
  paises: string[]
  organizacion_id: number | null
  tipo: { nombre: Localized } | null
  audiencia: { nombre: Localized } | null
}

interface EscenaRow {
  id: number
  orden: number
  titulo: Localized
  descripcion: Localized | null
  objetivo: Localized | null
  pedagogia: Localized | null
  psicologia: Localized | null
  cientifico: Localized | null
  consejos: Localized | null
  mecanica: Localized | null
}

const SELECT_STORYBOARD = `
  id, titulo, descripcion, objetivo, bibliografia, duracion_min, numero_escenas,
  paises, organizacion_id,
  tipo:tipos_storyboard ( nombre ),
  audiencia:edades_audiencia ( nombre )
`

export function useStoryboards() {
  const demo = !isSupabaseConfigured()
  const { locale } = useT()
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
      description: loc(row.descripcion, locale.value),
      category: loc(row.tipo?.nombre, locale.value) || '—',
      plan: row.organizacion_id ? 'Personalizado' : 'Estándar',
      targetAge: loc(row.audiencia?.nombre, locale.value) || '—',
      duration: row.duracion_min ? `${row.duracion_min} min` : '—',
      coverBg: COVER_COLORS[row.id % COVER_COLORS.length]!,
      scenesCount: row.numero_escenas,
      objective: loc(row.objetivo, locale.value),
      bibliografia: loc(row.bibliografia, locale.value),
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
      .eq('estado', 'PUBLICADO')
    // Estándar (sin dueño) o personalizado de MI organización.
    query = orgActiva.value
      ? query.or(`organizacion_id.is.null,organizacion_id.eq.${orgActiva.value.id}`)
      : query.is('organizacion_id', null)

    const { data } = await query.order('id')

    // Disponibilidad por país: vacío = global; con países, la comunidad debe estar en la lista.
    const pais = paisComunidad()
    const filas = (((data as unknown) as StoryboardRow[] | null) ?? [])
      .filter(row => !row.paises.length || (!!pais && row.paises.includes(pais)))

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
      .select(`${SELECT_STORYBOARD}, escenas:storyboard_escenas ( id, orden, titulo, descripcion, objetivo, pedagogia, psicologia, cientifico, consejos, mecanica )`)
      .eq('id', id)
      .maybeSingle()
    if (!data) return null

    const row = (data as unknown) as StoryboardRow & { escenas: EscenaRow[] }
    const sb = mapRow(row)
    sb.scenes = [...(row.escenas ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map(e => ({
        id: e.id,
        title: loc(e.titulo, locale.value),
        description: loc(e.descripcion, locale.value),
        objective: loc(e.objetivo, locale.value),
        pedagogia: loc(e.pedagogia, locale.value),
        psicologia: loc(e.psicologia, locale.value),
        cientifico: loc(e.cientifico, locale.value),
        consejos: loc(e.consejos, locale.value),
        mecanica: loc(e.mecanica, locale.value),
      }))
    return sb
  }

  function planBadgeClass(plan: string): string {
    return plan === 'Personalizado' ? 'bg-brand-purple text-white' : 'bg-white/90 text-gray-700'
  }

  return {
    storyboards,
    loading,
    refresh,
    getStoryboard,
    fetchDetalle,
    planBadgeClass,
    coverColors: COVER_COLORS,
  }
}
