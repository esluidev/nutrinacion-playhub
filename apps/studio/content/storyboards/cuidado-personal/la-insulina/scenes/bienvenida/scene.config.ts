import type { SceneConfig } from '~/types/scene'

export default {
  id: 'bienvenida',
  version: '1.0.0',
  meta: {
    title: { es: 'Bienvenida', en: 'Welcome' },
    // Anuncio hablado (botón de audio del HUD): título + subtítulo + seguridad
    // + arranque en UN audio. No se autonarra (autoplay bloqueado); nudge en kid.
    instruction: {
      es: '¡Energía con cuidado! Hoy vamos a conocer a la insulina: una ayudante que deja entrar la energía de la comida para jugar, aprender y crecer. Algunas personas la usan con ayuda de un adulto para sentirse bien, y eso es parte natural de cuidar el cuerpo. Toca el botón verde para comenzar.',
      en: 'Energy with care! Today we will meet insulin: a helper that lets the energy from food come in to play, learn and grow. Some people use it with a grown-up’s help to feel good, and that is a natural part of taking care of the body. Tap the green button to begin.',
    },
    estimatedDuration: 120,
    difficulty: 'easy',
    learningGoals: ['apertura-del-tema', 'insulina-como-ayuda', 'confianza-y-calma'],
  },
  // El accent va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡Energía con <span style="color: var(--accent-green-dark)">cuidado</span>!',
      en: 'Energy with <span style="color: var(--accent-green-dark)">care</span>!',
    },
    subtitle: {
      es: 'Hoy conoceremos a la insulina, la ayudante de tu energía',
      en: 'Today we will meet insulin, your energy helper',
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
