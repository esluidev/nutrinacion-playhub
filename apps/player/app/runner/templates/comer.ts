// ---- Las reglas de la plantilla Comer (TemplateComer.vue), sin dibujo ni tiempo: hay unos alimentos, cada uno en su
// tarjeta, y un personaje que se los come. El niño le da el que quiera, en el orden que quiera; no hay uno equivocado.
// Mientras el personaje come uno, no se le da otro. Uno ya comido no vuelve a la tarjeta: tocarla lo vuelve a mostrar.
// Con sus pruebas (tests/comer.test.ts). ----

/** Dónde está cada alimento: en su tarjeta, en la boca del personaje o ya comido. */
export type FoodState = 'tarjeta' | 'comiendo' | 'comido'

export function createFeeding(count: number) {
  const foods: FoodState[] = Array.from({ length: count }, () => 'tarjeta')
  let chosen: number | null = null
  const exists = (i: number) => Number.isInteger(i) && i >= 0 && i < count

  return {
    stateOf: (i: number): FoodState | null => (exists(i) ? foods[i]! : null),
    /** El alimento elegido con un toque, que espera a que se toque al personaje; o null. */
    chosen: () => chosen,
    /** El que se está comiendo ahora, o null. */
    eating: () => {
      const i = foods.indexOf('comiendo')
      return i < 0 ? null : i
    },
    /** Se le puede dar ahora: está en su tarjeta y el personaje no está comiendo otro. */
    canGive: (i: number) => exists(i) && foods[i] === 'tarjeta' && !foods.includes('comiendo'),
    /**
     * Tocar un alimento o su tarjeta: `elige` si queda elegido para dárselo con un toque al personaje, `repite` si ya
     * se lo comió (se vuelve a mostrar lo que hace), `quita` si ya estaba elegido (deja de estarlo); null si no hay nada.
     */
    choose(i: number): 'elige' | 'repite' | 'quita' | null {
      if (!exists(i)) return null
      if (foods[i] === 'comido') {
        chosen = null
        return 'repite'
      }
      if (foods[i] !== 'tarjeta') return null
      if (chosen === i) {
        chosen = null
        return 'quita'
      }
      chosen = i
      return 'elige'
    },
    /** Dárselo: empieza a comérselo. Falso si ahora no se puede. */
    give(i: number): boolean {
      if (!exists(i) || foods[i] !== 'tarjeta' || foods.includes('comiendo')) return false
      foods[i] = 'comiendo'
      chosen = null
      return true
    },
    /** Terminó de comérselo; `all`, si con él ya se comió todo. Null si no lo estaba comiendo. */
    swallow(i: number): { all: boolean } | null {
      if (!exists(i) || foods[i] !== 'comiendo') return null
      foods[i] = 'comido'
      return { all: foods.every(food => food === 'comido') }
    },
    done: () => foods.every(food => food === 'comido'),
    /** Cuánto va la escena, de 0 a 1: los alimentos comidos. */
    progress: () => (count ? foods.filter(food => food === 'comido').length / count : 1),
  }
}
