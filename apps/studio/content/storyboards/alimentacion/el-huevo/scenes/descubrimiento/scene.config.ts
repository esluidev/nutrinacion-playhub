import type { SceneConfig } from '~/types/scene'

export default {
  id: 'descubrimiento',
  version: '1.0.0',
  meta: {
    title: { es: 'Los Huevos por Tamaño', en: 'Eggs by Size' },
    instruction: {
      es: 'Toca cada tarjeta para descubrir los huevos y verlos del más pequeño al más grande.',
      en: 'Tap each card to discover the eggs and see them from smallest to biggest.',
    },
    completionFeedback: {
      es: 'Descubriste cuatro huevos, del más pequeño al más grande.',
      en: 'You discovered four eggs, from the smallest to the biggest.',
    },
    estimatedDuration: 180,
    difficulty: 'easy',
    learningGoals: ['identificar-variedades', 'reconocer-origen-aves', 'comparar-tamanos'],
  },
  primitives: ['RevealCard(custom)'],
  defaults: {
    completeWhen: 'all-revealed',
    pointsOnComplete: 30, // sum of per-egg reveals (7+8+6+9)
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
