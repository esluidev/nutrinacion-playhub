import type { SceneConfig } from '~/types/scene'

export default {
  id: 'pausa-activa',
  version: '1.0.0',
  meta: {
    title: { es: 'Pausa en Movimiento', en: 'Movement Break' },
    instruction: {
      es: 'Una pausa para mover el cuerpo. Toca el botón, mira el estiramiento e imítalo despacio hasta que el tiempo termine. Moverse también ayuda a la insulina.',
      en: 'A break to move the body. Tap the button, watch the stretch and copy it slowly until the time is up. Moving also helps insulin.',
    },
    completionFeedback: {
      es: 'Estiraste el cuerpo y le diste un empujoncito a tu energía.',
      en: 'You stretched your body and gave your energy a little boost.',
    },
    estimatedDuration: 150,
    difficulty: 'easy',
    learningGoals: ['pausa-activa', 'menos-sedentarismo', 'movimiento-e-insulina'],
  },
  strings: {
    stretchBtn: { es: '¡Estirar!', en: 'Stretch!' },
  },
  primitives: ['PoseGuide', 'ExerciseTimer'],
  defaults: {
    pointsPerStretch: 10,
    pointsOnComplete: 20,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
