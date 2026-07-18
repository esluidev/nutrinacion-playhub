import type { SceneConfig } from '~/types/scene'

export default {
  id: 'preparacion',
  version: '1.0.0',
  meta: {
    title: { es: 'A Cocinar', en: "Let's Cook" },
    instruction: {
      es: 'Los frijoles no se comen crudos. Ordena los pasos para prepararlos, desde limpiarlos hasta comerlos.',
      en: "Beans aren't eaten raw. Put the steps in order to prepare them, from cleaning to eating.",
    },
    completionFeedback: {
      es: 'Ordenaste todos los pasos para cocinar los frijoles.',
      en: 'You put all the steps to cook beans in order.',
    },
    estimatedDuration: 180,
    difficulty: 'medium',
    learningGoals: ['proceso-preparacion', 'cambios-sensoriales'],
  },
  strings: {
    stepLimpiar: { es: 'Escoger y limpiar', en: 'Pick and clean' },
    stepLavar: { es: 'Lavar con agua', en: 'Rinse with water' },
    stepRemojar: { es: 'Remojar', en: 'Soak' },
    stepCocinar: { es: 'Cocinar en la olla', en: 'Cook in the pot' },
    stepComer: { es: 'Servir y comer', en: 'Serve and eat' },
    shuffle: { es: 'Mezclar', en: 'Shuffle' },
    knTitle: { es: 'De crudos a deliciosos', en: 'From raw to delicious' },
    knHtml: {
      es: 'Al cocinarse, los frijoles cambian su olor, su sabor y su textura.',
      en: 'When cooked, beans change their smell, taste, and texture.',
    },
    knVoice: {
      es: '¡Muy bien! Así pasan los frijoles de crudos a deliciosos.',
      en: "Great! That's how beans go from raw to delicious.",
    },
  },
  primitives: ['ReorderList'],
  defaults: {
    pointsOnComplete: 30,
  },
  events: ['complete', 'score'],
} satisfies SceneConfig
