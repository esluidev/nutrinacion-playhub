import type { InjectionKey } from 'vue'
import { muted } from './settings'
import { cancelSpeech, speak, speechActive } from './speech'

// ─────────────────────────────────────────────────────────────────────────────
// NARRATION — pre-recorded voice (VoiceBox) resolved BY TEXT, Web Speech fallback.
//
// Each storyboard authors an `audio.manifest.json` ({ key, text } per locale) and
// scripts/generate_audio.py renders one wav per line (named by `key`). The runner
// already has the EXACT text of every narration moment (instruction,
// completionFeedback, knowledge `voice`, quiz question, closing line), so we look
// that text up in the manifest: match → play the wav; no match → speak() it.
//
// Two namespaces: per-storyboard content, and the shared runner shell
// (`content/runner/...`, when it exists — strings identical across storyboards,
// resolved by locale, not by storyboard).
//
// Result: audio is a zero-scene-code, additive layer. Adding audio is just
// authoring the manifest + generating — NO per-scene wiring, no keys in scenes.
// ─────────────────────────────────────────────────────────────────────────────

interface Manifest {
  locales?: Record<string, { lines?: { key: string, text: string }[] }>
}

// Eager: tiny JSON + url strings the runner needs the moment a storyboard plays.
const manifestModules = import.meta.glob([
  '../../../content/storyboards/*/*/audio.manifest.json',
  '../../../content/runner/audio.manifest.json',
], { eager: true }) as Record<string, { default?: Manifest } & Manifest>

const audioModules = import.meta.glob([
  '../../../content/storyboards/*/*/audio/*/*.wav',
  '../../../content/runner/audio/*/*.wav',
], { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const SB_MANIFEST_RE = /storyboards\/([^/]+)\/([^/]+)\/audio\.manifest\.json$/
const SB_WAV_RE = /storyboards\/([^/]+)\/([^/]+)\/audio\/([^/]+)\/(.+)\.wav$/
const RUNNER_MANIFEST_RE = /\/runner\/audio\.manifest\.json$/
const RUNNER_WAV_RE = /\/runner\/audio\/([^/]+)\/(.+)\.wav$/
const SHARED = 'shared' // namespace for runner-shell audio (no storyboard)

// Forgiving but exact-ish: the manifest text is authored to match the runtime
// text; this only absorbs whitespace/unicode noise, never wording.
const norm = (text: string) => text.trim().replace(/\s+/g, ' ').normalize('NFC')

// `${namespace}/${locale}/${key}` -> served wav url (namespace = `${cat}/${sb}` or `shared`)
const wavUrls = new Map<string, string>()
for (const [path, url] of Object.entries(audioModules)) {
  const sb = path.match(SB_WAV_RE)
  if (sb) {
    wavUrls.set(`${sb[1]}/${sb[2]}/${sb[3]}/${sb[4]}`, url)
    continue
  }
  const rn = path.match(RUNNER_WAV_RE)
  if (rn) wavUrls.set(`${SHARED}/${rn[1]}/${rn[2]}`, url)
}

// nested: `${namespace}/${locale}` -> (normalizedText -> wav url)
const textIndex = new Map<string, Map<string, string>>()
for (const [path, mod] of Object.entries(manifestModules)) {
  const sm = path.match(SB_MANIFEST_RE)
  const ns = sm ? `${sm[1]}/${sm[2]}` : RUNNER_MANIFEST_RE.test(path) ? SHARED : null
  if (!ns) continue
  const manifest = (mod.default ?? mod) as Manifest
  for (const [locale, block] of Object.entries(manifest.locales ?? {})) {
    const nsLoc = `${ns}/${locale}`
    let byText = textIndex.get(nsLoc)
    if (!byText) textIndex.set(nsLoc, (byText = new Map()))
    for (const line of block.lines ?? []) {
      const url = wavUrls.get(`${nsLoc}/${line.key}`)
      if (url) byText.set(norm(line.text), url)
    }
  }
}

export interface NarrationContext {
  category: string
  storyboardId: string
  locale: string
}

const nsOf = (ctx: NarrationContext) => `${ctx.category}/${ctx.storyboardId}/${ctx.locale}`

export function resolveNarration(ctx: NarrationContext, text: string): string | undefined {
  const n = norm(text)
  // per-storyboard first, then the shared runner-shell namespace (by locale)
  return textIndex.get(nsOf(ctx))?.get(n) ?? textIndex.get(`${SHARED}/${ctx.locale}`)?.get(n)
}

/* ── Single shared <audio> player (a new clip replaces the previous one) ─────── */

let el: HTMLAudioElement | null = null
let activeOnState: ((speaking: boolean) => void) | null = null
let activeResolve: (() => void) | null = null
let isPlaying = false

function notify(speaking: boolean) {
  isPlaying = speaking
  const cb = activeOnState
  const settle = activeResolve
  if (!speaking) {
    activeOnState = null
    activeResolve = null
  }
  cb?.(speaking)
  if (!speaking) settle?.()
}

function ensureEl(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null
  if (!el) {
    el = new Audio()
    el.addEventListener('ended', () => notify(false))
    el.addEventListener('error', () => notify(false))
  }
  return el
}

function playFile(url: string, onState?: (speaking: boolean) => void): Promise<void> {
  const a = ensureEl()
  if (!a) {
    onState?.(false)
    return Promise.resolve()
  }
  // Detach the previous clip's callback BEFORE pausing so its stop doesn't
  // clobber the new line's "speaking" state — but its PROMISE does resolve:
  // a replaced clip never strands its awaiter.
  const settlePrev = activeResolve
  activeOnState = null
  activeResolve = null
  a.pause()
  settlePrev?.()
  a.src = url
  a.currentTime = 0
  return new Promise((resolve) => {
    activeOnState = onState ?? null
    activeResolve = resolve
    isPlaying = true
    onState?.(true)
    void a.play().catch(() => notify(false))
  })
}

/* ── Public API ───────────────────────────────────────────────────────────── */

/** Narrate `text` for the storyboard/locale in `ctx`: play the matching wav if a
 *  manifest (storyboard or shared shell) has this line, else synthesize it.
 *
 *  CONTRATO: la promesa SIEMPRE resuelve (nunca rechaza) — al terminar el wav o
 *  la voz, inmediatamente con mute, al ser reemplazada por una narración nueva,
 *  o al cancelar. Se puede `await` sin timeouts de seguridad. `onState` sigue
 *  disponible para el estado intermedio "está sonando" (animaciones). */
export function narrate(ctx: NarrationContext, text: string, onState?: (speaking: boolean) => void): Promise<void> {
  if (muted.value) return Promise.resolve()
  const url = resolveNarration(ctx, text)
  if (url) return playFile(url, onState)
  // The storyboard ships audio but this exact line isn't in its manifest →
  // the text drifted from what was generated. Surface it in dev.
  if (import.meta.dev && textIndex.has(nsOf(ctx))) {
    console.warn(`[narration] no audio match in ${nsOf(ctx)} for: "${text.slice(0, 80)}" — check audio.manifest.json (using Web Speech)`)
  }
  return speak(text, onState)
}

/** Stop any narration — pre-recorded or synthesized. Resolves pending promises. */
export function cancelNarration() {
  if (el) {
    el.pause()
    try {
      el.currentTime = 0
    }
    catch {
      // some browsers throw resetting an unloaded element — ignore
    }
  }
  notify(false)
  cancelSpeech()
}

/** Whether narration is still sounding. (Consulta puntual de estado; para
 *  ESPERAR el fin, usar la promesa que devuelve `narrate()`.) */
export function narrationActive(): boolean {
  return isPlaying || speechActive()
}

/* ── Scene-facing narrator (provided by the runner shell, see useNarrator) ──── */

export type SceneNarrate = (text: string, onState?: (speaking: boolean) => void) => Promise<void>
export const NARRATOR_KEY: InjectionKey<SceneNarrate> = Symbol('playhub:narrate')
