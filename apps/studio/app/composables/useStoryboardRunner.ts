// glob-refresh: nueva categoría content/storyboards/salud-emocional (fuerza re-scan del import.meta.glob)
import type { Component } from 'vue'
import { tr } from '~/types/i18n'
import type { SceneConfig, StoryboardDef } from '~/types/scene'

// ─────────────────────────────────────────────────────────────────────────────
// Storyboard runner loader (StoryPlay spec §5): content lives in
// content/storyboards/{categoria}/{id}/ — storyboard.json owns the scene ORDER,
// each scene is a folder with scene.vue + scene.config.ts. No registry: scenes
// resolve by path via Vite glob imports.
// ─────────────────────────────────────────────────────────────────────────────

// Lazy: each scene chunk loads when its turn comes
const sceneModules = import.meta.glob('../../content/storyboards/*/*/scenes/*/scene.vue')

// Eager: configs are tiny manifests the runner needs BEFORE mounting
const configModules = import.meta.glob<{ default: SceneConfig }>(
  '../../content/storyboards/*/*/scenes/*/scene.config.ts',
  { eager: true },
)

const storyboardModules = import.meta.glob<{ default: StoryboardDef }>(
  '../../content/storyboards/*/*/storyboard.json',
  { eager: true },
)

const CONTENT_PREFIX = '../../content/storyboards'

export interface RunnerScene {
  folder: string
  title: string
  /** Spoken instruction (HUD audio button) — from scene.config meta */
  instruction: string | null
  /** Completion feedback line for the BottomSheet — from scene.config meta */
  completion: string | null
  config: Record<string, unknown>
  points: number
  loader: (() => Promise<unknown>) | null
}

export function useStoryboardRunner(category: string, storyboardId: string, requestedLang = '') {
  const base = `${CONTENT_PREFIX}/${category}/${storyboardId}`

  const definition: StoryboardDef | null
    = storyboardModules[`${base}/storyboard.json`]?.default ?? null

  // Active CONTENT locale: the requested ?lang= if the storyboard ships it,
  // else its defaultLanguage, else the first declared, else 'es'. (This is the
  // game content's language — Studio's own UI stays Spanish regardless.)
  const languages = definition?.languages ?? ['es']
  const fallback = definition?.defaultLanguage ?? languages[0] ?? 'es'
  const locale = languages.includes(requestedLang) ? requestedLang : fallback

  function sceneConfig(folder: string): SceneConfig | null {
    return configModules[`${base}/scenes/${folder}/scene.config.ts`]?.default ?? null
  }

  const scenes: RunnerScene[] = (definition?.scenes ?? []).map((entry) => {
    const config = sceneConfig(entry.folder)
    // overrides from storyboard.json apply on top of the scene defaults
    const merged = { ...(config?.defaults ?? {}), ...(entry.overrides ?? {}) }
    return {
      folder: entry.folder,
      title: tr(entry.title ?? config?.meta.title ?? entry.folder, locale, fallback),
      instruction: config?.meta.instruction != null ? tr(config.meta.instruction, locale, fallback) : null,
      completion: config?.meta.completionFeedback != null ? tr(config.meta.completionFeedback, locale, fallback) : null,
      config: merged,
      points: Number(merged.pointsOnComplete ?? 0),
      loader: sceneModules[`${base}/scenes/${entry.folder}/scene.vue`] ?? null,
    }
  })

  function sceneComponent(index: number): Component | null {
    const loader = scenes[index]?.loader
    if (!loader) return null
    return defineAsyncComponent(loader as () => Promise<Component>)
  }

  return { definition, scenes, sceneComponent, locale }
}
