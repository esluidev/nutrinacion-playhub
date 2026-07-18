import type { SceneConfig } from '~/types/scene'

export default {
  id: 'coordinacion',
  version: '1.0.0',
  meta: {
    title: { es: 'La Coreografía', en: 'The Choreography' },
    instruction: {
      es: 'Mira la coreografía completa: son tres movimientos seguidos. Puedes verla otra vez las veces que quieras. Cuando estés listo, toca mi turno y hazla con tu cuerpo.',
      en: 'Watch the whole choreography: three movements in a row. You can watch it again as many times as you want. When you are ready, tap my turn and do it with your body.',
    },
    completionFeedback: {
      es: 'Hiciste tres coreografías completas con tu cuerpo, movimiento por movimiento y en orden.',
      en: 'You did three full choreographies with your body, movement by movement and in order.',
    },
    estimatedDuration: 300,
    difficulty: 'hard',
    learningGoals: ['coordinacion', 'memoria-de-movimiento', 'agilidad-segura'],
  },
  strings: {
    watchBtn: { es: '¡Mira!', en: 'Watch!' },
    turnBtn: { es: '¡Mi turno!', en: 'My turn!' },
    knTitle: { es: 'Coordinación', en: 'Coordination' },
    knHtml: {
      es: 'Recordar los pasos y hacerlos en orden entrena la <span style="color:#2680ae; font-weight: 900;">coordinación</span>: el cuerpo y la mente trabajan juntos.',
      en: 'Remembering the steps and doing them in order trains <span style="color:#2680ae; font-weight: 900;">coordination</span>: body and mind work together.',
    },
    knVoice: {
      es: '¡Muy bien! Recordar los pasos y hacerlos en orden entrena la coordinación: el cuerpo y la mente trabajan juntos.',
      en: 'Great! Remembering the steps and doing them in order trains coordination: body and mind work together.',
    },
  },
  primitives: ['PoseGuide', 'ExerciseTimer'],
  defaults: {
    pointsPerRound: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
