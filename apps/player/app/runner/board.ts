import { getCurrentScope, onScopeDispose } from 'vue'
import { tr } from '~/types/i18n'
import type { I18nText } from '~/types/i18n'
import type { TemplateProps } from './types'

// Lo que comparten las plantillas: el tablero de 1280 × 600 en píxeles de diseño, la caja de cada pieza, el puntero en
// coordenadas del tablero, los textos de la escena, el movimiento reducido y las animaciones cuadro a cuadro. El gesto
// de arrastrar y soltar, en `useDrag.ts`; la mano que demuestra la acción, en `useDemo.ts` y `DemoHand.vue`.

export const BOARD = { width: 1280, height: 600 }

export interface Point { x: number, y: number }

/** La caja absoluta de una pieza en el tablero: izquierda, arriba, ancho y alto. */
export function box(x: number, y: number, w: number, h: number) {
  return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }
}

/** Un punto del puntero en coordenadas del tablero, con el zoom del marco y el encaje del tablero. */
export function toBoard(layer: Pick<HTMLElement, 'getBoundingClientRect'>, event: Pick<PointerEvent, 'clientX' | 'clientY'>) {
  const rect = layer.getBoundingClientRect()
  const k = rect.width / BOARD.width
  return { x: (event.clientX - rect.left) / k, y: (event.clientY - rect.top) / k }
}

/**
 * La tarjeta con escenario (PLAYER-DESIGN, «Piezas del tablero»): dentro del contorno de 3 y un margen blanco de 3
 * (`line`), el suelo del lugar abajo y a lo ancho (`strip`: una franja de la librería de 600 × 120, con la clase
 * `tb-suelo`) y, sobre él, la línea donde se apoya lo que muestra (`ground`: y 36 de la franja). Arriba, el blanco de
 * la tarjeta. En coordenadas de la tarjeta.
 */
export function sceneryCard(w: number, h: number) {
  const line = 6
  const sw = w - line * 2
  const sh = sw * 120 / 600
  const top = h - line - sh
  return { line, strip: { x: line, y: top, w: sw, h: sh }, ground: top + sh * 36 / 120 }
}

/** Los textos de la escena en su idioma: `t` traduce un texto y `str`, una clave de `strings`. */
export function useSceneText(props: Pick<TemplateProps, 'scene' | 'locale'>) {
  const t = (value: I18nText | null | undefined) => (value ? tr(value, props.locale) : '')
  const str = (key: string | undefined) => (key ? t(props.scene.strings?.[key]) : '')
  return { t, str }
}

/** El sistema pide movimiento reducido. */
export const prefersReducedMotion = () => import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Un punto de la curva de `a` a `b` con control en `c` (de Bézier, cuadrática), con `s` de 0 a 1. */
export function curve(a: Point, c: Point, b: Point, s: number): Point {
  return {
    x: (1 - s) ** 2 * a.x + 2 * (1 - s) * s * c.x + s ** 2 * b.x,
    y: (1 - s) ** 2 * a.y + 2 * (1 - s) * s * c.y + s ** 2 * b.y,
  }
}

/** Aceleración suave al salir y al llegar (un vuelo, la mano que demuestra). */
export const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
/** Sale rápido y frena al llegar (la vuelta a casa). */
export const easeOut = (k: number) => 1 - (1 - k) ** 3

/**
 * Una animación de `ms` cuadro a cuadro: `step(k)` con `k` de 0 a 1 y, al final, `step(1)` y `done`. Termina siempre:
 * si el navegador deja de pintar cuadros (la pestaña o el panel en segundo plano), el respaldo la lleva a su final al
 * acabar su tiempo, y la escena no se queda a medias. Con 0 ms, de una vez. Devuelve con qué pararla sin llegar al final.
 */
export function animate(ms: number, step: (k: number) => void, done?: () => void): () => void {
  let frame = 0
  let guard: ReturnType<typeof setTimeout> | undefined
  let over = false
  const stop = () => {
    over = true
    if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
    clearTimeout(guard)
  }
  const finish = () => {
    if (over) return
    stop()
    step(1)
    done?.()
  }
  if (ms <= 0) { finish(); return stop }
  const begin = performance.now()
  const tick = () => {
    if (over) return
    const k = Math.min((performance.now() - begin) / ms, 1)
    if (k >= 1) { finish(); return }
    step(k)
    if (!over && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick)
  }
  if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick)
  guard = setTimeout(finish, ms + 120)
  return stop
}

/** Una animación a la vez (`animate`): empezar otra para la anterior, y se para al desmontar la plantilla. */
export function useAnimation() {
  let stopCurrent = () => {}
  // Cuál es la última: si una animación de 0 ms termina al empezar y su `done` para o empieza otra, esa manda.
  let turn = 0
  const stop = () => {
    turn += 1
    stopCurrent()
    stopCurrent = () => {}
  }
  if (getCurrentScope()) onScopeDispose(stop)
  return {
    run(ms: number, step: (k: number) => void, done?: () => void) {
      stop()
      const mine = turn
      const stopThis = animate(ms, step, done)
      if (turn === mine) stopCurrent = stopThis
    },
    stop,
  }
}
