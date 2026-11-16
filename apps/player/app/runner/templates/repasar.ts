// ---- Las reglas de la plantilla Repasar (TemplateRepasar.vue), sin dibujo ni tiempo: armar el recorrido. Hay unos
// lugares en orden y una ficha por lugar: la ficha `i` va en el lugar `i`. Una ficha solo se queda en su lugar; soltada
// en otro, vuelve, sin contar el intento. Tocarla la manda al primer lugar libre. Los lugares se pueden llenar en
// cualquier orden. Con sus pruebas (tests/repasar.test.ts). ----

/** Lo que pasa al llevar una ficha a un lugar: se queda fija o vuelve a la bandeja. */
export type JourneyDrop = 'fija' | 'vuelve'

export function createJourney(count: number) {
  const total = Number.isInteger(count) && count > 0 ? count : 0
  const fixed = Array.from({ length: total }, () => false)
  const exists = (n: number) => Number.isInteger(n) && n >= 0 && n < total

  /** El primer lugar libre, o -1 si ya no queda ninguno. */
  const next = () => fixed.indexOf(false)
  /** Llevar la ficha a un lugar; null si no existen o la ficha ya está fija. */
  function drop(piece: number, place: number): JourneyDrop | null {
    if (!exists(piece) || !exists(place) || fixed[piece]) return null
    if (piece !== place) return 'vuelve'
    fixed[piece] = true
    return 'fija'
  }

  return {
    next,
    drop,
    /** Tocar una ficha: va al primer lugar libre. */
    tap: (piece: number) => drop(piece, next()),
    isFixed: (piece: number) => fixed[piece] === true,
    done: () => fixed.every(Boolean),
    /** Cuánto va la escena, de 0 a 1: las fichas en su lugar. */
    progress: () => (total ? fixed.filter(Boolean).length / total : 1),
  }
}
