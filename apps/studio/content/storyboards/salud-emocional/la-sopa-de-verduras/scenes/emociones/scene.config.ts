import type { SceneConfig } from '~/types/scene'

export default {
  id: 'emociones',
  version: '3.0.0',
  meta: {
    title: { es: '¿Qué sientes tú?', en: 'What do you feel?' },
    instruction: {
      es: 'Esta es nuestra sopa de verduras. Mírala, imagina su olor y su sabor, y responde con la carita: ¿qué sientes tú? No hay respuestas malas: decir lo que sentimos nos ayuda a conocer los alimentos.',
      en: 'This is our vegetable soup. Look at it, imagine its smell and taste, and answer with a face: what do you feel? There are no wrong answers: saying what we feel helps us get to know foods.',
    },
    completionFeedback: {
      es: 'Contaste lo que sientes con la sopa y aprendiste que se puede decir con calma, poquito a poquito.',
      en: 'You shared what you feel about the soup and learned it can be said calmly, little by little.',
    },
    estimatedDuration: 240,
    difficulty: 'easy',
    learningGoals: ['expresar-lo-que-siento', 'beneficios-de-la-sopa', 'que-hacer-con-el-rechazo'],
  },
  strings: {
    listenStory: { es: 'Escuchar la pregunta', en: 'Listen to the question' },
    nextBtn: { es: 'Siguiente', en: 'Next' },
  },
  primitives: [],
  defaults: {
    pointsPerRound: 10,
    pointsOnComplete: 10,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
