// Datos canónicos del storyboard "La Insulina: Energía con Cuidado"
// (cuidado personal · diabetes). Misma filosofía que los moves.ts de los otros
// pilares: el contenido vive acá y se traduce UNA vez; las escenas piden
// energyRoundsFor(locale) / stretchesFor(locale) / dayMomentsFor(locale) /
// careStarsFor(locale) y reciben vistas con strings planos.
//
// Tono: tranquilo, cercano y positivo — el cuidado (horarios, refrigeración,
// acompañamiento adulto) se presenta como parte natural del bienestar.
// Principio: los niños DESCUBREN, no adivinan — cada acción enseña algo.

import { tr, type Localized } from '~/types/i18n'
import type { PoseFrame } from '~/primitives/PoseGuide/PoseGuide.types'
import type { KidVariant } from '~/sprites/kid-poses'

export type CareTint = 'yellow' | 'red' | 'green' | 'blue'

/* ── Descubrimiento: LA LLAVE DE LA ENERGÍA ─────────────────────────────────── */
// La insulina es una llave: abre la puerta para que la energía de la comida
// entre al cuerpo. Cada ronda abre la puerta de una actividad de la vida real.

export interface EnergyRoundDef {
  id: string
  /** Para qué entra la energía ("Para jugar") */
  name: Localized
  /** El personaje celebra la actividad al abrirse la puerta */
  frames: PoseFrame[]
  interval: number
  variant: KidVariant
  tint: CareTint
  color: string
  factHtml: Localized
  factVoice: Localized
}

export interface EnergyRound extends Omit<EnergyRoundDef, 'name' | 'factHtml' | 'factVoice'> {
  name: string
  factHtml: string
  factVoice: string
}

export const ENERGY_ROUNDS: EnergyRoundDef[] = [
  {
    id: 'jugar',
    name: { es: 'Para jugar', en: 'To play' },
    frames: [{ pose: 'stand' }, { pose: 'jump' }, { pose: 'stand' }, { pose: 'jump' }],
    interval: 520,
    variant: 'boy',
    tint: 'yellow',
    color: '#c49b2a',
    factHtml: {
      es: 'La insulina es como una llave: <span style="color:#c49b2a; font-weight: 900;">deja entrar la energía</span> de la comida para correr y jugar.',
      en: 'Insulin is like a key: it <span style="color:#c49b2a; font-weight: 900;">lets the energy in</span> from food so you can run and play.',
    },
    factVoice: {
      es: '¡Muy bien! La insulina es como una llave: deja entrar la energía de la comida para correr y jugar.',
      en: 'Great! Insulin is like a key: it lets the energy in from food so you can run and play.',
    },
  },
  {
    id: 'aprender',
    name: { es: 'Para aprender', en: 'To learn' },
    frames: [{ pose: 'stand' }, { pose: 'breathe' }, { pose: 'stand' }, { pose: 'breathe' }],
    interval: 640,
    variant: 'girl',
    tint: 'blue',
    color: '#2680ae',
    factHtml: {
      es: 'Con la energía que la insulina deja entrar, tu <span style="color:#2680ae; font-weight: 900;">cerebro puede pensar y aprender</span>.',
      en: 'With the energy insulin lets in, your <span style="color:#2680ae; font-weight: 900;">brain can think and learn</span>.',
    },
    factVoice: {
      es: '¡Muy bien! Con la energía que la insulina deja entrar, tu cerebro puede pensar y aprender.',
      en: 'Great! With the energy insulin lets in, your brain can think and learn.',
    },
  },
  {
    id: 'crecer',
    name: { es: 'Para crecer', en: 'To grow' },
    frames: [{ pose: 'squat' }, { pose: 'stand' }, { pose: 'stretch-up' }, { pose: 'stand' }],
    interval: 560,
    variant: 'boy',
    tint: 'green',
    color: '#4a9068',
    factHtml: {
      es: 'La energía bien usada ayuda a tu cuerpo a <span style="color:#4a9068; font-weight: 900;">crecer fuerte y sano</span>.',
      en: 'Well-used energy helps your body <span style="color:#4a9068; font-weight: 900;">grow strong and healthy</span>.',
    },
    factVoice: {
      es: '¡Muy bien! La energía bien usada ayuda a tu cuerpo a crecer fuerte y sano.',
      en: 'Great! Well-used energy helps your body grow strong and healthy.',
    },
  },
]

/* ── Pausa activa: estiramientos suaves ─────────────────────────────────────── */

export interface StretchDef {
  id: string
  name: Localized
  frames: PoseFrame[]
  interval: number
  duration: number
  variant: KidVariant
  tint: CareTint
  color: string
  factHtml: Localized
  factVoice: Localized
}

export interface Stretch extends Omit<StretchDef, 'name' | 'factHtml' | 'factVoice'> {
  name: string
  factHtml: string
  factVoice: string
}

export const STRETCHES: StretchDef[] = [
  {
    id: 'brazos-al-cielo',
    name: { es: 'Brazos al cielo', en: 'Arms to the sky' },
    frames: [{ pose: 'stand' }, { pose: 'arms-side' }, { pose: 'stretch-up' }, { pose: 'arms-side' }],
    interval: 620,
    duration: 10,
    variant: 'girl',
    tint: 'blue',
    color: '#2680ae',
    factHtml: {
      es: 'Moverte un poquito ayuda a que la <span style="color:#2680ae; font-weight: 900;">insulina trabaje mejor</span> en tu cuerpo.',
      en: 'Moving a little helps <span style="color:#2680ae; font-weight: 900;">insulin work better</span> in your body.',
    },
    factVoice: {
      es: '¡Muy bien! Moverte un poquito ayuda a que la insulina trabaje mejor en tu cuerpo.',
      en: 'Great! Moving a little helps insulin work better in your body.',
    },
  },
  {
    id: 'abrir-brazos',
    name: { es: 'Abrir los brazos', en: 'Open the arms' },
    frames: [{ pose: 'stand' }, { pose: 'breathe' }],
    interval: 950,
    duration: 10,
    variant: 'boy',
    tint: 'green',
    color: '#4a9068',
    factHtml: {
      es: 'Estirarte despacio <span style="color:#4a9068; font-weight: 900;">despierta el cuerpo</span> y te da energía para seguir aprendiendo.',
      en: 'Stretching slowly <span style="color:#4a9068; font-weight: 900;">wakes up the body</span> and gives you energy to keep learning.',
    },
    factVoice: {
      es: '¡Muy bien! Estirarte despacio despierta el cuerpo y te da energía para seguir aprendiendo.',
      en: 'Great! Stretching slowly wakes up the body and gives you energy to keep learning.',
    },
  },
]

/* ── Autocuidado: UN DÍA CON LA INSULINA ────────────────────────────────────── */
// El sol recorre el día; en cada momento se HACE el hábito que toca.
// La acción de cada momento la define la escena (tap / drag al refri).

export interface DayMomentDef {
  id: 'manana' | 'mediodia' | 'tarde' | 'noche'
  time: Localized
  /** Qué hábito toca ("Insulina con un adulto") */
  name: Localized
  /** Texto del gesto ("¡Aplicar juntos!") */
  actionLabel: Localized
  tint: CareTint
  color: string
  factHtml: Localized
  factVoice: Localized
}

export interface DayMoment extends Omit<DayMomentDef, 'time' | 'name' | 'actionLabel' | 'factHtml' | 'factVoice'> {
  time: string
  name: string
  actionLabel: string
  factHtml: string
  factVoice: string
}

export const DAY_MOMENTS: DayMomentDef[] = [
  {
    id: 'manana',
    time: { es: 'Mañana', en: 'Morning' },
    name: { es: 'Insulina con un adulto', en: 'Insulin with a grown-up' },
    actionLabel: { es: '¡Aplicar juntos!', en: 'Apply together!' },
    tint: 'yellow',
    color: '#c49b2a',
    factHtml: {
      es: 'La insulina se aplica <span style="color:#c49b2a; font-weight: 900;">siempre con un adulto</span> y a la misma hora cada día.',
      en: 'Insulin is applied <span style="color:#c49b2a; font-weight: 900;">always with a grown-up</span> and at the same time every day.',
    },
    factVoice: {
      es: '¡Muy bien! La insulina se aplica siempre con un adulto y a la misma hora cada día.',
      en: 'Great! Insulin is applied always with a grown-up and at the same time every day.',
    },
  },
  {
    id: 'mediodia',
    time: { es: 'Mediodía', en: 'Noon' },
    name: { es: 'Plato equilibrado', en: 'Balanced plate' },
    actionLabel: { es: '¡A comer rico!', en: 'Time to eat!' },
    tint: 'green',
    color: '#4a9068',
    factHtml: {
      es: 'Comer equilibrado ayuda a que la <span style="color:#4a9068; font-weight: 900;">energía y la insulina trabajen en equipo</span>.',
      en: 'Eating balanced meals helps <span style="color:#4a9068; font-weight: 900;">energy and insulin work as a team</span>.',
    },
    factVoice: {
      es: '¡Muy bien! Comer equilibrado ayuda a que la energía y la insulina trabajen en equipo.',
      en: 'Great! Eating balanced meals helps energy and insulin work as a team.',
    },
  },
  {
    id: 'tarde',
    time: { es: 'Tarde', en: 'Afternoon' },
    name: { es: 'Agua natural', en: 'Plain water' },
    actionLabel: { es: '¡Un sorbo de agua!', en: 'A sip of water!' },
    tint: 'blue',
    color: '#2680ae',
    factHtml: {
      es: 'El agua natural <span style="color:#2680ae; font-weight: 900;">refresca tu cuerpo</span> y lo ayuda a estar en equilibrio.',
      en: 'Plain water <span style="color:#2680ae; font-weight: 900;">refreshes your body</span> and helps it stay in balance.',
    },
    factVoice: {
      es: '¡Muy bien! El agua natural refresca tu cuerpo y lo ayuda a estar en equilibrio.',
      en: 'Great! Plain water refreshes your body and helps it stay in balance.',
    },
  },
  {
    id: 'noche',
    time: { es: 'Noche', en: 'Night' },
    name: { es: 'Guardar en el refri', en: 'Store in the fridge' },
    actionLabel: { es: 'Llévala al refri', en: 'Take it to the fridge' },
    tint: 'red',
    color: '#b82838',
    factHtml: {
      es: 'La insulina vive en el refri: el <span style="color:#b82838; font-weight: 900;">frío la mantiene lista</span> para cuidarte.',
      en: 'Insulin lives in the fridge: the <span style="color:#b82838; font-weight: 900;">cold keeps it ready</span> to take care of you.',
    },
    factVoice: {
      es: '¡Muy bien! La insulina vive en el refri: el frío la mantiene lista para cuidarte.',
      en: 'Great! Insulin lives in the fridge: the cold keeps it ready to take care of you.',
    },
  },
]

/* ── Retroalimentación: LAS ESTRELLAS DEL CUIDADO ───────────────────────────── */
// Cada estrella encendida re-enseña un hábito (repaso por colección, sin examen).
// El sprite de cada estrella lo resuelve la escena por id.

export interface CareStarDef {
  id: 'agua' | 'horarios' | 'refri' | 'adulto' | 'plato'
  name: Localized
  factHtml: Localized
  factVoice: Localized
}

export interface CareStar extends Omit<CareStarDef, 'name' | 'factHtml' | 'factVoice'> {
  name: string
  factHtml: string
  factVoice: string
}

export const CARE_STARS: CareStarDef[] = [
  {
    id: 'agua',
    name: { es: 'Agua natural', en: 'Plain water' },
    factHtml: {
      es: 'Beber <span style="color:#2680ae; font-weight: 900;">agua natural</span> todos los días ayuda a tu cuerpo a estar en equilibrio.',
      en: 'Drinking <span style="color:#2680ae; font-weight: 900;">plain water</span> every day helps your body stay in balance.',
    },
    factVoice: {
      es: 'Beber agua natural todos los días ayuda a tu cuerpo a estar en equilibrio.',
      en: 'Drinking plain water every day helps your body stay in balance.',
    },
  },
  {
    id: 'horarios',
    name: { es: 'Respetar horarios', en: 'Keeping schedules' },
    factHtml: {
      es: 'La insulina se usa <span style="color:#c49b2a; font-weight: 900;">a la misma hora</span>: los horarios ayudan a tu cuerpo a sentirse bien.',
      en: 'Insulin is used <span style="color:#c49b2a; font-weight: 900;">at the same time</span>: schedules help your body feel good.',
    },
    factVoice: {
      es: 'La insulina se usa a la misma hora: los horarios ayudan a tu cuerpo a sentirse bien.',
      en: 'Insulin is used at the same time: schedules help your body feel good.',
    },
  },
  {
    id: 'refri',
    name: { es: 'Insulina en el refri', en: 'Insulin in the fridge' },
    factHtml: {
      es: 'El <span style="color:#b82838; font-weight: 900;">frío del refri</span> mantiene la insulina lista para cuidarte.',
      en: 'The <span style="color:#b82838; font-weight: 900;">cold of the fridge</span> keeps insulin ready to take care of you.',
    },
    factVoice: {
      es: 'El frío del refri mantiene la insulina lista para cuidarte.',
      en: 'The cold of the fridge keeps insulin ready to take care of you.',
    },
  },
  {
    id: 'adulto',
    name: { es: 'Con un adulto', en: 'With a grown-up' },
    factHtml: {
      es: 'La insulina se aplica <span style="color:#4a9068; font-weight: 900;">siempre con un adulto</span> que te acompaña y te cuida.',
      en: 'Insulin is applied <span style="color:#4a9068; font-weight: 900;">always with a grown-up</span> who is there to help you.',
    },
    factVoice: {
      es: 'La insulina se aplica siempre con un adulto que te acompaña y te cuida.',
      en: 'Insulin is applied always with a grown-up who is there to help you.',
    },
  },
  {
    id: 'plato',
    name: { es: 'Comer equilibrado', en: 'Eating balanced' },
    factHtml: {
      es: 'Un <span style="color:#4a9068; font-weight: 900;">plato equilibrado</span> le da a tu cuerpo la energía que la insulina ayuda a usar.',
      en: 'A <span style="color:#4a9068; font-weight: 900;">balanced plate</span> gives your body the energy insulin helps to use.',
    },
    factVoice: {
      es: 'Un plato equilibrado le da a tu cuerpo la energía que la insulina ayuda a usar.',
      en: 'A balanced plate gives your body the energy insulin helps to use.',
    },
  },
]

/* ── Resolvers ──────────────────────────────────────────────────────────────── */

export function energyRoundsFor(locale: string): EnergyRound[] {
  return ENERGY_ROUNDS.map(r => ({
    ...r,
    name: tr(r.name, locale),
    factHtml: tr(r.factHtml, locale),
    factVoice: tr(r.factVoice, locale),
  }))
}

export function stretchesFor(locale: string): Stretch[] {
  return STRETCHES.map(s => ({
    ...s,
    name: tr(s.name, locale),
    factHtml: tr(s.factHtml, locale),
    factVoice: tr(s.factVoice, locale),
  }))
}

export function dayMomentsFor(locale: string): DayMoment[] {
  return DAY_MOMENTS.map(m => ({
    ...m,
    time: tr(m.time, locale),
    name: tr(m.name, locale),
    actionLabel: tr(m.actionLabel, locale),
    factHtml: tr(m.factHtml, locale),
    factVoice: tr(m.factVoice, locale),
  }))
}

export function careStarsFor(locale: string): CareStar[] {
  return CARE_STARS.map(s => ({
    ...s,
    name: tr(s.name, locale),
    factHtml: tr(s.factHtml, locale),
    factVoice: tr(s.factVoice, locale),
  }))
}
