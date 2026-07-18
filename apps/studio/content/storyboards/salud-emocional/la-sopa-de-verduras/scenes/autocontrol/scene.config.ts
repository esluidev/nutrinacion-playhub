import type { SceneConfig } from '~/types/scene'

export default {
  id: 'autocontrol',
  version: '2.0.0',
  meta: {
    title: { es: 'Alto, Respira y Habla', en: 'Stop, Breathe and Talk' },
    instruction: {
      es: 'Lee la situación al grupo y actúenla juntos: toquen la sopa para imaginarla, y cuando la emoción empiece a subir digan ¡alto! con la mano en alto, respiren hondo sosteniendo la burbuja y repitan la frase en voz alta. Ninguna emoción es mala: lo que practicamos es la respuesta.',
      en: 'Read the situation to the group and act it out together: touch the soup to imagine it, and when the feeling starts to rise say stop with your hand up, take a deep breath while holding the bubble, and repeat the phrase out loud. No feeling is bad: what we practice is the response.',
    },
    completionFeedback: {
      es: 'Practicaste tres veces la secuencia completa: alto, respirar y hablar con respeto.',
      en: 'You practiced the full sequence three times: stop, breathe and speak respectfully.',
    },
    estimatedDuration: 240,
    difficulty: 'medium',
    learningGoals: ['autocontrol-del-enojo', 'detenerse-antes-de-reaccionar', 'comunicacion-asertiva'],
  },
  strings: {
    stopLabel: { es: 'Alto', en: 'Stop' },
    breatheLabel: { es: 'Respira', en: 'Breathe' },
    speakLabel: { es: 'Habla', en: 'Talk' },
    nextBtn: { es: 'Otra situación', en: 'Another situation' },
    listenSituation: { es: 'Escuchar la situación', en: 'Listen to the situation' },
  },
  primitives: ['EmotionGauge', 'HoldAction', 'Particles'],
  defaults: {
    escalateDuration: 4200,
    pointsPerRound: 15,
    pointsOnComplete: 10,
    holdDuration: 3200,
  },
  events: ['complete', 'score', 'knowledge'],
} satisfies SceneConfig
