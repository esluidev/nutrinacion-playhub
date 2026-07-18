import type { SceneConfig } from '~/types/scene'

export default {
  id: 'coordinacion',
  version: '1.0.0',
  meta: {
    title: { es: 'Sigue al Líder', en: 'Follow the Leader' },
    instruction: {
      es: 'Sigue al líder: el personaje irá cambiando de movimiento al ritmo y tú lo copias con tu cuerpo en vivo, sin parar. Cada ronda es más rápida. Toca el botón cuando estés listo.',
      en: 'Follow the leader: the character will keep changing movements to the beat and you copy it live with your body, without stopping. Each round gets faster. Tap the button when you are ready.',
    },
    completionFeedback: {
      es: 'Seguiste al líder en tres rondas cada vez más veloces sin perder el ritmo.',
      en: 'You followed the leader through three faster and faster rounds without losing the beat.',
    },
    estimatedDuration: 300,
    difficulty: 'hard',
    learningGoals: ['coordinacion', 'memoria-de-movimiento', 'agilidad-segura'],
  },
  strings: {
    startBtn: { es: '¡Vamos!', en: 'Go!' },
    cueIdle: { es: 'Sigue al líder', en: 'Follow the leader' },
    knTitle: { es: 'Coordinación', en: 'Coordination' },
    knHtml: {
      es: 'Cambiar de movimiento al instante entrena la <span style="color:#2680ae; font-weight: 900;">coordinación</span>: el cuerpo escucha, responde y no pierde la postura.',
      en: 'Switching movements right away trains <span style="color:#2680ae; font-weight: 900;">coordination</span>: the body listens, responds and keeps its posture.',
    },
    knVoice: {
      es: '¡Muy bien! Cambiar de movimiento al instante entrena la coordinación: el cuerpo escucha, responde y no pierde la postura.',
      en: 'Great! Switching movements right away trains coordination: the body listens, responds and keeps its posture.',
    },
  },
  primitives: ['PoseGuide', 'StepMeter'],
  defaults: {
    pointsPerRound: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
