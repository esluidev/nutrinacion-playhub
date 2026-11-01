import type { I18nText } from '~/types/i18n'

// Tipos del BUILD de storyboards (content/storyboards). Lo que no está en el JSON vive en
// Supabase: la publicación (estado, países, organización) la decide Player en la gestión
// (`publicar_storyboard`) y la guía la escribe Admin/Platform. Nada de eso se modela aquí.

// Eje del storyboard, como carpeta y como slug de ruta (/play/<eje>/<slug>).
export type TipoStoryboard = 'alimentacion' | 'actividad-fisica' | 'cuidado-personal' | 'salud-emocional'

/** `storyboard.json` tal como lo define estructura.md (skill playhub-storyboard-games). */
export interface StoryboardJson {
  /** UUID estable: une el build con la fila de `storyboards`. */
  key: string
  slug: string
  version?: string
  title: I18nText
  /** ALIMENTACION · ACTIVIDAD_FISICA · CUIDADO_PERSONAL · SALUD_EMOCIONAL */
  type: string
  /** Subcategoría de la guía como código (NUTRIENTES, PREVENCION…). */
  category?: string
  /** KIDS · PREADOLESCENTES · ADOLESCENTES: la edición. */
  audience: string
  /** Enfoques de salud (las «etiquetas» de la guía): DIABETES, OBESIDAD… Sirven para jornadas y búsquedas. */
  healthFocus?: string[]
  languages?: string[]
  defaultLanguage?: string
  estimatedDuration?: number
  scenes: { folder: string, title?: I18nText }[]
}

export interface StoryboardBuildScene {
  folder: string
  /** Título resuelto a español, para la tabla de escenas. */
  title: string
}

/** Un storyboard del build, listo para la gestión de Player. */
export interface StoryboardBuild {
  /** slug: así se navega en Player y en el runner. */
  id: string
  clave: string
  title: string
  tipo: TipoStoryboard
  categoria?: string
  audience: string
  healthFocus: string[]
  languages: string[]
  estimatedDuration?: number
  sceneCount: number
  scenes: StoryboardBuildScene[]
}
