import { tr } from '~/types/i18n'
import type { StoryboardDef } from '~/types/scene'
import type { StoryboardBuild, TipoStoryboard } from '~/types/storyboard'

// ─────────────────────────────────────────────────────────────────────────────
// Los storyboards COMPILADOS: se derivan en vivo de los `storyboard.json` de content/
// vía glob. Si cambia el json, cambia la UI.
//
// Acá NO hay catálogo. El estado de publicación, la guía pedagógica, la duración, los
// países y la propiedad viven en Supabase y se administran en admin/Platform (tarea 030).
// Para saber si un build ya está registrado y en qué estado: `useRegistroRemoto`.
//
// (Antes había un `CATALOG_SEED` en memoria que fingía esas columnas. Se eliminó porque
// mostraba estados inventados: la lista decía "Publicado" con la tabla en 0 filas.)
// ─────────────────────────────────────────────────────────────────────────────

const buildModules = import.meta.glob<{ default: StoryboardDef }>(
  '../../content/storyboards/*/*/storyboard.json',
  { eager: true },
)

// Exportado (no re-globear en otro composable: el glob ya vive acá y en
// useStoryboardRunner). `useStoryboardMetadata` lo consume para armar el JSON de registro.
export const BUILDS = Object.values(buildModules).map((m) => {
  const def = m.default
  return { def, tipo: def.type.toLowerCase().replace(/_/g, '-') as TipoStoryboard }
})

// ─────────────────────────────────────────────────────────────────────────────
// Etiquetas legibles
// ─────────────────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<TipoStoryboard, string> = {
  'alimentacion': 'Alimentación',
  'actividad-fisica': 'Actividad física',
  'cuidado-personal': 'Cuidado personal',
  'salud-emocional': 'Salud emocional',
}

const AUDIENCE_LABELS: Record<string, string> = {
  KIDS: 'Niños',
  PREADOLESCENTES: 'Preadolescentes',
  ADOLESCENTES: 'Adolescentes',
  ADULTOS: 'Adultos',
}

const CATEGORIA_LABELS: Record<string, string> = {
  PREVENCION: 'Prevención',
  DIABETES: 'Diabetes',
  BIENESTAR: 'Bienestar',
}

// Portada por TIPO: determinista, para que las tarjetas no queden todas grises antes de
// registrar. La portada real la define admin (`storyboards.portada`).
const COVER_POR_TIPO: Record<TipoStoryboard, string> = {
  'alimentacion': 'bg-emerald-500',
  'actividad-fisica': 'bg-sky-500',
  'cuidado-personal': 'bg-violet-500',
  'salud-emocional': 'bg-rose-500',
}

// El build usa codigos MAYUSCULA_GUION_BAJO; las etiquetas se indexan igual.
const toCode = (s?: string) => (s ?? '').toUpperCase().replace(/-/g, '_')

function toBuild(def: StoryboardDef, tipo: TipoStoryboard): StoryboardBuild {
  return {
    id: def.slug,
    clave: def.key,
    title: tr(def.title, 'es'),
    tipo,
    categoria: def.category ? def.category.toLowerCase().replace(/_/g, '-') : undefined,
    audience: def.audience,
    languages: [...(def.languages ?? ['es'])],
    sceneCount: def.scenes.length,
    scenes: def.scenes.map(s => ({ folder: s.folder, title: tr(s.title ?? s.folder, 'es') })),
    coverColor: COVER_POR_TIPO[tipo] ?? 'bg-emerald-500',
  }
}

export function useStoryboards() {
  const storyboards = computed<StoryboardBuild[]>(() => BUILDS.map(b => toBuild(b.def, b.tipo)))

  function getStoryboard(id: string): StoryboardBuild | undefined {
    return storyboards.value.find(sb => sb.id === id)
  }

  function audienceLabel(audience?: string): string {
    return audience ? (AUDIENCE_LABELS[audience] ?? audience) : '—'
  }

  function categoriaLabel(categoria?: string): string {
    const c = toCode(categoria)
    return c ? (CATEGORIA_LABELS[c] ?? c) : '—'
  }

  function tipoLabel(tipo: TipoStoryboard): string {
    return TIPO_LABELS[tipo] ?? tipo
  }

  return { storyboards, getStoryboard, audienceLabel, categoriaLabel, tipoLabel }
}
