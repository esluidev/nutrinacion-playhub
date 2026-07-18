import type { Component } from 'vue'
import type { I18nText, Localized } from './i18n'
import type { TipoStoryboard } from './storyboard'

export interface SceneStub {
  folder: string
  title: string
  index: number
  storyboardId: string
  storyboardTitle: string
  tipo: TipoStoryboard
}

/* ── Runner contract (v2, teacher-only) ───────────────────────────────────────
   Every scene ships a scene.config.ts (typed manifest, no logic/UI) and a
   scene.vue (props { locale, config } / emits { complete, score, knowledge,
   restart }). `restart` is for summary/final scenes only: it asks the runner
   to restart the whole workshop. The runner knows points/duration/title
   BEFORE mounting via this config. */

/** In-scene knowledge feedback (regla 15): the scene emits WHAT was learned,
    the SHELL renders the Tarjeta de Saber in the reserved bottom strip. The
    visible text is the educator's script; audio plays on demand only.
    Emit `null` to dismiss. */
export interface KnowledgePayload {
  /** Short subject label, e.g. "Frijol Rojo" — ALWAYS present (regla 15:
      every knowledge card keeps the same structure) */
  title: string
  /** Fact as HTML (inline-styled highlights allowed) — visible in every mode */
  html: string
  /** Plain speech version, played on demand from the card's audio button. The
      shell resolves a matching pre-recorded wav by this exact text
      (audio.manifest.json), else speaks it. */
  voice?: string
  /** Specific illustration (e.g. a sticker component) beside the text.
      Pass the component through markRaw(). */
  visual?: { component: Component, props?: Record<string, unknown> }
  /** Generic illustration when there is no specific component. The card
      ALWAYS shows an image: provide `visual` OR `emoji`. */
  emoji?: string
}

export interface SceneConfig {
  id: string
  version: string
  meta: {
    /** Display title — localized ({ es, en, … }) or a plain string */
    title: I18nText
    /** Spoken instruction of the scene — the HUD audio button reads it.
        Localized. HARD RULE: third person, food is never personified. */
    instruction?: I18nText
    /** Completion feedback shown in the BottomSheet when the scene is done
        (kid). Localized. Falls back to a generic line. Same voice rules
        as instruction. */
    completionFeedback?: I18nText
    /** Estimated duration in seconds */
    estimatedDuration?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    learningGoals?: string[]
  }
  /** Localized copy of the scene's own UI (buttons, prompts, in-scene labels):
      key → { es, en, … }. The scene resolves it with useT(strings, locale).
      Shared FOOD data is NOT here — it lives in the storyboard data file
      (beans.ts/eggs.ts) so it is translated once, not per scene. */
  strings?: Record<string, Localized>
  /** Primitives from app/primitives used by the scene */
  primitives?: string[]
  /** Declared i18n/audio keys — validated by CI scripts (future task) */
  i18nKeys?: string[]
  audioKeys?: string[]
  /** Default behavior; storyboard.json entries can override per use */
  defaults?: Record<string, unknown>
  events?: string[]
}

/** storyboard.json shape: the storyboard owns the ORDER (array) and flow config */
export interface StoryboardDef {
  key: string
  slug: string
  title: I18nText
  type: string
  category?: string
  audience: string
  /** Content locales this storyboard ships (independent from Studio's UI, which
      is Spanish-only). The runner picks ?lang= if listed, else defaultLanguage. */
  languages?: string[]
  /** Fallback locale when ?lang= is missing/unsupported (default 'es'). */
  defaultLanguage?: string
  scenes: { folder: string; title?: I18nText; overrides?: Record<string, unknown> }[]
}
