import { getCurrentScope, onScopeDispose, reactive, readonly } from 'vue'
import { boardPoint } from './board'
import type { Point } from './board'
import { haptic } from './engine/haptics'
import { playSound } from './engine/sound'
import type { SoundName } from './engine/sound'
import { SPRINGS, settled, stepSpring } from './engine/spring'
import { createVelocityTracker } from './engine/velocity'
import { realTime } from './engine/world'
import type { World } from './engine/world'
import { nearest, zoneAt } from './engine/zones'
import type { Zone } from './engine/zones'

// ---- Las piezas del tablero que se mueven: el gesto de arrastrar y soltar y el cambio de sitio, igual para todas las
// plantillas y con la física del motor (`engine/`). La plantilla dice qué se puede agarrar, dónde descansa cada pieza
// (`home`), qué zona queda debajo del dedo y qué pasa al soltar; esto se ocupa del resto, en coordenadas del tablero:
//   - Un dedo a la vez: mientras hay un arrastre, los demás dedos (o la palma) no lo tocan ni empiezan otro.
//   - Tocar o arrastrar: hasta pasar el umbral es un toque; el clic que sigue a un arrastre se descarta, así que el
//     toque llega por el clic (también con el teclado).
//   - La pieza nunca guarda dónde está: se dibuja en su casa más un desplazamiento, que siempre vuelve a cero con un
//     resorte. Al soltarla sigue con la velocidad que llevaba el dedo y frena hasta su casa; si la plantilla la cambió de
//     casa, sale del punto donde se soltó. Sobre una zona válida se posa: conserva solo parte de esa velocidad.
//     Agarrarla mientras vuelve la detiene donde está y sigue desde ahí.
//   - Cada pieza termina su vuelta por su cuenta: agarrar otra no la corta.
//   - Mientras se arrastra, va exactamente donde está el dedo. No se adelanta con la predicción del navegador
//     (`getPredictedEvents`): medida con un puntero a paso constante, variaba de un cuadro a otro y saltaba hacia atrás
//     al detenerse, y la pieza temblaba.
//   - Levantarla y posarla es gradual: sube sobre el dedo y baja con su propio resorte.
//   - Una pieza que cambia de sitio sin gesto (un toque la manda a su hueco) usa `shift`: llega igual, con el resorte.
//   - Un gesto que se corta (cancelado por el sistema, sin captura o con la escena bloqueada) vuelve igual.
//   - Si varias piezas se pisan (`pieces`), se agarra la que está más cerca del dedo, no la que quedó encima.
//   - Las zonas donde se puede soltar se declaran (`zones`, con su margen): el motor dice cuál queda bajo el dedo.
//   - Una zona puede no aceptar la pieza (`accepts`): entonces suena y vuelve como al soltarla fuera.
//   - Suena sola: al agarrarla, al soltarla en una zona, al soltarla fuera (vuelve) y al tocarla; y al llegar, si
//     quien la cambia de sitio lo pide. Agarrarla y soltarla en una zona además vibran, donde hay vibración.
//   - Corre en el tiempo de juego de la plantilla (`world`): con el tablero en pausa se queda quieto y sigue al volver.
//   - Todo termina siempre, aunque el navegador deje de pintar cuadros (el reloj del motor), y es inmediato con
//     movimiento reducido. ----

type Sample = Pick<PointerEvent, 'clientX' | 'clientY'> & { timeStamp?: number }

/** Lo que el gesto necesita de un evento de puntero. */
export type DragPointer = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY' | 'button' | 'pointerType'> & {
  currentTarget: EventTarget | null
  timeStamp?: number
  /** Todas las muestras que el navegador juntó en este evento (para la velocidad). */
  getCoalescedEvents?: () => Sample[]
}

export interface DragOptions<Id, Target> {
  /** El tablero: da las coordenadas del puntero. */
  layer: { value: Pick<HTMLElement, 'getBoundingClientRect'> | null }
  /** Dónde descansa la pieza, en el tablero. La escena manda: nunca se toma de dónde está la pieza al agarrarla. */
  home: (id: Id) => Point
  /** Si la pieza se puede agarrar ahora. */
  canStart?: (id: Id) => boolean
  /**
   * Las piezas que se pueden agarrar ahora. Si se pisan, al apoyar el dedo se elige la que tiene su `home` más cerca
   * (todas deben dar el mismo punto de sí mismas: su centro o su esquina), no la que quedó encima.
   */
  pieces?: () => readonly Id[]
  /** Las zonas donde se puede soltar la pieza ahora. Gana la más cercana al dedo, con `margin` de holgura. */
  zones?: (id: Id) => readonly Zone<Target>[]
  /** Cuánto se sale cada zona de su caja (el imán), en el tablero. */
  margin?: number
  /**
   * Si la zona de debajo acepta esta pieza (por defecto, sí). Si no la acepta, al soltarla suena y vuelve como fuera
   * de una zona; la plantilla se entera igual en `drop`, con la zona, para responder (un hueco que no es el suyo).
   */
  accepts?: (id: Id, target: Target) => boolean
  /** En vez de `zones`, para una forma que no sea una caja: la zona válida que queda bajo el dedo, o null. */
  targetAt?: (point: Point, id: Id) => Target | null
  /** Al apoyar el dedo sobre la pieza. */
  press?: (id: Id) => void
  /** Al pasar el umbral: empieza el arrastre. */
  start?: (id: Id) => void
  /** Al soltar después de arrastrar, con la zona de debajo (o null), el punto del dedo y el desplazamiento que llevaba. */
  drop?: (id: Id, target: Target | null, info: { point: Point, offset: Point }) => void
  /** Un toque sin arrastre (por el clic: también con el teclado). */
  tap?: (id: Id) => void
  /** La pieza quedó quieta en su casa después de un gesto. */
  settle?: (id: Id) => void
  /** Cuánto sube la pieza sobre el dedo al arrastrarla (negativo: hacia arriba). */
  lift?: number
  /** Distancia, en el tablero, que separa un toque de un arrastre. */
  threshold?: number
  /** Movimiento reducido: nada se desliza ni sube poco a poco; todo llega de una vez. */
  reduced?: boolean
  /** El tiempo de juego de la plantilla (`useWorld`): en pausa, las piezas se quedan quietas. Sin él, tiempo real. */
  world?: World
}

const ZERO: Readonly<Point> = Object.freeze({ x: 0, y: 0 })
const CLICK_AFTER_DRAG = 400
/** Sobre una zona válida la pieza se posa: conserva solo esta parte de la velocidad del dedo, para no pasarse de largo. */
const DROP_CARRY = 0.3

export function useDrag<Id extends string | number, Target = string>(options: DragOptions<Id, Target>) {
  const threshold = options.threshold ?? 10
  const lift = options.lift ?? 0
  const reduced = options.reduced ?? false
  const world = options.world ?? realTime
  // La zona bajo el dedo: de las declaradas o, si la plantilla la calcula, la suya.
  const targetAt = (point: Point, id: Id): Target | null => options.zones
    ? zoneAt(point, options.zones(id), options.margin ?? 0)
    : options.targetAt?.(point, id) ?? null

  // El gesto en curso: la pieza activa (apoyada, arrastrándose o volviendo de su gesto) y la zona que queda debajo.
  interface DragState { id: Id | null, dragging: boolean, over: Target | null }
  const state = reactive({ id: null, dragging: false, over: null }) as DragState

  // Cada pieza que no está quieta en su casa: su desplazamiento, cuánto está levantada (de 0 a 1) y, aparte, sus
  // velocidades. Una pieza en reposo no tiene entrada.
  interface Glide { x: number, y: number, lifted: number }
  const glides = reactive(new Map()) as Map<Id, Glide>
  const speeds = new Map<Id, Glide>()
  // Las que vuelven de un gesto: al quedar quietas se avisa a la plantilla (`settle`).
  const released = new Set<Id>()
  // Las que están cambiando de casa ahora mismo (`shift`).
  const shifting = new Set<Id>()
  // Lo que suena cuando una pieza que cambió de sitio llega al nuevo.
  const arrivals = new Map<Id, SoundName>()

  let pointer: number | null = null
  let origin: Point = { x: 0, y: 0 }
  let base: Point = { x: 0, y: 0 }
  let delta: Point = { x: 0, y: 0 }
  let last: Point = { x: 0, y: 0 }
  let fromRest = true
  let ignoreClicksUntil = 0
  // El último dedo apoyado: sobre qué pieza cayó y cuál se eligió. El toque (el clic que sigue) va a la elegida.
  let pressed: { handle: Id, chosen: Id } | null = null
  const tracker = createVelocityTracker()

  const now = () => performance.now()
  const stamp = (event: Sample) => event.timeStamp || now()
  // El puntero en el tablero: su caja se lee una vez por evento, también para todas sus muestras.
  function locate(): (event: Sample) => Point {
    const layer = options.layer.value
    return layer ? boardPoint(layer) : event => ({ x: event.clientX, y: event.clientY })
  }

  function touch(id: Id): Glide {
    if (!glides.has(id)) {
      glides.set(id, { x: 0, y: 0, lifted: 0 })
      speeds.set(id, { x: 0, y: 0, lifted: 0 })
    }
    return glides.get(id)!
  }

  // La pieza arrastrada: donde estaba al agarrarla, más lo que la lleva el dedo, más lo que sube según lo levantada.
  function follow(glide: Glide) {
    glide.x = base.x + delta.x
    glide.y = base.y + delta.y + lift * glide.lifted
  }

  // La pieza quedó quieta en su casa.
  function finish(id: Id) {
    glides.delete(id)
    speeds.delete(id)
    const arrival = arrivals.get(id)
    if (arrival) {
      arrivals.delete(id)
      playSound(arrival)
    }
    if (state.id === id && pointer === null) Object.assign(state, { id: null, dragging: false, over: null })
    if (released.delete(id)) options.settle?.(id)
  }

  // ---- El bucle: un paso de los resortes de cada pieza por cuadro, y solo mientras algo se mueve. ----
  let stopLoop: (() => void) | null = null
  const sleep = () => { stopLoop?.(); stopLoop = null }
  const wake = () => { if (!reduced && !stopLoop) stopLoop = world.onFrame(step) }
  if (getCurrentScope()) onScopeDispose(sleep)

  function step(dt: number) {
    const held = pointer !== null ? state.id : null
    const done: Id[] = []
    let moving = false
    for (const [id, glide] of glides) {
      const speed = speeds.get(id)!
      // Lo levantada que está: sube mientras se arrastra y baja al soltarla.
      const up = id === held && state.dragging ? 1 : 0
      if (glide.lifted !== up || speed.lifted !== 0) {
        const next = stepSpring(glide.lifted - up, speed.lifted, dt, SPRINGS.lift)
        if (settled(next.x, next.v, 0.004, 0.05)) { glide.lifted = up; speed.lifted = 0 }
        else { glide.lifted = up + next.x; speed.lifted = next.v; moving = true }
      }
      if (id === held) {
        // La lleva el dedo (o la tiene apoyada): no se desliza.
        if (state.dragging) follow(glide)
        continue
      }
      const x = stepSpring(glide.x, speed.x, dt, SPRINGS.settle)
      const y = stepSpring(glide.y, speed.y, dt, SPRINGS.settle)
      if (settled(Math.hypot(x.x, y.x), Math.hypot(x.v, y.v), 0.5, 20)) {
        Object.assign(glide, { x: 0, y: 0 })
        Object.assign(speed, { x: 0, y: 0 })
        if (glide.lifted === 0) done.push(id)
      }
      else {
        Object.assign(glide, { x: x.x, y: y.x })
        Object.assign(speed, { x: x.v, y: y.v })
        moving = true
      }
    }
    done.forEach(finish)
    if (!moving) sleep()
  }

  // Deja la pieza volver a su casa desde donde está y con la velocidad que lleva.
  function release(id: Id) {
    const glide = glides.get(id)
    const speed = speeds.get(id)
    const still = !glide || !speed || (Math.hypot(glide.x, glide.y) < 0.5 && glide.lifted === 0 && Math.hypot(speed.x, speed.y) < 20)
    if (reduced || still) { finish(id); return }
    wake()
  }

  /**
   * Cambia de casa una pieza (`change` mueve lo que `home` devuelve) sin que salte: sigue viéndose donde estaba y
   * llega a su casa nueva con el resorte. Con `arrive`, al llegar suena ese efecto. Con movimiento reducido, llega de
   * una vez.
   */
  function shift(id: Id, change: () => void, effects: { arrive?: SoundName } = {}) {
    // Dentro de otro cambio de la misma pieza (el de soltar), ese ya lo compensa y ya sonó.
    if (shifting.has(id)) { change(); return }
    const before = options.home(id)
    shifting.add(id)
    try { change() }
    finally { shifting.delete(id) }
    const after = options.home(id)
    const dx = before.x - after.x
    const dy = before.y - after.y
    if (reduced || (dx === 0 && dy === 0)) {
      if (effects.arrive && (dx !== 0 || dy !== 0)) playSound(effects.arrive)
      return
    }
    if (effects.arrive) arrivals.set(id, effects.arrive)
    const glide = touch(id)
    glide.x += dx
    glide.y += dy
    wake()
  }

  // Dónde se ve ahora una pieza: su casa más su desplazamiento.
  const shown = (id: Id): Point => {
    const home = options.home(id)
    const glide = glides.get(id)
    return glide ? { x: home.x + glide.x, y: home.y + glide.y } : home
  }

  function onDown(handle: Id, event: DragPointer) {
    if (pointer !== null) return // ya hay un dedo arrastrando
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const at = locate()(event)
    // De las que se pisan, la más cercana al dedo.
    const id = nearest(at, options.pieces?.() ?? [], shown) ?? handle
    pressed = { handle, chosen: id }
    if (options.canStart && !options.canStart(id)) return
    const glide = touch(id)
    // Agarrarla mientras vuelve la detiene donde está.
    Object.assign(speeds.get(id)!, { x: 0, y: 0 })
    released.delete(id)
    fromRest = Math.hypot(glide.x, glide.y) < 0.5 && glide.lifted === 0
    Object.assign(state, { id, dragging: false, over: null })
    pointer = event.pointerId
    origin = at
    last = origin
    delta = { x: 0, y: 0 }
    base = { x: glide.x, y: glide.y - lift * glide.lifted }
    tracker.reset()
    tracker.add(stamp(event), origin.x, origin.y)
    try { (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId) }
    catch { /* sin captura, el gesto se termina por cancelación */ }
    options.press?.(id)
  }

  function onMove(event: DragPointer) {
    if (event.pointerId !== pointer || state.id === null) return
    const id = state.id
    const at = locate()
    const p = at(event)
    const samples = event.getCoalescedEvents?.()
    if (samples?.length) samples.forEach((sample) => { const q = at(sample); tracker.add(stamp(sample), q.x, q.y) })
    else tracker.add(stamp(event), p.x, p.y)
    last = p
    const glide = touch(id)
    if (!state.dragging) {
      if (Math.hypot(p.x - origin.x, p.y - origin.y) < threshold) return
      state.dragging = true
      // Desde donde se ve ahora: si estaba posándose, no salta.
      base = { x: glide.x, y: glide.y - lift * glide.lifted }
      if (reduced) glide.lifted = 1
      haptic('grab')
      playSound('agarrar')
      options.start?.(id)
      wake()
    }
    delta = { x: p.x - origin.x, y: p.y - origin.y }
    follow(glide)
    state.over = targetAt(p, id)
  }

  function end(commit: boolean, event?: DragPointer) {
    const id = state.id
    if (id === null) return
    pointer = null
    const moved = state.dragging
    const p = event ? locate()(event) : last
    const glide = touch(id)
    state.dragging = false
    state.over = null
    if (moved || !commit) pressed = null
    if (moved || !fromRest) ignoreClicksUntil = now() + CLICK_AFTER_DRAG
    if (moved) {
      // Queda donde el dedo estaba al soltar.
      delta = { x: p.x - origin.x, y: p.y - origin.y }
      follow(glide)
    }
    if (moved && commit) {
      const velocity = reduced ? ZERO : tracker.velocity(event ? stamp(event) : now())
      const offset = { x: glide.x, y: glide.y }
      const target = targetAt(p, id)
      const taken = target !== null && (options.accepts?.(id, target) ?? true)
      if (taken) {
        haptic('drop')
        playSound('soltar')
      }
      else {
        playSound('volver')
      }
      // La plantilla puede cambiarla de casa: sale del punto donde se soltó.
      shift(id, () => options.drop?.(id, target, { point: p, offset }))
      if (state.id !== id || !glides.has(id)) return // la plantilla la terminó desde drop
      // Sin desplazamiento (la plantilla la dejó donde se soltó), no queda nada que deslizar ni levantado.
      if (Math.hypot(glide.x, glide.y) < 0.5) {
        released.add(id)
        finish(id)
        return
      }
      const carry = taken ? DROP_CARRY : 1
      Object.assign(speeds.get(id)!, { x: velocity.x * carry, y: velocity.y * carry })
    }
    released.add(id)
    release(id)
  }

  /** Los manejadores de una pieza, para `v-bind`. */
  function bind(id: Id) {
    return {
      onPointerdown: (event: PointerEvent) => onDown(id, event),
      onPointermove: (event: PointerEvent) => onMove(event),
      // El gesto es de un dedo: sus eventos llegan a la pieza sobre la que cayó, aunque se haya elegido otra.
      onPointerup: (event: PointerEvent) => { if (event.pointerId === pointer) end(true, event) },
      onPointercancel: (event: PointerEvent) => { if (event.pointerId === pointer) end(false, event) },
      onLostpointercapture: (event: PointerEvent) => { if (event.pointerId === pointer) end(false) },
      onClick: () => {
        // Con el dedo, el toque va a la pieza elegida al apoyarlo; con el teclado, a esta.
        const chosen = pressed?.handle === id ? pressed.chosen : id
        pressed = null
        if (now() < ignoreClicksUntil || (state.id !== null && state.id !== chosen)) return
        playSound('tocar')
        options.tap?.(chosen)
      },
    }
  }

  /** Corta el gesto en curso (la escena se bloqueó, cambió de fase…): la pieza vuelve a su casa. */
  function cancel() {
    if (pointer !== null) end(false)
  }

  return {
    state: readonly(state) as Readonly<DragState>,
    bind,
    cancel,
    shift,
    /** Lo que se desplaza la pieza sobre su casa (cero si está quieta en ella). */
    offsetOf: (id: Id): Readonly<Point> => {
      const glide = glides.get(id)
      return glide ? { x: glide.x, y: glide.y } : ZERO
    },
    /** Cuánto está levantada, de 0 a 1: sube al arrastrarla y baja al soltarla. */
    liftedOf: (id: Id) => glides.get(id)?.lifted ?? 0,
    /** La pieza está en un gesto o moviéndose hacia su casa. */
    isActive: (id: Id) => state.id === id || glides.has(id),
    isDragging: (id: Id) => state.id === id && state.dragging,
    /** Hay un gesto en curso o alguna pieza todavía moviéndose. */
    busy: () => state.id !== null || glides.size > 0,
  }
}
