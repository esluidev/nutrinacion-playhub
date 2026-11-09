import { getCurrentScope, onScopeDispose, reactive, readonly } from 'vue'
import { toBoard } from './board'

// ---- Arrastrar y soltar en el tablero: el gesto, igual para todas las plantillas. La plantilla dice qué se puede
// agarrar, dónde descansa cada pieza (`home`), qué zona queda debajo del dedo y qué pasa al soltar; esto se ocupa del
// resto, en coordenadas del tablero:
//   - Un dedo a la vez: mientras hay un arrastre, los demás dedos (o la palma) no lo tocan ni empiezan otro.
//   - Tocar o arrastrar: hasta pasar el umbral es un toque; el clic que sigue a un arrastre se descarta, así que el
//     toque llega por el clic (también con el teclado).
//   - La pieza nunca guarda dónde está: se dibuja en su casa más un desplazamiento, que siempre vuelve a cero. Al
//     soltar, si la plantilla la mueve de casa, el desplazamiento se recalcula para que salga del punto donde se soltó;
//     si no, vuelve a su casa deslizándose. Agarrarla mientras vuelve la detiene donde está y sigue desde ahí.
//   - Un gesto que se corta (cancelado por el sistema, sin captura o con la escena bloqueada) vuelve igual.
//   - La vuelta termina siempre, aunque el navegador deje de pintar cuadros, y es inmediata con movimiento reducido. ----

export interface Point { x: number, y: number }

/** Lo que el gesto necesita de un evento de puntero. */
export type DragPointer = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY' | 'button' | 'pointerType'> & {
  currentTarget: EventTarget | null
}

export interface DragOptions<Id, Target> {
  /** El tablero: da las coordenadas del puntero. */
  layer: { value: Pick<HTMLElement, 'getBoundingClientRect'> | null }
  /** Dónde descansa la pieza, en el tablero. La escena manda: nunca se toma de dónde está la pieza al agarrarla. */
  home: (id: Id) => Point
  /** Si la pieza se puede agarrar ahora. */
  canStart?: (id: Id) => boolean
  /** La zona válida que queda bajo el dedo, o null. */
  targetAt?: (point: Point, id: Id) => Target | null
  /** Al apoyar el dedo sobre la pieza. */
  press?: (id: Id) => void
  /** Al pasar el umbral: empieza el arrastre. */
  start?: (id: Id) => void
  /** Al soltar después de arrastrar, con la zona de debajo (o null), el punto del dedo y el desplazamiento que llevaba. */
  drop?: (id: Id, target: Target | null, info: { point: Point, offset: Point }) => void
  /** Un toque sin arrastre (por el clic: también con el teclado). */
  tap?: (id: Id) => void
  /** La pieza quedó quieta en su casa. */
  settle?: (id: Id) => void
  /** Cuánto sube la pieza sobre el dedo al empezar a arrastrarla (negativo: hacia arriba). */
  lift?: number
  /** Distancia, en el tablero, que separa un toque de un arrastre. */
  threshold?: number
  /** Duración de la vuelta a casa; 0 con movimiento reducido. */
  returnMs?: number
}

const ZERO: Readonly<Point> = Object.freeze({ x: 0, y: 0 })
const CLICK_AFTER_DRAG = 400
const ease = (k: number) => 1 - (1 - k) ** 3

export function useDrag<Id extends string | number, Target = string>(options: DragOptions<Id, Target>) {
  const threshold = options.threshold ?? 10
  const lift = options.lift ?? 0
  const returnMs = options.returnMs ?? 320

  // La pieza activa (apoyada, arrastrándose o volviendo), su desplazamiento sobre su casa, cuánto está levantada
  // (1 al arrastrar, 0 en reposo) y la zona que queda debajo.
  interface DragState { id: Id | null, dragging: boolean, x: number, y: number, lifted: number, over: Target | null }
  const state = reactive({ id: null, dragging: false, x: 0, y: 0, lifted: 0, over: null }) as DragState

  let pointer: number | null = null
  let origin: Point = { x: 0, y: 0 }
  let base: Point = { x: 0, y: 0 }
  let fromRest = true
  let last: Point = { x: 0, y: 0 }
  let ignoreClicksUntil = 0
  let raf = 0
  let guard: ReturnType<typeof setTimeout> | null = null

  const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now())
  const point = (event: Pick<DragPointer, 'clientX' | 'clientY'>): Point => {
    const layer = options.layer.value
    return layer ? toBoard(layer, event) : { x: event.clientX, y: event.clientY }
  }

  function stopReturn() {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
    raf = 0
    if (guard) clearTimeout(guard)
    guard = null
  }

  function rest() {
    stopReturn()
    const id = state.id
    Object.assign(state, { id: null, dragging: false, x: 0, y: 0, lifted: 0, over: null })
    if (id !== null) options.settle?.(id)
  }

  // La vuelta a casa: el desplazamiento y lo levantada que está bajan a cero. Si el navegador no pinta cuadros (pestaña
  // en segundo plano), el respaldo la termina al acabar su tiempo.
  function glideHome() {
    stopReturn()
    const from = { x: state.x, y: state.y, lifted: state.lifted }
    if (returnMs <= 0 || (Math.hypot(from.x, from.y) < 0.5 && from.lifted === 0)) { rest(); return }
    const begin = now()
    const tick = () => {
      const k = Math.min((now() - begin) / returnMs, 1)
      const e = ease(k)
      state.x = from.x * (1 - e)
      state.y = from.y * (1 - e)
      state.lifted = from.lifted * (1 - e)
      if (k < 1 && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(tick)
      else rest()
    }
    if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(tick)
    guard = setTimeout(rest, returnMs + 120)
  }

  function onDown(id: Id, event: DragPointer) {
    if (pointer !== null) return // ya hay un dedo arrastrando
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (options.canStart && !options.canStart(id)) return
    if (state.id !== null && state.id !== id) rest() // otra pieza que volvía: se queda en su casa
    stopReturn()
    fromRest = state.id === null || (Math.hypot(state.x, state.y) < 0.5 && state.lifted === 0)
    state.id = id
    pointer = event.pointerId
    origin = point(event)
    last = origin
    base = { x: state.x, y: state.y }
    try { (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId) }
    catch { /* sin captura, el gesto se termina por cancelación */ }
    options.press?.(id)
  }

  function onMove(event: DragPointer) {
    if (event.pointerId !== pointer || state.id === null) return
    const p = point(event)
    last = p
    if (!state.dragging) {
      if (Math.hypot(p.x - origin.x, p.y - origin.y) < threshold) return
      state.dragging = true
      state.lifted = 1
      if (fromRest) base = { x: base.x, y: base.y + lift }
      options.start?.(state.id)
    }
    state.x = base.x + p.x - origin.x
    state.y = base.y + p.y - origin.y
    state.over = options.targetAt?.(p, state.id) ?? null
  }

  function end(commit: boolean, event?: DragPointer) {
    const id = state.id
    if (id === null) return
    pointer = null
    const moved = state.dragging
    const p = event ? point(event) : last
    state.dragging = false
    state.over = null
    if (moved || !fromRest) ignoreClicksUntil = now() + CLICK_AFTER_DRAG
    if (moved && commit) {
      // Al soltar, la plantilla puede cambiarla de casa: el desplazamiento se recalcula para que no salte.
      const before = options.home(id)
      const offset = { x: state.x, y: state.y }
      options.drop?.(id, options.targetAt?.(p, id) ?? null, { point: p, offset })
      if (state.id !== id) return // la plantilla la terminó (cancel o rest) desde drop
      const after = options.home(id)
      state.x = before.x + offset.x - after.x
      state.y = before.y + offset.y - after.y
      // Sin desplazamiento (la plantilla la dejó donde se soltó), tampoco queda nada levantado.
      if (Math.hypot(state.x, state.y) < 0.5) state.lifted = 0
    }
    glideHome()
  }

  /** Los manejadores de una pieza, para `v-bind`. */
  function bind(id: Id) {
    return {
      onPointerdown: (event: PointerEvent) => onDown(id, event),
      onPointermove: (event: PointerEvent) => onMove(event),
      onPointerup: (event: PointerEvent) => { if (event.pointerId === pointer && state.id === id) end(true, event) },
      onPointercancel: (event: PointerEvent) => { if (event.pointerId === pointer && state.id === id) end(false, event) },
      onLostpointercapture: (event: PointerEvent) => { if (event.pointerId === pointer && state.id === id) end(false) },
      onClick: () => {
        if (now() < ignoreClicksUntil || (state.id !== null && state.id !== id)) return
        options.tap?.(id)
      },
    }
  }

  /** Corta el gesto en curso (la escena se bloqueó, cambió de fase…): la pieza vuelve a su casa. */
  function cancel() {
    if (pointer !== null) end(false)
  }

  if (getCurrentScope()) onScopeDispose(stopReturn)

  return {
    state: readonly(state) as Readonly<DragState>,
    bind,
    cancel,
    /** Lo que se desplaza la pieza sobre su casa (cero si no es la activa). */
    offsetOf: (id: Id): Readonly<Point> => (state.id === id ? { x: state.x, y: state.y } : ZERO),
    /** Cuánto está levantada: 1 mientras se arrastra, baja a 0 al volver. */
    liftedOf: (id: Id) => (state.id === id ? state.lifted : 0),
    /** La pieza está en un gesto: apoyada, arrastrándose o volviendo. */
    isActive: (id: Id) => state.id === id,
    isDragging: (id: Id) => state.id === id && state.dragging,
    /** Hay un gesto en curso (alguna pieza apoyada, arrastrándose o volviendo). */
    busy: () => state.id !== null,
  }
}
