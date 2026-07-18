import type { SceneConfig } from '~/types/scene'

export default {
  id: 'despedida',
  version: '1.0.0',
  meta: {
    title: { es: 'Hasta Pronto', en: 'See You Soon' },
    instruction: {
      es: 'El taller terminó. Es momento de recordar lo aprendido sobre los frijoles.',
      en: 'The workshop is over. Time to remember what we learned about beans.',
    },
    estimatedDuration: 60,
    difficulty: 'easy',
    learningGoals: ['cierre-positivo', 'motivacion-habitos'],
  },
  // El accent del título va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡Lo <span style="color: var(--accent-green-dark)">lograste</span>!',
      en: 'You <span style="color: var(--accent-green-dark)">did it</span>!',
    },
    message: {
      es: 'Hoy conociste los frijoles, sus colores, sus súper poderes y cómo se preparan.<br>¡Sigue comiendo rico y sano todos los días!',
      en: "Today you got to know beans, their colors, their superpowers, and how they're prepared.<br>Keep eating tasty and healthy every day!",
    },
    statPoints: { es: 'puntos', en: 'points' },
    statScenes: { es: 'escenas', en: 'scenes' },
    statTime: { es: 'tiempo', en: 'time' },
    byeBtn: { es: '¡Hasta pronto!', en: 'See you soon!' },
    speak: {
      es: '¡Lo lograste! Aprendiste mucho sobre los frijoles. Sigue comiendo rico y sano.',
      en: 'You did it! You learned a lot about beans. Keep eating tasty and healthy.',
    },
  },
  primitives: [],
  defaults: {
    // Summary scene (regla 17): shows the run's rewards — it awards none
    pointsOnComplete: 0,
  },
  events: ['complete'],
} satisfies SceneConfig
