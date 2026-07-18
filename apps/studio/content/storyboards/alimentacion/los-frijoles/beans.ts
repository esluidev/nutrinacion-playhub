// Datos compartidos del storyboard "Los Frijoles".
// Colores, datos y puntos vienen de ruleta-frijoles-v2 (juego de referencia);
// benefit/emoji los extienden para propiedades/retroalimentacion.
//
// i18n: los CAMPOS DE TEXTO son Localized ({ es, en }) y se traducen UNA sola
// vez aquí (los usan descubrimiento, propiedades y el quiz). Las escenas piden
// `beansFor(locale)` y reciben una vista `Bean` con strings ya resueltos.
//
// HARD RULE: el alimento es INERTE — sin personalidad, nunca habla en primera
// persona. Todo texto para el niño lo presenta tal cual, en tercera persona.

import { tr, type Localized } from '~/types/i18n'

/** Forma canónica (autoría): los campos de texto son Localized. */
export interface BeanDef {
  id: string
  /** Nombre corto ("Rojo" / "Red") */
  name: Localized
  /** Etiqueta completa para el niño ("Frijol Rojo" / "Red Bean") — el orden de
      palabras depende del idioma, por eso se localiza la frase entera */
  displayName: Localized
  /** Descripción en tercera persona (escena de bienvenida/descubrimiento) */
  description: Localized
  /** Color del sector de la ruleta / tintes */
  color: string
  /** Tono más oscuro de la silueta del frijol dentro del sector */
  sectorBean: string
  /** Colores del sticker */
  bean: { body: string; outline: string }
  /** Nutriente resaltado, localizado ("hierro" / "iron") */
  nutrient: Localized
  nutrientColor: string
  /** Súper poder para niños */
  benefitEmoji: string
  benefit: Localized
  points: number
  /** Dato con el marcador {{nutriente}} (el nutriente difiere por idioma) */
  fact: Localized
}

/** Vista resuelta a UN idioma — strings planos, lista para la escena. */
export interface Bean {
  id: string
  name: string
  displayName: string
  description: string
  color: string
  sectorBean: string
  bean: { body: string; outline: string }
  nutrient: string
  nutrientColor: string
  benefitEmoji: string
  benefit: string
  points: number
  fact: string
}

export const BEANS: BeanDef[] = [
  {
    id: 'rojo',
    name: { es: 'Rojo', en: 'Red' },
    displayName: { es: 'Frijol Rojo', en: 'Red Bean' },
    description: {
      es: 'Es pequeño, con forma de riñón y de color rojo oscuro.',
      en: "It's small, kidney-shaped, and dark red.",
    },
    color: '#e63946',
    sectorBean: '#b82838',
    bean: { body: '#d4404f', outline: '#5a1a22' },
    nutrient: { es: 'hierro', en: 'iron' },
    nutrientColor: '#e63946',
    benefitEmoji: '⚡',
    benefit: { es: 'Energía para jugar y correr', en: 'Energy to play and run' },
    points: 7,
    fact: {
      es: 'Tiene mucho {{hierro}}, nos da energía para jugar y correr.',
      en: 'It has lots of {{iron}}, which gives us energy to play and run.',
    },
  },
  {
    id: 'negro',
    name: { es: 'Negro', en: 'Black' },
    displayName: { es: 'Frijol Negro', en: 'Black Bean' },
    description: {
      es: 'Es brillante y de color negro. Es muy común en muchas casas.',
      en: "It's shiny and black. It's very common in many homes.",
    },
    color: '#3aa8e0',
    sectorBean: '#2680ae',
    bean: { body: '#3a3a42', outline: '#0a0a10' },
    nutrient: { es: 'antioxidantes', en: 'antioxidants' },
    nutrientColor: '#3aa8e0',
    benefitEmoji: '❤️',
    // Frase nominal: encaja en "nos da {benefit}" (voz) y como etiqueta del súper poder
    benefit: { es: 'Un corazón sano', en: 'A healthy heart' },
    points: 9,
    fact: {
      es: 'Está lleno de {{antioxidantes}} que cuidan nuestro corazón.',
      en: "It's full of {{antioxidants}} that care for our heart.",
    },
  },
  {
    id: 'blanco',
    name: { es: 'Blanco', en: 'White' },
    displayName: { es: 'Frijol Blanco', en: 'White Bean' },
    description: {
      es: 'Es suave y de color claro, casi como la crema.',
      en: "It's soft and light-colored, almost like cream.",
    },
    color: '#6bbf8a',
    sectorBean: '#4a9068',
    bean: { body: '#f2e9cc', outline: '#5a4a2a' },
    nutrient: { es: 'fibra', en: 'fiber' },
    nutrientColor: '#4a9068',
    benefitEmoji: '😊',
    benefit: { es: 'Pancita feliz', en: 'A happy tummy' },
    points: 6,
    fact: {
      es: 'Tiene mucha {{fibra}} que ayuda a la pancita feliz.',
      en: 'It has lots of {{fiber}} that helps keep the tummy happy.',
    },
  },
  {
    id: 'pinto',
    name: { es: 'Pinto', en: 'Pinto' },
    displayName: { es: 'Frijol Pinto', en: 'Pinto Bean' },
    description: {
      es: 'Tiene manchitas de color café, como pintitas.',
      en: 'It has little brown spots, like freckles.',
    },
    color: '#f4c542',
    sectorBean: '#c49b2a',
    bean: { body: '#d4a872', outline: '#3d2a20' },
    nutrient: { es: 'proteínas', en: 'protein' },
    nutrientColor: '#c49b2a',
    benefitEmoji: '💪',
    benefit: { es: 'Fuerza para crecer', en: 'Strength to grow' },
    points: 8,
    fact: {
      es: 'Tiene muchas {{proteínas}} para crecer fuerte y sano.',
      en: 'It has lots of {{protein}} to grow strong and healthy.',
    },
  },
]

/** Resuelve las variedades a un idioma (strings planos) para usar en la escena. */
export function beansFor(locale: string): Bean[] {
  return BEANS.map(b => ({
    ...b,
    name: tr(b.name, locale),
    displayName: tr(b.displayName, locale),
    description: tr(b.description, locale),
    nutrient: tr(b.nutrient, locale),
    benefit: tr(b.benefit, locale),
    fact: tr(b.fact, locale),
  }))
}

/** Mezcla un color saturado con blanco para un pastel suave (ruleta v2) */
export function pastelize(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c * 0.25 + 255 * 0.75)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

/** Dato (resuelto) con el marcador {{nutriente}} envuelto en un span de color */
export function factHtml(bean: Bean): string {
  return bean.fact.replace(
    `{{${bean.nutrient}}}`,
    `<span style="color:${bean.nutrientColor}; font-weight: 900;">${bean.nutrient}</span>`,
  )
}

/** Dato (resuelto) como texto de voz (sin marcadores) */
export function factSpeech(bean: Bean): string {
  return `${bean.displayName}. ${bean.fact.replace(/\{\{|\}\}/g, '')}`
}
