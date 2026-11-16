// ---- El resorte del motor: cómo llega una pieza a su sitio. A diferencia de una curva de duración fija, un resorte
// parte de la velocidad que la pieza ya lleva (la del dedo al soltarla), se puede interrumpir en cualquier punto y
// seguir desde ahí, y frena como frena un objeto. Se describe con dos números que se entienden sin fórmulas:
//   - `response`: los segundos que tarda, más o menos, en llegar;
//   - `damping`: cuánto se amortigua. 1 llega sin pasarse; por debajo de 1 se pasa un poco y vuelve (rebote).
// El paso es exacto (la solución del oscilador amortiguado), no una aproximación: da lo mismo avanzar 100 ms de una
// vez que en diez pasos de 10 ms, y por eso no se desboca cuando un cuadro tarda. ----

export interface Spring { response: number, damping: number }

export const SPRINGS = {
  /** Una pieza que vuelve a su sitio o llega a otro: decidida y sin rebote que se note. */
  settle: { response: 0.28, damping: 0.88 },
  /** Levantar y posar: corto y sin rebote. */
  lift: { response: 0.16, damping: 1 },
  /** Algo blando que tiembla (un líquido, una gelatina): se pasa y vuelve varias veces antes de quedarse quieto. */
  jelly: { response: 0.3, damping: 0.22 },
} satisfies Record<string, Spring>

/**
 * Avanza `dt` segundos un resorte que tira hacia cero: `x` es lo que falta para llegar y `v`, la velocidad (por
 * segundo). Devuelve los dos nuevos valores.
 */
export function stepSpring(x: number, v: number, dt: number, spring: Spring): { x: number, v: number } {
  if (dt <= 0) return { x, v }
  const w = 2 * Math.PI / spring.response
  const z = spring.damping
  if (z < 1) {
    // Se pasa y vuelve.
    const a = z * w
    const wd = w * Math.sqrt(1 - z * z)
    const b = (v + a * x) / wd
    const e = Math.exp(-a * dt)
    const cos = Math.cos(wd * dt)
    const sin = Math.sin(wd * dt)
    return { x: e * (x * cos + b * sin), v: e * ((b * wd - a * x) * cos - (a * b + x * wd) * sin) }
  }
  if (z === 1) {
    // Llega lo más rápido posible sin pasarse.
    const c = v + w * x
    const e = Math.exp(-w * dt)
    return { x: e * (x + c * dt), v: e * (v - w * c * dt) }
  }
  // Llega despacio, sin pasarse.
  const root = w * Math.sqrt(z * z - 1)
  const r1 = -w * z + root
  const r2 = -w * z - root
  const c1 = (v - r2 * x) / (r1 - r2)
  const c2 = x - c1
  const e1 = Math.exp(r1 * dt)
  const e2 = Math.exp(r2 * dt)
  return { x: c1 * e1 + c2 * e2, v: c1 * r1 * e1 + c2 * r2 * e2 }
}

/** Ya llegó: le falta menos de `distance` y va más despacio que `speed`. */
export const settled = (x: number, v: number, distance: number, speed: number) => Math.abs(x) < distance && Math.abs(v) < speed
