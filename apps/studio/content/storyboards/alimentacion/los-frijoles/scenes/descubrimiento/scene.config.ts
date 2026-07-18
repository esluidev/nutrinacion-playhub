import type { SceneConfig } from '~/types/scene'

export default {
  id: 'descubrimiento',
  version: '1.0.0',
  meta: {
    title: { es: 'La Ruleta de los Frijoles', en: 'The Bean Wheel' },
    instruction: {
      es: '¡Gira la ruleta para descubrir los frijoles!',
      en: 'Spin the wheel to discover the beans!',
    },
    completionFeedback: {
      es: 'Descubriste los cuatro frijoles y sus colores.',
      en: 'You discovered the four beans and their colors.',
    },
    estimatedDuration: 180,
    difficulty: 'easy',
    learningGoals: ['identificar-variedades', 'reconocer-colores-formas'],
  },
  strings: {
    spin: { es: 'GIRAR', en: 'SPIN' },
  },
  primitives: ['Wheel(custom)', 'Modal'],
  defaults: {
    completeWhen: 'all-revealed',
    pointsOnComplete: 30, // sum of per-bean reveals (7+9+6+8)
  },
  events: ['complete', 'score'],
} satisfies SceneConfig
