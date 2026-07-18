import type { SceneConfig } from '~/types/scene'

export default {
  id: 'bienvenida',
  version: '1.0.0',
  meta: {
    title: { es: 'Bienvenida', en: 'Welcome' },
    // Anuncio hablado (botón de audio del HUD): título + subtítulo + seguridad
    // + arranque en UN audio. No se autonarra (autoplay bloqueado); nudge en kid.
    instruction: {
      es: '¡Piernas fuertes! Hoy vamos a mover el cuerpo con ejercicios divertidos y seguros. Busca un lugar libre donde puedas moverte sin chocar con nada. Toca el botón verde para comenzar el taller.',
      en: 'Strong legs! Today we are going to move our body with fun and safe exercises. Find a clear spot where you can move without bumping into anything. Tap the green button to start the workshop.',
    },
    estimatedDuration: 120,
    difficulty: 'easy',
    learningGoals: ['apertura-del-tema', 'espacio-seguro', 'activacion-inicial'],
  },
  // El accent va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡Piernas <span style="color: var(--accent-green-dark)">fuertes</span>!',
      en: 'Strong <span style="color: var(--accent-green-dark)">legs</span>!',
    },
    subtitle: {
      es: 'Hoy moveremos el cuerpo con ejercicios divertidos y seguros',
      en: 'Today we will move our body with fun and safe exercises',
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
