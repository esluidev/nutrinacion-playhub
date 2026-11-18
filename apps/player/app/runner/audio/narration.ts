import type { InjectionKey } from 'vue'
import { muted } from './settings'
import { cancelSpeech, speak, speechActive } from './speech'
import type { Voz } from './voz'

// ─────────────────────────────────────────────────────────────────────────────
// La narración: lo que se dice en un momento (`Voz`, audio/voz.ts), tramo a tramo. Cada tramo suena con su grabación
// si la tiene (`audio`, la clave del archivo en `<storyboard>/audio/<idioma>/<clave>.wav`, o `.mp3`) y, si no, con la
// voz del navegador (speech.ts). La grabación se busca por su clave, nunca por el texto: cambiar lo que se ve no la
// pierde. Las genera scripts/generate_audio.py a partir de los JSON del storyboard.
// ─────────────────────────────────────────────────────────────────────────────

const audioModules = import.meta.glob([
  '../../../content/storyboards/*/*/audio/*/*.wav',
  '../../../content/storyboards/*/*/audio/*/*.mp3',
], { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const SB_AUDIO_RE = /storyboards\/([^/]+)\/([^/]+)\/audio\/([^/]+)\/(.+)\.(?:wav|mp3)$/

// `${categoría}/${storyboard}/${idioma}/${clave}` -> url servida
const audioUrls = new Map<string, string>()
for (const [path, url] of Object.entries(audioModules)) {
  const m = path.match(SB_AUDIO_RE)
  if (m) audioUrls.set(`${m[1]}/${m[2]}/${m[3]}/${m[4]}`, url)
}

export interface NarrationContext {
  category: string
  storyboardId: string
  locale: string
}

/** La grabación de una clave en el storyboard y el idioma de `ctx`, si existe. */
export function resolveNarration(ctx: NarrationContext, audio: string): string | undefined {
  return audioUrls.get(`${ctx.category}/${ctx.storyboardId}/${ctx.locale}/${audio}`)
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

// Cada narración nueva o `cancelNarration()` corta la que sonaba, también entre dos de sus tramos.
let turno = 0

/** Un tramo: su grabación si existe; si no, la voz del navegador. */
function sonar(ctx: NarrationContext, tramo: Voz[number], onState?: (speaking: boolean) => void): Promise<void> {
  const url = tramo.audio ? resolveNarration(ctx, tramo.audio) : undefined
  if (url) return playFile(url, onState)
  // La escena nombra una grabación que todavía no existe: suena la voz del navegador. En desarrollo se avisa.
  if (import.meta.dev && tramo.audio) {
    console.warn(`[narración] falta audio/${ctx.locale}/${tramo.audio} en ${ctx.category}/${ctx.storyboardId}: suena la voz del navegador (scripts/generate_audio.py)`)
  }
  return tramo.text ? speak(tramo.text, onState) : Promise.resolve()
}

/** Narra lo que se dice en un momento (`Voz`), tramo a tramo, en el storyboard y el idioma de `ctx`. Corta lo
 *  que estuviera sonando.
 *
 *  CONTRATO: la promesa SIEMPRE resuelve (nunca rechaza) — al terminar el último tramo, inmediatamente con mute o
 *  sin nada que decir, al ser reemplazada por una narración nueva, o al cancelar. Se puede `await` sin timeouts de
 *  seguridad. `onState` dice si está sonando (para las animaciones): verdadero al empezar, falso al terminar. */
export async function narrate(ctx: NarrationContext, voz: Voz, onState?: (speaking: boolean) => void): Promise<void> {
  const mio = ++turno
  if (muted.value || !voz.length) {
    onState?.(false)
    return
  }
  for (const tramo of voz) {
    if (mio !== turno || muted.value) break
    await sonar(ctx, tramo, speaking => onState?.(speaking && mio === turno))
  }
  if (mio === turno) onState?.(false)
}

/** Stop any narration — pre-recorded or synthesized. Resolves pending promises. */
export function cancelNarration() {
  turno += 1
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

export type SceneNarrate = (voz: Voz, onState?: (speaking: boolean) => void) => Promise<void>
export const NARRATOR_KEY: InjectionKey<SceneNarrate> = Symbol('playhub:narrate')
