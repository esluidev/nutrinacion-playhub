import { getCurrentScope, onScopeDispose, reactive, readonly } from 'vue'
import { curve, easeInOut, useAnimation } from './board'
import type { Point } from './board'

// ---- La mano que demuestra la acción, el patrón de los juegos táctiles: si nadie toca, la mano aparece con la punta del
// índice sobre lo que se agarra, lo presiona, lleva una copia translúcida por su camino hasta el destino (que se marca
// como al soltar encima), la suelta y se desvanece. La plantilla dice cuándo se puede demostrar, en qué tramo está el
// juego y qué movimiento se demuestra; esto se ocupa del resto:
//   - Cuándo: la primera de cada tramo al poco (`first`), luego cada `every` sin tocar. Tocar (o arrastrar) la corta y
//     vuelve a contar el tiempo.
//   - Nunca con la escena en pausa, mientras alguien arrastra (lo dice `ready`) ni con movimiento reducido.
//   - Termina siempre, aunque el navegador deje de pintar cuadros (`useAnimation`, en board.ts).
// Si lo que se demuestra es un toque (`tap`), la mano no lleva nada: se queda sobre lo que se toca y lo pulsa dos
// veces, y mientras lo pulsa lo marca (`over`), para que la plantilla lo haga reaccionar.
// La mano es lo único que invita: ninguna pieza respira ni late para pedir que la toquen. Cuando alguien toca lo que
// todavía no toca, o una acción abre un segundo paso, la plantilla pide la demostración al momento (`show`).
// Lo dibuja `DemoHand.vue`, con la mano puntero de la librería. ----

export interface DemoMove<Target> {
  /** De dónde sale (el centro de lo que se agarra) y adónde lo lleva, en el tablero. */
  from: Point
  to: Point
  /** El punto de control del camino; sin él, un arco suave por arriba. */
  via?: Point
  /** La zona que se marca al llegar, como al soltar encima. */
  target: Target
  /** La escala de la copia al salir y al llegar (por defecto, 1 y 1). */
  scale?: [number, number]
  /** Demuestra un toque, no un arrastre: la mano se queda en `from`, sin copia, y lo pulsa dos veces. */
  tap?: boolean
}

export interface DemoOptions<Target> {
  /** Si se puede demostrar ahora: la escena no está bloqueada, se está eligiendo y nadie arrastra. */
  ready: () => boolean
  /** Qué demostrar, la vez `n` (para alternar destinos), o null si no hay nada. */
  move: (n: number) => DemoMove<Target> | null
  /** El tramo en el que está el juego: al cambiar, la primera demostración vuelve a esperar `first`. */
  step?: () => string
  /** Cuánto espera la primera demostración del tramo, en ms. */
  first?: () => number
  /** Cada cuánto se repite sin tocar, en ms. */
  every?: number
  /** Movimiento reducido: nunca demuestra. */
  reduced?: boolean
}

/** La mano (su punta, su escala al presionar y su opacidad), la copia que lleva y la zona marcada. */
export interface DemoState<Target = unknown> {
  on: boolean
  hand: { x: number, y: number, s: number, o: number }
  copy: { x: number, y: number, s: number, o: number }
  over: Target | null
}

// La demostración dura 2400 ms: 0–300 aparece; 300–520 presiona; 520–1800 lleva; 1800–2000 suelta; 2000–2400 se va.
// El destino se marca de 1450 a 2000, como al soltar encima.
const LENGTH = 2400
// El toque dura 1900 ms: 0–300 aparece; pulsa de 300 a 660 y otra vez de 880 a 1240 (baja en 160 y sube en 200); de
// 1500 a 1900 se va. Lo que pulsa se marca mientras la mano está abajo.
const TAP = { length: 1900, presses: [300, 880], down: 160, up: 200, out: 1500 }
const CHECK_EVERY = 300
const clamp = (v: number) => Math.min(Math.max(v, 0), 1)

export function useDemo<Target = string>(options: DemoOptions<Target>) {
  const every = options.every ?? 6000
  const first = options.first ?? (() => 1500)

  const state = reactive({ on: false, hand: { x: 0, y: 0, s: 1, o: 0 }, copy: { x: 0, y: 0, s: 1, o: 0 }, over: null }) as DemoState<Target>
  const play = useAnimation()

  let idleSince = performance.now()
  let runs = 0
  let step = ''
  let stepRuns = 0

  /** Alguien tocó: corta la demostración, si la hay, y vuelve a contar el tiempo sin tocar. */
  function stop() {
    play.stop()
    state.on = false
    state.over = null
    idleSince = performance.now()
  }

  function run(move: DemoMove<Target>) {
    const { from, to, target } = move
    const [s0, s1] = move.scale ?? [1, 1]
    const path = { a: from, c: move.via ?? { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 80 }, b: to }
    state.on = true
    Object.assign(state.hand, { x: from.x, y: from.y, s: 1, o: 0 })
    Object.assign(state.copy, { x: from.x, y: from.y, s: s0, o: 0 })
    if (move.tap) {
      play.run(TAP.length, (k) => {
        if (!options.ready()) { stop(); return }
        const t = k * TAP.length
        // Cuánto baja la mano, de 0 a 1: la suma de sus pulsaciones.
        const press = TAP.presses.reduce((sum, at) => sum + (t < at + TAP.down ? clamp((t - at) / TAP.down) : 1 - clamp((t - at - TAP.down) / TAP.up)), 0)
        state.hand.o = t < 300 ? t / 300 : 1 - clamp((t - TAP.out) / (TAP.length - TAP.out))
        state.hand.s = 1 - 0.12 * press
        state.over = press > 0.5 ? target : null
      }, () => {
        if (state.on) stop()
      })
      return
    }
    play.run(LENGTH, (k) => {
      if (!options.ready()) { stop(); return }
      const t = k * LENGTH
      const travel = easeInOut(clamp((t - 520) / 1280))
      const p = curve(path.a, path.c, path.b, travel)
      state.hand.o = t < 300 ? t / 300 : t > 2000 ? 1 - clamp((t - 2000) / 400) : 1
      state.hand.s = t < 300 ? 1 : t < 520 ? 1 - 0.12 * clamp((t - 300) / 220) : t < 1800 ? 0.88 : 0.88 + 0.12 * clamp((t - 1800) / 200)
      state.copy.o = t < 300 ? 0 : t < 520 ? 0.7 * clamp((t - 300) / 220) : t < 1800 ? 0.7 : 0.7 * (1 - clamp((t - 1800) / 200))
      state.hand.x = p.x
      state.hand.y = p.y
      state.copy.x = p.x
      state.copy.y = p.y - 10 * Math.sin(Math.PI * travel)
      state.copy.s = s0 + (s1 - s0) * travel
      state.over = t > 1450 && t < 2000 ? target : null
    }, () => {
      if (state.on) stop()
    })
  }

  /** Demuestra lo que toca en este tramo, si hay algo; `now` no espera el tiempo sin tocar. */
  function check(now = false) {
    if (options.reduced || state.on) return
    if (!options.ready()) { idleSince = performance.now(); return }
    const here = options.step?.() ?? ''
    if (here !== step) {
      step = here
      stepRuns = 0
    }
    if (!now && performance.now() - idleSince < (stepRuns ? every : first())) return
    const move = options.move(runs)
    if (!move) return
    runs += 1
    stepRuns += 1
    run(move)
  }

  /**
   * Demuestra ya, sin esperar: alguien tocó lo que todavía no toca, o lo que acaba de hacer abre un segundo paso, y la
   * mano dice al momento qué sigue. Cuenta como la primera del tramo: la siguiente llega tras `every` sin tocar. Con
   * una demostración en marcha, con la escena sin estar lista o con movimiento reducido, no hace nada.
   */
  const show = () => check(true)

  const timer = setInterval(() => check(), CHECK_EVERY)
  if (getCurrentScope()) onScopeDispose(() => clearInterval(timer))

  return {
    state: readonly(state) as Readonly<DemoState<Target>>,
    stop,
    show,
  }
}
