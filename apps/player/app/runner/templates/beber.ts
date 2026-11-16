// ---- Las reglas de la plantilla Beber (TemplateBeber.vue), sin dibujo ni tiempo: cada toque cuenta un sorbo y el
// vaso queda lleno con el último; después, tocar ya no cuenta. Y la geometría del agua dentro de un vaso que se
// estrecha hacia abajo: a qué altura queda su superficie y cuánto mide de ancho ahí. Puras, con sus pruebas
// (tests/beber.test.ts). ----

export function createSips(sips: number) {
  // Un número que no vale (cero, negativo o que no es un número) deja un sorbo: el vaso siempre se puede llenar.
  const total = Number.isFinite(sips) ? Math.max(1, Math.round(sips)) : 1
  let done = 0

  return {
    total: () => total,
    /** Los sorbos que lleva. */
    done: () => done,
    /** Un toque: cuenta un sorbo y dice si con él quedó lleno (`full`); null si ya lo estaba. */
    sip(): { full: boolean } | null {
      if (done >= total) return null
      done += 1
      return { full: done === total }
    },
    /** Cuánto lleva, de 0 a 1. */
    level: () => done / total,
  }
}

/** El hueco de un vaso, en su lienzo: la y de la boca y la del piso, con la mitad de su ancho en cada una. */
export interface Hollow { mouth: { y: number, half: number }, floor: { y: number, half: number } }

/** La y de la superficie del agua cuando el vaso va por `level` (de 0 a 1): del piso a `full`, la del vaso lleno. */
export function waterLine(level: number, hollow: Hollow, full: number): number {
  const k = Math.min(Math.max(level, 0), 1)
  return hollow.floor.y - (hollow.floor.y - full) * k
}

/** La mitad del ancho del hueco a la altura `y`: de la boca al piso se estrecha en línea recta. */
export function hollowHalf(y: number, hollow: Hollow): number {
  const { mouth, floor } = hollow
  return mouth.half + (floor.half - mouth.half) * (y - mouth.y) / (floor.y - mouth.y)
}
