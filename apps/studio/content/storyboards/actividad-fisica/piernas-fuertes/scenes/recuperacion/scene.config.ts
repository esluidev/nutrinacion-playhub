import type { SceneConfig } from '~/types/scene'

export default {
  id: 'recuperacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Calma el Cuerpo', en: 'Calm the Body' },
    instruction: {
      es: 'Después del esfuerzo, el cuerpo descansa. Toca la tarjeta de respirar y sigue la burbuja: toma aire cuando crece y suéltalo cuando se hace pequeña. Después estira despacio con las tarjetas que siguen, en orden.',
      en: 'After the effort, the body rests. Tap the breathing card and follow the bubble: take air in when it grows and let it out when it gets small. Then stretch slowly with the next cards, in order.',
    },
    completionFeedback: {
      es: 'Calmaste el cuerpo con respiraciones profundas y estiramientos suaves.',
      en: 'You calmed your body with deep breaths and gentle stretches.',
    },
    estimatedDuration: 240,
    difficulty: 'easy',
    learningGoals: ['recuperacion', 'respiracion-guiada', 'relajacion-muscular'],
  },
  strings: {
    breatheBtn: { es: 'Respirar', en: 'Breathe' },
    labelIn: { es: 'Inhala', en: 'Breathe in' },
    labelOut: { es: 'Exhala', en: 'Breathe out' },
    knBreathTitle: { es: 'Respirar hondo', en: 'Deep breathing' },
    knBreathHtml: {
      es: 'Respirar hondo y despacio le avisa al cuerpo que es <span style="color:#2680ae; font-weight: 900;">momento de descansar</span>.',
      en: 'Breathing deep and slow tells the body it is <span style="color:#2680ae; font-weight: 900;">time to rest</span>.',
    },
    knBreathVoice: {
      es: '¡Muy bien! Respirar hondo y despacio le avisa al cuerpo que es momento de descansar.',
      en: 'Great! Breathing deep and slow tells the body it is time to rest.',
    },
  },
  primitives: ['BreathGuide', 'PoseGuide', 'ExerciseTimer'],
  defaults: {
    breathCycles: 3,
    pointsBreath: 10,
    pointsPerStretch: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
