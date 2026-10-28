import type { Component } from 'vue'
import type { I18nText } from '~/types/i18n'
import type { StoryboardJson, TipoStoryboard } from '~/types/storyboard'

// Contrato del contenido del runner (estructura.md) y de sus plantillas (PLAYER-DESIGN.md).

export type TemplateName = 'anuncio' | 'destapar' | 'colocar'

/** Caras suaves de la paleta reutilizable del kit. Lima y night son del UI. */
export type PieceTone = 'sun' | 'coral' | 'sky' | 'grape' | 'rose'

/** `scenes/<escena>/scene.json`. */
export interface SceneJson {
  id: string
  family: string
  /** La plantilla que juega la escena. Sin plantilla, la escena trae su `scene.vue`. */
  template?: TemplateName
  affirmations: string[]
  meta: {
    instruction?: I18nText | null
    completionFeedback?: I18nText | null
  }
  strings?: Record<string, I18nText>
  library: { rive: string[], svg: string[], sfx: string[] }
  defaults: {
    items?: string[]
    pointsOnComplete?: number
    [key: string]: unknown
  }
}

/** Un ítem del tema en `datos.json`. Los campos opcionales existen solo si una escena los usa. */
export interface DatosItem {
  id: string
  name: I18nText
  displayName?: I18nText
  tone?: PieceTone
  svg?: string
  rive?: string
  /** Tamaño relativo para comparar a una misma escala (1 = el más grande posible). */
  sizeScale?: number
  /** La pieza se apoya en el nido de la librería. */
  nest?: boolean
  /** Icono del kit como insignia de la pieza. */
  icon?: string
  description?: I18nText
  fact?: I18nText
  voice?: I18nText
  /** Personaje de Rive que aparece al descubrir el ítem, con los valores de su View Model. */
  character?: { rive: string, enum?: Record<string, string> }
}

export interface DatosJson {
  items: DatosItem[]
}

export type EditionId = 'infantil' | 'preadolescencia' | 'adolescencia'

/** Lo único que cambia entre audiencias: la interfaz y las plantillas son las mismas. */
export interface Profile {
  id: EditionId
  label: string
  /** Las piezas muestran su nombre escrito (infantil es prelectora: imagen y voz). */
  labels: boolean
  /** guiado: se ilumina dónde actuar · pista: ayuda en el primer error · libre: en el segundo. */
  scaffolding: 'guiado' | 'pista' | 'libre'
}

export type FeedbackKind = 'success' | 'complete' | 'retry' | 'selection' | 'info'

export interface FeedbackPayload {
  kind: FeedbackKind
  title: string
  body?: string
}

/** Lo que recibe una plantilla. No sabe en qué modo corre ni para qué edición: llega el perfil. */
export interface TemplateProps {
  scene: SceneJson
  items: DatosItem[]
  profile: Profile
  locale: string
  blocked: boolean
  storyboard: LoadedStoryboard
}

export interface RunnerScene {
  folder: string
  number: number
  title: string
  json: SceneJson
  /** `scene.vue` propio, cuando ninguna plantilla sirve. */
  custom?: () => Promise<Component>
}

export interface LoadedStoryboard {
  category: TipoStoryboard
  json: StoryboardJson
  datos: DatosJson
  scenes: RunnerScene[]
}
