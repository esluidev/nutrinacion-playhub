import { STORYBOARDS, tipoDeType } from '~/runner/content'
import { tr } from '~/types/i18n'
import type { StoryboardBuild, StoryboardJson, TipoStoryboard } from '~/types/storyboard'

// Los storyboards COMPILADOS, derivados en vivo de content/ (la misma lectura que usa el
// runner). Su estado en el catálogo de la base está en useCatalogoBase; la publicación, los
// países, la organización y la guía se deciden en Admin/Platform.

export const TIPO_LABELS: Record<TipoStoryboard, string> = {
  'alimentacion': 'Alimentación',
  'actividad-fisica': 'Actividad física',
  'cuidado-personal': 'Cuidado personal',
  'salud-emocional': 'Salud emocional',
}

const AUDIENCE_LABELS: Record<string, string> = {
  KIDS: 'Infantil · 4–8',
  PREADOLESCENTES: 'Preadolescencia · 9–12',
  ADOLESCENTES: 'Adolescencia · 13–17',
}

function toBuild(def: StoryboardJson): StoryboardBuild {
  return {
    id: def.slug,
    clave: def.key,
    title: tr(def.title, 'es'),
    tipo: tipoDeType(def.type),
    categoria: def.category ?? undefined,
    audience: def.audience,
    healthFocus: def.healthFocus ?? [],
    languages: [...(def.languages ?? [def.defaultLanguage ?? 'es'])],
    estimatedDuration: def.estimatedDuration,
    sceneCount: def.scenes.length,
    scenes: def.scenes.map(s => ({ folder: s.folder, title: tr(s.title ?? s.folder, 'es') })),
  }
}

export function useStoryboards() {
  const storyboards = computed<StoryboardBuild[]>(() => STORYBOARDS.map(s => toBuild(s.json)))

  function getStoryboard(id: string): StoryboardBuild | undefined {
    return storyboards.value.find(sb => sb.id === id)
  }

  const audienceLabel = (audience?: string) => (audience ? (AUDIENCE_LABELS[audience] ?? audience) : '—')
  const tipoLabel = (tipo: TipoStoryboard) => TIPO_LABELS[tipo] ?? tipo

  return { storyboards, getStoryboard, audienceLabel, tipoLabel }
}
