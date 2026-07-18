import type { SceneConfig } from '~/types/scene'

export default {
  id: 'motricidad',
  version: '1.0.0',
  meta: {
    title: { es: 'Quédate Así', en: 'Hold It' },
    instruction: {
      es: 'Vamos a jugar a quedarnos quietos. Toca el botón, ponte igual que el personaje y sostén la postura sin moverte mientras el anillo se llena. Espalda firme y respiración tranquila.',
      en: 'Let’s play staying still. Tap the button, copy the character and hold the posture without moving while the ring fills up. Steady back and calm breathing.',
    },
    completionFeedback: {
      es: 'Sostuviste las cuatro posturas como una estatua: tu espalda y tu equilibrio se hicieron más fuertes.',
      en: 'You held all four postures like a statue: your back and your balance got stronger.',
    },
    estimatedDuration: 240,
    difficulty: 'easy',
    learningGoals: ['postura-firme', 'movimientos-controlados', 'respiracion-coordinada'],
  },
  // Los nombres/datos de los ejercicios viven en moves.ts (datos canónicos del
  // storyboard, compartidos entre escenas) — acá solo la UI propia de la escena.
  strings: {
    holdBtn: { es: '¡Quédate así!', en: 'Hold it!' },
  },
  primitives: ['ProgressRing'],
  defaults: {
    pointsPerHold: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
