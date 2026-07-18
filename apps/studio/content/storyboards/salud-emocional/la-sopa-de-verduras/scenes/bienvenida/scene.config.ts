import type { SceneConfig } from '~/types/scene'

export default {
  id: 'bienvenida',
  version: '2.0.0',
  meta: {
    title: { es: 'Bienvenida', en: 'Welcome' },
    // Anuncio hablado (botón de audio del HUD): título + subtítulo + marco
    // seguro + arranque en UN audio. No se autonarra (autoplay bloqueado);
    // nudge en kid.
    instruction: {
      es: '¡La sopa de verduras! Su color, olor, textura o sabor pueden despertar curiosidad, sorpresa, desagrado o enojo. Todas esas reacciones son normales. Hoy aprenderemos a reconocerlas y decir lo que sentimos con calma y respeto. Toca el botón verde para comenzar.',
      en: 'The vegetable soup! Its color, smell, texture or taste may bring up curiosity, surprise, dislike or anger. All of those reactions are normal. Today we will learn to recognize them and say how we feel calmly and respectfully. Tap the green button to begin.',
    },
    estimatedDuration: 120,
    difficulty: 'easy',
    learningGoals: ['apertura-del-tema', 'emociones-normales', 'ambiente-seguro'],
  },
  // El accent va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡La sopa de <span style="color: var(--accent-green-dark)">verduras</span>!',
      en: 'The <span style="color: var(--accent-green-dark)">vegetable</span> soup!',
    },
    subtitle: {
      es: 'Lo que sentimos al comer también se puede nombrar',
      en: 'We can also name what we feel while eating',
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
