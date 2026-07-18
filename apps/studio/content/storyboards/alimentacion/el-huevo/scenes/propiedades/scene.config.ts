import type { SceneConfig } from '~/types/scene'

export default {
  id: 'propiedades',
  version: '1.0.0',
  meta: {
    title: { es: 'Las Partes del Huevo', en: 'Parts of the Egg' },
    instruction: {
      es: 'El huevo tiene partes por dentro y por fuera. Arrastra cada parte hacia lo que hace por el cuerpo.',
      en: 'The egg has parts inside and outside. Drag each part to what it does for the body.',
    },
    completionFeedback: {
      es: 'Ya conoces la cáscara, la clara y la yema.',
      en: 'Now you know the shell, the egg white, and the yolk.',
    },
    estimatedDuration: 180,
    difficulty: 'medium',
    learningGoals: ['partes-del-huevo', 'nutrientes-principales'],
  },
  // Sin strings propios: todos los textos (nombre/beneficio/dato de cada parte)
  // viven en eggs.ts (PARTS), compartidos con el quiz.
  primitives: ['Draggable', 'DropZone'],
  defaults: {
    pointsPerMatch: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
