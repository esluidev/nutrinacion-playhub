import type { SceneConfig } from '~/types/scene'

export default {
  id: 'resistencia',
  version: '1.0.0',
  meta: {
    title: { es: 'El Semáforo', en: 'The Traffic Light' },
    instruction: {
      es: 'Juguemos al semáforo. Luz verde: marcha rápido. Luz amarilla: marcha despacio. Luz roja: ¡quédate como estatua con la espalda firme! Toca el botón para empezar cada ronda.',
      en: 'Let’s play traffic light. Green light: march fast. Yellow light: march slowly. Red light: freeze like a statue with a steady back! Tap the button to start each round.',
    },
    completionFeedback: {
      es: 'Jugaste tres rondas de semáforo moviéndote y frenando con control.',
      en: 'You played three traffic-light rounds moving and stopping with control.',
    },
    estimatedDuration: 300,
    difficulty: 'medium',
    learningGoals: ['control-inhibitorio', 'resistencia', 'postura-firme'],
  },
  strings: {
    startBtn: { es: '¡Vamos!', en: 'Go!' },
    cueIdle: { es: 'Marcha', en: 'March' },
    cueGo: { es: '¡Rápido!', en: 'Fast!' },
    cueSlow: { es: 'Despacio', en: 'Slowly' },
    cueFreeze: { es: '¡Estatua!', en: 'Freeze!' },
    knTitle: { es: 'Control del cuerpo', en: 'Body control' },
    knHtml: {
      es: 'Frenar como estatua con la espalda firme entrena el <span style="color:#b82838; font-weight: 900;">control del cuerpo</span>: tú decides cuándo moverte y cuándo parar.',
      en: 'Freezing like a statue with a steady back trains <span style="color:#b82838; font-weight: 900;">body control</span>: you decide when to move and when to stop.',
    },
    knVoice: {
      es: '¡Muy bien! Frenar como estatua con la espalda firme entrena el control del cuerpo: tú decides cuándo moverte y cuándo parar.',
      en: 'Great! Freezing like a statue with a steady back trains body control: you decide when to move and when to stop.',
    },
  },
  primitives: ['PoseGuide', 'StopLight'],
  defaults: {
    pointsPerRound: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
