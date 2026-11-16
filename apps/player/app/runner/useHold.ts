import { getCurrentScope, onScopeDispose, reactive, readonly } from 'vue'
import { haptic } from './engine/haptics'
import { realTime } from './engine/world'
import type { World } from './engine/world'

// ---- Mantener el dedo sobre una pieza: el gesto de lo que tarda (cocinar, llenar, sostener), igual para todas las
// plantillas. La plantilla dice sobre qué se puede mantener el dedo, qué avanza mientras sigue ahí y qué pasa al
// levantarlo; esto se ocupa del resto:
//   - Un dedo a la vez: mientras se mantiene una pieza, los demás dedos (o la palma) no empiezan otra.
//   - El tiempo que se mantiene es tiempo de juego (`world`): `tick` llega en cada cuadro con lo que avanzó, y con el
//     tablero en pausa no avanza nada.
//   - Levantar el dedo es una decisión (`released: true`): la plantilla decide qué significa soltar ahora. Un gesto
//     que se corta (cancelado por el sistema, sin captura, con la escena bloqueada) no lo es (`released: false`): solo
//     deja de avanzar.
//   - También con el teclado: mantener Espacio o Intro sobre la pieza es mantener el dedo.
//   - Al apoyar el dedo, donde hay vibración, vibra como al agarrar una pieza.
// No decide cuánto dura ni cuándo está listo: eso es del juego. ----

/** Lo que el gesto necesita de un evento de puntero. */
export type HoldPointer = Pick<PointerEvent, 'pointerId' | 'button' | 'pointerType'> & { currentTarget: EventTarget | null }
type HoldKey = Pick<KeyboardEvent, 'key' | 'repeat'> & { preventDefault: () => void }

export interface HoldOptions<Id> {
  /** Si se puede mantener el dedo sobre la pieza ahora. */
  canStart?: (id: Id) => boolean
  /** Al apoyar el dedo. */
  start?: (id: Id) => void
  /** En cada cuadro de juego mientras el dedo sigue: `dt` en segundos y lo que lleva mantenido, en milisegundos. */
  tick?: (id: Id, dt: number, heldMs: number) => void
  /** Al terminar: `released` si el dedo se levantó; si el gesto se cortó, no. */
  end?: (id: Id, info: { released: boolean, heldMs: number }) => void
  /** El tiempo de juego de la plantilla (`useWorld`): en pausa, nada avanza. Sin él, tiempo real. */
  world?: World
}

/** El «puntero» del teclado. */
const KEYBOARD = -1
const isHoldKey = (key: string) => key === ' ' || key === 'Enter'

export function useHold<Id extends string | number>(options: HoldOptions<Id>) {
  const world = options.world ?? realTime
  // La pieza sobre la que está el dedo.
  const state = reactive({ id: null }) as { id: Id | null }
  let pointer: number | null = null
  let held = 0
  let off: (() => void) | null = null

  function begin(id: Id, by: number): boolean {
    if (state.id !== null) return false // ya hay un dedo
    if (options.canStart && !options.canStart(id)) return false
    state.id = id
    pointer = by
    held = 0
    haptic('grab')
    options.start?.(id)
    off = world.onFrame((dt) => {
      held += dt * 1000
      options.tick?.(id, dt, held)
    })
    return true
  }

  function finish(released: boolean) {
    const id = state.id
    if (id === null) return
    off?.()
    off = null
    state.id = null
    pointer = null
    options.end?.(id, { released, heldMs: held })
  }
  if (getCurrentScope()) onScopeDispose(() => finish(false))

  /** Los manejadores de una pieza, para `v-bind`. */
  function bind(id: Id) {
    return {
      onPointerdown: (event: HoldPointer) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        if (!begin(id, event.pointerId)) return
        try { (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId) }
        catch { /* sin captura, el gesto se termina por cancelación */ }
      },
      onPointerup: (event: HoldPointer) => { if (event.pointerId === pointer) finish(true) },
      onPointercancel: (event: HoldPointer) => { if (event.pointerId === pointer) finish(false) },
      onLostpointercapture: (event: HoldPointer) => { if (event.pointerId === pointer) finish(false) },
      onKeydown: (event: HoldKey) => {
        if (!isHoldKey(event.key) || event.repeat) return
        if (begin(id, KEYBOARD)) event.preventDefault()
      },
      onKeyup: (event: HoldKey) => { if (isHoldKey(event.key) && pointer === KEYBOARD && state.id === id) finish(true) },
      onBlur: () => { if (pointer === KEYBOARD && state.id === id) finish(false) },
      // Mantener el dedo no abre el menú del sistema.
      onContextmenu: (event: { preventDefault: () => void }) => event.preventDefault(),
    }
  }

  return {
    state: readonly(state) as Readonly<{ id: Id | null }>,
    bind,
    /** Corta el gesto en curso (la escena se bloqueó, cambió de fase…): no cuenta como levantar el dedo. */
    cancel: () => finish(false),
    isHeld: (id: Id) => state.id === id,
  }
}
