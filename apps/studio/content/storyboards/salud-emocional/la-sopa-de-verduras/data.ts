// Datos canónicos del storyboard "La Sopa de Verduras" (salud emocional).
// Misma filosofía que los data.ts/moves.ts de los otros pilares: el contenido
// vive acá y se traduce UNA vez; las escenas piden emotionsFor(locale) /
// sensoryRoundsFor(locale) / calmRoundsFor(locale) / reflectionStrategiesFor(locale)
// y reciben vistas con strings planos.
//
// Tono: seguro y sin juicios — TODAS las emociones son normales; lo que se
// practica es reconocerlas, expresarlas con respeto y calmarse antes de
// reaccionar. Regla dura 1: los alimentos son inertes (la sopa no siente,
// no habla, no es "amiga") — quien siente es el niño.

import { tr, type Localized } from '~/types/i18n'

export type EmotionId =
  | 'feliz'
  | 'triste'
  | 'enojado'
  | 'asustado'
  | 'calmado'
  | 'sorprendido'
  | 'curioso'
  | 'desagrado'

/* ── Emociones: la paleta compartida del taller ─────────────────────────────── */
// Cada emoción tiene SU color (cuerpo/sombra del EmotionFaceSticker), un
// adjetivo para la etiqueta bajo la carita y un sustantivo para el título de
// la Tarjeta de Saber ("Enojo", no "Enojado").

export interface EmotionDef {
  id: EmotionId
  label: Localized
  noun: Localized
  body: string
  shade: string
}

export interface Emotion extends Omit<EmotionDef, 'label' | 'noun'> {
  label: string
  noun: string
}

export const EMOTIONS: EmotionDef[] = [
  { id: 'feliz', label: { es: 'Feliz', en: 'Happy' }, noun: { es: 'Alegría', en: 'Joy' }, body: '#f9d976', shade: '#f4c542' },
  { id: 'triste', label: { es: 'Triste', en: 'Sad' }, noun: { es: 'Tristeza', en: 'Sadness' }, body: '#7cc4e8', shade: '#3aa8e0' },
  { id: 'enojado', label: { es: 'Enojado', en: 'Angry' }, noun: { es: 'Enojo', en: 'Anger' }, body: '#f08a8a', shade: '#e63946' },
  { id: 'asustado', label: { es: 'Asustado', en: 'Scared' }, noun: { es: 'Miedo', en: 'Fear' }, body: '#dcc8f0', shade: '#c9a6e8' },
  { id: 'calmado', label: { es: 'Calmado', en: 'Calm' }, noun: { es: 'Calma', en: 'Calm' }, body: '#a4d9b5', shade: '#6bbf8a' },
  { id: 'sorprendido', label: { es: 'Sorprendido', en: 'Surprised' }, noun: { es: 'Sorpresa', en: 'Surprise' }, body: '#f5b678', shade: '#ef8a3c' },
  { id: 'curioso', label: { es: 'Curioso', en: 'Curious' }, noun: { es: 'Curiosidad', en: 'Curiosity' }, body: '#cfb6e5', shade: '#b797d3' },
  { id: 'desagrado', label: { es: 'No me gusta', en: 'I don’t like it' }, noun: { es: 'Desagrado', en: 'Dislike' }, body: '#b3d69c', shade: '#8fbe72' },
]

/* ── ¿Qué sientes tú?: la pregunta va DIRECTA a los niños del taller ────────── */
// El educador tiene al grupo en frente: la sopa de la pantalla es LA sopa del
// taller y cada pregunta se dirige a los propios niños ("¿qué sientes tú?").
// Toda respuesta es válida (nombrar, no adivinar) y cada saber enseña lo que
// importa: los beneficios de comerla y qué hacer cuando un alimento genera
// rechazo.

export interface SensoryRoundDef {
  id: 'mirar' | 'olor' | 'probar' | 'no-gusta'
  /** La pregunta directa al niño (texto completo, termina en pregunta) */
  prompt: Localized
  options: EmotionId[]
  factHtml: Localized
  factVoice: Localized
}

export interface SensoryRound extends Omit<SensoryRoundDef, 'prompt' | 'factHtml' | 'factVoice'> {
  prompt: string
  factHtml: string
  factVoice: string
}

export const SENSORY_ROUNDS: SensoryRoundDef[] = [
  {
    id: 'mirar',
    prompt: {
      es: 'Mira los colores de la sopa: naranja, verde, amarillo. ¿Qué sientes tú al verla?',
      en: 'Look at the soup’s colors: orange, green, yellow. What do you feel when you see it?',
    },
    options: ['curioso', 'sorprendido', 'desagrado'],
    factHtml: {
      es: 'Cada color es una verdura distinta: la zanahoria <strong>cuida tus ojos</strong> y el verde te ayuda a <strong>crecer fuerte</strong>. Mirarla ya es empezar a conocerla.',
      en: 'Each color is a different vegetable: carrots <strong>care for your eyes</strong> and the green ones help you <strong>grow strong</strong>. Looking at it is already getting to know it.',
    },
    factVoice: {
      es: 'Cada color es una verdura distinta: la zanahoria cuida tus ojos y el verde te ayuda a crecer fuerte. Mirarla ya es empezar a conocerla.',
      en: 'Each color is a different vegetable: carrots care for your eyes and the green ones help you grow strong. Looking at it is already getting to know it.',
    },
  },
  {
    id: 'olor',
    prompt: {
      es: 'Imagina su olorcito calientito llegando a tu nariz. ¿Qué sientes tú?',
      en: 'Imagine its warm smell reaching your nose. What do you feel?',
    },
    options: ['curioso', 'calmado', 'desagrado'],
    factHtml: {
      es: 'Oler la comida es <strong>conocerla sin prisa</strong>. Si el olor no te gusta, puedes decirlo con calma: está bien.',
      en: 'Smelling food is <strong>getting to know it without hurry</strong>. If you don’t like the smell, you can say so calmly: that’s okay.',
    },
    factVoice: {
      es: 'Oler la comida es conocerla sin prisa. Si el olor no te gusta, puedes decirlo con calma: está bien.',
      en: 'Smelling food is getting to know it without hurry. If you don’t like the smell, you can say so calmly: that’s okay.',
    },
  },
  {
    id: 'probar',
    prompt: {
      es: 'Imagina que pruebas una cucharadita pequeña. ¿Qué sientes tú?',
      en: 'Imagine you try one small spoonful. What do you feel?',
    },
    options: ['feliz', 'sorprendido', 'desagrado'],
    factHtml: {
      es: 'Probar <strong>poquito a poquito</strong> hace que un sabor nuevo se vuelva conocido. La sopa te da <strong>energía para jugar y crecer</strong>.',
      en: 'Trying it <strong>little by little</strong> makes a new taste familiar. The soup gives you <strong>energy to play and grow</strong>.',
    },
    factVoice: {
      es: 'Probar poquito a poquito hace que un sabor nuevo se vuelva conocido. La sopa te da energía para jugar y crecer.',
      en: 'Trying it little by little makes a new taste familiar. The soup gives you energy to play and grow.',
    },
  },
  {
    id: 'no-gusta',
    prompt: {
      es: 'Y si no te gusta… ¿qué sientes tú?',
      en: 'And if you don’t like it… what do you feel?',
    },
    options: ['desagrado', 'enojado', 'triste'],
    factHtml: {
      es: 'Está bien que no te guste: dilo <strong>con calma, sin gritar</strong> — "No me gusta mucho, ¿puedo probar un poquito?". Tu cuerpo igual necesita sus verduras, poco a poco.',
      en: 'It’s okay not to like it: say it <strong>calmly, without shouting</strong> — "I don’t like it much, can I try a little bit?". Your body still needs its vegetables, little by little.',
    },
    factVoice: {
      es: 'Está bien que no te guste: dilo con calma, sin gritar. No me gusta mucho, ¿puedo probar un poquito? Tu cuerpo igual necesita sus verduras, poco a poco.',
      en: 'It’s okay not to like it: say it calmly, without shouting. I don’t like it much, can I try a little bit? Your body still needs its vegetables, little by little.',
    },
  },
]

/* ── Autocontrol: EL VOLCÁN DE LA CALMA ─────────────────────────────────────── */
// El enojo sube como un volcán (EmotionGauge); antes de reaccionar: alto,
// respira (HoldAction sostenido) y habla. Cada ronda enseña UNA frase de
// comunicación respetuosa para su situación. Los prompts van en SEGUNDA
// persona ("Imagina: no querías sopa…"): acá el que practica la calma es el
// propio niño, no un personaje.

export interface CalmRoundDef {
  id: string
  /** La situación que enciende el volcán */
  prompt: Localized
  /** Verbo sensorial del DETONANTE (tocar la sopa la actúa): Oler/Probar/Mirar */
  trigger: Localized
  /** Título del saber ("Probar un poquito") */
  name: Localized
  /** Intensidad inicial del volcán (0..1) */
  heat: number
  /** Frase que el niño practica DESPUÉS de detenerse y respirar */
  speech: Localized
  factHtml: Localized
  factVoice: Localized
}

export interface CalmRound extends Omit<CalmRoundDef, 'prompt' | 'trigger' | 'name' | 'speech' | 'factHtml' | 'factVoice'> {
  prompt: string
  trigger: string
  name: string
  speech: string
  factHtml: string
  factVoice: string
}

export const CALM_ROUNDS: CalmRoundDef[] = [
  {
    id: 'no-queria-sopa',
    prompt: {
      es: 'Imagina: hueles la sopa y su olor no te gusta nada.',
      en: 'Imagine: you smell the soup and you don’t like its smell at all.',
    },
    trigger: { es: 'Oler', en: 'Smell' },
    name: { es: 'Explicar lo que incomoda', en: 'Explain what feels uncomfortable' },
    heat: 0.9,
    speech: {
      es: 'Ese olor me incomoda. ¿Puedo empezar con una cucharadita?',
      en: 'That smell feels uncomfortable. Can I start with one spoonful?',
    },
    factHtml: {
      es: 'Primero te detuviste y respiraste. Después dijiste: <span style="color:#4a9068; font-weight: 900;">«Ese olor me incomoda. ¿Puedo empezar con una cucharadita?»</span>',
      en: 'First you stopped and breathed. Then you said: <span style="color:#4a9068; font-weight: 900;">“That smell feels uncomfortable. Can I start with one spoonful?”</span>',
    },
    factVoice: {
      es: 'Primero te detuviste y respiraste. Después dijiste: ese olor me incomoda, ¿puedo empezar con una cucharadita? Explicar lo que sientes ayuda al adulto a comprender.',
      en: 'First you stopped and breathed. Then you said: that smell feels uncomfortable, can I start with one spoonful? Explaining how you feel helps a grown-up understand.',
    },
  },
  {
    id: 'derrame',
    trigger: { es: 'Probar', en: 'Taste' },
    prompt: {
      es: 'Imagina: al probar la sopa, se te derramó un poquito en la mesa.',
      en: 'Imagine: while trying the soup, you spilled a little on the table.',
    },
    name: { es: 'Pedir ayuda', en: 'Ask for help' },
    heat: 0.75,
    speech: {
      es: 'Fue sin querer. ¿Me ayudas a limpiar?',
      en: 'It was an accident. Can you help me clean up?',
    },
    factHtml: {
      es: 'Un accidente no necesita gritos ni culpa. Te calmaste y dijiste: <span style="color:#2680ae; font-weight: 900;">«Fue sin querer. ¿Me ayudas a limpiar?»</span>',
      en: 'An accident does not need shouting or blame. You calmed down and said: <span style="color:#2680ae; font-weight: 900;">“It was an accident. Can you help me clean up?”</span>',
    },
    factVoice: {
      es: 'Un accidente no necesita gritos ni culpa. Te calmaste y dijiste: fue sin querer, ¿me ayudas a limpiar? Pedir ayuda también es autocuidado.',
      en: 'An accident does not need shouting or blame. You calmed down and said: it was an accident, can you help me clean up? Asking for help is also self-care.',
    },
  },
  {
    id: 'esperar',
    trigger: { es: 'Mirar', en: 'Look' },
    prompt: {
      es: 'Imagina: tienes mucha hambre, pero la sopa está caliente y toca esperar.',
      en: 'Imagine: you are very hungry, but the soup is hot and you have to wait.',
    },
    name: { es: 'Saber esperar', en: 'Learning to wait' },
    heat: 0.8,
    speech: {
      es: 'Tengo hambre, pero puedo esperar a que se enfríe.',
      en: 'I am hungry, but I can wait for it to cool down.',
    },
    factHtml: {
      es: 'Esperar es más fácil con el cuerpo tranquilo. Dijiste: <span style="color:#4a9068; font-weight: 900;">«Tengo hambre, pero puedo esperar a que se enfríe.»</span>',
      en: 'Waiting is easier with a calm body. You said: <span style="color:#4a9068; font-weight: 900;">“I am hungry, but I can wait for it to cool down.”</span>',
    },
    factVoice: {
      es: 'Esperar es más fácil con el cuerpo tranquilo. Dijiste: tengo hambre, pero puedo esperar a que se enfríe. La calma ayuda a tomar una decisión segura.',
      en: 'Waiting is easier with a calm body. You said: I am hungry, but I can wait for it to cool down. Calm helps us make a safe choice.',
    },
  },
]

/* ── Reflexión: MI PLAN TRANQUILO ───────────────────────────────────────────── */
// La reflexión no obliga a "aceptar" ni repite una clase de nutrientes. El
// niño elige una reacción válida y una estrategia posible; el resultado es
// un plan personal con una frase respetuosa. Los alimentos saludables siguen
// presentes por lo que aportan al cuerpo, sin invalidar el gusto o desagrado.

export type ReflectionStrategyId = 'respirar' | 'hablar' | 'probar-poco'

export interface ReflectionStrategyDef {
  id: ReflectionStrategyId
  name: Localized
  phrase: Localized
}

export interface ReflectionStrategy extends Omit<ReflectionStrategyDef, 'name' | 'phrase'> {
  name: string
  phrase: string
}

export const REFLECTION_STRATEGIES: ReflectionStrategyDef[] = [
  {
    id: 'respirar',
    name: { es: 'Respirar primero', en: 'Breathe first' },
    phrase: {
      es: 'Necesito respirar antes de responder.',
      en: 'I need to breathe before I answer.',
    },
  },
  {
    id: 'hablar',
    name: { es: 'Hablar con un adulto', en: 'Talk to a grown-up' },
    phrase: {
      es: 'Quiero contarte qué sabor o textura me incomoda.',
      en: 'I want to tell you which taste or texture feels uncomfortable.',
    },
  },
  {
    id: 'probar-poco',
    name: { es: 'Conocerla poco a poco', en: 'Discover it little by little' },
    phrase: {
      es: 'Puedo empezar con una cucharadita y decir cómo se siente.',
      en: 'I can start with one spoonful and say how it feels.',
    },
  },
]

/* ── Resolvers ──────────────────────────────────────────────────────────────── */

export function emotionsFor(locale: string): Emotion[] {
  return EMOTIONS.map(e => ({
    ...e,
    label: tr(e.label, locale),
    noun: tr(e.noun, locale),
  }))
}

export function sensoryRoundsFor(locale: string): SensoryRound[] {
  return SENSORY_ROUNDS.map(r => ({
    ...r,
    prompt: tr(r.prompt, locale),
    factHtml: tr(r.factHtml, locale),
    factVoice: tr(r.factVoice, locale),
  }))
}

export function calmRoundsFor(locale: string): CalmRound[] {
  return CALM_ROUNDS.map(r => ({
    ...r,
    prompt: tr(r.prompt, locale),
    trigger: tr(r.trigger, locale),
    name: tr(r.name, locale),
    speech: tr(r.speech, locale),
    factHtml: tr(r.factHtml, locale),
    factVoice: tr(r.factVoice, locale),
  }))
}

export function reflectionStrategiesFor(locale: string): ReflectionStrategy[] {
  return REFLECTION_STRATEGIES.map(strategy => ({
    ...strategy,
    name: tr(strategy.name, locale),
    phrase: tr(strategy.phrase, locale),
  }))
}
