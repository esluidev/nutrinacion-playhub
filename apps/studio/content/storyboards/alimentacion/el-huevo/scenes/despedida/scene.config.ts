import type { SceneConfig } from '~/types/scene'

export default {
  id: 'despedida',
  version: '1.0.0',
  meta: {
    title: { es: 'Hasta Pronto', en: 'See You Soon' },
    instruction: {
      es: 'El taller terminó. Es momento de recordar lo aprendido sobre el huevo.',
      en: 'The workshop is over. Time to remember what we learned about the egg.',
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
      es: 'Hoy conociste el huevo, sus partes, los huevos de otras aves y cómo se cocina.<br>¡Sigue comiendo rico y sano todos los días!',
      en: 'Today you got to know the egg, its parts, the eggs of other birds, and how it is cooked.<br>Keep eating tasty and healthy every day!',
    },
    statPoints: { es: 'puntos', en: 'points' },
    statScenes: { es: 'escenas', en: 'scenes' },
    statTime: { es: 'tiempo', en: 'time' },
    byeBtn: { es: '¡Hasta pronto!', en: 'See you soon!' },
    speak: {
      es: '¡Lo lograste! Aprendiste mucho sobre el huevo. Sigue comiendo rico y sano.',
      en: 'You did it! You learned a lot about the egg. Keep eating tasty and healthy.',
    },
  },
  primitives: [],
  defaults: {
    // Summary scene (regla 17): shows the run's rewards — it awards none
    pointsOnComplete: 0,
  },
  events: ['complete'],
} satisfies SceneConfig
