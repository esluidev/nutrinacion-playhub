import type { SceneConfig } from '~/types/scene'

export default {
  id: 'retroalimentacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Cuánto Aprendimos', en: 'What We Learned' },
    instruction: {
      es: 'Es momento de repasar. Escucha cada pregunta y toca la respuesta correcta.',
      en: 'Time to review. Listen to each question and tap the correct answer.',
    },
    completionFeedback: {
      es: 'Respondiste todas las preguntas del repaso.',
      en: 'You answered all the review questions.',
    },
    estimatedDuration: 180,
    difficulty: 'medium',
    learningGoals: ['consolidar-partes', 'consolidar-variedades', 'consumo-seguro'],
  },
  // Preguntas (q0..q3) + etiquetas de las opciones del quiz.
  strings: {
    q0: {
      es: '¿Qué parte del huevo ayuda a tener músculos fuertes?',
      en: 'Which part of the egg helps you have strong muscles?',
    },
    q1: {
      es: '¿Qué parte del huevo cuida la vista y da energía?',
      en: 'Which part of the egg cares for the eyes and gives energy?',
    },
    q2: {
      es: '¿Cuál es el huevo más grande del mundo?',
      en: 'Which is the biggest egg in the world?',
    },
    q3: {
      es: '¿Cómo nunca se debe comer el huevo?',
      en: 'How should an egg never be eaten?',
    },
    optCascara: { es: 'Cáscara', en: 'Shell' },
    optClara: { es: 'Clara', en: 'Egg white' },
    optYema: { es: 'Yema', en: 'Yolk' },
    optDeGallina: { es: 'De gallina', en: 'Hen' },
    optDeCodorniz: { es: 'De codorniz', en: 'Quail' },
    optDeAvestruz: { es: 'De avestruz', en: 'Ostrich' },
    optFrito: { es: 'Frito', en: 'Fried' },
    optCrudo: { es: 'Crudo', en: 'Raw' },
    optHervido: { es: 'Hervido', en: 'Boiled' },
    listenQuestion: { es: 'Escuchar pregunta', en: 'Listen to the question' },
  },
  primitives: [],
  defaults: {
    pointsPerAnswer: 10,
    pointsOnComplete: 40,
  },
  events: ['complete', 'score'],
} satisfies SceneConfig
