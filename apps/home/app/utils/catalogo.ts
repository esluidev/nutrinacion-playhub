import type { Edicion } from './perfiles'

// El catálogo del hogar (tarea 022): lo que devuelve `hogar_catalogo(país)` sin cuenta, los storyboards publicados
// para el hogar en ese país y las unidades de estudio publicadas. La app lo filtra con la edad del perfil y arma el
// inicio (Luis, 2026-11-27: dos filas de hasta 10, los recientes y las unidades) y «Explorar». Sin dibujo ni Vue, con
// sus pruebas (tests/catalogo.test.ts).

export type Textos = Record<string, string>

export interface StoryboardHogar {
  clave: string
  eje: string
  slug: string
  titulo: Textos
  categoria: string
  subcategoria: string | null
  edicion: Edicion
  enfoques_salud: string[]
  idiomas: string[]
  idioma_principal: string
  duracion_min: number | null
  numero_escenas: number
  /** Cuándo se registró: los más recientes van primero. */
  creado: string
  /** Su portada, relativa a Player (`portadas/<eje>/<storyboard>.svg`), o null si todavía no tiene. */
  portada: string | null
}

export interface UnidadHogar {
  id: number
  titulo: Textos
  descripcion: Textos | null
  /** Las claves de sus storyboards, en su orden. */
  storyboards: string[]
}

export interface CatalogoHogar {
  storyboards: StoryboardHogar[]
  unidades: UnidadHogar[]
}

export const CATALOGO_VACIO: CatalogoHogar = { storyboards: [], unidades: [] }

/** Cuántos salen en cada fila del inicio. */
export const POR_FILA = 10

/** El texto en un idioma, o en el primero que haya. */
export function textoEn(valor: Textos | string | null | undefined, idioma: string): string {
  if (!valor) return ''
  if (typeof valor === 'string') return valor
  return valor[idioma] ?? Object.values(valor).find(Boolean) ?? ''
}

/** Lo del catálogo que le toca a una edición: sus storyboards y las unidades con los suyos (sin las que quedan vacías). */
export function delPerfil(catalogo: CatalogoHogar, edicion: Edicion): CatalogoHogar {
  const storyboards = catalogo.storyboards.filter(s => s.edicion === edicion)
  const claves = new Set(storyboards.map(s => s.clave))
  const unidades = catalogo.unidades
    .map(u => ({ ...u, storyboards: u.storyboards.filter(c => claves.has(c)) }))
    .filter(u => u.storyboards.length > 0)
  return { storyboards, unidades }
}

/** Los más recientes primero, hasta `n`. */
export function recientes(storyboards: StoryboardHogar[], n = POR_FILA): StoryboardHogar[] {
  return [...storyboards].sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, n)
}

/** Las categorías que hay, en el orden del catálogo, para filtrar. */
export function categoriasDe(storyboards: StoryboardHogar[]): string[] {
  return [...new Set(storyboards.map(s => s.categoria))]
}

/** Sin tildes ni mayúsculas, para buscar. */
const sinTildes = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** «Explorar»: por categoría y por lo escrito en el título, los más recientes primero. */
export function explorar(storyboards: StoryboardHogar[], filtro: { categoria?: string | null, busqueda?: string }, idioma: string): StoryboardHogar[] {
  const busqueda = sinTildes(filtro.busqueda?.trim() ?? '')
  return recientes(storyboards, storyboards.length).filter(s =>
    (!filtro.categoria || s.categoria === filtro.categoria)
    && (!busqueda || sinTildes(textoEn(s.titulo, idioma)).includes(busqueda)))
}

/** El idioma en que se juega: el de la app si el storyboard lo tiene; si no, el suyo. */
export function idiomaDeJuego(storyboard: Pick<StoryboardHogar, 'idiomas' | 'idioma_principal'>, idioma: string): string {
  return storyboard.idiomas.includes(idioma) ? idioma : storyboard.idioma_principal
}

/** En qué escena va un perfil en un storyboard (lo cuenta el runner con `escena`; `escenas`, con `listo`). */
export interface Avance { clave: string, indice: number, escenas: number }

/** Lo que sale arriba del inicio: el juego a medias de ese perfil, con su avance, o lo más nuevo que no terminó. */
export type ParaSeguir = { storyboard: StoryboardHogar, avance: Avance } | { storyboard: StoryboardHogar, avance: null }

export function paraSeguir(storyboards: StoryboardHogar[], avance: Avance | null, terminados: string[]): ParaSeguir | null {
  const aMedias = avance && storyboards.find(s => s.clave === avance.clave)
  if (aMedias && avance && avance.indice > 0 && avance.indice < avance.escenas) return { storyboard: aMedias, avance }
  const nuevo = recientes(storyboards, storyboards.length).find(s => !terminados.includes(s.clave))
  return nuevo ? { storyboard: nuevo, avance: null } : null
}
