// ---- Las reglas de la plantilla Resumen (TemplateResumen.vue), sin dibujo ni tiempo: el álbum de fotos del taller.
// Una pila con una foto por logro y, al final, la invitación. Cada toque pasa la foto de arriba, que sale de la pila y
// se posa en su sitio del collage; también la invitación, la última, que completa la escena (entonces cae la foto del
// grupo en el centro). No hay orden que acertar ni nada que pueda fallar. Con sus pruebas (tests/resumen.test.ts). ----

/** Lo que pasa al tocar la foto de arriba: sale a su sitio del collage (el `index` de su foto); la invitación, la última. */
export type AlbumPass = { kind: 'logro', index: number } | { kind: 'invitacion', index: number }

/** Cuántos logros caben en el álbum: de tres a cinco. Con menos o con más, el collage no tiene sitios. */
export const ALBUM_MIN = 3
export const ALBUM_MAX = 5

export function createAlbum(count: number) {
  const total = Number.isInteger(count) ? Math.min(Math.max(count, 0), ALBUM_MAX) : 0
  let passed = 0
  let invited = false

  return {
    /** La foto que está arriba de la pila: un logro (su índice) o la invitación (`total`). */
    top: () => passed,
    /** Si el logro `i` ya salió de la pila. */
    isPassed: (i: number) => i < passed,
    /** Tocar la foto de arriba (o empujarla): null si la escena ya terminó. */
    pass(): AlbumPass | null {
      if (passed < total) return { kind: 'logro', index: passed++ }
      if (invited) return null
      invited = true
      return { kind: 'invitacion', index: total }
    },
    done: () => invited,
    /** Cuánto va la escena, de 0 a 1: los logros que salieron y la invitación. */
    progress: () => (passed + (invited ? 1 : 0)) / (total + 1),
  }
}

/** Un sitio del collage: el centro de la foto en el tablero y su giro, en grados. */
export interface Spot { x: number, y: number, r: number }

// Dónde se posa cada foto, en el tablero de 1280 × 600, alrededor del centro (640, 300), donde están la pila y, al final,
// la foto del grupo (420 × 366): con seis, tres a cada lado; con cinco, tres a la izquierda y dos a la derecha; con
// cuatro, dos y dos. Se llenan en orden, de arriba abajo y de izquierda a derecha; la invitación, la última. Girados
// entre 2 y 5 grados, como fotos dejadas sobre la mesa; ninguno pisa el centro.
const SPOTS: Record<number, Spot[]> = {
  4: [{ x: 272, y: 186, r: -4 }, { x: 262, y: 414, r: 3 }, { x: 1010, y: 186, r: 4 }, { x: 1000, y: 414, r: -3 }],
  5: [{ x: 262, y: 116, r: -5 }, { x: 300, y: 300, r: 3 }, { x: 256, y: 482, r: -2 }, { x: 1014, y: 186, r: 4 }, { x: 1000, y: 414, r: -3 }],
  6: [{ x: 262, y: 116, r: -5 }, { x: 300, y: 300, r: 3 }, { x: 256, y: 482, r: -2 }, { x: 1018, y: 116, r: 4 }, { x: 980, y: 300, r: -3 }, { x: 1024, y: 482, r: 3 }],
}

/** Los sitios del collage para `count` fotos (los logros y la invitación), o una lista vacía si no caben. */
export const collageSpots = (count: number): Spot[] => SPOTS[count] ?? []

/**
 * Cómo asoman las fotos de debajo de la de arriba: la de justo debajo y la siguiente, corridas y giradas. Las demás
 * esperan detrás de esas dos, sin verse.
 */
export const STACK_UNDER: Spot[] = [{ x: 9, y: 5, r: 4 }, { x: -7, y: 7, r: -5 }]
