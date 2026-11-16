import { SPRINGS, settled, stepSpring } from './spring'
import type { Spring } from './spring'
import type { World } from './world'

// ---- El temblor del motor: algo blando recibe un empujón y vuelve a su forma pasándose y volviendo (un líquido que
// se mueve, una gelatina, algo que se mece). Es un resorte poco amortiguado alrededor de cero:
//   - `kick` le da el empujón; uno sobre otro se suma, así que tocarlo varias veces lo agita más.
//   - `paint(x)` recibe en cada cuadro cuánto se aparta de su forma (más o menos de −1 a 1 con un empujón de 1) y lo
//     dibuja como quiera: inclinándolo, aplastándolo, girándolo. Solo transformaciones.
//   - Corre en el tiempo de un mundo y solo mientras se mueve: en pausa se queda como está y sigue al volver.
// Con movimiento reducido no se empuja: quien lo usa no llama a `kick`. ----

export function createWobble(world: World, paint: (x: number) => void, spring: Spring = SPRINGS.jelly) {
  let x = 0
  let v = 0
  let off: (() => void) | null = null
  const sleep = () => { off?.(); off = null }

  function step(dt: number) {
    const next = stepSpring(x, v, dt, spring)
    if (settled(next.x, next.v, 0.004, 0.05)) {
      x = 0
      v = 0
      paint(0)
      sleep()
      return
    }
    x = next.x
    v = next.v
    paint(x)
  }

  return {
    /** Un empujón: con `strength` 1 se aparta más o menos una unidad antes de volver. */
    kick(strength = 1) {
      v += strength * 2 * Math.PI / spring.response
      off ??= world.onFrame(step)
    },
    /** Lo deja quieto en su forma. */
    still() {
      x = 0
      v = 0
      paint(0)
      sleep()
    },
    /** Sigue temblando. */
    moving: () => off !== null,
  }
}
