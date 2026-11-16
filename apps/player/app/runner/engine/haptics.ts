import { settings } from './settings'

// ---- La respuesta en la mano: una vibración muy corta al agarrar una pieza y otra al soltarla sobre una zona válida.
// Solo existe en Android con motor de vibración; en iPhone, iPad y escritorio no hace nada. Siempre sale de un toque
// del usuario, que es cuando el navegador la permite. ----

const PATTERNS = { grab: 8, drop: 14 } as const

export function haptic(kind: keyof typeof PATTERNS) {
  if (!settings.haptics || typeof navigator === 'undefined') return
  // Sin un toque previo del usuario el navegador la bloquea y lo anota como error: no se pide.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  try { navigator.vibrate?.(PATTERNS[kind]) }
  catch { /* sin vibración */ }
}
