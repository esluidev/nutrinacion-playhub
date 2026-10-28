// Calendario del educador (lógica pura, sin Nuxt; tests en tests/calendario.test.ts): semanas de
// lunes a domingo, la cuadrícula del mes y el texto del rango, como en la app original.
import { isoDia } from './talleres'

export type VistaCalendario = 'semana' | 'mes'

/** 'YYYY-MM-DD' → fecha local (sin desfases de zona horaria). */
export function aFecha(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

/** El lunes de la semana de `iso`. */
export function inicioDeSemana(iso: string): string {
  const d = aFecha(iso)
  const desdeLunes = (d.getDay() + 6) % 7
  return isoDia(new Date(d.getFullYear(), d.getMonth(), d.getDate() - desdeLunes))
}

/** Los siete días (lunes a domingo) de la semana de `iso`. */
export function diasDeSemana(iso: string): string[] {
  const lunes = aFecha(inicioDeSemana(iso))
  return Array.from({ length: 7 }, (_, i) => isoDia(new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i)))
}

/** Semanas completas (lunes a domingo) que cubren el mes de `iso`; marca los días de otros meses. */
export function cuadriculaDelMes(iso: string): { iso: string, delMes: boolean }[][] {
  const d = aFecha(iso)
  const primero = isoDia(new Date(d.getFullYear(), d.getMonth(), 1))
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const semanas: { iso: string, delMes: boolean }[][] = []
  let lunes = inicioDeSemana(primero)
  while (aFecha(lunes) <= ultimo) {
    semanas.push(diasDeSemana(lunes).map(dia => ({ iso: dia, delMes: aFecha(dia).getMonth() === d.getMonth() })))
    const l = aFecha(lunes)
    lunes = isoDia(new Date(l.getFullYear(), l.getMonth(), l.getDate() + 7))
  }
  return semanas
}

/** Avanza o retrocede una semana o un mes (anterior/siguiente de la barra). */
export function moverRango(iso: string, vista: VistaCalendario, dir: 1 | -1): string {
  const d = aFecha(iso)
  return vista === 'semana'
    ? isoDia(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * dir))
    : isoDia(new Date(d.getFullYear(), d.getMonth() + dir, 1))
}

const intl = (locale: string) => (locale === 'en' ? 'en-US' : 'es-MX')

/** «12 – 18 oct 2026» (semana; con los dos meses si cruza) u «octubre 2026» (mes). */
export function textoDelRango(iso: string, vista: VistaCalendario, locale: string): string {
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(intl(locale), o).replace('.', '')
  if (vista === 'mes') return fmt(aFecha(iso), { month: 'long', year: 'numeric' })
  const dias = diasDeSemana(iso)
  const ini = aFecha(dias[0]!)
  const fin = aFecha(dias[6]!)
  const mesFin = fmt(fin, { month: 'short' })
  if (ini.getMonth() === fin.getMonth()) return `${ini.getDate()} – ${fin.getDate()} ${mesFin} ${fin.getFullYear()}`
  return `${ini.getDate()} ${fmt(ini, { month: 'short' })} – ${fin.getDate()} ${mesFin} ${fin.getFullYear()}`
}

/** Nombre corto del día («lun») y del mes en el idioma de la interfaz. */
export function diaCorto(iso: string, locale: string): string {
  return aFecha(iso).toLocaleDateString(intl(locale), { weekday: 'short' }).replace('.', '')
}

/** Iniciales de lunes a domingo para la cabecera de la cuadrícula. */
export function cabeceraSemana(locale: string): string[] {
  return diasDeSemana('2026-10-12').map(d => diaCorto(d, locale))
}
