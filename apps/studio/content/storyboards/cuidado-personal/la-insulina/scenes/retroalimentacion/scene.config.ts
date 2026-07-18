import type { SceneConfig } from '~/types/scene'

export default {
  id: 'retroalimentacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Las Estrellas del Cuidado', en: 'The Care Stars' },
    instruction: {
      es: 'Cada estrella guarda un cuidado que aprendiste hoy. Toca las estrellas para encenderlas y recordar juntos cada hábito.',
      en: 'Each star holds one care habit you learned today. Tap the stars to light them up and remember each habit together.',
    },
    completionFeedback: {
      es: 'Encendiste las cinco estrellas del cuidado: agua, horarios, refri, adulto y plato equilibrado.',
      en: 'You lit all five care stars: water, schedules, fridge, grown-up and balanced plate.',
    },
    estimatedDuration: 180,
    difficulty: 'easy',
    learningGoals: ['repaso-de-habitos', 'consolidacion', 'conciencia-preventiva'],
  },
  strings: {},
  primitives: [],
  defaults: {
    pointsPerStar: 10,
    pointsOnComplete: 20,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
