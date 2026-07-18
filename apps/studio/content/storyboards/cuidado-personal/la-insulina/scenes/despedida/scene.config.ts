import type { SceneConfig } from '~/types/scene'

export default {
  id: 'despedida',
  version: '1.0.0',
  meta: {
    title: { es: 'Hasta Pronto', en: 'See You Soon' },
    instruction: {
      es: 'El taller terminó. Es momento de recordar cómo la insulina ayuda a tu energía y cómo los buenos hábitos cuidan tu cuerpo todos los días.',
      en: 'The workshop is over. Time to remember how insulin helps your energy and how good habits take care of your body every day.',
    },
    estimatedDuration: 60,
    difficulty: 'easy',
    learningGoals: ['cierre-positivo', 'motivacion-habitos-activos'],
  },
  // El accent del título va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡Lo <span style="color: var(--accent-green-dark)">lograste</span>!',
      en: 'You <span style="color: var(--accent-green-dark)">did it</span>!',
    },
    message: {
      es: 'Descubriste la llave de la energía y los cuidados que la acompañan.<br>¡Agua natural, horarios, comida equilibrada y siempre con tu adulto de confianza!',
      en: 'You discovered the energy key and the care that comes with it.<br>Plain water, schedules, balanced food and always with your trusted grown-up!',
    },
    statPoints: { es: 'puntos', en: 'points' },
    statScenes: { es: 'escenas', en: 'scenes' },
    statTime: { es: 'tiempo', en: 'time' },
    byeBtn: { es: '¡Hasta pronto!', en: 'See you soon!' },
    speak: {
      es: '¡Lo lograste! Descubriste cómo la insulina ayuda a tu energía y aprendiste a cuidarla: agua natural, horarios, comida equilibrada y siempre con un adulto. Sigue cuidando tu cuerpo todos los días.',
      en: 'You did it! You discovered how insulin helps your energy and learned to care for it: plain water, schedules, balanced food and always with a grown-up. Keep taking care of your body every day.',
    },
  },
  primitives: [],
  defaults: {
    // Escena resumen (regla 17): muestra las recompensas — no otorga puntos
    pointsOnComplete: 0,
  },
  events: ['complete'],
} satisfies SceneConfig
