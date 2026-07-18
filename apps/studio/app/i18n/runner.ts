import type { Localized } from '~/types/i18n'

// ─────────────────────────────────────────────────────────────────────────────
// Textos del SHELL del runner de juego (HUD, hojas, modales de config/salir,
// guía). Es la experiencia de JUEGO — se sirve en el
// idioma del contenido (`?lang=`), NO el UI de gestión de Studio (que es
// español fijo). Compartido por todos los storyboards, por eso vive aquí y no
// en cada scene.config. Se resuelve con useT(RUNNER_STRINGS, () => locale).
// Varios botones se muestran en MAYÚSCULAS por CSS (text-transform): el texto
// se guarda en mayúscula/minúscula natural.
// ─────────────────────────────────────────────────────────────────────────────

export const RUNNER_STRINGS: Record<string, Localized> = {
  // Estados de fallback (storyboard mal configurado — dev)
  noContentTitle: { es: 'Storyboard sin contenido jugable', en: 'Storyboard without playable content' },
  back: { es: 'Volver', en: 'Back' },
  sceneLabel: { es: 'ESCENA {n}', en: 'SCENE {n}' },
  notImplemented: { es: 'Esta escena aun no esta implementada.', en: 'This scene is not implemented yet.' },

  // HUD (aria-labels — los lee el lector de pantalla)
  exitWorkshop: { es: 'Salir del taller', en: 'Exit the workshop' },
  ariaInstruction: { es: 'Escuchar instrucciones de la escena', en: 'Listen to the scene instructions' },
  teacherPanel: { es: 'Panel del docente', en: 'Teacher panel' },
  settings: { es: 'Configuración', en: 'Settings' },
  resetScene: { es: 'Reiniciar escena', en: 'Restart scene' },
  prevScene: { es: 'Escena anterior', en: 'Previous scene' },
  nextScene: { es: 'Siguiente escena', en: 'Next scene' },
  listen: { es: 'Escuchar', en: 'Listen' },

  // Hoja del docente
  sceneCounter: { es: 'Escena {n} de {total}', en: 'Scene {n} of {total}' },
  sceneDone: { es: '· Completada', en: '· Completed' },
  // Scene-list modal (opened from the scene-count pill)
  scenesList: { es: 'Escenas', en: 'Scenes' },
  ariaScenes: { es: 'Ver las escenas del taller', en: 'View the workshop scenes' },
  sceneHere: { es: 'Aquí', en: 'Here' },
  close: { es: 'Cerrar', en: 'Close' },
  guide: { es: 'Guía', en: 'Guide' },
  guideNote: {
    es: 'La guía pedagógica completa de esta escena vivirá aquí.',
    en: "This scene's full teaching guide will live here.",
  },

  // Modal de configuración
  sound: { es: 'Sonido', en: 'Sound' },
  workshop: { es: 'Taller', en: 'Workshop' },
  restart: { es: 'Reiniciar', en: 'Restart' },
  ready: { es: 'Listo', en: 'Done' },

  // Modal de salir
  exitAudio: {
    es: '¿Quieres salir del taller? Toca el botón verde para seguir jugando, o el rojo para salir.',
    en: 'Do you want to exit the workshop? Tap the green button to keep playing, or the red one to exit.',
  },
  exitTitle: { es: '¿Quieres salir?', en: 'Do you want to exit?' },
  exitText: {
    es: 'Si sales del taller, el juego se detiene aquí.',
    en: 'If you exit the workshop, the game stops here.',
  },
  stay: { es: 'Seguir', en: 'Stay' },
  exit: { es: 'Salir', en: 'Exit' },
}
