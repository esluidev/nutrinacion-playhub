import type { Enums } from '../../../../supabase/database.types'
import type { Localized } from '~/types/i18n'
import type { EscenaMetadata, EstadoCatalogo } from './storyboardMetadata'

// ─────────────────────────────────────────────────────────────────────────────
// Lo que la gestión de Player resume de la base para contarlo de un vistazo: los dos estados de
// un storyboard (frente a la base y de publicación), cuánta guía hay escrita por idioma y por
// escena (la escribe Admin; aquí solo se mira) y qué toca hacer ahora. Lógica PURA, con test.
// ─────────────────────────────────────────────────────────────────────────────

export type EstadoPublicacion = Enums<'estado_publicacion'>

/** El estado del JSON frente a la base: la primera pregunta de la gestión. */
export const ESTADO_CATALOGO: Record<EstadoCatalogo, { label: string, tone: 'coral' | 'sun' | 'lime', desc: string }> = {
  sin_registrar: { label: 'Sin registrar', tone: 'coral', desc: 'La base no lo conoce: no se puede publicar ni escribir su guía.' },
  desactualizado: { label: 'Desactualizado', tone: 'sun', desc: 'El JSON cambió después del último registro: la base dice otra cosa.' },
  al_dia: { label: 'Al día', tone: 'lime', desc: 'La base dice lo mismo que el JSON.' },
}

/** El estado de publicación, como un artículo (decisión 007). El tono sale de `uiPublicationTone`. */
export const ESTADO_PUBLICACION: Record<EstadoPublicacion, { label: string, desc: string }> = {
  REGISTRADO: { label: 'Registrado', desc: 'Está en la base; solo lo ve el equipo de Nutrinación.' },
  EN_REVISION: { label: 'En revisión', desc: 'El equipo revisa el contenido y la guía antes de publicarlo.' },
  PUBLICADO: { label: 'Publicado', desc: 'Lo ven las organizaciones de sus países y se puede programar.' },
  ARCHIVADO: { label: 'Archivado', desc: 'No se programa más; lo ya programado se conserva.' },
}

export const ORDEN_PUBLICACION: EstadoPublicacion[] = ['REGISTRADO', 'EN_REVISION', 'PUBLICADO', 'ARCHIVADO']

// Las secciones de la guía de cada escena (`guia_escenas`), por idioma. Mecánica y material se
// completan cuando el juego está hecho; cualquiera con texto cuenta como «empezada».
export const SECCIONES_GUIA = ['verbo', 'subtitulo', 'descripcion', 'objetivo', 'pedagogia', 'preguntas', 'psicologia',
  'cientifico', 'no_hace', 'consejos', 'mecanica', 'material'] as const
export type SeccionGuia = (typeof SECCIONES_GUIA)[number]

/** Una escena de la guía como la devuelve la base: lo del JSON más lo escrito en Admin. */
export type EscenaGuia = EscenaMetadata & Partial<Record<SeccionGuia, Localized | null>>

export interface GuiaIdioma {
  idioma: string
  /** Escenas con algo escrito en ese idioma. */
  escritas: number
  total: number
}

/** En qué idiomas, de los del storyboard, la escena tiene algo escrito. */
export function idiomasEscritos(escena: EscenaGuia, idiomas: string[]): string[] {
  return idiomas.filter(idioma => SECCIONES_GUIA.some(seccion => !!escena[seccion]?.[idioma]?.trim()))
}

/** Escenas escritas de N, por idioma del storyboard. */
export function resumenGuia(escenas: EscenaGuia[], idiomas: string[]): GuiaIdioma[] {
  return idiomas.map(idioma => ({
    idioma,
    escritas: escenas.filter(escena => idiomasEscritos(escena, [idioma]).length > 0).length,
    total: escenas.length,
  }))
}

/** El tono de un avance de la guía: completa en lima, empezada en sol, sin empezar neutra. */
export function tonoGuia(escritas: number, total: number): 'lime' | 'sun' | 'neutral' {
  if (total > 0 && escritas === total) return 'lime'
  return escritas > 0 ? 'sun' : 'neutral'
}

const NOMBRES_IDIOMA: Record<string, string> = { es: 'Español', en: 'English' }
export const nombreIdioma = (codigo: string) => NOMBRES_IDIOMA[codigo] ?? codigo.toUpperCase()

/**
 * Qué toca hacer ahora con un storyboard, en una frase: el hilo de «JSON nuevo» a «publicado»
 * (registrar → revisar → elegir países → publicar) sin tener que deducirlo de los badges.
 */
export function siguientePaso(
  estado: EstadoCatalogo | null,
  publicacion: { estado: EstadoPublicacion, paises: string[] } | null,
  errores: string[] = [],
): string {
  if (errores.length) return 'El JSON tiene errores: corrígelos antes de registrarlo.'
  if (!estado) return 'Leyendo la base…'
  if (estado === 'sin_registrar') return 'Regístralo en la base: así Admin podrá escribir su guía y se podrá publicar.'
  if (estado === 'desactualizado') return 'Actualízalo en la base para que diga lo mismo que el JSON.'
  if (!publicacion) return 'La base dice lo mismo que el JSON.'
  switch (publicacion.estado) {
    case 'REGISTRADO':
      return publicacion.paises.length
        ? 'Al día. Pásalo a revisión o publícalo cuando esté listo.'
        : 'Al día. Elige sus países y pásalo a revisión o publícalo cuando esté listo.'
    case 'EN_REVISION':
      return publicacion.paises.length
        ? 'En revisión. Publícalo cuando el contenido y la guía estén listos.'
        : 'En revisión. Elige sus países y publícalo cuando el contenido y la guía estén listos.'
    case 'PUBLICADO':
      return publicacion.paises.length === 1
        ? 'Publicado en un país: las organizaciones de ahí ya lo pueden programar.'
        : `Publicado en ${publicacion.paises.length} países: sus organizaciones ya lo pueden programar.`
    case 'ARCHIVADO':
      return 'Archivado: no se programa más. Para volver a ofrecerlo, publícalo otra vez.'
  }
}
