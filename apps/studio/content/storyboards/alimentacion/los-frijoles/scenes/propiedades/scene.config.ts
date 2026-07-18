import type { SceneConfig } from '~/types/scene'

export default {
  id: 'propiedades',
  version: '1.0.0',
  meta: {
    title: { es: 'Los Super Poderes', en: 'Superpowers' },
    instruction: {
      es: 'Cada frijol aporta algo importante al cuerpo. Arrastra cada frijol hacia lo que aporta.',
      en: 'Each bean gives the body something important. Drag each bean to what it provides.',
    },
    completionFeedback: {
      es: 'Ya conoces lo que aporta cada frijol.',
      en: 'Now you know what each bean provides.',
    },
    estimatedDuration: 180,
    difficulty: 'medium',
    learningGoals: ['nutrientes-por-variedad', 'partes-del-frijol'],
  },
  // Frase compuesta con datos del frijol: {nameLower}/{name}/{displayName},
  // {benefit} y {color} los rellena la escena con t(key, vars).
  strings: {
    matchHtml: {
      es: 'El frijol {nameLower} nos da <span style="color:{color};font-weight:900">{benefit}</span>.',
      en: '{displayName} gives your body <span style="color:{color};font-weight:900">{benefit}</span>.',
    },
    matchVoice: {
      es: '¡Muy bien! El frijol {name} nos da {benefit}.',
      en: 'Great! {displayName} gives your body {benefit}.',
    },
  },
  primitives: ['Draggable', 'DropZone'],
  defaults: {
    pointsPerMatch: 10,
    pointsOnComplete: 40,
  },
  events: ['complete', 'score'],
} satisfies SceneConfig
