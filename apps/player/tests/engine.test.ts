import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allAsleep, createBody, push, simulate, stepPhysics } from '~/runner/engine/physics'
import type { Body, PhysicsOptions } from '~/runner/engine/physics'
import { LIBRARY_SFX, librarySfx } from '~/runner/content'
import { createSustain, cueInterface, cueSound, loadSound, playSound, SCALE, soundLength, SOUNDS } from '~/runner/engine/sound'
import type { Recipe } from '~/runner/engine/sound'
import { SPRINGS, settled, stepSpring } from '~/runner/engine/spring'
import { onFrame } from '~/runner/engine/ticker'
import { createVelocityTracker } from '~/runner/engine/velocity'
import { createWobble } from '~/runner/engine/wobble'
import { createWorld } from '~/runner/engine/world'
import { nearest, zoneAt } from '~/runner/engine/zones'

// El motor del tablero (app/runner/engine): el resorte, la velocidad del dedo, el reloj, el tiempo de juego, las zonas
// la física libre, el sonido y el temblor.

describe('el resorte', () => {
  const run = (x: number, v: number, seconds: number, spring = SPRINGS.settle, dt = 1 / 60) => {
    let state = { x, v }
    for (let t = 0; t < seconds - 1e-9; t += dt) state = stepSpring(state.x, state.v, dt, spring)
    return state
  }

  it('llega a su sitio y se queda quieto', () => {
    const end = run(200, 0, 1)
    expect(settled(end.x, end.v, 0.5, 20)).toBe(true)
  })

  it('es exacto: da lo mismo un paso largo que muchos cortos', () => {
    for (const spring of [SPRINGS.settle, SPRINGS.lift, { response: 0.4, damping: 1.6 }]) {
      const once = stepSpring(200, -300, 0.1, spring)
      const many = run(200, -300, 0.1, spring, 0.001)
      expect(once.x).toBeCloseTo(many.x, 6)
      expect(once.v).toBeCloseTo(many.v, 4)
    }
  })

  it('parte de la velocidad que ya lleva: lanzada hacia fuera sigue un poco antes de volver', () => {
    const next = stepSpring(100, 1500, 1 / 60, SPRINGS.settle)
    expect(next.x).toBeGreaterThan(100)
    expect(run(100, 1500, 1).x).toBeCloseTo(0, 1)
  })

  it('amortiguado del todo no se pasa; con menos, se pasa un poco y vuelve', () => {
    let lowest = Infinity
    let state = { x: 100, v: 0 }
    for (let i = 0; i < 120; i += 1) { state = stepSpring(state.x, state.v, 1 / 60, SPRINGS.lift); lowest = Math.min(lowest, state.x) }
    expect(lowest).toBeGreaterThanOrEqual(0)

    lowest = Infinity
    state = { x: 100, v: 0 }
    for (let i = 0; i < 120; i += 1) { state = stepSpring(state.x, state.v, 1 / 60, { response: 0.3, damping: 0.5 }); lowest = Math.min(lowest, state.x) }
    expect(lowest).toBeLessThan(0)
  })

  it('el de las piezas no rebota a la vista: se pasa menos de un punto de cada cien', () => {
    let lowest = Infinity
    let state = { x: 100, v: 0 }
    for (let i = 0; i < 120; i += 1) { state = stepSpring(state.x, state.v, 1 / 60, SPRINGS.settle); lowest = Math.min(lowest, state.x) }
    expect(lowest).toBeGreaterThan(-1)
  })
})

describe('la velocidad del dedo', () => {
  it('mide un movimiento constante', () => {
    const tracker = createVelocityTracker()
    for (let i = 0; i <= 6; i += 1) tracker.add(i * 16, i * 8, i * -4) // 500 y -250 por segundo
    const v = tracker.velocity(96)
    expect(v.x).toBeCloseTo(500, 0)
    expect(v.y).toBeCloseTo(-250, 0)
  })

  it('una muestra con ruido no la dispara', () => {
    const tracker = createVelocityTracker()
    for (let i = 0; i <= 6; i += 1) tracker.add(i * 16, i * 8 + (i === 6 ? 6 : 0), 0)
    const v = tracker.velocity(96)
    expect(v.x).toBeGreaterThan(500)
    expect(v.x).toBeLessThan(700) // con solo las dos últimas saldría 875
  })

  it('es cero si el dedo ya estaba quieto, sin muestras o con una sola', () => {
    const tracker = createVelocityTracker()
    expect(tracker.velocity(0)).toEqual({ x: 0, y: 0 })
    tracker.add(0, 0, 0)
    expect(tracker.velocity(0)).toEqual({ x: 0, y: 0 })
    tracker.add(16, 50, 0)
    expect(tracker.velocity(16).x).toBeGreaterThan(0)
    expect(tracker.velocity(100)).toEqual({ x: 0, y: 0 })
  })

  it('solo cuenta lo reciente y tiene un tope', () => {
    const tracker = createVelocityTracker()
    tracker.add(0, 0, 0)
    tracker.add(16, 400, 0) // un tirón viejo
    for (let i = 0; i <= 6; i += 1) tracker.add(300 + i * 16, 400 + i * 2, 0)
    expect(tracker.velocity(396).x).toBeCloseTo(125, 0)

    const fast = createVelocityTracker()
    fast.add(0, 0, 0)
    fast.add(16, 400, 300)
    expect(Math.hypot(fast.velocity(16).x, fast.velocity(16).y)).toBeCloseTo(3000, 0)
  })
})

describe('el reloj', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
    vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('da a cada suscriptor el tiempo real de cada cuadro y se para al quedarse sin nadie', () => {
    const seen: number[] = []
    const stop = onFrame(dt => seen.push(dt))
    vi.advanceTimersByTime(48)
    expect(seen).toHaveLength(3)
    seen.forEach(dt => expect(dt).toBeCloseTo(0.016, 3))
    stop()
    vi.advanceTimersByTime(400)
    expect(seen).toHaveLength(3)
  })

  it('un solo bucle para todos, y quien se va deja de recibir cuadros', () => {
    const calls = { a: 0, b: 0 }
    const stopA = onFrame(() => { calls.a += 1 })
    const stopB = onFrame(() => { calls.b += 1 })
    vi.advanceTimersByTime(32)
    stopA()
    vi.advanceTimersByTime(32)
    stopB()
    expect(calls.a).toBeLessThan(calls.b)
    expect(calls.b).toBeGreaterThanOrEqual(3)
  })

  it('sin cuadros (pestaña en segundo plano) avanza por temporizador con el tiempo que pasó', () => {
    vi.stubGlobal('requestAnimationFrame', () => 0)
    const seen: number[] = []
    const stop = onFrame(dt => seen.push(dt))
    vi.advanceTimersByTime(450)
    stop()
    expect(seen).toHaveLength(2)
    expect(seen[0]).toBeCloseTo(0.2, 2)
  })
})

describe('el tiempo de juego', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
    vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('una espera vence a su tiempo y una repetición, cada vez', () => {
    const world = createWorld()
    const calls = { once: 0, many: 0 }
    world.after(300, () => { calls.once += 1 })
    world.every(100, () => { calls.many += 1 })
    vi.advanceTimersByTime(250)
    expect(calls.once).toBe(0)
    expect(calls.many).toBe(2)
    vi.advanceTimersByTime(100)
    expect(calls.once).toBe(1)
    vi.advanceTimersByTime(700)
    expect(calls.once).toBe(1)
    expect(calls.many).toBeGreaterThanOrEqual(9)
    world.clear()
  })

  it('en pausa el tiempo no corre: nada avanza ni vence, y al volver sigue desde donde estaba', () => {
    let paused = false
    const world = createWorld(() => paused)
    const ks: number[] = []
    const done = vi.fn()
    const later = vi.fn()
    world.tween(400, k => ks.push(k), done)
    world.after(300, later)
    vi.advanceTimersByTime(160)
    const before = ks.at(-1)!
    expect(before).toBeGreaterThan(0.3)
    paused = true
    vi.advanceTimersByTime(5000)
    expect(ks.at(-1)).toBeCloseTo(before, 1)
    expect(world.now()).toBeLessThan(200)
    expect(later).not.toHaveBeenCalled()
    expect(done).not.toHaveBeenCalled()
    paused = false
    world.resume()
    vi.advanceTimersByTime(180)
    expect(later).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(120)
    expect(ks.at(-1)).toBe(1)
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('una animación parada no termina, una de 0 ms termina de una vez y lo cancelado no vence', () => {
    const world = createWorld()
    const done = vi.fn()
    const stop = world.tween(300, () => {}, done)
    vi.advanceTimersByTime(100)
    stop()
    vi.advanceTimersByTime(500)
    expect(done).not.toHaveBeenCalled()

    const step = vi.fn()
    world.tween(0, step, done)
    expect(step).toHaveBeenCalledWith(1)
    expect(done).toHaveBeenCalledTimes(1)

    const later = vi.fn()
    world.after(100, later)()
    vi.advanceTimersByTime(300)
    expect(later).not.toHaveBeenCalled()
  })

  it('sin cuadros (pestaña en segundo plano), todo llega a su final igual', () => {
    vi.stubGlobal('requestAnimationFrame', () => 0)
    const world = createWorld()
    const step = vi.fn()
    const done = vi.fn()
    world.tween(300, step, done)
    vi.advanceTimersByTime(430)
    expect(step).toHaveBeenLastCalledWith(1)
    expect(done).toHaveBeenCalledTimes(1)
  })
})

describe('las zonas', () => {
  const zones = [{ id: 'a', x: 100, y: 100, w: 200, h: 100 }, { id: 'b', x: 340, y: 100, w: 200, h: 100 }]

  it('da la zona bajo el punto y ninguna fuera', () => {
    expect(zoneAt({ x: 150, y: 150 }, zones)).toBe('a')
    expect(zoneAt({ x: 500, y: 120 }, zones)).toBe('b')
    expect(zoneAt({ x: 320, y: 150 }, zones)).toBe(null)
    expect(zoneAt({ x: 150, y: 250 }, zones)).toBe(null)
  })

  it('con margen atrae desde fuera y, entre dos, gana la más cercana', () => {
    expect(zoneAt({ x: 150, y: 230 }, zones, 40)).toBe('a')
    expect(zoneAt({ x: 315, y: 150 }, zones, 40)).toBe('a')
    expect(zoneAt({ x: 325, y: 150 }, zones, 40)).toBe('b')
  })

  it('nearest: la pieza más cercana al dedo, hasta su alcance', () => {
    const eggs = [{ key: 0, x: 447, y: 455 }, { key: 1, x: 403, y: 453 }]
    const at = (egg: typeof eggs[number]) => egg
    expect(nearest({ x: 400, y: 450 }, eggs, at)?.key).toBe(1)
    expect(nearest({ x: 440, y: 450 }, eggs, at)?.key).toBe(0)
    expect(nearest({ x: 900, y: 100 }, eggs, at, 80)).toBe(null)
    expect(nearest({ x: 0, y: 0 }, [], at)).toBe(null)
  })
})

describe('la física libre', () => {
  const run = (bodies: Body[], seconds: number, options: PhysicsOptions, dt = 1 / 60) => {
    for (let t = 0; t < seconds - 1e-9; t += dt) stepPhysics(bodies, dt, options)
  }

  it('cae con la gravedad: la mitad de g por el tiempo al cuadrado', () => {
    const ball = createBody({ x: 0, y: 0, r: 10 })
    run([ball], 0.5, { gravity: 1000 })
    expect(ball.y).toBeGreaterThan(120)
    expect(ball.y).toBeLessThan(130) // 125 exactos; el paso fijo se queda a un punto
    expect(ball.vy).toBeCloseTo(500, 0)
  })

  it('da lo mismo con cuadros lentos que rápidos: el paso es fijo', () => {
    const fast = createBody({ x: 0, y: 0, r: 10 })
    const slow = createBody({ x: 0, y: 0, r: 10 })
    run([fast], 0.5, { gravity: 1000 }, 1 / 120)
    run([slow], 0.5, { gravity: 1000 }, 1 / 20)
    expect(slow.y).toBeCloseTo(fast.y, 6)
  })

  it('rebota en el suelo según cuánto rebota, y acaba quieta y dormida sobre él', () => {
    const bounds = { x: 0, y: 0, w: 400, h: 300 }
    const ball = createBody({ x: 200, y: 100, r: 20, bounce: 0.5 })
    let highest = 300
    let bounced = false
    for (let i = 0; i < 240; i += 1) {
      stepPhysics([ball], 1 / 60, { gravity: 1500, bounds })
      if (ball.vy < 0) bounced = true // ya va hacia arriba
      if (bounced) highest = Math.min(highest, ball.y)
    }
    // Cayó 180 hasta el suelo; con rebote 0,5 sube un cuarto: hasta unos 235.
    expect(highest).toBeGreaterThan(225)
    expect(highest).toBeLessThan(245)
    run([ball], 3, { gravity: 1500, bounds })
    expect(ball.y).toBe(280)
    expect(ball.vy).toBe(0)
    expect(ball.asleep).toBe(true)
    expect(allAsleep([ball])).toBe(true)
  })

  it('nada sale de los bordes y el suelo frena lo que rueda', () => {
    const bounds = { x: 0, y: 0, w: 400, h: 300 }
    const ball = createBody({ x: 50, y: 280, r: 20, vx: 900, bounce: 0.6 })
    for (let i = 0; i < 600; i += 1) {
      stepPhysics([ball], 1 / 60, { gravity: 1500, bounds })
      expect(ball.x).toBeGreaterThanOrEqual(20)
      expect(ball.x).toBeLessThanOrEqual(380)
      expect(ball.y).toBeLessThanOrEqual(280)
    }
    expect(ball.vx).toBe(0)
    expect(ball.asleep).toBe(true)
  })

  it('dos iguales que chocan de frente se devuelven la velocidad y no se pisan', () => {
    const a = createBody({ x: 0, y: 0, r: 10, vx: 200, bounce: 1 })
    const b = createBody({ x: 100, y: 0, r: 10, vx: -200, bounce: 1 })
    run([a, b], 0.5, {})
    expect(a.vx).toBeCloseTo(-200, 3)
    expect(b.vx).toBeCloseTo(200, 3)
    expect(b.x - a.x).toBeGreaterThanOrEqual(20)
  })

  it('el que pesa más empuja más, y uno fijo no se mueve', () => {
    const heavy = createBody({ x: 0, y: 0, r: 10, vx: 200, mass: 4, bounce: 1 })
    const light = createBody({ x: 60, y: 0, r: 10, bounce: 1 })
    run([heavy, light], 0.4, {})
    expect(light.vx).toBeGreaterThan(200)
    expect(heavy.vx).toBeGreaterThan(0)

    const wall = createBody({ x: 100, y: 0, r: 10, fixed: true })
    const ball = createBody({ x: 0, y: 0, r: 10, vx: 300, bounce: 0.5 })
    run([ball, wall], 0.5, {})
    expect(wall.x).toBe(100)
    expect(ball.vx).toBeLessThan(0)
  })

  it('uno cae sobre otro y los dos acaban quietos, sin pisarse; un empujón lo despierta', () => {
    const bounds = { x: 0, y: 0, w: 400, h: 300 }
    const lower = createBody({ x: 200, y: 280, r: 20, bounce: 0.2 })
    const upper = createBody({ x: 200, y: 100, r: 20, bounce: 0.2 })
    run([lower, upper], 4, { gravity: 1500, bounds })
    expect(allAsleep([lower, upper])).toBe(true)
    expect(lower.y - upper.y).toBeGreaterThanOrEqual(39.9)
    push(upper, 300, -400)
    expect(upper.asleep).toBe(false)
    stepPhysics([lower, upper], 1 / 60, { gravity: 1500, bounds })
    expect(upper.x).toBeGreaterThan(200)
  })

  it('el aire lo frena, y sin gravedad lo que queda quieto se duerme', () => {
    const puck = createBody({ x: 0, y: 0, r: 10, vx: 400, drag: 3 })
    run([puck], 1, {})
    expect(puck.vx).toBeGreaterThan(0)
    expect(puck.vx).toBeLessThan(40)
    run([puck], 3, {})
    expect(puck.asleep).toBe(true)
  })

  it('simulate: avanza en el tiempo de un mundo, dibuja en cada cuadro y se detiene cuando todo descansa', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
    vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
    const world = createWorld()
    const ball = createBody({ x: 100, y: 100, r: 20 })
    let paints = 0
    const sim = simulate(world, [ball], { gravity: 1500, bounds: { x: 0, y: 0, w: 400, h: 300 } }, () => { paints += 1 })
    vi.advanceTimersByTime(5000)
    expect(ball.asleep).toBe(true)
    const settledAt = paints
    vi.advanceTimersByTime(1000)
    expect(paints).toBe(settledAt) // ya no hay bucle
    push(ball, 0, -600)
    sim.wake()
    vi.advanceTimersByTime(100)
    expect(paints).toBeGreaterThan(settledAt)
    sim.stop()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
})

describe('el sonido', () => {
  const layers = (name: keyof typeof SOUNDS) => SOUNDS[name].layers as Recipe['layers']
  const tones = (name: keyof typeof SOUNDS) => layers(name).flatMap(layer => ('tone' in layer ? [layer] : []))
  // Las notas de una respuesta, en el orden en que suenan: la más grave de cada instante.
  const melody = (name: keyof typeof SOUNDS) => {
    const byTime = new Map<number, number>()
    for (const layer of tones(name)) byTime.set(layer.at ?? 0, Math.min(byTime.get(layer.at ?? 0) ?? Infinity, layer.tone))
    return [...byTime.entries()].sort((a, b) => a[0] - b[0]).map(([, tone]) => Math.round(tone))
  }

  it('un efecto que no está en la librería no suena ni rompe nada', async () => {
    await expect(loadSound('no-existe')).resolves.toBeUndefined()
    expect(() => playSound('no-existe', { volume: 0.5, vary: 0.1 })).not.toThrow()
  })

  it('los sonidos del motor se generan: ninguno es un archivo, y la librería no trae grabaciones', () => {
    for (const name of Object.keys(SOUNDS)) expect(librarySfx(name), name).toBeUndefined()
    expect(LIBRARY_SFX).toEqual([])
  })

  it('cada receta es corta, cabe en el volumen y solo usa tonos suaves', () => {
    for (const [name, recipe] of Object.entries(SOUNDS) as [string, Recipe][]) {
      expect(recipe.layers.length, name).toBeGreaterThan(0)
      expect(soundLength(recipe), name).toBeLessThan(1.3)
      expect(recipe.volume, name).toBeLessThanOrEqual(0.7)
      for (const layer of recipe.layers) {
        expect(layer.gain, name).toBeLessThanOrEqual(1)
        expect(layer.decay, name).toBeGreaterThan(0)
        if ('tone' in layer) {
          // Ni ondas cuadradas ni de sierra (suenan a máquina), y dentro de lo que un altavoz pequeño da bien.
          expect(layer.wave ?? 'sine', name).toBe('sine')
          expect(layer.tone, name).toBeGreaterThanOrEqual(90)
          expect(layer.tone, name).toBeLessThanOrEqual(4300)
          // Un tono que se desliza lo hace en un instante: nada de barridos largos.
          if (layer.to) expect(layer.glide ?? layer.decay, name).toBeLessThanOrEqual(0.12)
        }
      }
    }
  })

  it('el tono sigue al gesto: tomar sube, dejar baja y el toque que hace saltar, sube', () => {
    const glide = (name: keyof typeof SOUNDS) => tones(name)[0]!
    expect(glide('agarrar').to!).toBeGreaterThan(glide('agarrar').tone)
    expect(glide('soltar').to!).toBeLessThan(glide('soltar').tone)
    expect(glide('tocar').to!).toBeGreaterThan(glide('tocar').tone)
  })

  it('lo que va bien sube y lo que no, baja: las notas de cada respuesta', () => {
    const rising = (notes: number[]) => notes.every((note, i) => i === 0 || note > notes[i - 1]!)
    expect(melody('aviso')).toHaveLength(2)
    expect(rising(melody('aviso'))).toBe(true)
    expect(melody('acierto').length).toBeGreaterThanOrEqual(3)
    expect(rising(melody('acierto'))).toBe(true)
    expect(rising(melody('completar'))).toBe(true)
    // El cierre recorre el acorde entero: acaba una octava por encima de donde empezó.
    expect(melody('completar').at(-1)! / melody('completar')[0]!).toBeCloseTo(2, 1)
    const retry = melody('reintento')
    expect(retry).toHaveLength(2)
    expect(retry[1]!).toBeLessThan(retry[0]!)
    // «Otra vez» es más grave que cualquier acierto.
    expect(Math.max(...retry)).toBeLessThan(Math.min(...melody('acierto')))
  })

  it('la respuesta tiene capas: la hoja que sube (un soplo) y lo que dice (sus notas)', () => {
    for (const name of ['aviso', 'acierto', 'reintento'] as const) {
      expect(layers(name).some(layer => 'noise' in layer && (layer.at ?? 0) === 0 && layer.decay > 0.05), name).toBe(true)
      expect(tones(name).length, name).toBeGreaterThanOrEqual(4)
    }
  })

  it('la racha sube por la escala, empezando en la nota de siempre', () => {
    expect(SCALE[0]).toBe(1)
    expect(SCALE.every((step, i) => i === 0 || step > SCALE[i - 1]!)).toBe(true)
    expect(SCALE.at(-1)).toBe(2)
  })

  it('los controles de la interfaz no suenan como las piezas: unos son toques sin tono; las otras, burbujas con tono', () => {
    for (const name of ['pulsar', 'abrir', 'cerrar'] as const) expect(tones(name), name).toHaveLength(0)
    for (const name of ['tocar', 'agarrar', 'soltar'] as const) expect(tones(name).length, name).toBeGreaterThan(0)
  })

  it('pasar de escena no tiene sonido, y descubrir es la carta que se voltea: su soplo y un golpe grave al caer', () => {
    expect(Object.keys(SOUNDS)).not.toContain('pasar')
    expect(tones('destapar').some(layer => layer.tone < 200 && (layer.at ?? 0) > 0.1)).toBe(true)
    expect(layers('destapar').some(layer => 'noise' in layer)).toBe(true)
  })

  it('pulsar la interfaz es más corto que cualquier respuesta del juego, y completar, la más larga', () => {
    for (const name of ['aviso', 'acierto', 'reintento', 'completar'] as const) expect(soundLength(SOUNDS.pulsar)).toBeLessThan(soundLength(SOUNDS[name]) / 4)
    expect(soundLength(SOUNDS.completar)).toBeGreaterThan(soundLength(SOUNDS.acierto))
  })

  it('de las respuestas pedidas a la vez suena solo la que más pesa, con lo suyo, y cada tanda por separado', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const heard: [string, number | undefined][] = []
    const play = (name: string, options?: { rate?: number }) => { heard.push([name, options?.rate]) }
    cueSound('acierto', { rate: SCALE[2] }, play)
    cueSound('completar', undefined, play)
    cueSound('aviso', undefined, play)
    expect(heard).toEqual([])
    vi.advanceTimersByTime(100)
    expect(heard).toEqual([['completar', undefined]])
    cueSound('reintento', undefined, play)
    vi.advanceTimersByTime(100)
    cueSound('aviso', undefined, play)
    cueSound('acierto', { rate: SCALE[1] }, play) // el segundo acierto seguido, un paso más arriba
    vi.advanceTimersByTime(100)
    expect(heard).toEqual([['completar', undefined], ['reintento', undefined], ['acierto', 9 / 8]])
    vi.useRealTimers()
  })

  it('una interacción de la interfaz suena una vez: pulsar un botón que despliega o recoge algo suena solo a eso', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const heard: string[] = []
    const play = (name: string) => { heard.push(name) }
    cueInterface('pulsar', undefined, play)
    vi.advanceTimersByTime(60)
    cueInterface('pulsar', undefined, play)
    cueInterface('abrir', undefined, play)
    vi.advanceTimersByTime(60)
    cueInterface('pulsar', undefined, play)
    cueInterface('cerrar', undefined, play)
    vi.advanceTimersByTime(60)
    expect(heard).toEqual(['pulsar', 'abrir', 'cerrar'])
    vi.useRealTimers()
  })
})

describe('el sonido de lo que tarda', () => {
  const layers = (name: keyof typeof SOUNDS) => SOUNDS[name].layers as Recipe['layers']
  const tones = (name: keyof typeof SOUNDS) => layers(name).flatMap(layer => ('tone' in layer ? [layer] : []))

  // Los granos que suenan en `seconds` con el avance fijo en `k`, a 60 cuadros por segundo.
  function grains(k: number, seconds: number) {
    const heard: number[] = []
    const sustain = createSustain('cocer', {}, (_name, options) => { heard.push(options?.rate ?? 1) })
    for (let t = 0; t < seconds; t += 1 / 60) sustain.tick(1 / 60, k)
    return heard
  }

  beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5) })
  afterEach(() => { vi.restoreAllMocks() })

  it('mientras dura el gesto suenan granos; cerca del final, más seguidos y más agudos', () => {
    const start = grains(0, 3)
    const end = grains(1, 3)
    expect(start.length).toBeGreaterThan(5)
    expect(end.length).toBeGreaterThan(start.length * 2)
    expect(new Set(start)).toEqual(new Set([1]))
    expect(end[0]).toBeGreaterThan(1.4)
  })

  it('el primer grano suena al empezar, y al volver a empezar también', () => {
    const heard: number[] = []
    const sustain = createSustain('cocer', {}, () => { heard.push(1) })
    sustain.tick(1 / 60, 0)
    expect(heard).toHaveLength(1)
    sustain.tick(1 / 60, 0)
    expect(heard).toHaveLength(1)
    sustain.reset()
    sustain.tick(1 / 60, 0)
    expect(heard).toHaveLength(2)
  })

  it('el avance se toma entre 0 y 1: nunca suena más agudo que al final', () => {
    expect(grains(3, 1)[0]).toBe(grains(1, 1)[0])
    expect(grains(-1, 1)[0]).toBe(1)
  })

  it('el grano es una burbuja pequeña, más corta y más baja que tomar una pieza; «listo», dos campanas que suben', () => {
    const grain = tones('cocer')[0]!
    expect(grain.to!).toBeGreaterThan(grain.tone)
    expect(soundLength(SOUNDS.cocer)).toBeLessThan(soundLength(SOUNDS.agarrar))
    expect(SOUNDS.cocer.volume).toBeLessThan(SOUNDS.agarrar.volume / 2)
    const notes = [...new Set(tones('listo').map(layer => layer.at ?? 0))].map(at => Math.min(...tones('listo').filter(layer => (layer.at ?? 0) === at).map(layer => layer.tone)))
    expect(notes).toHaveLength(2)
    expect(notes[1]!).toBeGreaterThan(notes[0]!)
    // Es una campanilla, no una hoja: no lleva el soplo de la respuesta del juego.
    expect(layers('listo').some(layer => 'noise' in layer && layer.decay > 0.05)).toBe(false)
  })
})

describe('el temblor', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16))
    vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('un empujón lo aparta, se pasa al otro lado y vuelve a su forma, donde se queda quieto', () => {
    const seen: number[] = []
    const wobble = createWobble(createWorld(), (x) => { seen.push(x) })
    wobble.kick(1)
    expect(wobble.moving()).toBe(true)
    vi.advanceTimersByTime(4000)
    expect(Math.max(...seen)).toBeGreaterThan(0.4)
    expect(Math.max(...seen)).toBeLessThan(1.2)
    expect(Math.min(...seen)).toBeLessThan(-0.2)
    expect(seen.at(-1)).toBe(0)
    expect(wobble.moving()).toBe(false)
    // Quieto, ya no pinta.
    const painted = seen.length
    vi.advanceTimersByTime(500)
    expect(seen.length).toBe(painted)
  })

  it('un empujón sobre otro se suma', () => {
    const one: number[] = []
    const two: number[] = []
    const a = createWobble(createWorld(), (x) => { one.push(x) })
    const b = createWobble(createWorld(), (x) => { two.push(x) })
    a.kick(1)
    b.kick(1)
    b.kick(1)
    vi.advanceTimersByTime(2000)
    expect(Math.max(...two)).toBeGreaterThan(Math.max(...one) * 1.6)
  })

  it('en pausa se queda como está y sigue al volver; `still` lo deja en su forma', () => {
    let paused = false
    const seen: number[] = []
    const world = createWorld(() => paused)
    const wobble = createWobble(world, (x) => { seen.push(x) })
    wobble.kick(1)
    vi.advanceTimersByTime(60)
    paused = true
    vi.advanceTimersByTime(40)
    const frozen = seen.length
    vi.advanceTimersByTime(1000)
    expect(seen.length).toBe(frozen)
    paused = false
    world.resume()
    vi.advanceTimersByTime(60)
    expect(seen.length).toBeGreaterThan(frozen)
    wobble.still()
    expect(seen.at(-1)).toBe(0)
    expect(wobble.moving()).toBe(false)
  })
})
