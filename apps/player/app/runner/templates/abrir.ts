// ---- Las reglas de la plantilla Abrir (TemplateAbrir.vue), sin dibujo ni tiempo: un objeto entero se abre al último
// de sus toques y deja sus partes, que se tocan en el orden que se quiera. No hay respuesta incorrecta: tocar una
// parte ya vista lo repite. Con sus pruebas (tests/abrir.test.ts). ----

export type OpeningPhase = 'cerrado' | 'abriendo' | 'abierto'

/** Lo que abrir pesa en el avance de la escena; el resto son las partes vistas. */
const OPEN_SHARE = 0.25

export function createOpening(taps: number, parts: number) {
  // Un número que no vale (cero, negativo o que no es un número) deja un toque: el entero siempre se puede abrir.
  const total = Number.isFinite(taps) ? Math.max(1, Math.round(taps)) : 1
  const seen = new Set<number>()
  let done = 0
  let phase: OpeningPhase = 'cerrado'

  return {
    phase: () => phase,
    /** Los toques que lleva el entero. */
    taps: () => done,
    /** Un toque al entero: `grieta` si todavía aguanta y `abre` con el último; null si ya no está cerrado. */
    tap(): 'grieta' | 'abre' | null {
      if (phase !== 'cerrado') return null
      done += 1
      if (done < total) return 'grieta'
      phase = 'abriendo'
      return 'abre'
    },
    /** Las partes ya están en su sitio: desde ahora se pueden tocar. */
    opened() {
      if (phase === 'abriendo') phase = 'abierto'
    },
    /**
     * Un toque a una parte: si es la primera vez que se toca (`first`) y si con ella ya se vieron todas (`all`); null
     * si todavía no se pueden tocar o la parte no existe.
     */
    touch(part: number): { first: boolean, all: boolean } | null {
      if (phase !== 'abierto' || !Number.isInteger(part) || part < 0 || part >= parts) return null
      const first = !seen.has(part)
      seen.add(part)
      return { first, all: first && seen.size === parts }
    },
    seen: (part: number) => seen.has(part),
    /** Cuánto va la escena, de 0 a 1: abrir es la cuarta parte y el resto, las partes vistas. */
    progress() {
      if (phase === 'cerrado') return OPEN_SHARE * done / total
      return OPEN_SHARE + (1 - OPEN_SHARE) * (parts ? seen.size / parts : 1)
    },
  }
}

/**
 * El tramo de la grieta que se ve cuando el entero lleva `done` toques de `taps`, como fracciones del ancho de su
 * lienzo: con el primero, `first`; con cada uno crece hacia los dos lados hasta verse entera en el penúltimo (el
 * último abre). Sin toques no se ve: null.
 */
export function crackSpan(done: number, taps: number, first: readonly [number, number] = [0, 1]): [number, number] | null {
  if (done < 1) return null
  const grown = taps > 2 ? Math.min(1, (done - 1) / (taps - 2)) : 1
  return [first[0] * (1 - grown), first[1] + (1 - first[1]) * grown]
}
