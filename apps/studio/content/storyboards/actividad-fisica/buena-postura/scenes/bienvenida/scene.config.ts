import type { SceneConfig } from '~/types/scene'

export default {
  id: 'bienvenida',
  version: '1.0.0',
  meta: {
    title: { es: 'Bienvenida', en: 'Welcome' },
    // Anuncio hablado (botón de audio del HUD): título + subtítulo + seguridad
    // + arranque en UN audio. No se autonarra (autoplay bloqueado); nudge en kid.
    instruction: {
      es: '¡Creciendo con buena postura! Hoy vamos a aprender a mover el cuerpo con la espalda firme y sin tensión. Busca un lugar libre y cómodo donde puedas moverte sin chocar con nada. Toca el botón verde para comenzar el taller.',
      en: 'Growing with good posture! Today we are going to learn to move our body with a steady back and no tension. Find a clear, comfortable spot where you can move without bumping into anything. Tap the green button to start the workshop.',
    },
    estimatedDuration: 120,
    difficulty: 'easy',
    learningGoals: ['apertura-del-tema', 'espacio-seguro', 'postura-saludable'],
  },
  // El accent va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡Buena <span style="color: var(--accent-green-dark)">postura</span>!',
      en: 'Good <span style="color: var(--accent-green-dark)">posture</span>!',
    },
    subtitle: {
      es: 'Hoy aprenderemos a movernos con la espalda firme y relajada',
      en: 'Today we will learn to move with a steady, relaxed back',
    },
    cta: { es: '¡Comenzar!', en: 'Start!' },
  },
  primitives: [],
  defaults: {
    pointsOnComplete: 10,
    // Escena de puro anuncio: completar salta directo a la siguiente
    advanceOnComplete: true,
  },
  events: ['complete', 'score'],
} satisfies SceneConfig
