// Tipos del BUILD de storyboards. Todo lo editorial (estado de publicación, guía
// pedagógica, países, duración, propiedad) vive en Supabase y se administra en
// admin/Platform (tarea 030): Studio no lo modela ni lo escribe.

// Tipo de storyboard (taxonomía) — las 4 áreas de la plataforma. "nutricion" es el
// concepto global de producto, NO un valor de taxonomía: el tipo de comida es "alimentacion".
export type TipoStoryboard = 'alimentacion' | 'actividad-fisica' | 'cuidado-personal' | 'salud-emocional'

export interface StoryboardBuildScene {
  folder: string
  /** Título resuelto a español, para mostrar en la tabla de escenas. */
  title: string
}

/** Un storyboard tal como lo declara su `storyboard.json` — sin nada de la base. */
export interface StoryboardBuild {
  /** slug, que es como se navega en Studio y en el runner. */
  id: string
  /** uuid estable: la identidad que une build ↔ fila de `storyboards`. */
  clave: string
  title: string
  tipo: TipoStoryboard
  /** Código de categoría en minúscula-guion, o undefined si el build no la declara. */
  categoria?: string
  audience: string
  languages: string[]
  sceneCount: number
  scenes: StoryboardBuildScene[]
  /** Color de portada derivado del tipo — la portada real la define admin. */
  coverColor: string
}
