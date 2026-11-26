import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'
import type { SceneGuide } from '@playhub/ui/app/utils/runner-contract'

// Lógica pura de los talleres del educador (sin Nuxt): fechas, estados, lo que se hace en cada momento (ensayar,
// ejecutar, reportar), la portada y el reporte del educador. Tiene tests en tests/talleres.test.ts.

export type Participacion = 'baja' | 'media' | 'alta'
export type Claridad = 'poco_clara' | 'clara' | 'muy_clara'

/** El reporte del educador, «Reportar»: cómo fue el taller (constitución: medición de grupo, nunca de persona). */
export interface Cierre {
  calificacion: number // 1–5: cómo salió la sesión, según el facilitador
  asistentes: number
  // Cuántas eran niñas y cuántos niños (tarea 021): números del grupo, no personas. En una audiencia
  // cerrada hacen falta y suman los asistentes; en una abierta (una feria) van los dos en null.
  ninas: number | null
  ninos: number | null
  participacion: Participacion
  claridad: Claridad
  costo: string
  faltoMaterial: string
  // Cuántos dispositivos estaban conectados al terminar (tarea 021), si los hubo: lo cuenta la base al terminar
  // (educador_terminar) y el educador lo puede corregir.
  dispositivos: number | null
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
  // `clave`: su identidad (el `key` de su storyboard.json), la que abre el runner (/play/<clave>)
  storyboard: { clave: string, titulo: string, eje: string, slug: string, edicion: string, escenas: number, duracion: number | null }
  organizacion: { id: number, nombre: string }
  jornada: Jornada | null
  fecha: string // YYYY-MM-DD
  horaInicio: string
  horaFin: string // '' si no tiene
  lugar: string // dónde: el lugar y su espacio («Sede central · Aula 3A»); '' si no tiene
  grupo: string // la audiencia («2.º B», «Público general»); '' si no tiene
  grupoAbierto: boolean // audiencia abierta: el cierre va solo con el total
  asistentesEstimados: number | null
  idioma: Idioma // el del contenido: el runner se abre en este idioma, no en el de la interfaz
  modalidad: Modalidad
  estadoWorkshop: EstadoWorkshop
  motivoCancelacion: string | null
  // Cuántos dispositivos se unieron por la conexión del taller (tarea 013); rellena el cierre.
  dispositivosUnidos?: number
  // Ya se ejecutó hasta el final (el runner dijo «terminado»): toca reportarlo.
  terminado?: boolean
  cierre?: Cierre
}

/** El feedback tal como lo devuelve la base (educador_workshops y educador_guardar_feedback). */
export interface CierreBase {
  calificacion: number
  asistentes: number
  ninas?: number | null
  ninos?: number | null
  participacion: string
  claridad: string
  costo: string | null
  faltoMaterial: string | null
  dispositivos?: number | null
}

/** Un workshop tal como lo devuelve educador_workshops (supabase/migrations/0006; el título, 0016). */
export interface WorkshopBase {
  id: string | number
  titulo?: string | null
  storyboard: { clave: string, titulo: string | null, eje: string, categoria?: string, slug: string, edicion: string, escenas: number, duracion: number | null }
  organizacion: { id: number, nombre: string }
  jornada: { id: number, nombre: string, ubicacion: string, fecha_inicio: string, fecha_fin: string } | null
  fecha: string
  horaInicio: string | null
  horaFin: string | null
  lugar: string | null // dentro de una jornada, el espacio («Aula 3A»); suelto, el lugar y su espacio
  grupo: string | null // el nombre de la audiencia
  grupoAbierto?: boolean // audiencia abierta (tarea 021)
  asistentesEstimados: number | null
  idioma: string
  modalidad: string
  estadoWorkshop: string
  motivoCancelacion: string | null
  estado?: string // la asignación: pendiente, en_curso o completado
  iniciadoEn?: string | null
  terminadoEn?: string | null
  dispositivosUnidos?: number | null
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
    ninas: c.ninas ?? null,
    ninos: c.ninos ?? null,
    participacion: elegir(c.participacion, PARTICIPACIONES, 'media'),
    claridad: elegir(c.claridad, CLARIDADES, 'clara'),
    costo: c.costo ?? '',
    faltoMaterial: c.faltoMaterial ?? '',
    dispositivos: c.dispositivos ?? null,
  }
}

/** Dónde es el taller: dentro de una jornada, su lugar y el espacio del taller; suelto, ya viene compuesto. */
export function lugarDelTaller(lugar: string | null, jornada: { ubicacion: string } | null): string {
  return [jornada?.ubicacion, lugar].map(x => x?.trim()).filter(Boolean).join(' · ')
}

/** Un workshop de la base como `Taller`: los vacíos de texto quedan en '' y los valores desconocidos, en su respaldo. */
export function tallerDesdeBase(w: WorkshopBase): Taller {
  const s = w.storyboard
  return {
    id: String(w.id),
    titulo: w.titulo?.trim() || s.titulo || s.slug,
    storyboard: { clave: s.clave, titulo: s.titulo || s.slug, eje: s.eje, slug: s.slug, edicion: s.edicion, escenas: s.escenas, duracion: s.duracion ?? null },
    organizacion: { id: w.organizacion.id, nombre: w.organizacion.nombre },
    jornada: w.jornada
      ? { id: w.jornada.id, nombre: w.jornada.nombre, ubicacion: w.jornada.ubicacion, fechaInicio: w.jornada.fecha_inicio, fechaFin: w.jornada.fecha_fin }
      : null,
    fecha: w.fecha,
    horaInicio: w.horaInicio ?? '',
    horaFin: w.horaFin ?? '',
    lugar: lugarDelTaller(w.lugar, w.jornada),
    grupo: w.grupo?.trim() ?? '',
    grupoAbierto: w.grupoAbierto ?? false,
    asistentesEstimados: w.asistentesEstimados ?? null,
    idioma: w.idioma === 'en' ? 'en' : 'es',
    modalidad: elegir(w.modalidad, MODALIDADES, 'presencial'),
    estadoWorkshop: elegir(w.estadoWorkshop, ESTADOS_WORKSHOP, 'publicado'),
    motivoCancelacion: w.motivoCancelacion?.trim() || null,
    ...(typeof w.dispositivosUnidos === 'number' ? { dispositivosUnidos: w.dispositivosUnidos } : {}),
    ...(w.terminadoEn ? { terminado: true } : {}),
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

/** Cancelado (lo decidió la organización); si no, cerrado (ya reportado), hoy, próximo o por cerrar (ya pasó y falta reportarlo). */
export function estadoDe(taller: Taller, hoy = new Date()): EstadoTaller {
  if (taller.estadoWorkshop === 'cancelado') return 'cancelado'
  if (taller.cierre) return 'cerrado'
  const dia = isoDia(hoy)
  if (taller.fecha === dia) return 'hoy'
  return taller.fecha > dia ? 'proximo' : 'por_cerrar'
}

/**
 * Lo que se hace con un taller, con el verbo de su botón: **ensayar** (el runner sin el grupo: no queda anotado, sin
 * dispositivos ni reporte), **ejecutar** (con el grupo, el día del taller: la base lo anota como empezado, abre la
 * conexión para los dispositivos y al terminar pide el reporte) y **reportar** (cómo fue: asistentes, participación,
 * claridad; con eso se arma el reporte de la organización en Admin).
 */
export type Accion = 'ejecutar' | 'ensayar' | 'reportar'

/**
 * Las acciones de un taller en su momento, la principal primero: antes de su día se ensaya; el día del taller se ejecuta
 * (y se puede ensayar); ya ejecutado hasta el final, o pasado su día, se reporta. Uno cancelado o ya reportado no tiene
 * ninguna: su reporte se corrige desde su ficha.
 */
export function accionesDe(taller: Taller, hoy = new Date()): Accion[] {
  const estado = estadoDe(taller, hoy)
  if (estado === 'cancelado' || estado === 'cerrado') return []
  if (estado === 'proximo') return ['ensayar']
  if (estado === 'hoy') return taller.terminado ? ['reportar'] : ['ejecutar', 'ensayar']
  return ['reportar']
}

/** Se ejecuta con el grupo solo el día del taller y mientras no se haya reportado. */
export function puedeEjecutarse(taller: Taller, hoy = new Date()): boolean {
  return accionesDe(taller, hoy).includes('ejecutar')
}

/** Ensayar no anota nada: cualquier día, salvo un taller cancelado. */
export function puedeEnsayarse(taller: Taller): boolean {
  return taller.estadoWorkshop !== 'cancelado'
}

/** Se reporta desde su día (y se corrige después); uno cancelado o que aún no llega, no. */
export function puedeReportarse(taller: Taller, hoy = new Date()): boolean {
  return taller.estadoWorkshop !== 'cancelado' && taller.fecha <= isoDia(hoy)
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

/** Los talleres seguidos del mismo día, juntos y en el orden en que llegan. */
function porDias(talleres: Taller[]): DiaAgenda[] {
  const dias: DiaAgenda[] = []
  for (const t of talleres) {
    const ultimo = dias.at(-1)
    if (ultimo?.dia === t.fecha) ultimo.talleres.push(t)
    else dias.push({ dia: t.fecha, talleres: [t] })
  }
  return dias
}

/**
 * La portada, «Mis talleres»: los de hoy por hora; los que falta reportar (ya pasaron sin reporte), del más reciente al
 * más antiguo; los próximos, día por día; y los anteriores (reportados o cancelados), día por día del más reciente al
 * más antiguo y, dentro de cada día, por hora. Un cancelado sigue en su día y nunca falta reportarlo.
 */
export function portada(talleres: Taller[], hoy = new Date()) {
  const dia = isoDia(hoy)
  const orden = [...talleres].sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))
  const pasados = orden.filter(t => t.fecha < dia)
  return {
    hoy: orden.filter(t => t.fecha === dia),
    porReportar: pasados.filter(t => estadoDe(t, hoy) === 'por_cerrar').reverse(),
    proximos: porDias(orden.filter(t => t.fecha > dia)),
    anteriores: porDias(pasados.filter(t => estadoDe(t, hoy) !== 'por_cerrar')).reverse(),
  }
}

/** El estado que ya dice un día de la semana o del mes, para no repetirlo en cada taller: hoy o próximo. */
export function obvioDelDia(dia: string, hoy: string): EstadoTaller | undefined {
  if (dia === hoy) return 'hoy'
  return dia > hoy ? 'proximo' : undefined
}

/** Talleres por día ('YYYY-MM-DD'), ordenados por hora: las vistas Semana y Mes. */
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

/**
 * Un cierre está completo con la calificación, los asistentes y las dos observaciones. En una audiencia
 * cerrada, cuántas eran niñas y cuántos niños es opcional (Luis, 2026-11-26: el total es lo principal y
 * el educador puede no haberse fijado); si van, los dos y sumando los asistentes. En una abierta, los dos
 * van vacíos (tarea 021). Los dispositivos son opcionales; si van, un entero desde cero.
 */
export function cierreCompleto(c: Partial<Cierre>, abierto = false): c is Cierre {
  const calificada = typeof c.calificacion === 'number' && c.calificacion >= 1 && c.calificacion <= 5
  const base = calificada && typeof c.asistentes === 'number' && c.asistentes >= 0 && Boolean(c.participacion) && Boolean(c.claridad)
  if (!base || (c.dispositivos != null && !(Number.isInteger(c.dispositivos) && c.dispositivos >= 0))) return false
  if (c.ninas == null && c.ninos == null) return true
  if (abierto) return false
  return typeof c.ninas === 'number' && typeof c.ninos === 'number' && c.ninas >= 0 && c.ninos >= 0
    && c.ninas + c.ninos === c.asistentes
}

/**
 * Las niñas y los niños de una audiencia cerrada, de los asistentes (Luis, 2026-11-26: el total es lo principal; el
 * desglose, casi opcional, por si el educador no se fijó). Sin ninguno, sin desglose (null); con uno, el otro es el
 * resto; con los dos, tienen que sumar el total. Si no cuadra (más que el total, o no suman), false.
 */
export function desgloseDe(total: number | undefined | null, ninas: number | undefined | null, ninos: number | undefined | null): { ninas: number, ninos: number } | null | false {
  const conNinas = typeof ninas === 'number'
  const conNinos = typeof ninos === 'number'
  if (!conNinas && !conNinos) return null
  if (typeof total !== 'number') return false
  const a = conNinas ? ninas : total - (ninos as number)
  const b = conNinos ? ninos : total - (ninas as number)
  return a >= 0 && b >= 0 && a + b === total ? { ninas: a, ninos: b } : false
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

/**
 * URL del runner de Player para incrustarlo (docs/runner.md), en el idioma del workshop: en modo `educator` para
 * ejecutarlo y, con `ensayo`, en modo `rehearsal`: sin dispositivos y sin mezclar su escena con la del taller de verdad.
 */
export function urlDelTaller(playerUrl: string, taller: Taller, ensayo = false): string {
  return runnerUrl(playerUrl, { clave: taller.storyboard.clave, modo: ensayo ? 'rehearsal' : 'educator', idioma: taller.idioma })
}

/**
 * La lista con los talleres de hoy recién pedidos en lugar de los que tenía de hoy (la agenda abierta se pone al día
 * cada minuto pidiendo solo los de hoy). Si no cambió nada, la misma lista, para no volver a pintar. `seFueron` dice si
 * alguno de los que eran de hoy ya no está: se movió a otro día o se lo quitaron, y hay que pedir la lista entera para
 * verlo donde quedó.
 */
export function conLosDeHoy(talleres: Taller[], deHoy: Taller[], hoy: string): { lista: Taller[], seFueron: boolean } {
  const antes = talleres.filter(t => t.fecha === hoy)
  const porId = (a: Taller, b: Taller) => a.id.localeCompare(b.id)
  if (JSON.stringify([...antes].sort(porId)) === JSON.stringify([...deHoy].sort(porId))) return { lista: talleres, seFueron: false }
  const ahora = new Set(deHoy.map(t => t.id))
  return {
    lista: [...talleres.filter(t => t.fecha !== hoy && !ahora.has(t.id)), ...deHoy],
    seFueron: antes.some(t => !ahora.has(t.id)),
  }
}
