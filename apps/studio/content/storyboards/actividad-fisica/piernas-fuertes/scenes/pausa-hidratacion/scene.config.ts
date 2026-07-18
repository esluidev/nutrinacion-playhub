import type { SceneConfig } from '~/types/scene'

export default {
  id: 'pausa-hidratacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Pausa de Agua', en: 'Water Break' },
    instruction: {
      es: 'Después de moverse, el cuerpo pide agua. El agua natural de una fuente limpia es la mejor opción. Toca el botón para tomar un sorbo con calma.',
      en: 'After moving, the body asks for water. Plain water from a clean source is the best choice. Tap the button to take a calm sip.',
    },
    completionFeedback: {
      es: 'Tomaste una pausa de agua para recuperar energía y seguir moviéndote.',
      en: 'You took a water break to get energy back and keep moving.',
    },
    estimatedDuration: 90,
    difficulty: 'easy',
    learningGoals: ['habito-hidratacion', 'agua-durante-ejercicio', 'fuente-segura'],
  },
  strings: {
    sipBtn: { es: 'Tomar un sorbo', en: 'Take a sip' },
    knTitle: { es: 'Agua natural', en: 'Plain water' },
    knHtml: {
      es: 'Cuando el cuerpo se mueve, el agua lo <span style="color:#2680ae; font-weight: 900;">refresca</span> y le devuelve la energía para seguir.',
      en: 'When the body moves, water <span style="color:#2680ae; font-weight: 900;">refreshes</span> it and gives back the energy to keep going.',
    },
    knVoice: {
      es: '¡Muy bien! Cuando el cuerpo se mueve, el agua lo refresca y le devuelve la energía para seguir.',
      en: 'Great! When the body moves, water refreshes it and gives back the energy to keep going.',
    },
  },
  primitives: ['Glass', 'StepMeter'],
  defaults: {
    sips: 5,
    pointsOnComplete: 10,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
