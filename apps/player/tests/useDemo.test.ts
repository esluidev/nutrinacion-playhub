import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { animate, useAnimation } from '~/runner/board'
import { useDemo } from '~/runner/useDemo'
import type { DemoMove } from '~/runner/useDemo'

// La animación con respaldo (app/runner/board.ts) y la mano que demuestra la acción (app/runner/useDemo.ts), con el
// tiempo y los cuadros simulados.

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('animate', () => {
  it('avanza cuadro a cuadro y termina en 1', () => {
    const ks: number[] = []
    const done = vi.fn()
    animate(300, k => ks.push(k), done)
    vi.advanceTimersByTime(150)
    expect(ks.at(-1)).toBeGreaterThan(0)
    expect(ks.at(-1)).toBeLessThan(1)
    vi.advanceTimersByTime(200)
    expect(ks.at(-1)).toBe(1)
    expect(done).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(500) // el respaldo no la termina otra vez
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('sin cuadros (pestaña en segundo plano), el respaldo la termina', () => {
    vi.stubGlobal('requestAnimationFrame', () => 0)
    const step = vi.fn()
    const done = vi.fn()
    animate(300, step, done)
    vi.advanceTimersByTime(430)
    expect(step).toHaveBeenLastCalledWith(1)
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('pararla no la lleva al final', () => {
    const step = vi.fn()
    const done = vi.fn()
    const stop = animate(300, step, done)
    vi.advanceTimersByTime(100)
    stop()
    vi.advanceTimersByTime(500)
    expect(step).not.toHaveBeenCalledWith(1)
    expect(done).not.toHaveBeenCalled()
  })

  it('con 0 ms (movimiento reducido), de una vez', () => {
    const step = vi.fn()
    const done = vi.fn()
    animate(0, step, done)
    expect(step).toHaveBeenCalledWith(1)
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('useAnimation: empezar otra para la anterior', () => {
    const anim = useAnimation()
    const first = vi.fn()
    const second = vi.fn()
    anim.run(300, () => {}, first)
    vi.advanceTimersByTime(100)
    anim.run(300, () => {}, second)
    vi.advanceTimersByTime(500)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})

function setup(opts: { ready?: () => boolean, step?: () => string, first?: () => number, reduced?: boolean, targets?: string[] } = {}) {
  const targets = opts.targets ?? ['tienda', 'casa']
  const moves: number[] = []
  const demo = useDemo<string>({
    ready: opts.ready ?? (() => true),
    step: opts.step,
    first: opts.first,
    reduced: opts.reduced,
    move: (n): DemoMove<string> => {
      moves.push(n)
      return { from: { x: 100, y: 300 }, to: { x: 900, y: 200 }, target: targets[n % targets.length]!, scale: [1, 0.5] }
    },
  })
  return { demo, moves }
}

describe('useDemo', () => {
  it('la primera llega al poco sin tocar y recorre el camino hasta el destino, que se marca al llegar', () => {
    const { demo } = setup()
    vi.advanceTimersByTime(1200)
    expect(demo.state.on).toBe(false)
    vi.advanceTimersByTime(600) // empezó a los 1,5 s
    expect(demo.state.on).toBe(true)
    vi.advanceTimersByTime(1300) // 1,6 s de demostración: la mano llegando
    expect(demo.state.hand.x).toBeGreaterThan(100)
    expect(demo.state.copy.o).toBeCloseTo(0.7)
    expect(demo.state.copy.s).toBeLessThan(1)
    expect(demo.state.over).toBe('tienda')
    vi.advanceTimersByTime(1100) // terminó
    expect(demo.state.on).toBe(false)
    expect(demo.state.over).toBe(null)
  })

  it('se repite cada 6 s sin tocar y alterna los destinos', () => {
    const { demo, moves } = setup()
    vi.advanceTimersByTime(1800)
    expect(moves).toEqual([0])
    vi.advanceTimersByTime(2400 + 5000)
    expect(moves).toEqual([0])
    vi.advanceTimersByTime(1500)
    expect(moves).toEqual([0, 1])
    expect(demo.state.on).toBe(true)
  })

  it('tocar la corta y vuelve a contar el tiempo', () => {
    const { demo, moves } = setup()
    vi.advanceTimersByTime(1800)
    expect(demo.state.on).toBe(true)
    demo.stop()
    expect(demo.state.on).toBe(false)
    expect(demo.state.over).toBe(null)
    vi.advanceTimersByTime(5500)
    expect(moves).toHaveLength(1)
    vi.advanceTimersByTime(900)
    expect(moves).toHaveLength(2)
  })

  it('al cambiar de tramo, la primera vuelve a esperar poco', () => {
    let tramo = 'nido'
    const { moves } = setup({ step: () => tramo, first: () => (tramo === 'nido' ? 1500 : 2000) })
    vi.advanceTimersByTime(1800)
    expect(moves).toHaveLength(1)
    vi.advanceTimersByTime(2700) // terminó
    tramo = 'tienda'
    vi.advanceTimersByTime(2400)
    expect(moves).toHaveLength(2)
  })

  it('no con la escena en pausa: la espera empieza al poder', () => {
    let ready = false
    const { moves } = setup({ ready: () => ready })
    vi.advanceTimersByTime(10000)
    expect(moves).toHaveLength(0)
    ready = true
    vi.advanceTimersByTime(1200)
    expect(moves).toHaveLength(0)
    vi.advanceTimersByTime(600)
    expect(moves).toHaveLength(1)
  })

  it('se corta si la escena deja de poder (pausa, arrastre)', () => {
    let ready = true
    const { demo } = setup({ ready: () => ready })
    vi.advanceTimersByTime(1800)
    expect(demo.state.on).toBe(true)
    ready = false
    vi.advanceTimersByTime(40)
    expect(demo.state.on).toBe(false)
  })

  it('sin cuadros (pestaña en segundo plano), termina igual', () => {
    vi.stubGlobal('requestAnimationFrame', () => 0)
    const { demo } = setup()
    vi.advanceTimersByTime(1800)
    expect(demo.state.on).toBe(true)
    vi.advanceTimersByTime(2600)
    expect(demo.state.on).toBe(false)
  })

  it('nunca con movimiento reducido', () => {
    const { moves } = setup({ reduced: true })
    vi.advanceTimersByTime(20000)
    expect(moves).toHaveLength(0)
  })
})
