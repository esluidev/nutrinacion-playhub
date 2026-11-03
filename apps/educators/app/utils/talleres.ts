import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'
import type { SceneGuide } from '@playhub/ui/app/utils/runner-contract'

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

/** La jornada de la que forma parte un taller: un lugar y uno o varios días. El educador solo la ve. */
export interface Jornada {
  id: number
  nombre: string
  ubicacion: string // el lugar; sus talleres lo heredan
  fechaInicio: string // YYYY-MM-DD
  fechaFin: string // el mismo día que el inicio si dura uno
}

export interface Taller {
  id: string
  titulo: string // el que le puso la organización; si no tiene, el del storyboard
  storyboard: { titulo: string, eje: string, slug: string, edicion: string, escenas: number, duracion: number | null }
  organizacion: { id: number, nombre: string }
  jornada: Jornada | null
  fecha: string // YYYY-MM-DD
  horaInicio: string
  horaFin: string // '' si no tiene
  lugar: string // dónde: el de la jornada y su detalle («Sede central · Aula 3A»), o el suyo; '' si no tiene
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

/** Un workshop tal como lo devuelve educador_workshops (supabase/migrations/0006; el título, 0016). */
export interface WorkshopBase {
  id: string | number
  titulo?: string | null
  storyboard: { titulo: string | null, eje: string, categoria?: string, slug: string, edicion: string, escenas: number, duracion: number | null }
  organizacion: { id: number, nombre: string }
  jornada: { id: number, nombre: string, ubicacion: string, fecha_inicio: string, fecha_fin: string } | null
  fecha: string
  horaInicio: string | null
  horaFin: string | null
  lugar: string | null // dentro de una jornada, el detalle («Aula 3A»); suelto, el lugar
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

/** Dónde es el taller: dentro de una jornada, su lugar y el detalle del taller; suelto, el suyo. */
export function lugarDelTaller(lugar: string | null, jornada: { ubicacion: string } | null): string {
  return [jornada?.ubicacion, lugar].map(x => x?.trim()).filter(Boolean).join(' · ')
}

/** Un workshop de la base como `Taller`: los vacíos de texto quedan en '' y los valores desconocidos, en su respaldo. */
export function tallerDesdeBase(w: WorkshopBase): Taller {
  const s = w.storyboard
  return {
    id: String(w.id),
    titulo: w.titulo?.trim() || s.titulo || s.slug,
    storyboard: { titulo: s.titulo || s.slug, eje: s.eje, slug: s.slug, edicion: s.edicion, escenas: s.escenas, duracion: s.duracion ?? null },
    organizacion: { id: w.organizacion.id, nombre: w.organizacion.nombre },
    jornada: w.jornada
      ? { id: w.jornada.id, nombre: w.jornada.nombre, ubicacion: w.jornada.ubicacion, fechaInicio: w.jornada.fecha_inicio, fechaFin: w.jornada.fecha_fin }
      : null,
    fecha: w.fecha,
    horaInicio: w.horaInicio ?? '',
    horaFin: w.horaFin ?? '',
    lugar: lugarDelTaller(w.lugar, w.jornada),
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

/** Un workshop del modo demo (fixtures/talleres.json): la forma de la base con los días relativos a hoy, también los de su jornada. */
export interface WorkshopFixture extends Omit<WorkshopBase, 'fecha' | 'jornada'> {
  diaRelativo: number
  jornada: { id: number, nombre: string, ubicacion: string, diaInicioRelativo: number, diaFinRelativo: number } | null
}

/** Un workshop del fixture como `Taller`, con sus fechas (y las de su jornada) contadas desde `hoy`. */
export function tallerDesdeFixture(w: WorkshopFixture, hoy = new Date()): Taller {
  const { diaRelativo: offset, jornada, ...resto } = w
  return tallerDesdeBase({
    ...resto,
    fecha: diaRelativo(offset, hoy),
    jornada: jornada
      ? { id: jornada.id, nombre: jornada.nombre, ubicacion: jornada.ubicacion, fecha_inicio: diaRelativo(jornada.diaInicioRelativo, hoy), fecha_fin: diaRelativo(jornada.diaFinRelativo, hoy) }
      : null,
  })
}

/** Cancelado (lo decidió la organización); si no, cerrado (tiene su feedback), hoy, próximo o por cerrar (ya pasó y falta el feedback). */
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

/** «4 escenas · 30 min», sin la duración si el storyboard no la tiene. `escenas` y `minutos` dan el texto de cada cifra. */
export function escenasYDuracion(taller: Taller, escenas: (n: number) => string, minutos: (n: number) => string): string {
  const sb = taller.storyboard
  return [escenas(sb.escenas), sb.duracion ? minutos(sb.duracion) : ''].filter(Boolean).join(' · ')
}

export interface DiaAgenda {
  dia: string
  talleres: Taller[]
}

/**
 * La vista Día: los talleres de `dia`, por hora; lo que viene después, día por día; y lo que ya
 * pasó sin cierre (contado desde hoy, mire el día que mire), del más reciente al más antiguo. Un
 * cancelado sigue en su día y nunca queda por cerrar.
 */
export function agenda(talleres: Taller[], dia: string, hoy = new Date()) {
  const orden = [...talleres].sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))
  const despues: DiaAgenda[] = []
  for (const t of orden.filter(t => t.fecha > dia)) {
    const ultimo = despues.at(-1)
    if (ultimo?.dia === t.fecha) ultimo.talleres.push(t)
    else despues.push({ dia: t.fecha, talleres: [t] })
  }
  return {
    delDia: orden.filter(t => t.fecha === dia),
    despues,
    porCerrar: orden.filter(t => estadoDe(t, hoy) === 'por_cerrar').reverse(),
  }
}

/** Talleres por día ('YYYY-MM-DD'), ordenados por hora. */
export function talleresPorDia(talleres: Taller[]): Record<string, Taller[]> {
  const mapa: Record<string, Taller[]> = {}
  for (const t of [...talleres].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))) (mapa[t.fecha] ??= []).push(t)
  return mapa
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

/** Una escena de la guía como la da `educador_guia`: los campos del runner más su orden, su título y el material (0015). */
export interface EscenaGuia extends SceneGuide {
  order?: number
  title?: string
  material?: string
}

/** La guía de un taller, por carpeta de escena. Al runner se le pasa tal cual: descarta lo que no es de su contrato. */
export type GuiaTaller = Record<string, EscenaGuia>

/** Las escenas de la guía en su orden (sin orden, en el que llegan), con su número y su carpeta. */
export function escenasDeLaGuia(guia: GuiaTaller): (EscenaGuia & { carpeta: string, numero: number })[] {
  return Object.entries(guia)
    .map(([carpeta, escena], i) => ({ ...escena, carpeta, i }))
    .sort((a, b) => (a.order ?? a.i) - (b.order ?? b.i))
    .map(({ i: _, ...escena }, n) => ({ ...escena, numero: n + 1 }))
}

/** URL del runner de Player en modo educador, para incrustarlo (docs/runner.md), en el idioma del workshop. */
export function urlDelTaller(playerUrl: string, taller: Taller): string {
  return runnerUrl(playerUrl, { eje: taller.storyboard.eje, slug: taller.storyboard.slug, modo: 'educator', idioma: taller.idioma })
}
