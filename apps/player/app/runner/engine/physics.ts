import type { World } from './world'

// ---- La física libre del motor: cuerpos que caen, ruedan, rebotan y chocan. Es para lo que no va a un sitio fijo (eso
// son los resortes de `useDrag`): algo que se suelta y cae en un plato, piezas que se empujan, una pelota.
//   - Cada cuerpo es redondo: su centro, su radio, su velocidad y cómo se comporta (cuánto rebota, cuánto lo frena el
//     aire, cuánto pesa).
//   - El mundo pone la gravedad, los bordes (el suelo y las paredes) y el roce del suelo.
//   - Se avanza en pasos cortos y fijos (120 por segundo), aunque el cuadro tarde más: así nada atraviesa el suelo ni a
//     otro cuerpo cuando el dispositivo va lento.
//   - Un cuerpo que ya descansa en el suelo se duerme y deja de calcularse; un empujón (`push`) lo despierta.
// Las unidades son las del tablero: puntos, y puntos por segundo. ----

export interface Body {
  x: number
  y: number
  vx: number
  vy: number
  /** Radio. */
  r: number
  /** Cuánto rebota, de 0 (se queda) a 1 (vuelve con la misma fuerza). */
  bounce: number
  /** Cuánto lo frena el aire, por segundo: 0 no lo frena. */
  drag: number
  /** Su peso frente a los demás al chocar. */
  mass: number
  /** No se mueve: los demás chocan con él. */
  fixed: boolean
  /** Descansa en el suelo: no se calcula hasta que lo empujan. */
  asleep: boolean
}

export interface PhysicsOptions {
  /** Aceleración hacia abajo, en puntos por segundo al cuadrado. */
  gravity?: number
  /** La caja de la que nada sale: su suelo, su techo y sus paredes. */
  bounds?: { x: number, y: number, w: number, h: number }
  /** Cuánto frena el suelo a lo que rueda sobre él, por segundo. */
  friction?: number
}

const STEP = 1 / 120
/** Por debajo de esta velocidad, lo que toca el suelo se queda quieto. */
const REST = 12

export function createBody(body: Pick<Body, 'x' | 'y' | 'r'> & Partial<Body>): Body {
  return { vx: 0, vy: 0, bounce: 0.4, drag: 0, mass: 1, fixed: false, asleep: false, ...body }
}

/** Un empujón: suma velocidad al cuerpo y lo despierta. */
export function push(body: Body, vx: number, vy: number) {
  body.vx += vx
  body.vy += vy
  body.asleep = false
}

// Dos cuerpos que se pisan se separan y, si se acercaban, rebotan. `resting` recoge al que queda apoyado sobre otro.
function collide(a: Body, b: Body, resting: Set<Body>, slow: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distance = Math.hypot(dx, dy)
  const overlap = a.r + b.r - distance
  if (overlap <= 0) return
  // La dirección del choque, de `a` a `b`; si están justo uno sobre otro, hacia abajo.
  const nx = distance > 0 ? dx / distance : 0
  const ny = distance > 0 ? dy / distance : 1
  const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
  // Un golpe de verdad despierta al que dormía; un roce, no.
  if (approach < -slow) { a.asleep = false; b.asleep = false }
  const wa = a.fixed || a.asleep ? 0 : 1 / a.mass
  const wb = b.fixed || b.asleep ? 0 : 1 / b.mass
  if (wa + wb === 0) return
  // Se separan, cada uno según lo que pesa el otro.
  a.x -= nx * overlap * wa / (wa + wb)
  a.y -= ny * overlap * wa / (wa + wb)
  b.x += nx * overlap * wb / (wa + wb)
  b.y += ny * overlap * wb / (wa + wb)
  // El que queda encima del otro, casi sin velocidad entre ellos, está apoyado.
  if (Math.abs(approach) < slow) {
    if (ny > 0.5) resting.add(a)
    if (ny < -0.5) resting.add(b)
  }
  if (approach >= 0) return
  const impulse = -(1 + Math.min(a.bounce, b.bounce)) * approach / (wa + wb)
  a.vx -= impulse * wa * nx
  a.vy -= impulse * wa * ny
  b.vx += impulse * wb * nx
  b.vy += impulse * wb * ny
}

/** Avanza `dt` segundos todos los cuerpos. */
export function stepPhysics(bodies: Body[], dt: number, options: PhysicsOptions = {}) {
  const gravity = options.gravity ?? 0
  const friction = options.friction ?? 6
  const bounds = options.bounds
  const steps = Math.max(1, Math.ceil(dt / STEP - 1e-9))
  const h = dt / steps
  // Lo que la gravedad suma en un paso también cuenta como «quieto».
  const slow = REST + gravity * h
  for (let step = 0; step < steps; step += 1) {
    for (const body of bodies) {
      if (body.fixed || body.asleep) continue
      body.vy += gravity * h
      if (body.drag) {
        const keep = Math.exp(-body.drag * h)
        body.vx *= keep
        body.vy *= keep
      }
      body.x += body.vx * h
      body.y += body.vy * h
    }
    const resting = new Set<Body>()
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) collide(bodies[i]!, bodies[j]!, resting, slow)
    }
    for (const body of bodies) {
      if (body.fixed || body.asleep) continue
      if (bounds) {
        const left = bounds.x + body.r
        const right = bounds.x + bounds.w - body.r
        const top = bounds.y + body.r
        const floor = bounds.y + bounds.h - body.r
        if (body.x < left) { body.x = left; if (body.vx < 0) body.vx = -body.vx * body.bounce }
        if (body.x > right) { body.x = right; if (body.vx > 0) body.vx = -body.vx * body.bounce }
        if (body.y < top) { body.y = top; if (body.vy < 0) body.vy = -body.vy * body.bounce }
        if (body.y >= floor) {
          body.y = floor
          if (body.vy > 0) body.vy = -body.vy * body.bounce
          // En el suelo: un rebote que ya no se ve se apaga, y lo que rueda se frena.
          if (Math.abs(body.vy) < slow) body.vy = 0
          body.vx *= Math.exp(-friction * h)
          resting.add(body)
        }
      }
      // Se duerme lo que ya está quieto: con gravedad, apoyado en el suelo o en otro cuerpo; sin ella, donde esté.
      const speed = Math.hypot(body.vx, body.vy)
      if (gravity > 0 ? resting.has(body) && speed < slow : speed < REST / 4) {
        body.vx = 0
        body.vy = 0
        body.asleep = true
      }
    }
  }
}

/** Todos los cuerpos descansan: no queda nada que calcular. */
export const allAsleep = (bodies: Body[]) => bodies.every(body => body.fixed || body.asleep)

/**
 * Pone a andar los cuerpos en el tiempo de un mundo: en cada cuadro los avanza y llama a `paint` para dibujarlos. Se
 * detiene sola cuando todos descansan; `wake` la reanuda (después de un `push`) y `stop` la para.
 */
export function simulate(world: World, bodies: Body[], options: PhysicsOptions, paint: () => void) {
  let off: (() => void) | null = null
  const stop = () => { off?.(); off = null }
  const wake = () => {
    off ??= world.onFrame((dt) => {
      stepPhysics(bodies, dt, options)
      paint()
      if (allAsleep(bodies)) stop()
    })
  }
  wake()
  return { wake, stop }
}
