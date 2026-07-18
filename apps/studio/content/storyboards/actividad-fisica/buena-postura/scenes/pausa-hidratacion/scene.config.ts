import type { SceneConfig } from '~/types/scene'

export default {
  id: 'pausa-hidratacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Pausa de Agua', en: 'Water Break' },
    instruction: {
      es: 'Después de moverse, el cuerpo pide agua. El agua natural de una fuente limpia refresca y devuelve la energía. Toca el botón para tomar un sorbo con calma.',
      en: 'After moving, the body asks for water. Plain water from a clean source refreshes you and gives your energy back. Tap the button to take a calm sip.',
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
      es: 'El agua natural mantiene el cuerpo <span style="color:#2680ae; font-weight: 900;">fresco, fuerte y activo</span> durante el ejercicio.',
      en: 'Plain water keeps the body <span style="color:#2680ae; font-weight: 900;">fresh, strong and active</span> during exercise.',
    },
    knVoice: {
      es: '¡Muy bien! El agua natural mantiene el cuerpo fresco, fuerte y activo durante el ejercicio.',
      en: 'Great! Plain water keeps the body fresh, strong and active during exercise.',
    },
  },
  primitives: ['Glass', 'StepMeter'],
  defaults: {
    sips: 5,
    pointsOnComplete: 10,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
