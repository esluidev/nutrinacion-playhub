// Reglas puras de «Programar sesiones» (tarea 021): las fechas de una serie semanal; y los meses
// de la ficha del programa (tarea 023), que muestra sus talleres mes a mes. Fechas como
// 'YYYY-MM-DD' (días del calendario, utils/fechas.ts). Las usan la página de sesiones y la ficha
// del programa; los tests las ejercitan directo.

import { aFecha, isoLocal } from './fechas'
import { fechaEnJornada, sumarDias } from './jornadas'

/** Día de la semana de una fecha: 1 = lunes … 7 = domingo. */
export function diaDeSemana(fecha: string): number {
  const d = aFecha(fecha).getDay()
  return d === 0 ? 7 : d
}

/**
 * Las `n` fechas de una serie semanal: la primera en el día de la semana pedido (1 = lunes … 7 =
 * domingo) desde `desde`, incluido, y después una cada siete días.
 */
export function fechasDeSerie(desde: string, dia: number, n: number): string[] {
  if (!desde || n < 1) return []
  const primera = sumarDias(desde, (dia - diaDeSemana(desde) + 7) % 7)
  return Array.from({ length: n }, (_, i) => sumarDias(primera, i * 7))
}

/** Las fechas de la serie que caen fuera del programa (la base las rechazaría). */
export function fueraDelPrograma(fechas: string[], p: { fecha_inicio: string, fecha_fin: string }): string[] {
  return fechas.filter(f => !fechaEnJornada(p, f))
}

// ── Los meses de la ficha ─────────────────────────────────────────────────────
/** Los meses que abarca un programa, del primero al último, como 'YYYY-MM'. */
export function mesesDelPrograma(p: { fecha_inicio: string, fecha_fin: string }): string[] {
  const meses: string[] = []
  let mes = p.fecha_inicio.slice(0, 7)
  const ultimo = p.fecha_fin.slice(0, 7)
  while (mes <= ultimo) {
    meses.push(mes)
    const d = aFecha(`${mes}-01`)
    mes = isoLocal(new Date(d.getFullYear(), d.getMonth() + 1, 1)).slice(0, 7)
  }
  return meses
}

/** El mes con que abre la ficha: el de hoy si el programa está en curso; antes de empezar, el primero; terminado, el
 *  último. */
export function mesInicial(meses: string[], hoy: string): string {
  const actual = hoy.slice(0, 7)
  if (!meses.length) return actual
  if (actual < meses[0]!) return meses[0]!
  if (actual > meses[meses.length - 1]!) return meses[meses.length - 1]!
  return actual
}

/** Los días de un mes 'YYYY-MM', como rango (para `talleresPorDia`). */
export function rangoDelMes(mes: string): { fecha_inicio: string, fecha_fin: string } {
  const d = aFecha(`${mes}-01`)
  return { fecha_inicio: `${mes}-01`, fecha_fin: isoLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
}
