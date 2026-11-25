// Reglas puras del reporte (tarea 021): lo que devuelve `reporte_talleres` (0005) ordenado para
// pintarlo. La base ya calcula el resumen, el alcance y la dosis por audiencia en cada lugar; aquí
// solo se agrupa lo que se dibuja: las sesiones de cada audiencia, las semanas, los temas, la
// participación y la claridad, y lo que contaron los educadores. Fechas como 'YYYY-MM-DD'. Tests en
// tests/reporte.test.ts. Nada es de una persona: todo es del grupo.

import { sumarDias } from './jornadas'
import { diaDeSemana } from './programas'

export type Nivel = 'ALTA' | 'MEDIA' | 'BAJA'
export type Claridad = 'MUY_CLARA' | 'CLARA' | 'POCO_CLARA'

export interface FilaReporte {
  id: number
  fecha: string | null
  estado: string
  storyboard_id: number
  lugar_id: number | null
  comunidad_id: number | null
  grupo_audiencia_id: number | null
  abierto: boolean
  programa_id: number | null
  jornada_id: number | null
  asistentes_estimados: number | null
  realizado: boolean
  asistentes: number | null
  ninas: number | null
  ninos: number | null
  calificacion: number | null
  participacion: Nivel | null
  claridad: Claridad | null
  minutos: number | null
  dispositivos: number | null
  segundos_dispositivos: number      // tiempo conectado de los dispositivos aprobados (tarea 013)
  dificultades: string[]
  material: string[]
  motivo_cancelacion: string | null
}

export interface CambioReporte {
  workshop_id: number
  tipo: 'CANCELADO' | 'REPROGRAMADO' | 'FECHA_CAMBIADA'
  fecha_anterior: string | null
  fecha_nueva: string | null
  motivo: string | null
  cuando: string
}

export interface ParReporte {
  grupo_audiencia_id: number
  lugar_id: number
  previstas: number
  recibidas: number
  ninas: number | null
  ninos: number | null
}

export interface Reporte {
  resumen: {
    previstos: number
    realizados: number
    cancelados: number
    sin_realizar: number
    asistencias: number
    asistencias_abiertos: number
    minutos: number
    talleres_con_dispositivos: number
    dispositivos: number
    segundos_dispositivos: number
  }
  alcance: { total: number, ninas: number, ninos: number }
  pares: ParReporte[]
  talleres: FilaReporte[]
  historial: CambioReporte[]
}

// ── Sesiones de cada audiencia en cada lugar ──────────────────────────────────
// Realizado (lima), realizado en otra fecha (cielo: se reprogramó), sin realizar (coral: cancelado
// o pasó sin darse) o por venir (neutro).
export type Celda = 'hecho' | 'otra' | 'no' | 'pendiente'

export function estadoCelda(f: Pick<FilaReporte, 'id' | 'estado' | 'realizado'>, reprogramados: Set<number>): Celda {
  if (f.realizado) return reprogramados.has(f.id) ? 'otra' : 'hecho'
  if (f.estado === 'CANCELADO' || f.estado === 'FINALIZADO') return 'no'
  return 'pendiente'
}

export interface FilaMatriz {
  grupoAudienciaId: number
  lugarId: number
  abierto: boolean
  celdas: { taller: FilaReporte, celda: Celda }[]
  recibidas: number
}

/** Una fila por audiencia en cada lugar, con sus talleres por fecha; por su primera fecha. */
export function matriz(talleres: FilaReporte[], historial: CambioReporte[]): FilaMatriz[] {
  const reprogramados = new Set(historial.filter(h => h.tipo === 'REPROGRAMADO').map(h => h.workshop_id))
  const filas = new Map<string, FilaMatriz>()
  for (const t of talleres) {
    if (t.grupo_audiencia_id === null || t.lugar_id === null) continue
    const clave = `${t.grupo_audiencia_id}|${t.lugar_id}`
    const fila = filas.get(clave) ?? { grupoAudienciaId: t.grupo_audiencia_id, lugarId: t.lugar_id, abierto: t.abierto, celdas: [], recibidas: 0 }
    const celda = estadoCelda(t, reprogramados)
    fila.celdas.push({ taller: t, celda })
    if (t.realizado) fila.recibidas++
    filas.set(clave, fila)
  }
  const porFecha = (a: { taller: FilaReporte }, b: { taller: FilaReporte }) => (a.taller.fecha ?? '').localeCompare(b.taller.fecha ?? '')
  return [...filas.values()]
    .map(f => ({ ...f, celdas: [...f.celdas].sort(porFecha) }))
    .sort((a, b) => (a.celdas[0]?.taller.fecha ?? '').localeCompare(b.celdas[0]?.taller.fecha ?? '') || a.grupoAudienciaId - b.grupoAudienciaId)
}

// ── Asistencia semana a semana ────────────────────────────────────────────────
/** El lunes de la semana de una fecha. */
export function lunesDe(fecha: string): string {
  return sumarDias(fecha, 1 - diaDeSemana(fecha))
}

export interface Semana {
  lunes: string
  asistencias: number
  realizados: number
}

/** Las asistencias de los talleres realizados, por semana, de la primera a la última (también las vacías). */
export function porSemana(talleres: FilaReporte[]): Semana[] {
  const hechos = talleres.filter(t => t.realizado && t.fecha)
  if (!hechos.length) return []
  const mapa = new Map<string, Semana>()
  for (const t of hechos) {
    const lunes = lunesDe(t.fecha!)
    const s = mapa.get(lunes) ?? { lunes, asistencias: 0, realizados: 0 }
    s.asistencias += t.asistentes ?? 0
    s.realizados++
    mapa.set(lunes, s)
  }
  const lunes = [...mapa.keys()].sort()
  const semanas: Semana[] = []
  for (let l = lunes[0]!; l <= lunes.at(-1)!; l = sumarDias(l, 7)) semanas.push(mapa.get(l) ?? { lunes: l, asistencias: 0, realizados: 0 })
  return semanas
}

// ── Cómo salieron ─────────────────────────────────────────────────────────────
export function distribucion<K extends string>(valores: (K | null)[], claves: readonly K[]): Record<K, number> {
  const r = Object.fromEntries(claves.map(k => [k, 0])) as Record<K, number>
  for (const v of valores) if (v !== null && v in r) r[v]++
  return r
}

export function participacion(talleres: FilaReporte[]) {
  return distribucion(talleres.filter(t => t.realizado).map(t => t.participacion), ['ALTA', 'MEDIA', 'BAJA'] as const)
}

export function claridad(talleres: FilaReporte[]) {
  return distribucion(talleres.filter(t => t.realizado).map(t => t.claridad), ['MUY_CLARA', 'CLARA', 'POCO_CLARA'] as const)
}

/** La calificación media de los realizados (null si no hay). */
export function calificacionMedia(talleres: FilaReporte[]): number | null {
  const notas = talleres.filter(t => t.realizado && t.calificacion !== null).map(t => t.calificacion!)
  return notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null
}

// ── Lo que se trabajó ─────────────────────────────────────────────────────────
export interface Tema {
  storyboardId: number
  previstos: number
  realizados: number
  alta: number
  pocoClara: number
  muyClara: number
}

/** Por storyboard: cuántos talleres, cuántos se dieron y cómo salieron; en el orden en que aparecen. */
export function porTema(talleres: FilaReporte[]): Tema[] {
  const ordenados = [...talleres].sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))
  const mapa = new Map<number, Tema>()
  for (const t of ordenados) {
    const tema = mapa.get(t.storyboard_id) ?? { storyboardId: t.storyboard_id, previstos: 0, realizados: 0, alta: 0, pocoClara: 0, muyClara: 0 }
    tema.previstos++
    if (t.realizado) {
      tema.realizados++
      if (t.participacion === 'ALTA') tema.alta++
      if (t.claridad === 'POCO_CLARA') tema.pocoClara++
      if (t.claridad === 'MUY_CLARA') tema.muyClara++
    }
    mapa.set(t.storyboard_id, tema)
  }
  return [...mapa.values()]
}

// ── Lo que contaron los educadores ────────────────────────────────────────────
/** El material que faltó, juntando lo que se escribió igual (sin mayúsculas ni espacios de más), de más a menos. */
export function materialAgrupado(talleres: FilaReporte[]): { texto: string, veces: number, talleres: number[] }[] {
  const mapa = new Map<string, { texto: string, veces: number, talleres: number[] }>()
  for (const t of talleres) {
    for (const m of t.material) {
      const texto = m.trim()
      if (!texto) continue
      const clave = texto.toLowerCase().replace(/\s+/g, ' ').replace(/[.。]+$/, '')
      const g = mapa.get(clave) ?? { texto, veces: 0, talleres: [] }
      g.veces++
      if (!g.talleres.includes(t.id)) g.talleres.push(t.id)
      mapa.set(clave, g)
    }
  }
  return [...mapa.values()].sort((a, b) => b.veces - a.veces || a.texto.localeCompare(b.texto))
}

/** Lo que más le costó al grupo, con su taller, por fecha. */
export function dificultades(talleres: FilaReporte[]): { texto: string, taller: FilaReporte }[] {
  return [...talleres]
    .sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))
    .flatMap(t => t.dificultades.map(d => d.trim()).filter(Boolean).map(texto => ({ texto, taller: t })))
}

// ── Incidencias ───────────────────────────────────────────────────────────────
export type TipoIncidencia = CambioReporte['tipo'] | 'SIN_CIERRE'

export interface Incidencia {
  tipo: TipoIncidencia
  workshopId: number
  fecha: string | null        // la fecha que tenía (o la del taller, si pasó sin cierre)
  fechaNueva: string | null
  motivo: string | null
}

/** Lo que no se dio como estaba previsto: el historial (cancelado, reprogramado, cambio de fecha) y
 *  los finalizados sin cierre, por fecha; con la misma fecha, en el orden en que pasó. */
export function incidencias(talleres: FilaReporte[], historial: CambioReporte[]): Incidencia[] {
  const r: Incidencia[] = historial.map(h => ({ tipo: h.tipo, workshopId: h.workshop_id, fecha: h.fecha_anterior, fechaNueva: h.fecha_nueva, motivo: h.motivo }))
  for (const t of talleres) {
    if (t.estado === 'FINALIZADO' && !t.realizado) r.push({ tipo: 'SIN_CIERRE', workshopId: t.id, fecha: t.fecha, fechaNueva: null, motivo: null })
  }
  return r.sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))
}
