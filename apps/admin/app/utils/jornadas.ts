// Reglas puras de las jornadas (decisión 011): una jornada es dónde y cuándo se va, un lugar y uno
// o varios días. Se crea o se elige al programar un taller; sus talleres caen en sus días y toman su
// lugar (tarea 021: lo pone la base); el taller añade su espacio («Aula 3A»). Vive en el
// planificador (una banda sobre sus días) y en los talleres («Pertenece a»).
// Fechas como 'YYYY-MM-DD' (días del calendario, utils/fechas.ts): se comparan como texto.
// Funciones puras: las alimentan usePlanner, useWorkshopWizard, la sección de Jornadas y la lista
// de talleres; los tests las ejercitan directo.

import { aFecha, fechaCorta, isoLocal } from './fechas'

export interface JornadaRango {
  id: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

/** Lo que un taller sabe de su jornada: sus días y el nombre de su lugar. */
export interface JornadaResumen extends JornadaRango {
  ubicacion: string
}

/** Un día del calendario más `n` días, como 'YYYY-MM-DD'. */
export function sumarDias(fecha: string, n: number): string {
  const d = aFecha(fecha)
  return isoLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n))
}

/** Si el día cae dentro de la jornada (ambos extremos incluidos). */
export function fechaEnJornada(j: Pick<JornadaRango, 'fecha_inicio' | 'fecha_fin'>, fecha: string): boolean {
  return !!fecha && fecha >= j.fecha_inicio && fecha <= j.fecha_fin
}

/** Cuántos días dura (uno si empieza y termina el mismo día). */
export function diasDeJornada(j: Pick<JornadaRango, 'fecha_inicio' | 'fecha_fin'>): number {
  return Math.round((aFecha(j.fecha_fin).getTime() - aFecha(j.fecha_inicio).getTime()) / 86_400_000) + 1
}

/**
 * Los días de la jornada en los que se puede programar un taller, para elegirlos uno a uno: desde
 * hoy si la jornada ya empezó (todos si aún no), hasta su fin. Con más de `max` días, null: se elige
 * con un campo de fecha.
 */
export function diasParaElegir(j: Pick<JornadaRango, 'fecha_inicio' | 'fecha_fin'>, hoy: string, max = 14): string[] | null {
  const desde = hoy > j.fecha_inicio && hoy <= j.fecha_fin ? hoy : j.fecha_inicio
  const n = diasDeJornada({ fecha_inicio: desde, fecha_fin: j.fecha_fin })
  if (n < 1 || n > max) return null
  return Array.from({ length: n }, (_, i) => sumarDias(desde, i))
}

/** Sus días como texto: «16 nov 2026» si dura uno; «9 nov 2026 – 13 nov 2026» si dura varios. */
export function rangoJornada(j: Pick<JornadaRango, 'fecha_inicio' | 'fecha_fin'>, locale: string): string {
  return j.fecha_inicio === j.fecha_fin
    ? fechaCorta(j.fecha_inicio, locale)
    : `${fechaCorta(j.fecha_inicio, locale)} – ${fechaCorta(j.fecha_fin, locale)}`
}

// Las jornadas a las que todavía se puede sumar un taller: las que no han terminado (`fecha_fin`
// desde hoy, con `hoyLocal()`), por inicio y, a igual inicio, por nombre.
export function jornadasEnCurso<J extends JornadaRango>(jornadas: J[], hoy: string): J[] {
  return jornadas
    .filter(j => j.fecha_fin >= hoy)
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio) || a.nombre.localeCompare(b.nombre))
}

/** Para la lista de su sección: primero las que no han terminado, por su inicio; las terminadas al final, la más
 *  reciente arriba. */
export function ordenarJornadas<J extends JornadaRango>(jornadas: J[], hoy: string): J[] {
  const vivas = jornadasEnCurso(jornadas, hoy)
  const terminadas = jornadas.filter(j => j.fecha_fin < hoy).sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin))
  return [...vivas, ...terminadas]
}

// Dónde es el taller: su lugar y, si lo hay, su espacio: «Sede central · Aula 3A». Dentro de una
// jornada, el lugar es el de ella (lo pone la base). Vacío si no se sabe.
export function lugarDelTaller(lugar: string | null | undefined, espacio: string | null | undefined): string {
  return [lugar?.trim(), espacio?.trim()].filter(Boolean).join(' · ')
}

// Los días que tendría la jornada para que el día quepa: se alarga por el lado que haga falta.
// Si ya cabe, sus días de siempre.
export function ampliarJornada(j: Pick<JornadaRango, 'fecha_inicio' | 'fecha_fin'>, fecha: string): { fecha_inicio: string, fecha_fin: string } {
  return {
    fecha_inicio: fecha && fecha < j.fecha_inicio ? fecha : j.fecha_inicio,
    fecha_fin: fecha && fecha > j.fecha_fin ? fecha : j.fecha_fin,
  }
}

/**
 * Los días de la ficha de una jornada, cada uno con sus talleres en el orden en que llegan. Con hasta `max` días, todos,
 * también los que aún no tienen talleres (para agregarles uno); más larga, solo los que tienen. Los talleres sin fecha o
 * fuera de sus días (un borrador a medias) van aparte, en `sinDia`.
 */
export function talleresPorDia<W extends { date: string }>(
  j: Pick<JornadaRango, 'fecha_inicio' | 'fecha_fin'>,
  talleres: W[],
  max = 14,
): { dias: { fecha: string, talleres: W[] }[], sinDia: W[] } {
  const n = diasDeJornada(j)
  const porFecha = new Map<string, W[]>(n <= max ? Array.from({ length: n }, (_, i) => [sumarDias(j.fecha_inicio, i), []]) : [])
  const sinDia: W[] = []
  for (const w of talleres) {
    if (!w.date || !fechaEnJornada(j, w.date)) {
      sinDia.push(w)
      continue
    }
    porFecha.set(w.date, [...(porFecha.get(w.date) ?? []), w])
  }
  const dias = [...porFecha.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, lista]) => ({ fecha, talleres: lista }))
  return { dias, sinDia }
}

/** Las jornadas que pasan por un día, ordenadas por inicio (para marcar el día en la vista de mes). */
export function jornadasDelDia<J extends JornadaRango>(jornadas: J[], fecha: string): J[] {
  return jornadas.filter(j => fechaEnJornada(j, fecha)).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
}

export interface BandaSemana<J extends JornadaRango> {
  jornada: J
  desde: number          // columna de la semana donde empieza (1 = lunes … 7 = domingo)
  hasta: number          // columna donde termina, incluida
  empiezaAntes: boolean  // viene de la semana anterior
  sigueDespues: boolean  // continúa la semana siguiente
}

// Las bandas de la vista de semana: por cada jornada que toca la semana que empieza en `lunes`,
// las columnas que abarca. Una jornada más larga que la semana se recorta a sus bordes y lo dice
// (`empiezaAntes`, `sigueDespues`). Ordenadas por inicio y, a igual inicio, la más larga primero.
export function bandasSemana<J extends JornadaRango>(jornadas: J[], lunes: string): BandaSemana<J>[] {
  const domingo = sumarDias(lunes, 6)
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
  return jornadas
    .filter(j => j.fecha_inicio <= domingo && j.fecha_fin >= lunes)
    .map((jornada) => {
      const empiezaAntes = jornada.fecha_inicio < lunes
      const sigueDespues = jornada.fecha_fin > domingo
      const desde = empiezaAntes ? 1 : dias.indexOf(jornada.fecha_inicio) + 1
      const hasta = sigueDespues ? 7 : dias.indexOf(jornada.fecha_fin) + 1
      return { jornada, desde, hasta, empiezaAntes, sigueDespues }
    })
    .sort((a, b) => a.jornada.fecha_inicio.localeCompare(b.jornada.fecha_inicio) || diasDeJornada(b.jornada) - diasDeJornada(a.jornada))
}

/** Cada banda en su fila, la primera libre: dos jornadas que no se cruzan en la semana comparten fila; las que se cruzan
 *  bajan a la siguiente. Filas desde 1, en el orden en que llegan (bandasSemana). */
export function filasDeBandas<B extends { desde: number, hasta: number }>(bandas: B[]): (B & { fila: number })[] {
  const finDeFila: number[] = []
  return bandas.map((b) => {
    let fila = finDeFila.findIndex(fin => fin < b.desde)
    if (fila === -1) fila = finDeFila.push(b.hasta) - 1
    else finDeFila[fila] = b.hasta
    return { ...b, fila: fila + 1 }
  })
}
