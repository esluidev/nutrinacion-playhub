import type { SceneConfig } from '~/types/scene'

export default {
  id: 'resistencia',
  version: '1.0.0',
  meta: {
    title: { es: 'Rondas de Energía', en: 'Energy Rounds' },
    instruction: {
      es: 'Ahora vamos a movernos con más energía. Toca el botón para empezar cada ronda y sigue el ritmo del movimiento hasta que el tiempo termine.',
      en: 'Now let’s move with more energy. Tap the button to start each round and follow the rhythm of the movement until the time is up.',
    },
    completionFeedback: {
      es: 'Completaste tres rondas de energía siguiendo el ritmo sin parar.',
      en: 'You finished three energy rounds keeping the rhythm without stopping.',
    },
    estimatedDuration: 300,
    difficulty: 'medium',
    learningGoals: ['intensidad-moderada', 'resistencia', 'ritmo-continuo'],
  },
  strings: {
    startBtn: { es: '¡Vamos!', en: 'Go!' },
  },
  primitives: ['PoseGuide', 'ExerciseTimer'],
  defaults: {
    pointsPerRound: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
