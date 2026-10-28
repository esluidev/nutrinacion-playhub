import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'

// Lógica pura de los talleres del educador (sin Nuxt): fechas, estados, agrupación y el
// cierre del facilitador. Tiene tests en tests/talleres.test.ts.

export type Participacion = 'baja' | 'media' | 'alta'
export type Claridad = 'poco_clara' | 'clara' | 'muy_clara'

/** Cierre estructurado del facilitador (constitución: medición de grupo, nunca de persona). */
export interface Cierre {
  calificacion: number // 1–5: cómo salió la sesión, según el facilitador
  asistentes: number
  participacion: Participacion
  claridad: Claridad
  costo: string
  faltoMaterial: string
}

export type Idioma = 'es' | 'en'
export type Modalidad = 'presencial' | 'remoto' | 'hibrido'
export type EstadoWorkshop = 'publicado' | 'finalizado' | 'cancelado'

export interface Taller {
  id: string
  storyboard: { titulo: string, eje: string, slug: string, edicion: string, escenas: number, duracion: number | null }
  comunidad: { id: number, nombre: string }
  fecha: string // YYYY-MM-DD
  horaInicio: string
  horaFin: string // '' si no tiene
  lugar: string // '' si no tiene
  grupo: string // '' si no tiene
  asistentesEstimados: number | null
  idioma: Idioma // el del contenido: el runner se abre en este idioma, no en el de la interfaz
  modalidad: Modalidad
  estadoWorkshop: EstadoWorkshop
  motivoCancelacion: string | null
  cierre?: Cierre
}

/** El feedback tal como lo devuelve la base (educador_workshops y educador_guardar_feedback). */
export interface CierreBase {
  calificacion: number
  asistentes: number
  participacion: string
  claridad: string
  costo: string | null
  faltoMaterial: string | null
}

/** Un workshop tal como lo devuelve educador_workshops (supabase/migrations/0006). */
export interface WorkshopBase {
  id: string | number
  storyboard: { titulo: string | null, eje: string, categoria?: string, slug: string, edicion: string, escenas: number, duracion: number | null }
  comunidad: { id: number, nombre: string }
  fecha: string
  horaInicio: string | null
  horaFin: string | null
  lugar: string | null
  grupo: string | null
  asistentesEstimados: number | null
  idioma: string
  modalidad: string
  estadoWorkshop: string
  motivoCancelacion: string | null
  estado?: string // la asignación: pendiente, en_curso o completado
  iniciadoEn?: string | null
  terminadoEn?: string | null
  cierre: CierreBase | null
}

export type EstadoTaller = 'hoy' | 'proximo' | 'por_cerrar' | 'cerrado' | 'cancelado'

const MODALIDADES: Modalidad[] = ['presencial', 'remoto', 'hibrido']
const ESTADOS_WORKSHOP: EstadoWorkshop[] = ['publicado', 'finalizado', 'cancelado']
const PARTICIPACIONES: Participacion[] = ['baja', 'media', 'alta']
const CLARIDADES: Claridad[] = ['poco_clara', 'clara', 'muy_clara']

const elegir = <T extends string>(valor: string | null | undefined, opciones: T[], respaldo: T): T =>
  opciones.includes(valor as T) ? valor as T : respaldo

/** El feedback de la base, con los valores del tipo `Cierre`. */
export function cierreDesdeBase(c: CierreBase): Cierre {
  return {
    calificacion: c.calificacion,
    asistentes: c.asistentes,
    participacion: elegir(c.participacion, PARTICIPACIONES, 'media'),
    claridad: elegir(c.claridad, CLARIDADES, 'clara'),
    costo: c.costo ?? '',
    faltoMaterial: c.faltoMaterial ?? '',
  }
}

/** Un workshop de la base como `Taller`: los vacíos de texto quedan en '' y los valores desconocidos, en su respaldo. */
export function tallerDesdeBase(w: WorkshopBase): Taller {
  const s = w.storyboard
  return {
    id: String(w.id),
    storyboard: { titulo: s.titulo || s.slug, eje: s.eje, slug: s.slug, edicion: s.edicion, escenas: s.escenas, duracion: s.duracion ?? null },
    comunidad: { id: w.comunidad.id, nombre: w.comunidad.nombre },
    fecha: w.fecha,
    horaInicio: w.horaInicio ?? '',
    horaFin: w.horaFin ?? '',
    lugar: w.lugar?.trim() ?? '',
    grupo: w.grupo?.trim() ?? '',
    asistentesEstimados: w.asistentesEstimados ?? null,
    idioma: w.idioma === 'en' ? 'en' : 'es',
    modalidad: elegir(w.modalidad, MODALIDADES, 'presencial'),
    estadoWorkshop: elegir(w.estadoWorkshop, ESTADOS_WORKSHOP, 'publicado'),
    motivoCancelacion: w.motivoCancelacion?.trim() || null,
    ...(w.cierre ? { cierre: cierreDesdeBase(w.cierre) } : {}),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
export const isoDia = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** La fecha de un día relativo a `hoy` (0 = hoy, -1 = ayer). */
export function diaRelativo(offset: number, hoy = new Date()): string {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + offset)
  return isoDia(d)
}

/** Cancelado (lo decidió la comunidad); si no, cerrado (tiene su feedback), hoy, próximo o por cerrar (ya pasó y falta el feedback). */
export function estadoDe(taller: Taller, hoy = new Date()): EstadoTaller {
  if (taller.estadoWorkshop === 'cancelado') return 'cancelado'
  if (taller.cierre) return 'cerrado'
  const dia = isoDia(hoy)
  if (taller.fecha === dia) return 'hoy'
  return taller.fecha > dia ? 'proximo' : 'por_cerrar'
}

/** Un taller cancelado no se inicia ni recibe feedback. */
export function puedeIniciarse(taller: Taller): boolean {
  return taller.estadoWorkshop !== 'cancelado'
}

/** «10:00 – 10:30», o solo el inicio si no tiene fin. */
export function horario(taller: Taller): string {
  return taller.horaFin ? `${taller.horaInicio} – ${taller.horaFin}` : taller.horaInicio
}

/** «2.º B · 24 asistentes previstos», sin las partes que falten. `asistentes` da el texto de la cifra. */
export function grupoYAsistentes(taller: Taller, asistentes: (n: number) => string): string {
  return [taller.grupo, taller.asistentesEstimados !== null ? asistentes(taller.asistentesEstimados) : ''].filter(Boolean).join(' · ')
}

/** Orden de trabajo: lo de hoy y lo pendiente de cerrar primero, luego lo próximo y lo cerrado. Los cancelados, aparte: nunca quedan por cerrar. */
export function agruparTalleres(talleres: Taller[], hoy = new Date()) {
  const porHora = (a: Taller, b: Taller) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`)
  const de = (estado: EstadoTaller) => talleres.filter(t => estadoDe(t, hoy) === estado).sort(porHora)
  return {
    hoy: de('hoy'),
    porCerrar: de('por_cerrar'),
    proximos: de('proximo'),
    cerrados: de('cerrado').reverse(),
    cancelados: de('cancelado'),
  }
}

/** El PIN del educador o su código de activación: 6 dígitos (se ignoran espacios y guiones al escribirlo). */
export function normalizarCodigo(valor: string): string {
  return valor.replace(/[\s-]/g, '')
}

export function codigoValido(valor: string): boolean {
  return /^\d{6}$/.test(normalizarCodigo(valor))
}

export function correoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
}

/** Un cierre está completo con la calificación, los asistentes reales y las dos observaciones. */
export function cierreCompleto(c: Partial<Cierre>): c is Cierre {
  const calificada = typeof c.calificacion === 'number' && c.calificacion >= 1 && c.calificacion <= 5
  return calificada && typeof c.asistentes === 'number' && c.asistentes >= 0 && Boolean(c.participacion) && Boolean(c.claridad)
}

/** Talleres por día ('YYYY-MM-DD'), ordenados por hora. */
export function talleresPorDia(talleres: Taller[]): Record<string, Taller[]> {
  const mapa: Record<string, Taller[]> = {}
  for (const t of [...talleres].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))) (mapa[t.fecha] ??= []).push(t)
  return mapa
}

/** URL del runner de Player en modo educador, para incrustarlo (docs/runner.md), en el idioma del workshop. */
export function urlDelTaller(playerUrl: string, taller: Taller): string {
  return runnerUrl(playerUrl, { eje: taller.storyboard.eje, slug: taller.storyboard.slug, modo: 'educator', idioma: taller.idioma })
}
