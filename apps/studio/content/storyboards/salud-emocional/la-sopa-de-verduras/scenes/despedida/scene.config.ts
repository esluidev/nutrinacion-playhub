import type { SceneConfig } from '~/types/scene'

export default {
  id: 'despedida',
  version: '2.0.0',
  meta: {
    title: { es: 'Hasta Pronto', en: 'See You Soon' },
    instruction: {
      es: 'El taller terminó. Recuerda el recorrido: notar lo que sientes frente a un alimento, cuidar tu cuerpo, detenerte, respirar y hablar con respeto con un adulto de confianza.',
      en: 'The workshop is over. Remember the journey: notice what you feel about a food, care for your body, stop, breathe and speak respectfully with a trusted grown-up.',
    },
    estimatedDuration: 60,
    difficulty: 'easy',
    learningGoals: ['cierre-positivo', 'autocuidado-emocional', 'habitos-de-bienestar'],
  },
  // El accent del título va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡Lo <span style="color: var(--accent-green-dark)">lograste</span>!',
      en: 'You <span style="color: var(--accent-green-dark)">did it</span>!',
    },
    message: {
      es: 'Reconociste lo que color, olor, textura y sabor pueden hacerte sentir.<br>¡Ahora puedes detenerte, respirar y decirlo con respeto!',
      en: 'You recognized what color, smell, texture and taste may make you feel.<br>Now you can stop, breathe and say it respectfully!',
    },
    statPoints: { es: 'puntos', en: 'points' },
    statScenes: { es: 'escenas', en: 'scenes' },
    statTime: { es: 'tiempo', en: 'time' },
    byeBtn: { es: '¡Hasta pronto!', en: 'See you soon!' },
    speak: {
      es: '¡Lo lograste! Aprendiste que el color, el olor, la textura o el sabor pueden provocar reacciones distintas. Practicaste detenerte, respirar y hablar con respeto. Puedes conocer los alimentos saludables poco a poco, sin esconder lo que sientes.',
      en: 'You did it! You learned that color, smell, texture or taste may bring up different reactions. You practiced stopping, breathing and speaking respectfully. You can discover healthy foods little by little without hiding how you feel.',
    },
  },
  primitives: [],
  defaults: {
    // Escena resumen (regla 17): muestra las recompensas — no otorga puntos
    pointsOnComplete: 0,
  },
  events: ['complete'],
} satisfies SceneConfig
