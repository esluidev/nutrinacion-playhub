import type { Point } from '../board'

// ---- Dónde cae lo que se suelta y qué se agarra, en coordenadas del tablero. Una plantilla no escribe a mano la
// cuenta de «si el punto está dentro de esta caja»: declara sus zonas y pregunta.
//   - `zoneAt`: la zona válida bajo el dedo, con un margen alrededor (el imán: no hace falta atinar al borde). Si el
//     punto cae en dos, gana la que tiene el centro más cerca.
//   - `nearest`: de varias piezas que se pisan, la que está más cerca del dedo, hasta un alcance. ----

/** Una zona rectangular del tablero: su esquina, su tamaño y a qué corresponde. */
export interface Zone<T> { id: T, x: number, y: number, w: number, h: number }

export function zoneAt<T>(point: Point, zones: readonly Zone<T>[], margin = 0): T | null {
  let found: T | null = null
  let closest = Infinity
  for (const zone of zones) {
    const inside = point.x >= zone.x - margin && point.x <= zone.x + zone.w + margin
      && point.y >= zone.y - margin && point.y <= zone.y + zone.h + margin
    if (!inside) continue
    const distance = Math.hypot(point.x - (zone.x + zone.w / 2), point.y - (zone.y + zone.h / 2))
    if (distance < closest) { found = zone.id; closest = distance }
  }
  return found
}

export function nearest<T>(point: Point, items: readonly T[], at: (item: T) => Point, reach = Infinity): T | null {
  let found: T | null = null
  let closest = reach
  for (const item of items) {
    const p = at(item)
    const distance = Math.hypot(point.x - p.x, point.y - p.y)
    if (distance <= closest) { found = item; closest = distance }
  }
  return found
}
