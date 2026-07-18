// Datos compartidos del storyboard "Piernas Fuertes" (actividad física).
// Misma filosofía que beans.ts/eggs.ts: los datos canónicos de los EJERCICIOS
// viven acá y se traducen UNA vez; las escenas piden warmupFor(locale) /
// energyFor(locale) / coordStepsFor(locale) / cooldownFor(locale) y reciben
// vistas con strings planos.
//
// Cada movimiento declara sus frames de PoseGuide (cómo se demuestra), su
// tempo, su duración y su dato de saber (por qué le hace bien al cuerpo).
// El niño IMITA el movimiento en el espacio real — la pantalla solo guía.

import { tr, type Localized } from '~/types/i18n'
import type { PoseFrame } from '~/primitives/PoseGuide/PoseGuide.types'
import type { KidVariant } from '~/sprites/kid-poses'

/* ── Tipos ──────────────────────────────────────────────────────────────────── */

export type MoveTint = 'yellow' | 'red' | 'green' | 'blue'

/** Forma canónica (autoría): campos de texto Localized. */
export interface MoveDef {
  id: string
  /** Nombre corto del ejercicio ("Marcha suave" / "Soft march") */
  name: Localized
  /** Demo del movimiento (PoseGuide) */
  frames: PoseFrame[]
  /** ms por cuadro de la demo */
  interval: number
  /** Duración del ejercicio en segundos */
  duration: number
  /** Beat del ritmo en ms (solo ejercicios dinámicos) */
  beatMs?: number
  /** Quién demuestra el ejercicio (niño/niña se alternan en el taller) */
  variant: KidVariant
  /** Tinte de identidad (sp-card--*) */
  tint: MoveTint
  /** Acento del tinte (camiseta del niño, resaltados) */
  color: string
  /** Dato de saber (Tarjeta de Saber) — HTML con resaltado inline */
  factHtml: Localized
  /** Dato de saber hablado (kid auto-narra) */
  factVoice: Localized
  points: number
}

/** Vista resuelta a un idioma — strings planos. */
export interface Move extends Omit<MoveDef, 'name' | 'factHtml' | 'factVoice'> {
  name: string
  factHtml: string
  factVoice: string
}

/* ── Motricidad: despertar el cuerpo (suave, sin beat) ─────────────────────── */

export const WARMUP_MOVES: MoveDef[] = [
  {
    id: 'marcha-suave',
    variant: 'boy',
    name: { es: 'Marcha suave', en: 'Soft march' },
    frames: [{ pose: 'march' }, { pose: 'stand' }, { pose: 'march', mirror: true }, { pose: 'stand' }],
    interval: 640,
    duration: 12,
    tint: 'yellow',
    color: '#c49b2a',
    factHtml: {
      es: 'Marchar despacio <span style="color:#c49b2a; font-weight: 900;">despierta las piernas</span> y prepara el cuerpo para moverse.',
      en: 'Marching slowly <span style="color:#c49b2a; font-weight: 900;">wakes up the legs</span> and gets the body ready to move.',
    },
    factVoice: {
      es: '¡Muy bien! Marchar despacio despierta las piernas y prepara el cuerpo para moverse.',
      en: 'Great! Marching slowly wakes up the legs and gets the body ready to move.',
    },
    points: 10,
  },
  {
    id: 'rodillas-suaves',
    variant: 'girl',
    name: { es: 'Doblar rodillas', en: 'Bend the knees' },
    frames: [{ pose: 'stand' }, { pose: 'squat' }],
    interval: 700,
    duration: 12,
    tint: 'green',
    color: '#4a9068',
    factHtml: {
      es: 'Doblar las rodillas despacio <span style="color:#4a9068; font-weight: 900;">cuida las articulaciones</span> antes de ejercicios más activos.',
      en: 'Bending the knees slowly <span style="color:#4a9068; font-weight: 900;">takes care of the joints</span> before more active exercises.',
    },
    factVoice: {
      es: '¡Muy bien! Doblar las rodillas despacio cuida las articulaciones antes de ejercicios más activos.',
      en: 'Great! Bending the knees slowly takes care of the joints before more active exercises.',
    },
    points: 10,
  },
  {
    id: 'brazos-arriba',
    variant: 'boy',
    name: { es: 'Brazos arriba', en: 'Arms up' },
    // Tijera lateral: abajo → T lateral → arriba → T lateral (las manos
    // dibujan el arco por los LADOS, nunca pegadas al cuerpo)
    frames: [{ pose: 'stand' }, { pose: 'arms-side' }, { pose: 'stretch-up' }, { pose: 'arms-side' }],
    interval: 480,
    duration: 12,
    tint: 'blue',
    color: '#2680ae',
    factHtml: {
      es: 'Subir los brazos lento y <span style="color:#2680ae; font-weight: 900;">respirar tranquilo</span> ayuda a mantener una postura firme.',
      en: 'Raising the arms slowly and <span style="color:#2680ae; font-weight: 900;">breathing calmly</span> helps keep a steady posture.',
    },
    factVoice: {
      es: '¡Muy bien! Subir los brazos lento y respirar tranquilo ayuda a mantener una postura firme.',
      en: 'Great! Raising the arms slowly and breathing calmly helps keep a steady posture.',
    },
    points: 10,
  },
]

/* ── Resistencia: rondas de energía (moderado, con beat) ───────────────────── */

export const ENERGY_MOVES: MoveDef[] = [
  {
    id: 'rodillas-arriba',
    variant: 'girl',
    name: { es: 'Rodillas arriba', en: 'Knees up' },
    frames: [{ pose: 'knee-up' }, { pose: 'stand' }, { pose: 'knee-up', mirror: true }, { pose: 'stand' }],
    // Rep = rodilla arriba + abajo (2 cuadros): el beat marca cada rodilla
    interval: 420,
    duration: 15,
    beatMs: 840,
    tint: 'red',
    color: '#b82838',
    factHtml: {
      es: 'Con las rodillas arriba el <span style="color:#b82838; font-weight: 900;">corazón late más fuerte</span> y lleva energía a todo el cuerpo.',
      en: 'With knees up the <span style="color:#b82838; font-weight: 900;">heart beats stronger</span> and sends energy to the whole body.',
    },
    factVoice: {
      es: '¡Muy bien! Con las rodillas arriba el corazón late más fuerte y lleva energía a todo el cuerpo.',
      en: 'Great! With knees up the heart beats stronger and sends energy to the whole body.',
    },
    points: 10,
  },
  {
    id: 'saltitos-suaves',
    variant: 'boy',
    name: { es: 'Saltitos suaves', en: 'Soft hops' },
    // Ciclo completo del salto: agacharse → volar → aterrizar de pie → agacharse
    frames: [{ pose: 'squat' }, { pose: 'jump' }, { pose: 'stand' }],
    // Rep = agacharse + volar + aterrizar (3 cuadros): el beat marca cada salto
    interval: 380,
    duration: 15,
    beatMs: 1140,
    tint: 'yellow',
    color: '#c49b2a',
    factHtml: {
      es: 'Los saltitos suaves hacen <span style="color:#c49b2a; font-weight: 900;">piernas más fuertes</span>. Caer con las rodillas dobladas las protege.',
      en: 'Soft hops build <span style="color:#c49b2a; font-weight: 900;">stronger legs</span>. Landing with bent knees protects them.',
    },
    factVoice: {
      es: '¡Muy bien! Los saltitos suaves hacen piernas más fuertes. Caer con las rodillas dobladas las protege.',
      en: 'Great! Soft hops build stronger legs. Landing with bent knees protects them.',
    },
    points: 10,
  },
  {
    id: 'pasos-laterales',
    variant: 'girl',
    name: { es: 'Pasos laterales', en: 'Side steps' },
    frames: [{ pose: 'side-step' }, { pose: 'stand' }, { pose: 'side-step', mirror: true }, { pose: 'stand' }],
    // Rep = paso a un lado + volver (2 cuadros): el beat marca cada paso
    interval: 460,
    duration: 15,
    beatMs: 920,
    tint: 'green',
    color: '#4a9068',
    factHtml: {
      es: 'Moverse de lado a lado sin parar entrena la <span style="color:#4a9068; font-weight: 900;">resistencia</span>: el cuerpo aguanta más sin cansarse.',
      en: 'Moving side to side without stopping trains <span style="color:#4a9068; font-weight: 900;">endurance</span>: the body lasts longer without getting tired.',
    },
    factVoice: {
      es: '¡Muy bien! Moverse de lado a lado sin parar entrena la resistencia: el cuerpo aguanta más sin cansarse.',
      en: 'Great! Moving side to side without stopping trains endurance: the body lasts longer without getting tired.',
    },
    points: 10,
  },
]

/* ── Coordinación: coreografías (secuencias de movimientos encadenados) ────── */
// Coordinación motora REAL: el personaje ejecuta una secuencia de ~3 movimientos
// seguidos en UNA sola demo y el niño la realiza con su cuerpo. Cada secuencia
// se autora como segmentos (nombre + frames); el resolver concatena los frames
// en una cadena única para PoseGuide y guarda los límites para que la escena
// muestre el nombre del movimiento en curso.

/** Un movimiento dentro de la coreografía (segmento de la cadena). */
export interface CoordMoveDef {
  name: Localized
  frames: PoseFrame[]
}

export interface CoordSeqDef {
  id: string
  /** Nombre de la coreografía ("Salta y estira") */
  title: Localized
  moves: CoordMoveDef[]
  /** ms por cuadro de la cadena */
  interval: number
  /** Segundos de ¡MI TURNO! (la demo se repite en bucle mientras corre) */
  duration: number
  variant: KidVariant
  tint: MoveTint
  color: string
}

/** Vista resuelta: cadena concatenada + índice de inicio de cada segmento. */
export interface CoordSeq extends Omit<CoordSeqDef, 'title' | 'moves'> {
  title: string
  moves: { name: string, frames: PoseFrame[] }[]
  /** Todos los frames encadenados (la coreografía completa, en orden) */
  chain: PoseFrame[]
  /** Índice del primer frame de cada segmento dentro de `chain` */
  bounds: number[]
}

// Cada segmento abre/cierra cerca de 'stand' para que el tween entre
// movimientos fluya sin saltos. 2 repeticiones por movimiento (legible).
export const COORD_SEQS: CoordSeqDef[] = [
  {
    id: 'salta-y-estira',
    title: { es: 'Salta y estira', en: 'Jump and stretch' },
    moves: [
      { name: { es: 'Salto', en: 'Jump' }, frames: [{ pose: 'stand' }, { pose: 'jump' }, { pose: 'stand' }, { pose: 'jump' }] },
      { name: { es: 'Brazos arriba', en: 'Arms up' }, frames: [{ pose: 'arms-side' }, { pose: 'stretch-up' }, { pose: 'arms-side' }, { pose: 'stretch-up' }] },
      { name: { es: 'Sentadilla', en: 'Squat' }, frames: [{ pose: 'stand' }, { pose: 'squat' }, { pose: 'stand' }, { pose: 'squat' }] },
    ],
    interval: 560,
    duration: 14,
    variant: 'girl',
    tint: 'yellow',
    color: '#c49b2a',
  },
  {
    id: 'marcha-y-rodilla',
    title: { es: 'Marcha y rodilla', en: 'March and knee' },
    moves: [
      { name: { es: 'Marcha', en: 'March' }, frames: [{ pose: 'march' }, { pose: 'stand' }, { pose: 'march', mirror: true }, { pose: 'stand' }] },
      { name: { es: 'Rodilla arriba', en: 'Knee up' }, frames: [{ pose: 'knee-up' }, { pose: 'stand' }, { pose: 'knee-up', mirror: true }, { pose: 'stand' }] },
      { name: { es: 'Salto', en: 'Jump' }, frames: [{ pose: 'jump' }, { pose: 'stand' }, { pose: 'jump' }, { pose: 'stand' }] },
    ],
    interval: 540,
    duration: 14,
    variant: 'boy',
    tint: 'red',
    color: '#b82838',
  },
  {
    id: 'pasos-laterales',
    title: { es: 'Pasos laterales', en: 'Side steps' },
    moves: [
      { name: { es: 'Izquierda', en: 'Left' }, frames: [{ pose: 'side-step', mirror: true }, { pose: 'stand' }, { pose: 'side-step', mirror: true }, { pose: 'stand' }] },
      { name: { es: 'Sentadilla', en: 'Squat' }, frames: [{ pose: 'squat' }, { pose: 'stand' }, { pose: 'squat' }, { pose: 'stand' }] },
      { name: { es: 'Derecha', en: 'Right' }, frames: [{ pose: 'side-step' }, { pose: 'stand' }, { pose: 'side-step' }, { pose: 'stand' }] },
    ],
    interval: 560,
    duration: 14,
    variant: 'girl',
    tint: 'blue',
    color: '#2680ae',
  },
]

/* ── Recuperación: estiramientos suaves (lento, sin beat) ──────────────────── */

export const COOLDOWN_MOVES: MoveDef[] = [
  {
    id: 'estirar-alto',
    variant: 'girl',
    name: { es: 'Estirar alto', en: 'Stretch tall' },
    // Misma tijera lateral que el calentamiento, a ritmo de estiramiento
    frames: [{ pose: 'stand' }, { pose: 'arms-side' }, { pose: 'stretch-up' }, { pose: 'arms-side' }],
    interval: 620,
    duration: 10,
    tint: 'blue',
    color: '#2680ae',
    factHtml: {
      es: 'Estirar despacio <span style="color:#2680ae; font-weight: 900;">relaja los músculos</span> después del esfuerzo.',
      en: 'Stretching slowly <span style="color:#2680ae; font-weight: 900;">relaxes the muscles</span> after the effort.',
    },
    factVoice: {
      es: '¡Muy bien! Estirar despacio relaja los músculos después del esfuerzo.',
      en: 'Great! Stretching slowly relaxes the muscles after the effort.',
    },
    points: 10,
  },
  {
    id: 'abrir-brazos',
    variant: 'boy',
    name: { es: 'Abrir los brazos', en: 'Open the arms' },
    frames: [{ pose: 'stand' }, { pose: 'breathe' }],
    interval: 1000,
    duration: 10,
    tint: 'green',
    color: '#4a9068',
    factHtml: {
      es: 'Abrir los brazos y soltar el aire ayuda al <span style="color:#4a9068; font-weight: 900;">corazón a volver a la calma</span>.',
      en: 'Opening the arms and letting the air out helps the <span style="color:#4a9068; font-weight: 900;">heart return to calm</span>.',
    },
    factVoice: {
      es: '¡Muy bien! Abrir los brazos y soltar el aire ayuda al corazón a volver a la calma.',
      en: 'Great! Opening the arms and letting the air out helps the heart return to calm.',
    },
    points: 10,
  },
]

/* ── Resolvers ──────────────────────────────────────────────────────────────── */

function moveFor(locale: string) {
  return (m: MoveDef): Move => ({
    ...m,
    name: tr(m.name, locale),
    factHtml: tr(m.factHtml, locale),
    factVoice: tr(m.factVoice, locale),
  })
}

export function warmupFor(locale: string): Move[] {
  return WARMUP_MOVES.map(moveFor(locale))
}

export function energyFor(locale: string): Move[] {
  return ENERGY_MOVES.map(moveFor(locale))
}

export function cooldownFor(locale: string): Move[] {
  return COOLDOWN_MOVES.map(moveFor(locale))
}

export function coordSeqsFor(locale: string): CoordSeq[] {
  return COORD_SEQS.map((s) => {
    const moves = s.moves.map(m => ({ name: tr(m.name, locale), frames: m.frames }))
    const chain: PoseFrame[] = []
    const bounds: number[] = []
    for (const m of moves) {
      bounds.push(chain.length)
      chain.push(...m.frames)
    }
    return { ...s, title: tr(s.title, locale), moves, chain, bounds }
  })
}
