// Fechas de la base. Las columnas `date` llegan como 'YYYY-MM-DD': son un día del calendario, sin
// hora ni zona. `new Date('2026-10-16')` las lee como medianoche UTC y en América salen con un día
// menos; aquí se leen como medianoche local. Los `timestamptz` son un instante y se muestran en la
// hora local, como siempre.
//
// «Hoy» también es local: `new Date().toISOString().slice(0, 10)` da el día en UTC, que en
// Guatemala ya es mañana desde las 18:00.

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/

function dosCifras(n: number) {
  return String(n).padStart(2, '0')
}

/** Un día del calendario como 'YYYY-MM-DD', en la zona local. */
export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`
}

/** Hoy (o dentro de `dias`) como 'YYYY-MM-DD' local: para comparar con columnas `date` y para los `min` de los campos de fecha. */
export function hoyLocal(dias = 0, ahora = new Date()): string {
  return isoLocal(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + dias))
}

/** Un valor de la base como Date: una fecha sin hora, a medianoche local; un instante, tal cual. */
export function aFecha(valor: string): Date {
  if (SOLO_FECHA.test(valor)) {
    const [y, m, d] = valor.split('-').map(Number)
    return new Date(y!, m! - 1, d!)
  }
  return new Date(valor)
}

/** «16 oct 2026» / «Oct 16, 2026». */
export function fechaCorta(valor: string, locale: string): string {
  return aFecha(valor).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Un instante con su hora local, sin el año: «1 nov, 10:32» / «Nov 1, 10:32 AM». */
export function fechaHora(valor: string, locale: string): string {
  return aFecha(valor).toLocaleString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Días desde hoy hasta un día del calendario: 0 es hoy, negativo si ya pasó. */
export function diasHasta(fecha: string, ahora = new Date()): number {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  return Math.round((aFecha(fecha.slice(0, 10)).getTime() - hoy.getTime()) / 86_400_000)
}

/** El final (23:59:59 local) del día elegido en un campo de fecha, como instante: «vence el 25» vale todo el 25. */
export function finDelDia(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y!, m! - 1, d!, 23, 59, 59).toISOString()
}
