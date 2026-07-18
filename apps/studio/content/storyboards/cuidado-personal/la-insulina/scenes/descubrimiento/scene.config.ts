import type { SceneConfig } from '~/types/scene'

export default {
  id: 'descubrimiento',
  version: '1.0.0',
  meta: {
    title: { es: 'La Llave de la Energía', en: 'The Energy Key' },
    instruction: {
      es: 'La insulina es como una llave. La energía de la comida espera frente a la puerta: usa la llave para abrirla y descubre para qué entra la energía a tu cuerpo.',
      en: 'Insulin is like a key. The energy from food waits at the door: use the key to open it and discover what the energy comes into your body for.',
    },
    completionFeedback: {
      es: 'Abriste las tres puertas: la insulina dejó entrar la energía para jugar, aprender y crecer.',
      en: 'You opened all three doors: insulin let the energy in to play, learn and grow.',
    },
    estimatedDuration: 240,
    difficulty: 'easy',
    learningGoals: ['funcion-de-la-insulina', 'energia-de-los-alimentos', 'bienestar-corporal'],
  },
  strings: {
    keyBtn: { es: '¡Usar la llave!', en: 'Use the key!' },
  },
  primitives: ['PoseGuide'],
  defaults: {
    pointsPerRound: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
