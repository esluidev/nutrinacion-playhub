import type { SceneConfig } from '~/types/scene'

export default {
  id: 'pausa-hidratacion',
  version: '3.0.0',
  meta: {
    title: { es: 'Pausa de Agua', en: 'Water Break' },
    instruction: {
      es: 'Haz una pausa. Mantén presionada la gota para beber agua natural con calma, y nota lo que siente tu cuerpo.',
      en: 'Take a break. Press and hold the drop to drink plain water calmly, and notice what your body feels.',
    },
    completionFeedback: {
      es: 'Bebiste agua con calma y notaste cómo tu cuerpo la recibe.',
      en: 'You drank water calmly and noticed how your body receives it.',
    },
    estimatedDuration: 90,
    difficulty: 'easy',
    learningGoals: ['habito-hidratacion', 'agua-natural', 'notar-el-cuerpo'],
  },
  strings: {
    sipBtn: { es: 'Beber', en: 'Drink' },
    knTitle: { es: 'Tu cuerpo', en: 'Your body' },
    knHtml: {
      es: 'El agua refresca tu boca, baja suave por tu garganta y le <span style="color: var(--accent-blue-dark); font-weight: 900;">devuelve energía a tu cuerpo</span>. Cada emoción puede seguir ahí, y está bien.',
      en: 'The water refreshes your mouth, flows gently down your throat and <span style="color: var(--accent-blue-dark); font-weight: 900;">gives your body energy back</span>. Each feeling may still be there, and that is okay.',
    },
    knVoice: {
      es: 'El agua refresca tu boca, baja suave por tu garganta y le devuelve energía a tu cuerpo. Cada emoción puede seguir ahí, y está bien.',
      en: 'The water refreshes your mouth, flows gently down your throat and gives your body energy back. Each feeling may still be there, and that is okay.',
    },
  },
  primitives: ['Glass', 'HoldAction'],
  defaults: {
    sips: 3,
    sipDuration: 2400,
    pointsOnComplete: 10,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
