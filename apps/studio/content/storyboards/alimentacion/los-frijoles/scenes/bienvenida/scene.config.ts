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
      es: '¡A conocer los frijoles! Hoy descubriremos un alimento que ayuda a crecer sanos y fuertes. Toca el botón verde para comenzar el taller.',
      en: "Let's meet beans! Today we'll discover a food that helps us grow healthy and strong. Tap the green button to start the workshop.",
    },
    estimatedDuration: 120,
    difficulty: 'easy',
    learningGoals: ['apertura-del-tema', 'expresar-experiencias'],
  },
  // Texto de UI de la escena (el accent va con estilo inline porque se rinde
  // con v-html — el CSS scoped no alcanza el contenido inyectado).
  strings: {
    title: {
      es: '¡A conocer los <span style="color: var(--accent-red)">frijoles</span>!',
      en: "Let's meet <span style=\"color: var(--accent-red)\">beans</span>!",
    },
    subtitle: {
      es: 'Hoy descubriremos un alimento que ayuda a crecer sanos y fuertes',
      en: "Today we'll discover a food that helps us grow healthy and strong",
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
