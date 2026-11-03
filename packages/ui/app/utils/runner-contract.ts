// Contrato entre el runner de Player y las apps que lo incrustan en un iframe (docs/runner.md,
// decisión 004). Lo usan los dos lados: Player (el runner) y UiRunner (la app que lo muestra).
//
// - La URL dice qué cargar: storyboard, modo, idioma y escena.
// - La app manda `iniciar` con lo que solo ella tiene (la guía del educador). En la vista previa
//   (`preview`), además conduce: `ir` a una escena y `reiniciar` la actual.
// - El runner cuenta lo que pasa: listo, escena, terminado, salir y error.
//
// Los mensajes llevan canal y versión. Los cambios son aditivos: un campo nuevo es opcional y
// un `tipo` desconocido se ignora, así Player y cada app se despliegan sin coordinarse.

export const RUNNER_CHANNEL = 'playhub-runner'
export const RUNNER_VERSION = 1

/** `preview`: solo el escenario, para mirar un storyboard desde Admin; la app conduce con `ir` y `reiniciar`. */
export type RunnerMode = 'educator' | 'device' | 'home' | 'preview'

/** Guía del educador para una escena (decisión 002). Solo texto. */
export interface SceneGuide {
  verb?: string
  subtitle?: string
  description?: string
  objective?: string
  mechanic?: string
  pedagogy?: string
  questions?: string
  psychology?: string
  science?: string
  notDoing?: string
  tips?: string
}

/** La guía de un storyboard, por carpeta de escena. */
export type StoryboardGuide = Record<string, SceneGuide>

/** Runner → app. */
export type RunnerEvent =
  | { tipo: 'listo', storyboard: string, modo: RunnerMode, idioma: string, escenas: number }
  | { tipo: 'escena', indice: number, carpeta: string }
  | { tipo: 'terminado' }
  | { tipo: 'salir', indice: number, carpeta: string }
  | { tipo: 'error', codigo: 'no-encontrado' }

/** App → runner. */
export type RunnerCommand =
  | { tipo: 'iniciar', guia?: StoryboardGuide }
  /** Vista previa: ir a una escena, por su número (desde 0) o por su carpeta. */
  | { tipo: 'ir', indice: number }
  | { tipo: 'ir', escena: string }
  /** Vista previa: reiniciar la escena actual. */
  | { tipo: 'reiniciar' }

export type RunnerEnvelope<T> = T & { canal: typeof RUNNER_CHANNEL, v: number }

/** Envuelve un mensaje con canal y versión para postMessage. */
export function runnerMessage<T extends RunnerEvent | RunnerCommand>(message: T): RunnerEnvelope<T> {
  return { ...message, canal: RUNNER_CHANNEL, v: RUNNER_VERSION }
}

const MODES: RunnerMode[] = ['educator', 'device', 'home', 'preview']
const GUIDE_FIELDS: (keyof SceneGuide)[] = ['verb', 'subtitle', 'description', 'objective', 'mechanic', 'pedagogy', 'questions', 'psychology', 'science', 'notDoing', 'tips']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown, max = 200): value is string => typeof value === 'string' && value.length > 0 && value.length <= max
const isIndex = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

function envelope(data: unknown): Record<string, unknown> | null {
  if (!isRecord(data) || data.canal !== RUNNER_CHANNEL) return null
  if (typeof data.v !== 'number' || data.v < 1) return null
  return data
}

/** Lee un mensaje del runner. Devuelve null si no es del canal o no tiene la forma esperada. */
export function parseRunnerEvent(data: unknown): RunnerEvent | null {
  const m = envelope(data)
  if (!m) return null
  switch (m.tipo) {
    case 'listo':
      if (!isText(m.storyboard) || !MODES.includes(m.modo as RunnerMode) || !isText(m.idioma, 16) || !isIndex(m.escenas)) return null
      return { tipo: 'listo', storyboard: m.storyboard, modo: m.modo as RunnerMode, idioma: m.idioma, escenas: m.escenas }
    case 'escena':
    case 'salir':
      if (!isIndex(m.indice) || !isText(m.carpeta)) return null
      return { tipo: m.tipo, indice: m.indice, carpeta: m.carpeta }
    case 'terminado':
      return { tipo: 'terminado' }
    case 'error':
      return m.codigo === 'no-encontrado' ? { tipo: 'error', codigo: 'no-encontrado' } : null
    default:
      return null
  }
}

/** Solo los campos de texto conocidos de cada escena; lo demás se descarta. */
function parseGuide(value: unknown): StoryboardGuide | null {
  if (!isRecord(value)) return null
  const guide: StoryboardGuide = {}
  for (const [folder, scene] of Object.entries(value)) {
    if (!isText(folder) || !isRecord(scene)) continue
    const clean: SceneGuide = {}
    for (const field of GUIDE_FIELDS) {
      if (isText(scene[field], 20_000)) clean[field] = scene[field] as string
    }
    guide[folder] = clean
  }
  return guide
}

/** Lee una orden de la app. Devuelve null si no es del canal o no tiene la forma esperada. */
export function parseRunnerCommand(data: unknown): RunnerCommand | null {
  const m = envelope(data)
  if (!m) return null
  if (m.tipo === 'iniciar') {
    if (m.guia === undefined) return { tipo: 'iniciar' }
    const guia = parseGuide(m.guia)
    return guia ? { tipo: 'iniciar', guia } : null
  }
  if (m.tipo === 'ir') {
    if (isIndex(m.indice)) return { tipo: 'ir', indice: m.indice }
    return isText(m.escena) ? { tipo: 'ir', escena: m.escena } : null
  }
  if (m.tipo === 'reiniciar') return { tipo: 'reiniciar' }
  return null
}

/** Orígenes de una lista separada por comas o espacios («https://educator.nutrinacion.com, …»). */
export function runnerOrigins(list: string | undefined): string[] {
  const origins = new Set<string>()
  for (const item of (list ?? '').split(/[\s,]+/)) {
    if (!item) continue
    try {
      const url = new URL(item)
      if (url.protocol === 'https:' || url.protocol === 'http:') origins.add(url.origin)
    }
    catch { /* no es una URL: se ignora */ }
  }
  return [...origins]
}

/** URL del runner en Player para un storyboard. */
export function runnerUrl(playerUrl: string, options: { eje: string, slug: string, modo: RunnerMode, idioma?: string, escena?: string }): string {
  const url = new URL(`play/${encodeURIComponent(options.eje)}/${encodeURIComponent(options.slug)}`, `${playerUrl.replace(/\/+$/, '')}/`)
  url.searchParams.set('mode', options.modo)
  if (options.idioma) url.searchParams.set('lang', options.idioma)
  if (options.escena) url.searchParams.set('escena', options.escena)
  return url.toString()
}
