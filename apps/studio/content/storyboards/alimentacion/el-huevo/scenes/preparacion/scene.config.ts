import type { SceneConfig } from '~/types/scene'

export default {
  id: 'preparacion',
  version: '1.0.0',
  meta: {
    title: { es: 'A Cocinar', en: "Let's Cook" },
    instruction: {
      es: 'El huevo nunca se come crudo. Lleva un huevo a cada estación y mira cómo la cocina lo prepara de una forma distinta.',
      en: 'The egg is never eaten raw. Bring an egg to each station and watch the kitchen prepare it a different way.',
    },
    completionFeedback: {
      es: 'Pusiste la cocina a funcionar: huevo hervido, frito y revuelto.',
      en: 'You got the kitchen going: boiled, fried, and scrambled egg.',
    },
    estimatedDuration: 240,
    difficulty: 'medium',
    learningGoals: ['formas-de-preparacion', 'consumo-seguro', 'cambios-sensoriales'],
  },
  // Texto de las 3 estaciones de cocina (nombre + tarjeta de saber por estación).
  strings: {
    eggLabel: { es: 'Huevo', en: 'Egg' },

    hervidoName: { es: 'Hervido', en: 'Boiled' },
    hervidoKnTitle: { es: 'Huevo hervido', en: 'Boiled egg' },
    hervidoHtml: {
      es: 'En la olla con agua caliente se vuelve <span style="color:#3aa8e0; font-weight: 900;">huevo duro</span>: firme y fácil de pelar.',
      en: 'In the pot with hot water it becomes a <span style="color:#3aa8e0; font-weight: 900;">hard-boiled egg</span>: firm and easy to peel.',
    },
    hervidoVoice: {
      es: '¡Muy bien! En la olla con agua caliente el huevo se vuelve duro: firme y fácil de pelar.',
      en: 'Great! In the pot with hot water the egg becomes hard: firm and easy to peel.',
    },

    fritoName: { es: 'Frito', en: 'Fried' },
    fritoKnTitle: { es: 'Huevo frito', en: 'Fried egg' },
    fritoHtml: {
      es: 'Cascado en el sartén, la clara se pone blanca y la <span style="color:#c49b2a; font-weight: 900;">yema brilla</span> en el centro.',
      en: 'Cracked into the pan, the white turns white and the <span style="color:#c49b2a; font-weight: 900;">yolk shines</span> in the center.',
    },
    fritoVoice: {
      es: '¡Muy bien! Cascado en el sartén, la clara se pone blanca y la yema queda brillante en el centro.',
      en: 'Great! Cracked into the pan, the white turns white and the yolk stays shiny in the center.',
    },

    revueltoName: { es: 'Revuelto', en: 'Scrambled' },
    revueltoKnTitle: { es: 'Huevo revuelto', en: 'Scrambled egg' },
    revueltoHtml: {
      es: 'Batido en el tazón y cocinado, queda <span style="color:#4a9068; font-weight: 900;">suave y esponjoso</span>.',
      en: 'Beaten in the bowl and cooked, it turns out <span style="color:#4a9068; font-weight: 900;">soft and fluffy</span>.',
    },
    revueltoVoice: {
      es: '¡Muy bien! Batido en el tazón y cocinado, el huevo revuelto queda suave y esponjoso.',
      en: 'Great! Beaten in the bowl and cooked, scrambled egg turns out soft and fluffy.',
    },
  },
  primitives: ['Draggable', 'DropZone', 'Stove', 'TapAction', 'Particles', 'Stir'],
  defaults: {
    pointsPerCook: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
