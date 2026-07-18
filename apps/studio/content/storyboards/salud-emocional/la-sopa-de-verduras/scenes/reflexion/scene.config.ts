import type { SceneConfig } from '~/types/scene'

export default {
  id: 'reflexion',
  version: '2.0.0',
  meta: {
    title: { es: 'Mi Plan Tranquilo', en: 'My Calm Plan' },
    instruction: {
      es: 'Construye tu plan para la mesa. Primero elige algo que podrías sentir frente a la sopa. Después elige una forma de cuidarte y mira la frase respetuosa que puedes usar.',
      en: 'Build your plan for the table. First choose something you might feel about the soup. Then choose a way to care for yourself and see the respectful phrase you can use.',
    },
    completionFeedback: {
      es: 'Construiste un plan para reconocer lo que sientes, cuidarte y expresarlo con respeto.',
      en: 'You built a plan to recognize what you feel, care for yourself and express it respectfully.',
    },
    estimatedDuration: 240,
    difficulty: 'easy',
    learningGoals: ['reflexion-personal', 'eleccion-de-estrategia', 'comunicacion-respetuosa'],
  },
  strings: {
    feelingStep: { es: '1 · Lo que siento', en: '1 · What I feel' },
    strategyStep: { es: '2 · Lo que puedo hacer', en: '2 · What I can do' },
    phraseStep: { es: '3 · Lo que puedo decir', en: '3 · What I can say' },
    feelingPrompt: { es: 'Frente a la sopa podría sentir…', en: 'When I see the soup, I might feel…' },
    strategyPrompt: { es: 'Para responder con calma puedo…', en: 'To respond calmly, I can…' },
    planBtn: { es: '¡Mi plan!', en: 'My plan!' },
    knTitle: { es: 'Un plan que cuida', en: 'A caring plan' },
    knHtml: {
      es: 'La sopa de verduras aporta alimentos que ayudan al cuerpo a <span style="color: var(--accent-green-dark); font-weight: 900;">crecer y tener energía</span>. Puedes conocerla poco a poco y decir con respeto si su olor, sabor o textura te incomodan.',
      en: 'Vegetable soup provides foods that help the body <span style="color: var(--accent-green-dark); font-weight: 900;">grow and have energy</span>. You can discover it little by little and respectfully say if its smell, taste or texture feels uncomfortable.',
    },
    knVoice: {
      es: 'La sopa de verduras aporta alimentos que ayudan al cuerpo a crecer y tener energía. Puedes conocerla poco a poco y decir con respeto si su olor, sabor o textura te incomodan.',
      en: 'Vegetable soup provides foods that help the body grow and have energy. You can discover it little by little and respectfully say if its smell, taste or texture feels uncomfortable.',
    },
  },
  primitives: [],
  defaults: {
    pointsPerChoice: 10,
    pointsOnComplete: 30,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
