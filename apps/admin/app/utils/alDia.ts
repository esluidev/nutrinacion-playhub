// Lo leído de la base se guarda (useState) para pintarlo al momento, pero otra app, otra pestaña u otra persona puede
// cambiarlo: un educador que elige su PIN en Educators, un taller que otro administrador programa, un storyboard que
// Player publica. Por eso cada lista se vuelve a leer al entrar a una página que la usa y al volver a la pestaña o a la
// ventana (`useAlDia`), sin tapar lo que ya se ve, y no más de una vez cada pocos segundos: varias piezas de la misma
// página usan la misma lista.

export const FRESCO_MS = 5_000

/** Cuándo se leyó por última vez y si hay una lectura en curso. */
export interface Lectura { leidoEn: number, enCurso: boolean }

export const lecturaNueva = (): Lectura => ({ leidoEn: 0, enCurso: false })

/** Hay que leer si hay organización, no hay otra lectura en curso y lo guardado es de otra organización o tiene más
 *  de unos segundos. */
export function hayQueLeer(lectura: Lectura, oid: number | null | undefined, orgGuardada: number | null, ahora = Date.now()): boolean {
  return !!oid && !lectura.enCurso && (orgGuardada !== oid || ahora - lectura.leidoEn > FRESCO_MS)
}

/** Lee y anota cuándo, también si falla. */
export async function leerAnotando(lectura: Lectura, leer: () => Promise<void>, ahora: () => number = Date.now): Promise<void> {
  lectura.enCurso = true
  try {
    await leer()
  }
  finally {
    lectura.enCurso = false
    lectura.leidoEn = ahora()
  }
}
