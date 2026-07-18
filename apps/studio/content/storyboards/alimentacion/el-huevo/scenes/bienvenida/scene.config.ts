import type { SceneConfig } from '~/types/scene'

export default {
  id: 'bienvenida',
  version: '1.0.0',
  meta: {
    title: { es: 'Bienvenida', en: 'Welcome' },
    // Anuncio hablado de la bienvenida (lo lee el botón de audio del HUD): junta
    // título + subtítulo + arranque en UN audio. NO se autonarra al montar —
    // los navegadores bloquean el autoplay sin gesto; el botón hace nudge en kid.
    instruction: {
      es: '¡A conocer el huevo! Hoy descubriremos un alimento pequeño que guarda mucha fuerza. Toca el botón verde para comenzar el taller.',
      en: "Let's meet the egg! Today we will discover a small food that holds a lot of strength. Tap the green button to start the workshop.",
    },
    estimatedDuration: 120,
    difficulty: 'easy',
    learningGoals: ['apertura-del-tema', 'expresar-experiencias'],
  },
  // El accent va inline (se rinde con v-html).
  strings: {
    title: {
      es: '¡A conocer el <span style="color: var(--accent-yellow-dark)">huevo</span>!',
      en: "Let's meet the <span style=\"color: var(--accent-yellow-dark)\">egg</span>!",
    },
    subtitle: {
      es: 'Hoy descubriremos un alimento pequeño que guarda mucha fuerza',
      en: 'Today we will discover a small food that holds a lot of strength',
    },
    cta: { es: '¡Comenzar!', en: 'Start!' },
  },
  primitives: [],
  defaults: {
    pointsOnComplete: 10,
    // Pure announcement scene (no real interaction): completing it jumps
    // straight to the next scene — no completion popup, no waiting
    advanceOnComplete: true,
  },
  events: ['complete', 'score'],
} satisfies SceneConfig
