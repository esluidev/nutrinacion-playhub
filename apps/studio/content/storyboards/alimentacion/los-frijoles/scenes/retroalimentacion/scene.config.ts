import type { SceneConfig } from '~/types/scene'

export default {
  id: 'retroalimentacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Cuanto Aprendimos', en: 'What We Learned' },
    instruction: {
      es: 'Es momento de repasar. Escucha cada pregunta y toca el frijol correcto.',
      en: 'Time to review. Listen to each question and tap the correct bean.',
    },
    completionFeedback: {
      es: 'Respondiste todas las preguntas del repaso.',
      en: 'You answered all the review questions.',
    },
    estimatedDuration: 180,
    difficulty: 'medium',
    learningGoals: ['consolidar-nutrientes', 'consolidar-variedades'],
  },
  strings: {
    q0: {
      es: '¿Qué frijol tiene mucho hierro para darnos energía?',
      en: 'Which bean has lots of iron to give us energy?',
    },
    q1: {
      es: '¿Cuál está lleno de antioxidantes que cuidan el corazón?',
      en: 'Which one is full of antioxidants that care for the heart?',
    },
    q2: {
      es: '¿Cuál tiene fibra para una pancita feliz?',
      en: 'Which one has fiber for a happy tummy?',
    },
    q3: {
      es: '¿Cuál nos da proteínas para crecer fuertes?',
      en: 'Which one gives us protein to grow strong?',
    },
    listenQuestion: { es: 'Escuchar pregunta', en: 'Listen to the question' },
  },
  primitives: [],
  defaults: {
    pointsPerAnswer: 10,
    pointsOnComplete: 40,
  },
  events: ['complete', 'score'],
} satisfies SceneConfig
