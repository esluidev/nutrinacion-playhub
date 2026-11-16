import { getCurrentScope, onScopeDispose, watch } from 'vue'
import { onFrame } from './ticker'
import type { FrameFn } from './ticker'

// ---- El tiempo del juego: el reloj de un tablero. Todo lo que pasa en un juego (un vuelo, una espera, una pieza que
// vuelve, una caída) cuenta su tiempo aquí y no en el reloj del sistema, así que:
//   - con el tablero en pausa (la pausa, un panel, una ventana, otra escena delante) el tiempo se detiene y nada avanza
//     ni vence; al volver, todo sigue desde donde estaba;
//   - una plantilla no usa `setTimeout`, `setInterval` ni `requestAnimationFrame`: pide `after`, `every`, `tween` u
//     `onFrame` a su mundo, y al desmontarse todo se limpia solo;
//   - solo hay bucle mientras hay algo pendiente (el reloj del motor, `ticker.ts`).
// Lo que no es del juego (la mano que demuestra, que se corta al pausar; el marco) usa `realTime`, que nunca se pausa. ----

export interface World {
  /** El tiempo de juego transcurrido, en milisegundos. */
  now: () => number
  /** `fn(dt, now)` en cada cuadro de juego, con `dt` en segundos. Devuelve con qué dejarlo. */
  onFrame: (fn: FrameFn) => () => void
  /** `fn` una vez, pasados `ms` de juego. Devuelve con qué cancelarlo. */
  after: (ms: number, fn: () => void) => () => void
  /** `fn` cada `ms` de juego. Devuelve con qué pararlo. */
  every: (ms: number, fn: () => void) => () => void
  /**
   * Una animación con guion de `ms`: `step(k)` en cada cuadro con `k` de 0 a 1 y, al final, `step(1)` y `done`. Con
   * 0 ms, de una vez. Devuelve con qué pararla sin llegar al final.
   */
  tween: (ms: number, step: (k: number) => void, done?: () => void) => () => void
  /** Sigue andando después de una pausa. */
  resume: () => void
  /** Deja todo lo pendiente sin hacer. */
  clear: () => void
}

export function createWorld(paused: () => boolean = () => false): World {
  interface Timer { at: number, every: number, fn: () => void }
  const frames = new Set<FrameFn>()
  const timers = new Set<Timer>()
  let time = 0
  let stop: (() => void) | null = null

  const sleep = () => { stop?.(); stop = null }
  const idle = () => !frames.size && !timers.size
  const wake = () => { if (!stop && !idle() && !paused()) stop = onFrame(tick) }

  function tick(dt: number) {
    // En pausa el tiempo no corre y no hay bucle: `resume` lo vuelve a poner en marcha.
    if (paused()) { sleep(); return }
    time += dt * 1000
    for (const fn of [...frames]) if (frames.has(fn)) fn(dt, time)
    for (const timer of [...timers]) {
      if (!timers.has(timer) || time < timer.at) continue
      if (timer.every) timer.at = time + timer.every
      else timers.delete(timer)
      timer.fn()
    }
    if (idle()) sleep()
  }

  function schedule(ms: number, every: number, fn: () => void) {
    const timer = { at: time + ms, every, fn }
    timers.add(timer)
    wake()
    return () => {
      timers.delete(timer)
      if (idle()) sleep()
    }
  }

  const world: World = {
    now: () => time,
    onFrame(fn) {
      frames.add(fn)
      wake()
      return () => {
        frames.delete(fn)
        if (idle()) sleep()
      }
    },
    after: (ms, fn) => schedule(ms, 0, fn),
    every: (ms, fn) => schedule(ms, ms, fn),
    tween(ms, step, done) {
      let over = false
      let elapsed = 0
      let off = () => {}
      const halt = () => { over = true; off() }
      const finish = () => {
        if (over) return
        halt()
        step(1)
        done?.()
      }
      if (ms <= 0) { finish(); return halt }
      off = world.onFrame((dt) => {
        if (over) return
        elapsed += dt * 1000
        if (elapsed >= ms) finish()
        else step(elapsed / ms)
      })
      return halt
    },
    resume: wake,
    clear() {
      frames.clear()
      timers.clear()
      sleep()
    },
  }
  return world
}

/** El tiempo real: nunca se pausa. Para lo que no es del juego y para quien no recibe un mundo. */
export const realTime = createWorld()

/** El mundo de una plantilla: se pausa mientras `paused()` y se limpia al desmontarla. */
export function useWorld(paused: () => boolean): World {
  const world = createWorld(paused)
  if (getCurrentScope()) {
    watch(paused, (now) => { if (!now) world.resume() })
    onScopeDispose(world.clear)
  }
  return world
}
