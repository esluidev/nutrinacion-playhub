import type { SceneConfig } from '~/types/scene'

export default {
  id: 'pausa-hidratacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Pausa de Agua', en: 'Water Break' },
    instruction: {
      es: 'Es momento de una pausa. El agua natural es la mejor opción para el cuerpo. Toca el botón para tomar un sorbo.',
      en: 'Time for a break. Plain water is the best choice for the body. Tap the button to take a sip.',
    },
    completionFeedback: {
      es: 'Tomaste una pausa de agua que le da energía al cuerpo.',
      en: 'You took a water break that gives the body energy.',
    },
    estimatedDuration: 90,
    difficulty: 'easy',
    learningGoals: ['habito-hidratacion', 'agua-natural'],
  },
  strings: {
    sipBtn: { es: 'Tomar un sorbo', en: 'Take a sip' },
    knTitle: { es: 'Agua natural', en: 'Plain water' },
    knHtml: {
      es: 'Le da energía al cuerpo y lo ayuda a estar feliz.',
      en: 'It gives the body energy and helps it feel happy.',
    },
    knVoice: {
      es: '¡Muy bien! Hidratarse ayuda a tu cuerpo a estar feliz y con energía.',
      en: 'Great! Staying hydrated helps your body feel happy and full of energy.',
    },
  },
  primitives: ['Glass', 'StepMeter'],
  defaults: {
    sips: 5,
    pointsOnComplete: 10,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
