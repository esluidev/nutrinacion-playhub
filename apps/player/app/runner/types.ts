import type { Component } from 'vue'
import type { I18nText } from '~/types/i18n'
import type { StoryboardJson, TipoStoryboard } from '~/types/storyboard'

// Contrato del contenido del runner (estructura.md) y de sus plantillas (PLAYER-DESIGN.md).

export type TemplateName = 'anuncio' | 'destapar' | 'colocar' | 'historia' | 'estaciones' | 'abrir' | 'beber' | 'senalar' | 'repasar'

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
  /** Colocar: la pieza va asentada en el apoyo de la escena (`defaults.support`). */
  nest?: boolean
  /** Icono del kit como insignia de la pieza. */
  icon?: string
  /**
   * La base del lugar: su isla, una pieza de la librería de 560 × 166 (`isla-corral`, `isla-cancha`…; sus apoyos, en
   * `ISLAND`, board.ts), suelta en el tablero bajo lo que se toma o se toca (el origen de un recorrido: su dibujo al
   * fondo y su personaje y el nido delante) o en la ficha que es un lugar (el repaso).
   */
  ground?: string
  /**
   * La tarjeta de un lugar al aire libre: su exterior, que la llena (`exterior-corral`, `exterior-acera`…; 616 × 536 o
   * 616 × 456, con sus apoyos en `EXTERIOR`, board.ts). El cielo arriba y el suelo del lugar abajo, de lado a lado, como
   * un interior bajo techo (el destino de un recorrido, lo que se destapa).
   */
  exterior?: string
  /**
   * Historia: el interior del lugar, que la tarjeta muestra mientras el huevo está ahí, con el cartón donde se posa.
   * Estaciones: el escenario de la tarjeta de la estación (616 × 536), siempre a la vista.
   */
  interior?: string
  description?: I18nText
  fact?: I18nText
  voice?: I18nText
  /**
   * Personaje de Rive del ítem (el que aparece al descubrirlo, el del origen de un recorrido), con los valores de su
   * View Model y el trigger con que responde cuando pasa algo con él (`accept`); sin trigger, no responde.
   */
  character?: { rive: string, enum?: Record<string, string>, accept?: string }
  /**
   * Estaciones: el utensilio de la estación es `svg`; esto dice cómo se compone con lo que llega. Los dibujos van a la
   * escala del tablero y se colocan por sus puntos de apoyo.
   */
  station?: {
    /** Dónde se apoya el utensilio sobre la estufa, en su lienzo. */
    anchor: [number, number]
    /** Dónde descansa lo de dentro, en el lienzo del utensilio. */
    inside: [number, number]
    /** La capa de delante del utensilio, si lo que llega va entre dos (una olla con agua). */
    front?: string
    /** Lo que llega, recién puesto (líquido). */
    raw?: string
    /** A qué tamaño va `raw`, si no es al suyo. */
    rawScale?: number
    /** Lo mismo ya hecho (firme): aparece poco a poco sobre `raw` mientras se mantiene el dedo. */
    done?: string
    /** Lo que se mueve dentro mientras se hace (una cuchara): va metido en lo de dentro, que tapa su pala. Su pivote, en su lienzo; dónde va, desde donde descansa lo de dentro; su giro y su tamaño. */
    tool?: { svg: string, pivot: [number, number], at: [number, number], rotate?: number, scale?: number }
    /** Lo que queda en el plato al servir. */
    served: string
    /** A qué tamaño va `served`, si no es al suyo. */
    servedScale?: number
    /** Lo hecho no se ve hasta servirlo (un huevo hervido se parte en el plato): servir suena a descubrir. */
    reveal?: boolean
  }
}

export interface DatosJson {
  items: DatosItem[]
}

/**
 * Un apoyo de la librería donde se asienta algo (un nido, un cartón de huevos). Lo nombra la escena, nunca la
 * plantilla, y trae las medidas de su propio dibujo: sus dos capas (`svg` detrás y `front` delante, si lo que se
 * asienta va entre ellas), su lienzo (`w` × `h`), el aire que el dibujo deja bajo su base (`drop`) y sus asientos
 * (`seats`): por cada uno, x e y de donde descansa el centro de la base de lo que lleva y, si va recostado, su giro en
 * grados. Todo en las unidades del lienzo, desde su esquina de arriba a la izquierda.
 */
export interface SupportSpec {
  svg: string
  front?: string
  w: number
  h: number
  drop?: number
  seats: [x: number, y: number, tilt?: number][]
}

export type EditionId = 'infantil' | 'preadolescencia' | 'adolescencia'

/** Lo único que cambia entre audiencias: la interfaz y las plantillas son las mismas. */
export interface Profile {
  id: EditionId
  label: string
  /** Las piezas muestran su nombre escrito (infantil es prelectora: imagen y voz). */
  labels: boolean
  /**
   * Cuándo llega la pista de un juego que la tiene: en guiado y en pista, con el primer error; en libre, con el
   * segundo. La mano que demuestra la acción no depende de esto: sale en las tres ediciones.
   */
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
