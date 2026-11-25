// «Pertenece a», al programar un taller (tarea 023): una sola pregunta en lugar de dos pestañas y un selector de
// programa. Un taller va suelto, dentro de un programa (cae en sus fechas) o dentro de una jornada (toma su lugar, sus
// días y su programa). Las jornadas y los programas se crean en su sección; aquí solo se eligen. Puro y con tests.

import { rangoJornada } from './jornadas'

export type Pertenencia = { tipo: 'suelto' } | { tipo: 'programa', id: number } | { tipo: 'jornada', id: number }

interface ConFechas { id: number, nombre: string, fecha_inicio: string, fecha_fin: string }
interface JornadaElegible extends ConFechas { ubicacion: string }

/** La pertenencia de un taller por su jornada y su programa (la jornada manda: su programa es el de ella). */
export function pertenenciaDe(jornadaId: number | null, programaId: number | null): Pertenencia {
  if (jornadaId) return { tipo: 'jornada', id: jornadaId }
  if (programaId) return { tipo: 'programa', id: programaId }
  return { tipo: 'suelto' }
}

/** Su valor en el desplegable: «suelto», «p:3», «j:5». */
export function valorDePertenencia(p: Pertenencia): string {
  return p.tipo === 'suelto' ? 'suelto' : `${p.tipo === 'programa' ? 'p' : 'j'}:${p.id}`
}

/** Del desplegable a la jornada y el programa del taller. Uno que no se entiende vale como suelto. */
export function leerPertenencia(valor: string | number | null): { jornadaId: number | null, programaId: number | null } {
  const m = /^([pj]):(\d+)$/.exec(String(valor ?? ''))
  if (!m) return { jornadaId: null, programaId: null }
  const id = Number(m[2])
  return m[1] === 'j' ? { jornadaId: id, programaId: null } : { jornadaId: null, programaId: id }
}

/**
 * Las opciones: «Taller suelto»; los programas y las jornadas que no han terminado, cada grupo bajo su leyenda y por
 * su inicio. El ya elegido sale aunque haya terminado (para verlo elegido). Cada opción dice sus fechas y, la jornada,
 * su lugar: «Semana de la nutrición · Escuela Rural 2 · 3 mar – 7 mar».
 */
export function opcionesDePertenencia(
  programas: ConFechas[],
  jornadas: JornadaElegible[],
  hoy: string,
  elegida: Pertenencia,
  textos: { suelto: string, programas: string, jornadas: string },
  locale: string,
): { value: string, label: string, group?: string, pinned?: boolean }[] {
  const vigente = (x: ConFechas, tipo: 'programa' | 'jornada') => x.fecha_fin >= hoy || (elegida.tipo === tipo && elegida.id === x.id)
  const porInicio = (a: ConFechas, b: ConFechas) => a.fecha_inicio.localeCompare(b.fecha_inicio) || a.nombre.localeCompare(b.nombre)
  return [
    { value: 'suelto', label: textos.suelto, pinned: true },
    ...programas.filter(p => vigente(p, 'programa')).sort(porInicio)
      .map(p => ({ value: `p:${p.id}`, label: `${p.nombre} · ${rangoJornada(p, locale)}`, group: textos.programas })),
    ...jornadas.filter(j => vigente(j, 'jornada')).sort(porInicio)
      .map(j => ({ value: `j:${j.id}`, label: [j.nombre, j.ubicacion, rangoJornada(j, locale)].filter(Boolean).join(' · '), group: textos.jornadas })),
  ]
}
