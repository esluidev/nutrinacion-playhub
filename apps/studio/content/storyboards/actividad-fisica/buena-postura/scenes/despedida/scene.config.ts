import type { SceneConfig } from '~/types/scene'

export default {
  id: 'despedida',
  version: '1.0.0',
  meta: {
    title: { es: 'Hasta Pronto', en: 'See You Soon' },
    instruction: {
      es: 'El taller terminó. Es momento de recordar cómo el cuerpo se movió con buena postura, ganó energía y volvió a la calma.',
      en: 'The workshop is over. Time to remember how the body moved with good posture, gained energy, and came back to calm.',
    },
    estimatedDuration: 60,
    difficulty: 'easy',
    learningGoals: ['cierre-positivo', 'motivacion-habitos-activos'],
  },
  // El accent del título va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡Lo <span style="color: var(--accent-green-dark)">lograste</span>!',
      en: 'You <span style="color: var(--accent-green-dark)">did it</span>!',
    },
    message: {
      es: 'Tu cuerpo se movió con la espalda firme, ganó energía y volvió a la calma.<br>¡Cuida tu postura todos los días: al sentarte, al caminar y al jugar!',
      en: 'Your body moved with a steady back, gained energy, and came back to calm.<br>Take care of your posture every day: sitting, walking and playing!',
    },
    statPoints: { es: 'puntos', en: 'points' },
    statScenes: { es: 'escenas', en: 'scenes' },
    statTime: { es: 'tiempo', en: 'time' },
    byeBtn: { es: '¡Hasta pronto!', en: 'See you soon!' },
    speak: {
      es: '¡Lo lograste! Moviste tu cuerpo con buena postura, ganaste energía y aprendiste a descansar. Cuida tu postura todos los días: al sentarte, al caminar y al jugar.',
      en: 'You did it! You moved your body with good posture, gained energy, and learned to rest. Take care of your posture every day: sitting, walking and playing.',
    },
  },
  primitives: [],
  defaults: {
    // Escena resumen (regla 17): muestra las recompensas — no otorga puntos
    pointsOnComplete: 0,
  },
  events: ['complete'],
} satisfies SceneConfig
