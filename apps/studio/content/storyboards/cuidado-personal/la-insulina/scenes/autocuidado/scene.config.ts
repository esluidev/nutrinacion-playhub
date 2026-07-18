import type { SceneConfig } from '~/types/scene'

export default {
  id: 'autocuidado',
  version: '1.0.0',
  meta: {
    title: { es: 'Un Día con la Insulina', en: 'A Day with Insulin' },
    instruction: {
      es: 'Acompaña al sol por un día completo de buenos cuidados. En cada momento haz el hábito que toca: la insulina con un adulto por la mañana, comer equilibrado, beber agua y, en la noche, guardar la insulina en el refri.',
      en: 'Follow the sun through a whole day of good care. At each moment do the right habit: insulin with a grown-up in the morning, balanced eating, drinking water and, at night, storing the insulin in the fridge.',
    },
    completionFeedback: {
      es: 'Cuidaste el día completo: horarios, comida, agua y la insulina segura en el refri.',
      en: 'You took care of the whole day: schedules, food, water and the insulin safe in the fridge.',
    },
    estimatedDuration: 240,
    difficulty: 'medium',
    learningGoals: ['horarios-de-insulina', 'acompanamiento-adulto', 'refrigeracion', 'hidratacion-y-alimentacion'],
  },
  strings: {
    penLabel: { es: 'Insulina', en: 'Insulin' },
    fridgeLabel: { es: 'El refri', en: 'The fridge' },
  },
  primitives: ['Draggable', 'DropZone'],
  defaults: {
    pointsPerMoment: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
