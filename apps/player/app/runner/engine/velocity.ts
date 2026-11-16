import type { Point } from '../board'

// ---- La velocidad del dedo, para que la pieza siga con ella al soltarla. Se calcula con todas las muestras de los
// últimos 100 ms (la recta que mejor las ajusta, por mínimos cuadrados), no con las dos últimas: una sola muestra con
// ruido no cambia el resultado. Si el dedo se quedó quieto antes de levantarse, la velocidad es cero. ----

export interface VelocityTracker {
  /** Una muestra: el instante en milisegundos y el punto. */
  add: (t: number, x: number, y: number) => void
  reset: () => void
  /** La velocidad en unidades por segundo en el instante `now`. */
  velocity: (now: number) => Point
}

export function createVelocityTracker(span = 100, stale = 40, max = 3000): VelocityTracker {
  let samples: { t: number, x: number, y: number }[] = []
  return {
    add(t, x, y) {
      samples.push({ t, x, y })
      if (samples.length > 40) samples = samples.slice(-20)
    },
    reset() { samples = [] },
    velocity(now) {
      const newest = samples.at(-1)
      // Sin datos o con el dedo ya quieto: no hay impulso.
      if (!newest || now - newest.t > stale) return { x: 0, y: 0 }
      const recent = samples.filter(s => newest.t - s.t <= span)
      const n = recent.length
      if (n < 2) return { x: 0, y: 0 }
      const mt = recent.reduce((sum, s) => sum + s.t, 0) / n
      const mx = recent.reduce((sum, s) => sum + s.x, 0) / n
      const my = recent.reduce((sum, s) => sum + s.y, 0) / n
      let stt = 0
      let stx = 0
      let sty = 0
      for (const s of recent) {
        stt += (s.t - mt) ** 2
        stx += (s.t - mt) * (s.x - mx)
        sty += (s.t - mt) * (s.y - my)
      }
      // Todas en el mismo instante: no hay con qué medir.
      if (stt < 1) return { x: 0, y: 0 }
      let x = stx / stt * 1000
      let y = sty / stt * 1000
      const speed = Math.hypot(x, y)
      if (speed > max) { x *= max / speed; y *= max / speed }
      return { x, y }
    },
  }
}
