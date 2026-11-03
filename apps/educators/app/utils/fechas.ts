// Fechas legibles en el idioma de la interfaz (lógica pura, sin Nuxt; tests en tests/fechas.test.ts).

const intl = (locale: string) => (locale === 'en' ? 'en-US' : 'es-MX')

/** 'YYYY-MM-DD' → fecha local (sin desfases de zona horaria). */
function aFecha(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

/** «martes, 14 de octubre». */
export function fechaLarga(iso: string, locale: string): string {
  return aFecha(iso).toLocaleDateString(intl(locale), { weekday: 'long', day: 'numeric', month: 'long' })
}

/**
 * Los días de una jornada: «25 oct – 13 nov»; «12 – 16 oct» si es el mismo mes; «12 oct» si dura
 * un día; con el año si cambia. En inglés, el mes delante («Oct 25 – Nov 13»).
 */
export function rangoDeDias(inicio: string, fin: string, locale: string): string {
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(intl(locale), o).replace('.', '')
  const ini = aFecha(inicio)
  const end = aFecha(fin)
  const mismoAnio = ini.getFullYear() === end.getFullYear()
  const diaYMes = (d: Date) => fmt(d, mismoAnio ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
  if (inicio === fin) return diaYMes(ini)
  if (mismoAnio && ini.getMonth() === end.getMonth()) {
    const mes = fmt(end, { month: 'short' })
    return locale === 'en' ? `${mes} ${ini.getDate()} – ${end.getDate()}` : `${ini.getDate()} – ${end.getDate()} ${mes}`
  }
  return `${diaYMes(ini)} – ${diaYMes(end)}`
}
