import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Lo que el gesto hace sonar, sin audio de verdad.
const played = vi.hoisted(() => [] as string[])
vi.mock('~/runner/engine/sound', () => ({ playSound: (name: string) => { played.push(name) } }))
import { createWorld, realTime } from '~/runner/engine/world'
import { useDrag } from '~/runner/useDrag'
import type { Point } from '~/runner/board'

// El gesto de arrastrar y soltar del tablero (app/runner/useDrag.ts), con punteros simulados sobre un tablero a escala 1.

const layer = { value: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 600 }) as DOMRect } }
const piece = { setPointerCapture: vi.fn() }
const ev = (pointerId: number, x: number, y: number) =>
  ({ pointerId, clientX: x, clientY: y, button: 0, pointerType: 'touch', currentTarget: piece }) as unknown as PointerEvent

function setup(opts: { target?: (p: Point) => string | null, lift?: number, reduced?: boolean, canStart?: () => boolean } = {}) {
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
    reduced: opts.reduced,
  })
  const h = drag.bind('huevo')
  return { drag, h, homes, calls }
}

beforeEach(() => {
  played.length = 0
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
})
afterEach(() => {
  realTime.clear() // lo que una prueba deja a medias no sigue en la siguiente
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
    const { drag, h } = setup({ lift: -12, reduced: true })
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
  it('al soltarla en movimiento sigue con la velocidad del dedo y luego vuelve', () => {
    const { drag, h } = setup()
    h.onPointerdown(ev(1, 100, 100))
    for (let i = 1; i <= 6; i += 1) {
      vi.advanceTimersByTime(16)
      h.onPointermove(ev(1, 100 + i * 30, 100)) // a la derecha, a unos 1.900 por segundo
    }
    h.onPointerup(ev(1, 280, 100))
    expect(drag.offsetOf('huevo').x).toBe(180)
    vi.advanceTimersByTime(32)
    expect(drag.offsetOf('huevo').x).toBeGreaterThan(180) // sigue un poco en la dirección del dedo
    vi.advanceTimersByTime(700)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
    expect(drag.busy()).toBe(false)
  })

  it('sobre una zona válida se posa: conserva menos velocidad que fuera', () => {
    const far = (target: string | null) => {
      const homes: Record<string, Point> = { ficha: { x: 100, y: 100 } }
      const drag = useDrag<string>({ layer, home: id => homes[id]!, targetAt: () => target })
      const h = drag.bind('ficha')
      h.onPointerdown(ev(1, 100, 100))
      for (let i = 1; i <= 6; i += 1) {
        vi.advanceTimersByTime(16)
        h.onPointermove(ev(1, 100 + i * 30, 100))
      }
      h.onPointerup(ev(1, 280, 100))
      vi.advanceTimersByTime(32)
      const x = drag.offsetOf('ficha').x
      vi.advanceTimersByTime(700)
      return x
    }
    const outside = far(null)
    const inside = far('hueco')
    expect(outside).toBeGreaterThan(180)
    expect(inside).toBeLessThan(outside)
  })

  it('si el dedo se queda quieto antes de soltar, no hay impulso', () => {
    const { drag, h } = setup()
    h.onPointerdown(ev(1, 100, 100))
    for (let i = 1; i <= 6; i += 1) {
      vi.advanceTimersByTime(16)
      h.onPointermove(ev(1, 100 + i * 30, 100))
    }
    vi.advanceTimersByTime(120) // quieto
    h.onPointerup(ev(1, 280, 100))
    vi.advanceTimersByTime(32)
    expect(drag.offsetOf('huevo').x).toBeLessThan(180)
  })

  it('sube sobre el dedo poco a poco, sin saltar', () => {
    const { drag, h } = setup({ lift: -12 })
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 120, 100))
    expect(drag.offsetOf('huevo')).toEqual({ x: 20, y: 0 })
    expect(drag.liftedOf('huevo')).toBe(0)
    vi.advanceTimersByTime(48)
    expect(drag.liftedOf('huevo')).toBeGreaterThan(0)
    expect(drag.liftedOf('huevo')).toBeLessThan(1)
    vi.advanceTimersByTime(400)
    expect(drag.liftedOf('huevo')).toBe(1)
    expect(drag.offsetOf('huevo')).toEqual({ x: 20, y: -12 })
  })

  it('va exactamente donde está el dedo: la predicción del navegador no la mueve (temblaba)', () => {
    const { drag, h } = setup()
    const predicted = (x: number, px: number) =>
      ({ ...ev(1, x, 100), getPredictedEvents: () => [{ clientX: px, clientY: 100 }] }) as unknown as PointerEvent
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(predicted(200, 212))
    expect(drag.offsetOf('huevo')).toEqual({ x: 100, y: 0 })
    h.onPointermove(predicted(210, 193)) // el dedo se frena y la predicción se va hacia atrás
    expect(drag.offsetOf('huevo')).toEqual({ x: 110, y: 0 })
  })

  it('cada pieza termina su vuelta por su cuenta: agarrar otra no la corta', () => {
    const homes: Record<string, Point> = { a: { x: 100, y: 100 }, b: { x: 400, y: 100 } }
    const settled: string[] = []
    const drag = useDrag<string>({ layer, home: id => homes[id]!, settle: id => settled.push(id) })
    const a = drag.bind('a')
    const b = drag.bind('b')
    a.onPointerdown(ev(1, 100, 100))
    a.onPointermove(ev(1, 300, 100))
    a.onPointerup(ev(1, 300, 100))
    vi.advanceTimersByTime(48)
    b.onPointerdown(ev(2, 400, 100))
    b.onPointermove(ev(2, 420, 100))
    const midway = drag.offsetOf('a').x
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(200)
    vi.advanceTimersByTime(600)
    expect(drag.offsetOf('a')).toEqual({ x: 0, y: 0 })
    expect(settled).toEqual(['a'])
    expect(drag.isDragging('b')).toBe(true)
    expect(drag.offsetOf('b')).toEqual({ x: 20, y: 0 })
  })

  it('shift: una pieza que cambia de casa sin gesto llega deslizándose, sin saltar', () => {
    const homes: Record<string, Point> = { ficha: { x: 100, y: 400 } }
    const calls = { settle: 0 }
    const drag = useDrag<string>({ layer, home: id => homes[id]!, settle: () => { calls.settle += 1 } })
    drag.shift('ficha', () => { homes.ficha = { x: 500, y: 100 } })
    const o = drag.offsetOf('ficha')
    expect({ x: homes.ficha!.x + o.x, y: homes.ficha!.y + o.y }).toEqual({ x: 100, y: 400 }) // se ve donde estaba
    expect(drag.isActive('ficha')).toBe(true)
    vi.advanceTimersByTime(700)
    expect(drag.offsetOf('ficha')).toEqual({ x: 0, y: 0 })
    expect(drag.busy()).toBe(false)
    expect(calls.settle).toBe(0) // no venía de un gesto
  })

  it('shift dentro de drop no compensa dos veces, y con movimiento reducido llega de una vez', () => {
    const homes: Record<string, Point> = { ficha: { x: 100, y: 100 } }
    const drag = useDrag<string>({
      layer,
      home: id => homes[id]!,
      targetAt: () => 'hueco',
      drop: id => drag.shift(id, () => { homes.ficha = { x: 700, y: 300 } }),
    })
    const h = drag.bind('ficha')
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 650, 280))
    h.onPointerup(ev(1, 650, 280))
    const o = drag.offsetOf('ficha')
    expect({ x: homes.ficha!.x + o.x, y: homes.ficha!.y + o.y }).toEqual({ x: 650, y: 280 })

    const still = useDrag<string>({ layer, home: id => homes[id]!, reduced: true })
    still.shift('ficha', () => { homes.ficha = { x: 100, y: 100 } })
    expect(still.offsetOf('ficha')).toEqual({ x: 0, y: 0 })
    expect(still.busy()).toBe(false)
  })
  it('de varias piezas que se pisan se agarra la más cercana al dedo, y su toque también es suyo', () => {
    const homes: Record<string, Point> = { a: { x: 100, y: 100 }, b: { x: 140, y: 100 } }
    const taps: string[] = []
    const drag = useDrag<string>({ layer, home: id => homes[id]!, pieces: () => ['a', 'b'], tap: id => taps.push(id) })
    const a = drag.bind('a') // la que quedó encima recibe el dedo
    a.onPointerdown(ev(1, 135, 100))
    a.onPointermove(ev(1, 235, 100))
    expect(drag.isDragging('b')).toBe(true)
    expect(drag.offsetOf('b')).toEqual({ x: 100, y: 0 })
    expect(drag.offsetOf('a')).toEqual({ x: 0, y: 0 })
    a.onPointerup(ev(1, 235, 100))
    vi.advanceTimersByTime(700)
    expect(drag.busy()).toBe(false)

    a.onPointerdown(ev(1, 138, 100))
    a.onPointerup(ev(1, 138, 100))
    a.onClick()
    expect(taps).toEqual(['b'])
    a.onClick() // con el teclado, sin dedo: la suya
    expect(taps).toEqual(['b', 'a'])
  })

  it('las zonas declaradas: la de debajo del dedo, con su margen', () => {
    const calls: (string | null)[] = []
    const drag = useDrag<string>({
      layer,
      home: () => ({ x: 100, y: 100 }),
      zones: () => [{ id: 'tienda', x: 800, y: 40, w: 320, h: 240 }, { id: 'casa', x: 800, y: 320, w: 320, h: 240 }],
      margin: 24,
      drop: (_id, target) => calls.push(target),
    })
    const h = drag.bind('huevo')
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 500, 150))
    expect(drag.state.over).toBe(null)
    h.onPointermove(ev(1, 780, 150)) // a 20 del borde: dentro del margen
    expect(drag.state.over).toBe('tienda')
    h.onPointermove(ev(1, 900, 305)) // entre las dos: la más cercana
    expect(drag.state.over).toBe('casa')
    h.onPointerup(ev(1, 900, 305))
    expect(calls).toEqual(['casa'])
  })

  it('con el tablero en pausa la pieza se queda quieta y sigue al volver', () => {
    let paused = false
    const world = createWorld(() => paused)
    const drag = useDrag<string>({ layer, home: () => ({ x: 100, y: 100 }), world })
    const h = drag.bind('huevo')
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 100))
    h.onPointerup(ev(1, 300, 100))
    vi.advanceTimersByTime(64)
    paused = true
    vi.advanceTimersByTime(32)
    const frozen = drag.offsetOf('huevo').x
    expect(frozen).toBeGreaterThan(0)
    vi.advanceTimersByTime(3000)
    expect(drag.offsetOf('huevo').x).toBe(frozen)
    paused = false
    world.resume()
    vi.advanceTimersByTime(700)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
    expect(drag.busy()).toBe(false)
  })
  it('suena sola: al agarrarla, al soltarla en una zona, al soltarla fuera y al tocarla', () => {
    const { h } = setup({ target: p => (p.x > 500 ? 'tienda' : null) })
    h.onPointerdown(ev(1, 100, 100))
    expect(played).toEqual([])
    h.onPointermove(ev(1, 600, 100))
    expect(played).toEqual(['agarrar'])
    h.onPointerup(ev(1, 600, 100))
    expect(played).toEqual(['agarrar', 'soltar'])
    vi.advanceTimersByTime(700)

    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 100))
    h.onPointerup(ev(1, 300, 100))
    expect(played).toEqual(['agarrar', 'soltar', 'agarrar', 'volver'])
    vi.advanceTimersByTime(700)

    h.onPointerdown(ev(1, 100, 100))
    h.onPointerup(ev(1, 100, 100))
    h.onClick()
    expect(played.at(-1)).toBe('tocar')
  })

  it('una zona que no acepta la pieza: suena y vuelve como fuera, y la plantilla recibe la zona', () => {
    const drops: (string | null)[] = []
    const drag = useDrag<string>({
      layer,
      home: () => ({ x: 100, y: 100 }),
      targetAt: () => 'hueco',
      accepts: (_id, target) => target !== 'hueco',
      drop: (_id, target) => { drops.push(target) },
    })
    const h = drag.bind('huevo')
    h.onPointerdown(ev(1, 100, 100))
    h.onPointermove(ev(1, 300, 100))
    h.onPointerup(ev(1, 300, 100))
    expect(drops).toEqual(['hueco'])
    expect(played).toEqual(['agarrar', 'volver'])
    vi.advanceTimersByTime(3000)
    expect(drag.offsetOf('huevo')).toEqual({ x: 0, y: 0 })
  })

  it('un gesto cortado no suena, y una pieza que cambia de sitio suena al llegar si se pide', () => {
    const homes: Record<string, Point> = { ficha: { x: 100, y: 400 } }
    const drag = useDrag<string>({ layer, home: id => homes[id]! })
    const h = drag.bind('ficha')
    h.onPointerdown(ev(1, 100, 400))
    h.onPointermove(ev(1, 300, 400))
    drag.cancel()
    expect(played).toEqual(['agarrar'])
    vi.advanceTimersByTime(700)

    drag.shift('ficha', () => { homes.ficha = { x: 500, y: 100 } }, { arrive: 'soltar' })
    expect(played).toEqual(['agarrar'])
    vi.advanceTimersByTime(700)
    expect(played).toEqual(['agarrar', 'soltar'])

    drag.shift('ficha', () => { homes.ficha = { x: 100, y: 400 } })
    vi.advanceTimersByTime(700)
    expect(played).toEqual(['agarrar', 'soltar']) // volver a la bandeja no suena
  })
})
