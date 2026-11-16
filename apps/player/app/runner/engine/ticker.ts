// ---- El reloj del motor: un solo bucle de cuadros para todo lo que se mueve con física en el tablero. Cada suscriptor
// recibe en cada cuadro el tiempo real que pasó (`dt`, en segundos) y el instante (`now`, en milisegundos).
//   - Solo corre mientras alguien lo necesita: con todo quieto no hay bucle ni gasto.
//   - Avanza con el tiempo real: si un cuadro tarda, el siguiente recupera lo que faltó y nada va a cámara lenta.
//   - Si el navegador deja de pintar cuadros (la pestaña o el panel en segundo plano), sigue avanzando por temporizador,
//     así que lo que estaba en movimiento llega a su final y la escena no se queda a medias. ----

export type FrameFn = (dt: number, now: number) => void

/** Cuánto se espera un cuadro antes de avanzar por temporizador. */
const IDLE = 200

const subscribers = new Set<FrameFn>()
let frame = 0
let guard: ReturnType<typeof setTimeout> | undefined
let last = 0

function tick() {
  const now = performance.now()
  const dt = Math.max(now - last, 0) / 1000
  last = now
  for (const fn of [...subscribers]) if (subscribers.has(fn)) fn(dt, now)
  arm()
}

// Pide el siguiente cuadro y su respaldo. Siempre desde cero: un identificador que quedó colgado no detiene el reloj.
function arm() {
  if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
  clearTimeout(guard)
  frame = 0
  guard = undefined
  if (!subscribers.size) return
  if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick)
  guard = setTimeout(tick, IDLE)
}

/** Llama a `fn` en cada cuadro hasta que se llame a lo que devuelve. */
export function onFrame(fn: FrameFn): () => void {
  if (!subscribers.size) last = performance.now()
  subscribers.add(fn)
  arm()
  return () => {
    subscribers.delete(fn)
    if (!subscribers.size) arm()
  }
}
