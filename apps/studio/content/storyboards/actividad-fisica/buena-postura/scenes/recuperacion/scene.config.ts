import type { SceneConfig } from '~/types/scene'

export default {
  id: 'recuperacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Crece como un Árbol', en: 'Grow like a Tree' },
    instruction: {
      es: 'Vamos a crecer como un árbol. Toca el botón y respira con la burbuja: con cada respiración tu cuerpo crece un poco más, desde semilla hasta árbol. Sigue los movimientos del personaje, despacio.',
      en: 'Let’s grow like a tree. Tap the button and breathe with the bubble: with every breath your body grows a little more, from a seed to a tree. Follow the character’s movements, slowly.',
    },
    completionFeedback: {
      es: 'Creciste como un árbol: respiraste hondo y estiraste todo el cuerpo hasta quedar en calma.',
      en: 'You grew like a tree: you breathed deeply and stretched your whole body until you were calm.',
    },
    estimatedDuration: 240,
    difficulty: 'easy',
    learningGoals: ['recuperacion', 'respiracion-guiada', 'relajacion-muscular'],
  },
  strings: {
    startBtn: { es: 'Comenzar', en: 'Begin' },
    labelIn: { es: 'Inhala', en: 'Breathe in' },
    labelOut: { es: 'Exhala', en: 'Breathe out' },
    knTitle: { es: 'Crecer en calma', en: 'Growing calm' },
    knHtml: {
      es: 'Crecer despacio como un árbol <span style="color:#4a9068; font-weight: 900;">estira la espalda y calma el cuerpo</span> después del ejercicio.',
      en: 'Growing slowly like a tree <span style="color:#4a9068; font-weight: 900;">stretches the back and calms the body</span> after exercise.',
    },
    knVoice: {
      es: '¡Muy bien! Crecer despacio como un árbol estira la espalda y calma el cuerpo después del ejercicio.',
      en: 'Great! Growing slowly like a tree stretches the back and calms the body after exercise.',
    },
  },
  primitives: ['BreathGuide'],
  defaults: {
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
