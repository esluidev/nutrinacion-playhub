import { tr } from '~/types/i18n'
import type { Narrado, Texto } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Lo que se ve y lo que se dice. Un texto de la escena es un texto por idioma, que se ve y, si es un momento que se
// narra, también se lee; o un texto narrado (`Narrado`), que separa lo que se ve (`text`) de lo que se dice (`voice`)
// y nombra la grabación que lo dice (`audio`, su clave en `audio/<idioma>/` del storyboard).
//
// Se narran momentos: la introducción de la escena (su consigna) y cada hoja de feedback. Un momento junta los
// textos que muestra (la hoja: su título y su cuerpo). Si alguno trae voz o grabación, suenan solo los que la traen,
// cada uno con la suya, en orden: así una voz puede decir la hoja entera sin repetir lo que dicen los demás. Si
// ninguno la trae, se lee lo que se ve. Lógica PURA, con test.
// ─────────────────────────────────────────────────────────────────────────────

/** Un tramo de la narración: lo que se dice y, si la hay, la clave de la grabación que lo dice. */
export interface Tramo {
  text: string
  audio?: string
}

/** Lo que se narra en un momento: uno o varios tramos, seguidos. Vacío si no hay nada que decir. */
export type Voz = Tramo[]

/** Lo que puede formar parte de un momento: un texto de la escena o uno ya resuelto (del runner). */
export type Parte = Texto | string | null | undefined

/** Si un texto de la escena es un texto narrado (lo que se ve, lo que se dice y su grabación). */
export function esNarrado(valor: unknown): valor is Narrado {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor) && 'text' in valor
}

/** Lo que se ve de un texto, en un idioma. */
export function textoDe(valor: Parte, locale: string): string {
  if (!valor) return ''
  return tr(esNarrado(valor) ? valor.text : valor, locale)?.trim() ?? ''
}

const tieneVoz = (valor: Parte): valor is Narrado => esNarrado(valor) && Boolean(valor.voice || valor.audio)

/** Une frases para leerlas seguidas: cada una termina en su signo; si no lo trae, en punto. */
export function unirFrases(frases: string[]): string {
  return frases
    .map(frase => frase.trim())
    .filter(Boolean)
    .map((frase, i, todas) => (i < todas.length - 1 && !/[.!?…:;]$/.test(frase) ? `${frase}.` : frase))
    .join(' ')
}

/** Lo que se narra de un momento hecho con estas partes, en un idioma. */
export function vozDe(partes: Parte[], locale: string): Voz {
  const conVoz = partes.filter(tieneVoz)
  if (conVoz.length) {
    return conVoz
      .map(parte => ({ text: tr(parte.voice ?? parte.text, locale)?.trim() ?? '', ...(parte.audio ? { audio: parte.audio } : {}) }))
      .filter(tramo => tramo.text || tramo.audio)
  }
  const texto = unirFrases(partes.map(parte => textoDe(parte, locale)))
  return texto ? [{ text: texto }] : []
}

/** Las grabaciones que pide un texto (para revisar el contenido): su clave y lo que dice en cada idioma. */
export function grabacionDe(valor: unknown, idiomas: string[]): { audio: string, dice: Record<string, string> } | null {
  if (!esNarrado(valor) || !valor.audio) return null
  return { audio: valor.audio, dice: Object.fromEntries(idiomas.map(idioma => [idioma, tr(valor.voice ?? valor.text, idioma) ?? ''])) }
}
