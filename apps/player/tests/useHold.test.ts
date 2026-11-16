import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWorld, realTime } from '~/runner/engine/world'
import { useHold } from '~/runner/useHold'

// El gesto de mantener el dedo sobre una pieza (app/runner/useHold.ts), con punteros y teclas simulados.

const piece = { setPointerCapture: vi.fn() }
const ev = (pointerId: number, button = 0, pointerType = 'touch') =>
  ({ pointerId, button, pointerType, currentTarget: piece }) as unknown as PointerEvent
const key = (name: string, repeat = false) => ({ key: name, repeat, preventDefault: vi.fn() })

function setup(opts: { canStart?: () => boolean, paused?: () => boolean } = {}) {
  const calls = { start: [] as string[], ticks: 0, seconds: 0, held: 0, end: [] as { id: string, released: boolean, heldMs: number }[] }
  const world = createWorld(opts.paused)
  const hold = useHold<string>({
    world,
    canStart: opts.canStart,
    start: (id) => { calls.start.push(id) },
    tick: (_id, dt, heldMs) => {
      calls.ticks += 1
      calls.seconds += dt
      calls.held = heldMs
    },
    end: (id, info) => { calls.end.push({ id, ...info }) },
  })
  return { hold, calls, world, olla: hold.bind('olla'), sarten: hold.bind('sarten') }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
})
afterEach(() => {
  realTime.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useHold', () => {
  it('mientras el dedo sigue, el tiempo de juego avanza; al levantarlo, termina como una decisión', () => {
    const { hold, calls, olla } = setup()
    olla.onPointerdown(ev(1))
    expect(calls.start).toEqual(['olla'])
    expect(hold.isHeld('olla')).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(calls.ticks).toBeGreaterThan(30)
    expect(calls.seconds).toBeCloseTo(1, 1)
    expect(calls.held).toBeCloseTo(1000, -2)
    olla.onPointerup(ev(1))
    expect(calls.end).toHaveLength(1)
    expect(calls.end[0]).toMatchObject({ id: 'olla', released: true })
    expect(calls.end[0]!.heldMs).toBeCloseTo(1000, -2)
    expect(hold.state.id).toBeNull()
    // Ya sin dedo, nada avanza.
    const ticks = calls.ticks
    vi.advanceTimersByTime(500)
    expect(calls.ticks).toBe(ticks)
  })

  it('un dedo a la vez: otro dedo no empieza otra pieza ni termina la que hay', () => {
    const { hold, calls, olla, sarten } = setup()
    olla.onPointerdown(ev(1))
    sarten.onPointerdown(ev(2))
    expect(calls.start).toEqual(['olla'])
    sarten.onPointerup(ev(2))
    olla.onPointerup(ev(2))
    expect(calls.end).toEqual([])
    expect(hold.state.id).toBe('olla')
    olla.onPointerup(ev(1))
    expect(calls.end).toHaveLength(1)
  })

  it('si la pieza no se puede mantener ahora, o no es el botón principal del ratón, no empieza', () => {
    let allowed = false
    const { calls, olla } = setup({ canStart: () => allowed })
    olla.onPointerdown(ev(1))
    expect(calls.start).toEqual([])
    allowed = true
    olla.onPointerdown(ev(1, 2, 'mouse'))
    expect(calls.start).toEqual([])
    olla.onPointerdown(ev(1, 0, 'mouse'))
    expect(calls.start).toEqual(['olla'])
  })

  it('un gesto que se corta no es levantar el dedo: termina sin decisión, y solo una vez', () => {
    for (const cut of ['cancel', 'lost', 'escena'] as const) {
      const { hold, calls, olla } = setup()
      olla.onPointerdown(ev(1))
      vi.advanceTimersByTime(200)
      if (cut === 'cancel') olla.onPointercancel(ev(1))
      else if (cut === 'lost') olla.onLostpointercapture(ev(1))
      else hold.cancel()
      expect(calls.end, cut).toHaveLength(1)
      expect(calls.end[0]!.released, cut).toBe(false)
      // Lo que llega después del corte no cuenta.
      olla.onPointerup(ev(1))
      olla.onLostpointercapture(ev(1))
      expect(calls.end, cut).toHaveLength(1)
    }
  })

  it('al levantar el dedo, la pérdida de la captura que sigue no lo termina otra vez', () => {
    const { calls, olla } = setup()
    olla.onPointerdown(ev(1))
    olla.onPointerup(ev(1))
    olla.onLostpointercapture(ev(1))
    expect(calls.end).toHaveLength(1)
    expect(calls.end[0]!.released).toBe(true)
  })

  it('con el tablero en pausa no avanza, y sigue al volver', () => {
    let paused = false
    const { calls, world, olla } = setup({ paused: () => paused })
    olla.onPointerdown(ev(1))
    vi.advanceTimersByTime(300)
    const before = calls.seconds
    paused = true
    vi.advanceTimersByTime(2000)
    expect(calls.seconds).toBeCloseTo(before, 1)
    paused = false
    world.resume()
    vi.advanceTimersByTime(300)
    expect(calls.seconds).toBeGreaterThan(before + 0.2)
  })

  it('con el teclado: mantener Espacio o Intro es mantener el dedo; la repetición de la tecla no cuenta', () => {
    const { hold, calls, olla } = setup()
    const down = key(' ')
    olla.onKeydown(down)
    expect(down.preventDefault).toHaveBeenCalled()
    olla.onKeydown(key(' ', true))
    olla.onKeydown(key('a'))
    expect(calls.start).toEqual(['olla'])
    vi.advanceTimersByTime(400)
    olla.onKeyup(key('a'))
    expect(hold.state.id).toBe('olla')
    olla.onKeyup(key(' '))
    expect(calls.end).toHaveLength(1)
    expect(calls.end[0]!.released).toBe(true)
    // Perder el foco con la tecla apretada corta el gesto.
    olla.onKeydown(key('Enter'))
    olla.onBlur()
    expect(calls.end).toHaveLength(2)
    expect(calls.end[1]!.released).toBe(false)
  })

  it('mantener el dedo no abre el menú del sistema', () => {
    const { olla } = setup()
    const event = { preventDefault: vi.fn() }
    olla.onContextmenu(event)
    expect(event.preventDefault).toHaveBeenCalled()
  })
})
