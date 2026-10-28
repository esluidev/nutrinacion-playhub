import { muted } from './settings'

// Child-friendly Web Speech voice, ported verbatim from ruleta-frijoles-v2.
// Pre-recorded ElevenLabs narration replaces this in the audio task; this is
// the documented fallback. Respects the global HUD mute.
//
// CONTRATO: `speak()` devuelve una promesa que SIEMPRE resuelve (nunca rechaza):
// al terminar la voz, inmediatamente con mute o sin speechSynthesis, al ser
// reemplazada por una locución nueva, al cancelar, o vía watchdog si el motor
// se cuelga. Los consumidores pueden hacer `await` sin red de seguridad propia.
// `onState` se mantiene para el estado intermedio "está hablando" (animaciones).

const VOICE_CONFIG = {
  lang: 'es-MX',
  rate: 1.05,
  pitch: 1.8,
  volume: 1.0,
  preferredVoices: [
    'Paulina', // macOS (es-MX)
    'Microsoft Dalia', // Windows (es-MX)
    'Microsoft Sabina', // Windows (es-MX legacy)
    'Google español de Estados Unidos', // Android/Chrome
    'Monica', // macOS
  ],
}

const LANG_PRIORITY = ['es-MX', 'es-SV', 'es-US', 'es-419', 'es-CO', 'es-AR', 'es']

// Web Speech a veces queda "hablando" sin arrancar y sin disparar onend jamás
// (bug clásico del motor). Si la locución no arrancó en este plazo, se cancela
// y la promesa resuelve — detalle interno del motor, invisible para el runner.
const WATCHDOG_MS = 2500

// Resolutor de la locución en curso: una nueva locución o cancelSpeech() la
// liberan — quien la esperaba nunca queda colgado.
let pendingSettle: (() => void) | null = null

export function speak(text: string, onState?: (speaking: boolean) => void): Promise<void> {
  if (muted.value) return Promise.resolve()
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve()

  // La locución anterior resuelve ANTES de ser reemplazada
  pendingSettle?.()
  window.speechSynthesis.cancel()

  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = VOICE_CONFIG.lang
    utter.rate = VOICE_CONFIG.rate
    utter.pitch = VOICE_CONFIG.pitch
    utter.volume = VOICE_CONFIG.volume

    const voices = window.speechSynthesis.getVoices()
    let chosen: SpeechSynthesisVoice | undefined

    for (const name of VOICE_CONFIG.preferredVoices) {
      chosen = voices.find(v => v.name.includes(name))
      if (chosen) break
    }
    if (!chosen) {
      for (const lang of LANG_PRIORITY) {
        chosen = voices.find(v => v.lang === lang && /female|mujer|dalia|paulina|monica|sabina/i.test(v.name))
          ?? voices.find(v => v.lang === lang)
        if (chosen) break
      }
    }
    if (!chosen) chosen = voices.find(v => v.lang.startsWith('es'))
    if (chosen) utter.voice = chosen

    let started = false
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (pendingSettle === finish) pendingSettle = null
      onState?.(false)
      resolve()
    }
    pendingSettle = finish

    utter.onstart = () => {
      started = true
      onState?.(true)
    }
    utter.onend = finish
    utter.onerror = finish

    window.speechSynthesis.speak(utter)

    // Watchdog: si a los 2.5s no arrancó (colgado o descartado en silencio),
    // cancelar y resolver — el niño nunca queda varado esperando.
    setTimeout(() => {
      if (!done && !started) {
        window.speechSynthesis.cancel()
        finish()
      }
    }, WATCHDOG_MS)
  })
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  // cancel() no garantiza onend en todos los navegadores — resolver a mano
  pendingSettle?.()
}

/** Whether a synthesized line is still sounding or queued. */
export function speechActive(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  return window.speechSynthesis.speaking || window.speechSynthesis.pending
}

// Preload voices (some browsers populate them async)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}
