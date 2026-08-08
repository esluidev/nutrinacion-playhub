import { BUILDS } from '~/composables/useStoryboards'
import { construirMetadata } from '~/utils/storyboardMetadata'
import type { StoryboardMetadata } from '~/utils/storyboardMetadata'

// Acceso a la metadata de registro desde las páginas. La lógica (y el contrato con las
// columnas de Supabase) vive en `utils/storyboardMetadata.ts`, que tiene test propio.
export function useStoryboardMetadata() {
  function metadataDe(slug: string): StoryboardMetadata | null {
    const build = BUILDS.find(b => b.def.slug === slug)
    return build ? construirMetadata(build.def) : null
  }

  // Lo que se copia al portapapeles: indentado, para poder leerlo y revisarlo antes de pegar.
  function metadataComoJson(slug: string): string | null {
    const meta = metadataDe(slug)
    return meta ? JSON.stringify(meta, null, 2) : null
  }

  return { metadataDe, metadataComoJson }
}
