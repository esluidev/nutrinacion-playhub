import type { Localized } from './i18n'

// Publication status values mirror future DB enum (Spanish snake_case)
export type PublicationStatus = 'borrador' | 'en_revision' | 'publicado' | 'archivado'

// Propiedad del contenido (deriva de storyboards.organizacion_id en la BD):
// 'estandar' = sin dueño (catálogo base para todos) · 'personalizado' = de una
// organización. No hay tiers gratis/premium (el acceso lo da la licencia).
export type Propiedad = 'estandar' | 'personalizado'

// Storyboard type (taxonomy) — the 4 platform pillars. "nutricion" is the
// global product concept, NOT a taxonomy value: the food type is "alimentacion".
export type TipoStoryboard = 'alimentacion' | 'actividad-fisica' | 'cuidado-personal' | 'salud-emocional'

// Guía pedagógica de UNA escena (espejo de storyboard_escenas, catálogo-owned).
// Cada sección es texto enriquecido Localized con sus preguntas/listas EMBEBIDAS
// (pedagogia lleva las "Preguntas e interacciones sugeridas", psicologia las
// "Preguntas de conexión emocional", cientifico la "Información de refuerzo",
// consejos su lista). `mecanica` se completa cuando el juego de la escena está listo.
export interface SceneGuide {
  descripcion?: Localized
  objetivo?: Localized
  pedagogia?: Localized
  psicologia?: Localized
  cientifico?: Localized
  consejos?: Localized
  mecanica?: Localized
}

export interface StoryboardScene {
  folder: string
  title: string
  guia?: SceneGuide
}

export interface StoryboardJson {
  id: string
  clave: string
  title: string
  description: string
  tipo: TipoStoryboard
  categoria?: string
  audience: string
  duration: string
  languages: string[]
  status: PublicationStatus
  propiedad: Propiedad
  organizacion?: string // organización dueña cuando propiedad = 'personalizado' (storyboards.organizacion_id)
  paises: string[] // códigos ISO donde está disponible; vacío = global (storyboards.paises)
  // Guía del storyboard (catálogo-owned, texto enriquecido Localized): se autora
  // en Studio y vive en Supabase (storyboards.objetivo / storyboards.bibliografia).
  objetivo?: Localized
  bibliografia?: Localized
  scenes: StoryboardScene[]
  coverColor: string
}

export interface Storyboard extends StoryboardJson {
  sceneCount: number
}
