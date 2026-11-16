// ---- Las reglas de la plantilla Señalar (TemplateSenalar.vue), sin dibujo ni tiempo: hay unas cosas que se buscan
// (lo que trae el huevo) y unas zonas de un personaje (la cara, el cuerpo); cada cosa tiene su zona. El niño elige una
// cosa, en el orden que quiera, y toca la zona donde le sirve: si es la suya, queda encontrada; si no, se reintenta,
// sin contar los intentos. Elegir otra vez una ya encontrada la vuelve a mostrar. Con sus pruebas
// (tests/senalar.test.ts). ----

export interface PointingHit {
  /** La cosa que se estaba buscando. */
  item: number
  /** La zona tocada es la suya. */
  hit: boolean
  /** Con ella ya se encontraron todas. */
  all: boolean
}

/** `zones[i]` es la zona de la cosa `i`. */
export function createPointing(zones: readonly string[]) {
  const found = new Set<number>()
  let chosen: number | null = null

  return {
    /** La cosa que se está buscando, o null si no hay ninguna elegida. */
    chosen: () => chosen,
    found: (item: number) => found.has(item),
    done: () => found.size === zones.length,
    /**
     * Elegir una cosa: `busca` si desde ahora se busca su zona y `repite` si ya estaba encontrada (se vuelve a mostrar
     * y no se busca nada); null si no existe.
     */
    choose(item: number): 'busca' | 'repite' | null {
      if (!Number.isInteger(item) || item < 0 || item >= zones.length) return null
      if (found.has(item)) {
        chosen = null
        return 'repite'
      }
      chosen = item
      return 'busca'
    },
    /** Tocar una zona con una cosa elegida; null si no se está buscando nada. Un fallo deja la cosa elegida. */
    point(zone: string): PointingHit | null {
      if (chosen === null) return null
      const item = chosen
      if (zones[item] !== zone) return { item, hit: false, all: false }
      found.add(item)
      chosen = null
      return { item, hit: true, all: found.size === zones.length }
    },
    /** Cuánto va la escena, de 0 a 1: las cosas encontradas. */
    progress: () => (zones.length ? found.size / zones.length : 1),
  }
}
