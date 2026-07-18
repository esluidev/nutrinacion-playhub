// Datos compartidos del storyboard "El Huevo".
// Misma estructura que beans.ts: 4 variedades (una por sector de la ruleta),
// partes para la escena de propiedades + quiz, y colores de identidad.
//
// i18n: los CAMPOS DE TEXTO son Localized ({ es, en }) y se traducen UNA vez
// aquí. Las escenas piden eggsFor(locale) / partsFor(locale) y reciben vistas
// con strings ya resueltos.
//
// HARD RULE: el alimento es INERTE — sin personalidad, nunca habla en primera
// persona. Todo texto para el niño lo presenta tal cual, en tercera persona.

import { tr, type Localized } from '~/types/i18n'

/* ── Variedades (ruleta + quiz) ─────────────────────────────────────────────── */

/** Forma canónica (autoría): campos de texto Localized. */
export interface EggDef {
  id: string
  /** Nombre del ave ("Gallina" / "Hen") */
  name: Localized
  /** Etiqueta completa ("Huevo de Gallina" / "Hen Egg") */
  displayName: Localized
  color: string
  sectorEgg: string
  egg: { body: string; outline: string; speckled?: boolean; speckle?: string }
  highlightColor: string
  points: number
  /** Tamaño lineal relativo al más grande (avestruz = 1) — arma la fila por tamaño */
  sizeScale: number
  /** Dato con el marcador {{...}} resaltado en UI (frase difiere por idioma) */
  fact: Localized
}

/** Vista resuelta a un idioma — strings planos. */
export interface Egg {
  id: string
  name: string
  displayName: string
  color: string
  sectorEgg: string
  egg: { body: string; outline: string; speckled?: boolean; speckle?: string }
  highlightColor: string
  points: number
  sizeScale: number
  fact: string
}

export const EGGS: EggDef[] = [
  {
    id: 'gallina',
    name: { es: 'Gallina', en: 'Hen' },
    displayName: { es: 'Huevo de Gallina', en: 'Hen Egg' },
    color: '#e63946',
    sectorEgg: '#b82838',
    egg: { body: '#f0c08e', outline: '#80522a' },
    highlightColor: '#e63946',
    points: 7,
    sizeScale: 0.35,
    fact: {
      es: 'Es el más común: {{viene de la gallina}} y está en casi todas las cocinas.',
      en: 'It is the most common: {{it comes from the hen}} and is in almost every kitchen.',
    },
  },
  {
    id: 'avestruz',
    name: { es: 'Avestruz', en: 'Ostrich' },
    displayName: { es: 'Huevo de Avestruz', en: 'Ostrich Egg' },
    color: '#3aa8e0',
    sectorEgg: '#2680ae',
    egg: { body: '#f4eedd', outline: '#7c7257' },
    highlightColor: '#3aa8e0',
    points: 8,
    sizeScale: 1,
    fact: {
      es: '¡Es {{el más grande del mundo}}! Pesa como veinticuatro huevos de gallina.',
      en: 'It is {{the biggest in the world}}! It weighs about twenty-four hen eggs.',
    },
  },
  {
    id: 'pata',
    name: { es: 'Pata', en: 'Duck' },
    displayName: { es: 'Huevo de Pata', en: 'Duck Egg' },
    color: '#6bbf8a',
    sectorEgg: '#4a9068',
    egg: { body: '#e3efe4', outline: '#51705c' },
    highlightColor: '#4a9068',
    points: 6,
    sizeScale: 0.42,
    fact: {
      es: 'Es más grande que el de gallina y su {{cáscara es más dura}}.',
      en: 'It is bigger than a hen egg and its {{shell is harder}}.',
    },
  },
  {
    id: 'codorniz',
    name: { es: 'Codorniz', en: 'Quail' },
    displayName: { es: 'Huevo de Codorniz', en: 'Quail Egg' },
    color: '#f4c542',
    sectorEgg: '#c49b2a',
    egg: { body: '#efe3c0', outline: '#6d5429', speckled: true, speckle: '#7a5c33' },
    highlightColor: '#c49b2a',
    points: 9,
    sizeScale: 0.2,
    fact: {
      es: 'Es pequeñito y {{con manchitas}}. Viene de un ave llamada codorniz.',
      en: 'It is tiny and {{has little spots}}. It comes from a bird called a quail.',
    },
  },
]

/* ── Partes (escena de propiedades + quiz) ──────────────────────────────────── */

export interface EggPartDef {
  id: 'cascara' | 'clara' | 'yema'
  name: Localized
  benefitEmoji: string
  benefit: Localized
  highlightColor: string
  /** Dato de la tarjeta de saber (resaltado HTML inline, localizado) */
  factHtml: Localized
  factVoice: Localized
}

export interface EggPart {
  id: 'cascara' | 'clara' | 'yema'
  name: string
  benefitEmoji: string
  benefit: string
  highlightColor: string
  factHtml: string
  factVoice: string
}

export const PARTS: EggPartDef[] = [
  {
    id: 'cascara',
    name: { es: 'Cáscara', en: 'Shell' },
    benefitEmoji: '🛡️',
    benefit: { es: 'Protege el huevo', en: 'Protects the egg' },
    highlightColor: '#c49b2a',
    factHtml: {
      es: 'La cáscara es dura y <span style="color:#c49b2a; font-weight: 900;">protege</span> el huevo. No se come.',
      en: 'The shell is hard and <span style="color:#c49b2a; font-weight: 900;">protects</span> the egg. It is not eaten.',
    },
    factVoice: {
      es: '¡Muy bien! La cáscara es dura y protege el huevo. La cáscara no se come.',
      en: 'Great! The shell is hard and protects the egg. The shell is not eaten.',
    },
  },
  {
    id: 'clara',
    name: { es: 'Clara', en: 'Egg white' },
    benefitEmoji: '💪',
    benefit: { es: 'Músculos fuertes', en: 'Strong muscles' },
    highlightColor: '#3aa8e0',
    factHtml: {
      es: 'La clara tiene <span style="color:#3aa8e0; font-weight: 900;">proteínas</span> que ayudan a crecer con músculos fuertes.',
      en: 'The egg white has <span style="color:#3aa8e0; font-weight: 900;">protein</span> that helps you grow with strong muscles.',
    },
    factVoice: {
      es: '¡Muy bien! La clara tiene proteínas que ayudan a crecer con músculos fuertes.',
      en: 'Great! The egg white has protein that helps you grow with strong muscles.',
    },
  },
  {
    id: 'yema',
    name: { es: 'Yema', en: 'Yolk' },
    benefitEmoji: '👀',
    benefit: { es: 'Vista sana y energía', en: 'Healthy eyes and energy' },
    highlightColor: '#e6a23c',
    factHtml: {
      es: 'La yema tiene <span style="color:#e6a23c; font-weight: 900;">vitaminas</span> que cuidan la vista y dan energía.',
      en: 'The yolk has <span style="color:#e6a23c; font-weight: 900;">vitamins</span> that care for the eyes and give energy.',
    },
    factVoice: {
      es: '¡Muy bien! La yema tiene vitaminas que cuidan la vista y dan energía.',
      en: 'Great! The yolk has vitamins that care for the eyes and give energy.',
    },
  },
]

/* ── Resolvers ──────────────────────────────────────────────────────────────── */

/** Resuelve las variedades a un idioma (strings planos). */
export function eggsFor(locale: string): Egg[] {
  return EGGS.map(e => ({
    ...e,
    name: tr(e.name, locale),
    displayName: tr(e.displayName, locale),
    fact: tr(e.fact, locale),
  }))
}

/** Resuelve las partes a un idioma (strings planos). */
export function partsFor(locale: string): EggPart[] {
  return PARTS.map(p => ({
    ...p,
    name: tr(p.name, locale),
    benefit: tr(p.benefit, locale),
    factHtml: tr(p.factHtml, locale),
    factVoice: tr(p.factVoice, locale),
  }))
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

/** Mezcla un color saturado con blanco para un pastel suave */
export function pastelize(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c * 0.25 + 255 * 0.75)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

/** Dato (resuelto) con el marcador {{...}} envuelto en un span de color */
export function factHtml(egg: Egg): string {
  return egg.fact.replace(
    /\{\{(.+?)\}\}/,
    `<span style="color:${egg.highlightColor}; font-weight: 900;">$1</span>`,
  )
}

/** Dato (resuelto) como texto de voz (sin marcadores) */
export function factSpeech(egg: Egg): string {
  return `${egg.displayName}. ${egg.fact.replace(/\{\{|\}\}/g, '')}`
}

/** Egg silhouette path (200×260 box, center ≈ 100,130) — wheel sectors */
export const EGG_SILHOUETTE = 'M100,8 C148,8 186,86 186,158 C186,216 148,252 100,252 C52,252 14,216 14,158 C14,86 52,8 100,8 Z'
