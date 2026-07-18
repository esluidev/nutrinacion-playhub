import type { SceneConfig } from '~/types/scene'

export default {
  id: 'despedida',
  version: '1.0.0',
  meta: {
    title: { es: 'Hasta Pronto', en: 'See You Soon' },
    instruction: {
      es: 'El taller terminó. Es momento de recordar cómo el cuerpo se movió suave, con energía y volvió a la calma.',
      en: 'The workshop is over. Time to remember how the body moved gently, with energy, and came back to calm.',
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
      es: 'Tu cuerpo se movió suave, se llenó de energía y volvió a la calma.<br>¡Sigue moviéndote todos los días en espacios seguros!',
      en: 'Your body moved gently, filled up with energy, and came back to calm.<br>Keep moving every day in safe spaces!',
    },
    statPoints: { es: 'puntos', en: 'points' },
    statScenes: { es: 'escenas', en: 'scenes' },
    statTime: { es: 'tiempo', en: 'time' },
    byeBtn: { es: '¡Hasta pronto!', en: 'See you soon!' },
    speak: {
      es: '¡Lo lograste! Moviste tu cuerpo, ganaste fuerza en las piernas y aprendiste a descansar. Sigue moviéndote todos los días.',
      en: 'You did it! You moved your body, made your legs stronger, and learned to rest. Keep moving every day.',
    },
  },
  primitives: [],
  defaults: {
    // Escena resumen (regla 17): muestra las recompensas — no otorga puntos
    pointsOnComplete: 0,
  },
  events: ['complete'],
} satisfies SceneConfig
