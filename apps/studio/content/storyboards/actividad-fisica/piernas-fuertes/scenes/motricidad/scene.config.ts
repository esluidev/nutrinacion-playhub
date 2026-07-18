import type { SceneConfig } from '~/types/scene'

export default {
  id: 'motricidad',
  version: '1.0.0',
  meta: {
    title: { es: 'Despertar el Cuerpo', en: 'Wake Up the Body' },
    instruction: {
      es: 'Vamos a despertar el cuerpo despacio. Toca una tarjeta, mira cómo se hace el movimiento e imítalo hasta que el tiempo termine.',
      en: 'Let’s wake up the body slowly. Tap a card, watch how the movement is done, and copy it until the time is up.',
    },
    completionFeedback: {
      es: 'Despertaste el cuerpo con tres movimientos suaves y controlados.',
      en: 'You woke up your body with three slow, controlled movements.',
    },
    estimatedDuration: 240,
    difficulty: 'easy',
    learningGoals: ['movimientos-basicos', 'cuidado-articulaciones', 'respiracion-coordinada'],
  },
  // Los nombres/datos de los ejercicios viven en moves.ts (datos canónicos del
  // storyboard, compartidos entre escenas) — acá solo la UI propia de la escena.
  strings: {},
  primitives: ['PoseGuide', 'ExerciseTimer'],
  defaults: {
    pointsPerMove: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
