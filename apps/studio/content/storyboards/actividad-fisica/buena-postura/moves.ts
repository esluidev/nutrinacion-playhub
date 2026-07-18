// Datos compartidos del storyboard "Creciendo con Buena Postura" (actividad
// física). Misma filosofía que piernas-fuertes/moves.ts: los datos canónicos
// de los EJERCICIOS viven acá y se traducen UNA vez; las escenas piden
// holdsFor(locale) / leaderCuesFor(locale) / treeStagesFor(locale) y
// reciben vistas con strings planos.
//
// Tema: postura saludable — espalda firme, hombros sueltos, equilibrio.
// Cada dato de saber conecta el ejercicio con el cuidado postural.
// El niño IMITA el movimiento en el espacio real — la pantalla solo guía.

import { tr, type Localized } from '~/types/i18n'
import type { PoseFrame } from '~/primitives/PoseGuide/PoseGuide.types'
import type { KidPose, KidVariant } from '~/sprites/kid-poses'

/* ── Tipos (idénticos al patrón del pilar) ──────────────────────────────────── */

export type MoveTint = 'yellow' | 'red' | 'green' | 'blue'

/** Forma canónica (autoría): campos de texto Localized. */
export interface MoveDef {
  id: string
  name: Localized
  frames: PoseFrame[]
  interval: number
  duration: number
  beatMs?: number
  variant: KidVariant
  tint: MoveTint
  color: string
  factHtml: Localized
  factVoice: Localized
  points: number
}

/** Vista resuelta a un idioma — strings planos. */
export interface Move extends Omit<MoveDef, 'name' | 'factHtml' | 'factVoice'> {
  name: string
  factHtml: string
  factVoice: string
}

/* ── Quédate Así (motricidad): posturas SOSTENIDAS con metáfora ─────────────── */
// Preparación corporal por control estático: el niño adopta la postura del
// personaje y la SOSTIENE quieto mientras el anillo se llena. Progresión fija
// de lo fácil al equilibrio. "Mantener la espalda firme durante algunos
// segundos" (brief) — holds, no repeticiones.

export interface HoldMoveDef {
  id: string
  /** Nombre-metáfora ("El avión") — la imagen mental que sostiene la postura */
  name: Localized
  pose: KidPose
  /** Segundos que se sostiene la postura */
  holdSeconds: number
  tint: MoveTint
  color: string
  factHtml: Localized
  factVoice: Localized
  points: number
}

export interface HoldMove extends Omit<HoldMoveDef, 'name' | 'factHtml' | 'factVoice'> {
  name: string
  factHtml: string
  factVoice: string
}

export const HOLD_MOVES: HoldMoveDef[] = [
  {
    id: 'el-avion',
    name: { es: 'El avión', en: 'The airplane' },
    pose: 'arms-side',
    holdSeconds: 8,
    tint: 'blue',
    color: '#2680ae',
    factHtml: {
      es: 'Con los brazos abiertos y quietos como un avión, los <span style="color:#2680ae; font-weight: 900;">hombros y la espalda se hacen fuertes</span>.',
      en: 'With arms open and still like an airplane, the <span style="color:#2680ae; font-weight: 900;">shoulders and back get strong</span>.',
    },
    factVoice: {
      es: '¡Muy bien! Con los brazos abiertos y quietos como un avión, los hombros y la espalda se hacen fuertes.',
      en: 'Great! With arms open and still like an airplane, the shoulders and back get strong.',
    },
    points: 10,
  },
  {
    id: 'la-montana',
    name: { es: 'La montaña', en: 'The mountain' },
    pose: 'stretch-up',
    holdSeconds: 8,
    tint: 'yellow',
    color: '#c49b2a',
    factHtml: {
      es: 'Estirarte alto y quieto como una montaña <span style="color:#c49b2a; font-weight: 900;">alarga tu espalda</span> y mejora tu postura.',
      en: 'Stretching tall and still like a mountain <span style="color:#c49b2a; font-weight: 900;">lengthens your back</span> and improves your posture.',
    },
    factVoice: {
      es: '¡Muy bien! Estirarte alto y quieto como una montaña alarga tu espalda y mejora tu postura.',
      en: 'Great! Stretching tall and still like a mountain lengthens your back and improves your posture.',
    },
    points: 10,
  },
  {
    id: 'la-silla',
    name: { es: 'La silla', en: 'The chair' },
    pose: 'squat',
    holdSeconds: 8,
    tint: 'red',
    color: '#b82838',
    factHtml: {
      es: 'Sostener la silla invisible hace <span style="color:#b82838; font-weight: 900;">piernas fuertes</span> que ayudan a tu espalda.',
      en: 'Holding the invisible chair builds <span style="color:#b82838; font-weight: 900;">strong legs</span> that help your back.',
    },
    factVoice: {
      es: '¡Muy bien! Sostener la silla invisible hace piernas fuertes que ayudan a tu espalda.',
      en: 'Great! Holding the invisible chair builds strong legs that help your back.',
    },
    points: 10,
  },
  {
    id: 'el-flamenco',
    name: { es: 'El flamenco', en: 'The flamingo' },
    pose: 'balance',
    holdSeconds: 10,
    tint: 'green',
    color: '#4a9068',
    factHtml: {
      es: 'Quedarte en un pie como un flamenco entrena el <span style="color:#4a9068; font-weight: 900;">equilibrio</span> que te mantiene derecho.',
      en: 'Standing on one foot like a flamingo trains the <span style="color:#4a9068; font-weight: 900;">balance</span> that keeps you upright.',
    },
    factVoice: {
      es: '¡Muy bien! Quedarte en un pie como un flamenco entrena el equilibrio que te mantiene derecho.',
      en: 'Great! Standing on one foot like a flamingo trains the balance that keeps you upright.',
    },
    points: 10,
  },
]

/* ── El Semáforo (resistencia): verde/amarillo/rojo — los guiones de ronda
   viven en la escena (son de la mecánica); acá solo la demo compartida ────── */

/** Marcha de la demo del semáforo (la escena varía el tempo por luz). */
export const SEMAFORO_MARCH: PoseFrame[] = [
  { pose: 'march' }, { pose: 'stand' }, { pose: 'march', mirror: true }, { pose: 'stand' },
]

/* ── Sigue al Líder (coordinación): cues en tiempo real ─────────────────────── */

export interface LeaderCueDef {
  id: string
  name: Localized
  frames: PoseFrame[]
}

export interface LeaderCue extends Omit<LeaderCueDef, 'name'> {
  name: string
}

export const LEADER_CUES: LeaderCueDef[] = [
  { id: 'marcha', name: { es: 'Marcha', en: 'March' }, frames: [{ pose: 'march' }, { pose: 'stand' }, { pose: 'march', mirror: true }, { pose: 'stand' }] },
  { id: 'salto', name: { es: 'Salto', en: 'Jump' }, frames: [{ pose: 'stand' }, { pose: 'jump' }, { pose: 'stand' }, { pose: 'jump' }] },
  { id: 'rodilla', name: { es: 'Rodilla arriba', en: 'Knee up' }, frames: [{ pose: 'knee-up' }, { pose: 'stand' }, { pose: 'knee-up', mirror: true }, { pose: 'stand' }] },
  { id: 'izquierda', name: { es: 'Izquierda', en: 'Left' }, frames: [{ pose: 'side-step', mirror: true }, { pose: 'stand' }, { pose: 'side-step', mirror: true }, { pose: 'stand' }] },
  { id: 'derecha', name: { es: 'Derecha', en: 'Right' }, frames: [{ pose: 'side-step' }, { pose: 'stand' }, { pose: 'side-step' }, { pose: 'stand' }] },
  { id: 'brazos', name: { es: 'Brazos arriba', en: 'Arms up' }, frames: [{ pose: 'arms-side' }, { pose: 'stretch-up' }, { pose: 'arms-side' }, { pose: 'stretch-up' }] },
]

/* ── Crece como un Árbol (recuperación): etapas de crecimiento ──────────────── */

export interface TreeStageDef {
  id: string
  name: Localized
  pose: KidPose
}

export interface TreeStage extends Omit<TreeStageDef, 'name'> {
  name: string
}

// La respiración hace crecer al personaje: una etapa por ciclo de la burbuja.
// Cierra en la pose de árbol (equilibrio) — postura firme y calma.
export const TREE_STAGES: TreeStageDef[] = [
  { id: 'semilla', name: { es: 'Semilla', en: 'Seed' }, pose: 'squat' },
  { id: 'brote', name: { es: 'Brote', en: 'Sprout' }, pose: 'stand' },
  { id: 'ramas', name: { es: 'Ramas abiertas', en: 'Open branches' }, pose: 'arms-side' },
  { id: 'arbol-alto', name: { es: 'Árbol alto', en: 'Tall tree' }, pose: 'stretch-up' },
  { id: 'arbol-viento', name: { es: 'Árbol en calma', en: 'Calm tree' }, pose: 'balance' },
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

export function holdsFor(locale: string): HoldMove[] {
  return HOLD_MOVES.map(h => ({
    ...h,
    name: tr(h.name, locale),
    factHtml: tr(h.factHtml, locale),
    factVoice: tr(h.factVoice, locale),
  }))
}

export function leaderCuesFor(locale: string): LeaderCue[] {
  return LEADER_CUES.map(c => ({ ...c, name: tr(c.name, locale) }))
}

export function treeStagesFor(locale: string): TreeStage[] {
  return TREE_STAGES.map(t => ({ ...t, name: tr(t.name, locale) }))
}
