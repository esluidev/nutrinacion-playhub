import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDrag } from '~/runner/useDrag'
import type { Point } from '~/runner/board'

// El gesto de arrastrar y soltar del tablero (app/runner/useDrag.ts), con punteros simulados sobre un tablero a escala 1.

const layer = { value: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 600 }) as DOMRect } }
const piece = { setPointerCapture: vi.fn() }
const ev = (pointerId: number, x: number, y: number) =>
  ({ pointerId, clientX: x, clientY: y, button: 0, pointerType: 'touch', currentTarget: piece }) as unknown as PointerEvent

function setup(opts: { target?: (p: Point) => string | null, lift?: number, returnMs?: number, canStart?: () => boolean } = {}) {
  const homes: Record<string, Point> = { huevo: { x: 100, y: 100 } }
  const calls = { drop: [] as { target: string | null, offset: Point }[], tap: 0, settle: 0, start: 0 }
  const drag = useDrag<string>({
    layer,
    home: id => homes[id]!,
    canStart: opts.canStart,
    targetAt: p => opts.target?.(p) ?? null,
    start: () => { calls.start += 1 },
    drop: (_id, target, info) => { calls.drop.push({ target, offset: info.offset }) },
    tap: () => { calls.tap += 1 },
    settle: () => { calls.settle += 1 },
    lift: opts.lift ?? 0,
    returnMs: opts.returnMs ?? 300,
  })
  const h = drag.bind('huevo')
  return { drag, h, homes, calls }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useDrag', () => {
  it('un toque sin arrastre llega por el clic y no mueve la pieza', () => {
    const { drag, h, calls } = setup()
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 104, 103)) // dentro del umbral
    h.onPointerup(ev(1, 104, 103))
    h.onClick()
    expect(calls.tap).toBe(1)
    expect(calls.start).toBe(0)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
    expect(drag.busy()).toBe(false)
  })

  it('soltar fuera de una zona: vuelve a su casa y el clic que sigue se descarta', () => {
    const { drag, h, calls } = setup()
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 250))
    expect(drag.offsetOf('huevo')).toEqual({ x: 200, y: 150 })
    expect(drag.isDragging('huevo')).toBe(true)
    h.onPointerup(ev(1, 300, 250))
    h.onClick()
    expect(calls.tap).toBe(0)
    expect(calls.drop).toEqual([{ target: null, offset: { x: 200, y: 150 } }])
    vi.advanceTimersByTime(150)
    const mid = drag.offsetOf('huevo')
    expect(mid.x).toBeGreaterThan(0)
    expect(mid.x).toBeLessThan(200)
    vi.advanceTimersByTime(300)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
    expect(drag.busy()).toBe(false)
    expect(calls.settle).toBe(1)
  })

  it('agarrarla mientras vuelve la detiene donde está, y su casa no cambia: nunca se queda en el aire', () => {
    const { drag, h } = setup()
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 250))
    h.onPointerup(ev(1, 300, 250))
    vi.advanceTimersByTime(100)
    const caught = { ...drag.offsetOf('huevo') }
    h.onPointerdown(ev(2, 150, 150))
    vi.advanceTimersByTime(200) // la vuelta anterior ya no la mueve
    expect(drag.offsetOf('huevo')).toEqual(caught)
    h.onPointermove(ev(2, 170, 170))
    expect(drag.offsetOf('huevo')).toEqual({ x: caught.x + 20, y: caught.y + 20 })
    h.onPointerup(ev(2, 170, 170))
    vi.advanceTimersByTime(500)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
    expect(drag.busy()).toBe(false)
  })

  it('un segundo dedo no toca el arrastre ni empieza otro', () => {
    const { drag, h, calls } = setup()
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 200, 100))
    h.onPointerdown(ev(2, 400, 400))
    h.onPointermove(ev(2, 500, 500))
    expect(drag.offsetOf('huevo')).toEqual({ x: 100, y: 0 })
    h.onPointerup(ev(2, 500, 500))
    expect(drag.isDragging('huevo')).toBe(true)
    h.onPointerup(ev(1, 200, 100))
    expect(calls.drop).toHaveLength(1)
    vi.advanceTimersByTime(500)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
  })

  it('marca la zona que queda debajo y se la entrega a la plantilla al soltar', () => {
    const { drag, h, calls } = setup({ target: p => (p.x > 500 ? 'tienda' : null) })
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 120))
    expect(drag.state.over).toBe(null)
    h.onPointermove(ev(1, 600, 120))
    expect(drag.state.over).toBe('tienda')
    h.onPointerup(ev(1, 600, 120))
    expect(calls.drop[0]!.target).toBe('tienda')
    expect(drag.state.over).toBe(null)
  })

  it('al cambiarla de casa en drop, el desplazamiento se recalcula: no salta', () => {
    const homes: Record<string, Point> = { ficha: { x: 100, y: 100 } }
    const drag = useDrag<string>({
      layer,
      home: id => homes[id]!,
      targetAt: () => 'hueco',
      drop: () => { homes.ficha = { x: 700, y: 300 } },
      returnMs: 300,
    })
    const h = drag.bind('ficha')
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 650, 280)) // se ve en 650, 280
    h.onPointerup(ev(1, 650, 280))
    const o = drag.offsetOf('ficha')
    expect({ x: homes.ficha!.x + o.x, y: homes.ficha!.y + o.y }).toEqual({ x: 650, y: 280 })
    vi.advanceTimersByTime(500)
    expect(drag.offsetOf('ficha')).toEqual({ x: 0, y: 0 })
  })

  it('si la plantilla la deja donde se soltó, no queda nada que deslizar ni levantado', () => {
    const homes: Record<string, Point> = { huevo: { x: 100, y: 100 } }
    const drag = useDrag<string>({
      layer,
      home: id => homes[id]!,
      drop: (_id, _t, { offset }) => { homes.huevo = { x: 100 + offset.x, y: 100 + offset.y } },
    })
    const h = drag.bind('huevo')
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 300))
    h.onPointerup(ev(1, 300, 300))
    expect(drag.busy()).toBe(false)
    expect(drag.liftedOf('huevo')).toBe(0)
  })

  it('un gesto cancelado o sin captura vuelve a casa sin soltar', () => {
    for (const how of ['onPointercancel', 'onLostpointercapture'] as const) {
      const { drag, h, calls } = setup({ target: () => 'tienda' })
      h.onPointerdown(ev(1, 100, 100))
      h.onPointermove(ev(1, 300, 300))
      h[how](ev(1, 300, 300))
      expect(calls.drop).toHaveLength(0)
      vi.advanceTimersByTime(500)
      expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
      expect(drag.busy()).toBe(false)
    }
  })

  it('cancel() corta el gesto en curso (la escena se bloqueó)', () => {
    const { drag, h, calls } = setup()
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 300))
    drag.cancel()
    expect(calls.drop).toHaveLength(0)
    h.onPointermove(ev(1, 400, 400)) // el dedo sigue, pero ya no la mueve
    vi.advanceTimersByTime(500)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
  })

  it('sin cuadros (pestaña en segundo plano), la vuelta termina igual', () => {
    vi.stubGlobal('requestAnimationFrame', () => 0)
    const { drag, h } = setup()
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 300))
    h.onPointerup(ev(1, 300, 300))
    vi.advanceTimersByTime(500)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
    expect(drag.busy()).toBe(false)
  })

  it('sube sobre el dedo al empezar y vuelve inmediata con movimiento reducido', () => {
    const { drag, h } = setup({ lift: -12, returnMs: 0 })
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 120, 100))
    expect(drag.offsetOf('huevo')).toEqual({ x: 20, y: -12 })
    expect(drag.liftedOf('huevo')).toBe(1)
    h.onPointerup(ev(1, 120, 100))
    expect(drag.busy()).toBe(false)
  })

  it('no empieza si la pieza no se puede agarrar', () => {
    const { drag, h } = setup({ canStart: () => false })
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 300))
    expect(drag.busy()).toBe(false)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
  })
})
