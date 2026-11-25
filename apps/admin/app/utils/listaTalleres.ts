// La lista de talleres de la organización (tarea 023): una tabla que aguanta cientos de talleres. Primero los próximos,
// del más cercano al más lejano; luego los que aún no tienen fecha; al final los pasados, el más reciente arriba. Se
// filtran por fecha (hoy, esta semana, este mes, próximos, pasados o entre dos fechas) y por lo que pertenecen (una
// jornada, un programa o nada). Puro y con tests.

import { aFecha, isoLocal } from './fechas'
import { sumarDias } from './jornadas'
import { lunesDe } from './reporte'

export type Periodo = 'todas' | 'hoy' | 'semana' | 'mes' | 'proximos' | 'pasados' | 'elegir'
/** Los periodos que se eligen de un clic; «elegir» es el de las fechas escritas (Desde y Hasta). */
export const PERIODOS = ['todas', 'hoy', 'semana', 'mes', 'proximos', 'pasados'] as const satisfies readonly Periodo[]

/** Lo elegido en el filtro de fechas (FiltroDeFechas): un periodo o, con «elegir», las fechas escritas. */
export interface FiltroFechas { periodo: Periodo, desde: string, hasta: string }

/** Los días que abarca un filtro, ambos incluidos; null en un extremo = sin límite por ese lado. */
export interface RangoDeFechas { desde: string | null, hasta: string | null }

/**
 * Los días del filtro contados desde `hoy`. La semana va de lunes a domingo y el mes es el del calendario. null =
 * todas las fechas, también los talleres que aún no tienen: «elegir» sin ninguna fecha escrita no filtra.
 */
export function rangoDelFiltro({ periodo, desde, hasta }: FiltroFechas, hoy: string): RangoDeFechas | null {
  switch (periodo) {
    case 'hoy':
      return { desde: hoy, hasta: hoy }
    case 'semana': {
      const lunes = lunesDe(hoy)
      return { desde: lunes, hasta: sumarDias(lunes, 6) }
    }
    case 'mes': {
      const d = aFecha(hoy)
      return { desde: isoLocal(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: isoLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
    }
    case 'proximos':
      return { desde: hoy, hasta: null }
    case 'pasados':
      return { desde: null, hasta: sumarDias(hoy, -1) }
    case 'elegir':
      return desde || hasta ? { desde: desde || null, hasta: hasta || null } : null
    default:
      return null
  }
}

/** Si un taller cae en el rango. Uno sin fecha solo sale sin filtro de fechas. */
export function fechaEnRango(fecha: string, rango: RangoDeFechas | null): boolean {
  if (!rango) return true
  if (!fecha) return false
  return (!rango.desde || fecha >= rango.desde) && (!rango.hasta || fecha <= rango.hasta)
}

interface TallerOrdenable { date: string, time: string, title: string }

/** Los próximos (hoy incluido) por fecha y hora; luego los que no tienen fecha; al final los pasados, el más reciente
 *  arriba. A igual fecha y hora, por título. */
export function ordenarTalleres<W extends TallerOrdenable>(talleres: W[], hoy: string): W[] {
  const clave = (w: W) => `${w.date} ${w.time}`
  const proximos = talleres.filter(w => w.date && w.date >= hoy)
    .sort((a, b) => clave(a).localeCompare(clave(b)) || a.title.localeCompare(b.title))
  const sinFecha = talleres.filter(w => !w.date)
    .sort((a, b) => a.title.localeCompare(b.title))
  const pasados = talleres.filter(w => w.date && w.date < hoy)
    .sort((a, b) => clave(b).localeCompare(clave(a)) || a.title.localeCompare(b.title))
  return [...proximos, ...sinFecha, ...pasados]
}

interface TallerConPertenencia {
  jornada: { id: number } | null
  programa: { id: number } | null
}

/**
 * Si el taller pertenece a lo elegido en el filtro: «todos», «suelto» (ni jornada ni programa), «j:5» (esa jornada) o
 * «p:3» (ese programa, también sus talleres dentro de una jornada del programa: el programa del taller es el de ella).
 */
export function perteneceA(w: TallerConPertenencia, valor: string | number): boolean {
  if (valor === 'todos') return true
  if (valor === 'suelto') return !w.jornada && !w.programa
  const m = /^([pj]):(\d+)$/.exec(String(valor))
  if (!m) return true
  const id = Number(m[2])
  return m[1] === 'j' ? w.jornada?.id === id : w.programa?.id === id
}
