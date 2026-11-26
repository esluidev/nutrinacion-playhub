import type { Enums } from '../../../../supabase/database.types'
import type { Localized } from '~/types/i18n'
import type { EscenaMetadata, EstadoCatalogo } from './storyboardMetadata'

// ─────────────────────────────────────────────────────────────────────────────
// Lo que la gestión de Player resume de la base para contarlo de un vistazo: los dos estados de
// un storyboard (frente a la base y de publicación), cuánta guía hay escrita por idioma y por
// escena (se escribe aquí, en Player: decisión 013), los campos de la guía con sus ayudas y qué toca
// hacer ahora. Lógica PURA, con test.
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

/**
 * El filtro «Estado» de la lista: dónde está el storyboard en su ciclo (sin registrar o su estado de
 * publicación) o si su JSON cambió desde el último registro (desactualizado, en cualquier estado).
 */
export type FiltroEstado = 'todos' | 'sin_registrar' | 'desactualizado' | EstadoPublicacion

export const OPCIONES_FILTRO_ESTADO: { value: FiltroEstado, label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'sin_registrar', label: 'Sin registrar' },
  { value: 'desactualizado', label: 'Desactualizado' },
  ...ORDEN_PUBLICACION.map(value => ({ value, label: ESTADO_PUBLICACION[value].label })),
]

/** El filtro «Hogar» de la lista (tarea 022): si sale en la app del hogar. */
export type FiltroHogar = 'todos' | 'si' | 'no'

export const OPCIONES_FILTRO_HOGAR: { value: FiltroHogar, label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'si', label: 'En el hogar' },
  { value: 'no', label: 'Fuera del hogar' },
]

/** Si un storyboard pasa el filtro «Hogar»; uno sin registrar no está en el hogar. */
export function pasaFiltroHogar(filtro: FiltroHogar, hogar: boolean | null): boolean {
  if (filtro === 'todos') return true
  return filtro === 'si' ? hogar === true : hogar !== true
}

/** Si un storyboard pasa el filtro «Estado», con su estado frente a la base y el de publicación. */
export function pasaFiltroEstado(filtro: FiltroEstado, base: EstadoCatalogo | null, publicacion: EstadoPublicacion | null): boolean {
  if (filtro === 'todos') return true
  if (filtro === 'sin_registrar' || filtro === 'desactualizado') return base === filtro
  return base !== null && base !== 'sin_registrar' && publicacion === filtro
}

// Las secciones de la guía de cada escena (`guia_escenas`), por idioma. Mecánica y material se
// completan cuando el juego está hecho; cualquiera con texto cuenta como «empezada».
export const SECCIONES_GUIA = ['verbo', 'subtitulo', 'descripcion', 'objetivo', 'pedagogia', 'preguntas', 'psicologia',
  'cientifico', 'no_hace', 'consejos', 'mecanica', 'material'] as const
export type SeccionGuia = (typeof SECCIONES_GUIA)[number]

/** Una escena de la guía como la devuelve la base: lo del JSON más lo escrito en la guía. */
export type EscenaGuia = EscenaMetadata & { id?: number } & Partial<Record<SeccionGuia, Localized | null>>

/** Cada sección de la guía de una escena, con lo que se escribe en ella (la plantilla de la guía). */
export const ETIQUETAS_GUIA: Record<SeccionGuia, { label: string, hint: string }> = {
  verbo: { label: 'Verbo', hint: 'Qué hace el niño en esta escena, tal como está en la estructura.' },
  subtitulo: { label: 'Subtítulo', hint: 'De qué va la escena en este taller.' },
  descripcion: { label: 'Descripción', hint: 'Qué se enseña y qué descubre el niño. Dos o tres líneas.' },
  objetivo: { label: 'Objetivo', hint: 'Qué logra el educador al terminar la escena.' },
  pedagogia: { label: 'Pedagogía', hint: 'Cómo desarrolla el educador el contenido con el grupo: qué dice, qué pregunta y cómo cierra.' },
  preguntas: { label: 'Preguntas e interacciones sugeridas', hint: 'Tres a cinco preguntas y una o dos cosas que el educador pide al grupo.' },
  psicologia: { label: 'Psicología', hint: 'El estado propio de esta escena y cómo acompañarlo.' },
  cientifico: { label: 'Científico', hint: 'Los términos que el educador necesita comprender y cómo explicarlos a esa edad. Sin fuentes.' },
  no_hace: { label: 'Lo que esta escena no hace', hint: 'El límite con la escena vecina: qué no se dice todavía o qué ya se dijo.' },
  consejos: { label: 'Consejos', hint: 'Dos o tres, solo de esta escena.' },
  mecanica: { label: 'Mecánica', hint: 'Cómo funciona el juego de la escena. Se completa cuando el juego está implementado.' },
  material: { label: 'Material', hint: 'Con qué participa quien no tiene dispositivo. Se completa junto con la mecánica.' },
}

/** La cabecera de la guía (tabla `guias`): lo que el educador lee antes de las escenas. */
export interface CabeceraGuia {
  version: string | null
  descripcion: Localized | null
  objetivo: Localized | null
  publico: Localized | null
  /** Solo en un personalizado: para quién es y a qué está adaptado. */
  adaptado_a: Localized | null
}

/**
 * Un texto por idioma como se guarda: solo los idiomas del storyboard, sin espacios sobrantes y sin
 * cadenas vacías. Si no queda ninguno, null: dejar el campo en blanco borra lo guardado.
 */
export function textoPorIdioma(campo: Partial<Record<string, string>>, idiomas: string[]): Localized | null {
  const salida: Localized = {}
  for (const idioma of idiomas) {
    const valor = campo[idioma]?.trim()
    if (valor) salida[idioma] = valor
  }
  return Object.keys(salida).length ? salida : null
}

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

/** La subcategoría y los enfoques de salud de un storyboard, en palabras (los mismos que en Admin). */
const NOMBRES_SUBCATEGORIA: Record<string, string> = {
  NUTRIENTES: 'Nutrientes', HIDRATACION: 'Hidratación', CRECIMIENTO: 'Crecimiento', ENERGIA: 'Energía', DIGESTION: 'Digestión',
  PREVENCION: 'Prevención', PROCESADOS: 'Procesados', TEMPORADA: 'Temporada', FUERZA: 'Fuerza', COORDINACION: 'Coordinación',
  HIGIENE: 'Higiene', RUTINAS: 'Rutinas', PIEL: 'Piel', DESCANSO: 'Descanso', ACEPTACION: 'Aceptación', CREENCIAS: 'Creencias',
  MEDICINA: 'Medicina', HABITOS: 'Hábitos',
}
const NOMBRES_ENFOQUE: Record<string, string> = {
  DIABETES: 'Diabetes', OBESIDAD: 'Obesidad', DESNUTRICION: 'Desnutrición', ANEMIA: 'Anemia', CELIAQUIA: 'Celiaquía',
  ALERGIAS: 'Alergias', HIPERTENSION: 'Hipertensión', CARIES: 'Caries', SEDENTARISMO: 'Sedentarismo', ASMA: 'Asma',
  PIE_DIABETICO: 'Pie diabético', INFECCIONES: 'Infecciones', AUTOESTIMA: 'Autoestima',
}
export const nombreSubcategoria = (codigo: string) => NOMBRES_SUBCATEGORIA[codigo] ?? codigo
export const nombreEnfoque = (codigo: string) => NOMBRES_ENFOQUE[codigo] ?? codigo

/** El nombre de una plantilla del runner como se lee en la gestión: «historia» → «Historia», «senalar» → «Señalar». */
const NOMBRES_PLANTILLA: Record<string, string> = { senalar: 'Señalar' }
export const nombrePlantilla = (plantilla: string) => NOMBRES_PLANTILLA[plantilla] ?? plantilla.charAt(0).toUpperCase() + plantilla.slice(1)

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
  if (estado === 'sin_registrar') return 'Regístralo en la base: así podrás escribir su guía y publicarlo.'
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
