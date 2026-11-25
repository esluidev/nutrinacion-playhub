// Reglas puras de las unidades de estudio de la app del hogar (tarea 022): el formulario del editor,
// qué falta para guardarla o publicarla y el orden de sus storyboards. Tests en tests/unidadesEstudio.test.ts.

export const IDIOMAS_UNIDAD = ['es', 'en'] as const
export type IdiomaUnidad = (typeof IDIOMAS_UNIDAD)[number]
export type TextoPorIdioma = Partial<Record<IdiomaUnidad, string>>

export interface FormUnidad {
  titulo: Record<IdiomaUnidad, string>
  descripcion: Record<IdiomaUnidad, string>
  publicada: boolean
  /** Ids de sus storyboards, en orden. */
  storyboards: number[]
}

export function formVacio(): FormUnidad {
  return { titulo: { es: '', en: '' }, descripcion: { es: '', en: '' }, publicada: false, storyboards: [] }
}

/** Un texto por idioma tal como se guarda: sin los idiomas vacíos; null si no queda ninguno. */
export function textoLimpio(texto: Record<IdiomaUnidad, string>): TextoPorIdioma | null {
  const limpio = Object.fromEntries(IDIOMAS_UNIDAD.map(i => [i, texto[i]?.trim() ?? '']).filter(([, v]) => v)) as TextoPorIdioma
  return Object.keys(limpio).length ? limpio : null
}

/** El texto en español o, si no lo tiene, en el primer idioma escrito. */
export function textoLocal(texto: TextoPorIdioma | Record<string, string> | null | undefined): string {
  if (!texto) return ''
  return (texto as Record<string, string>).es || Object.values(texto).find(Boolean) || ''
}

/**
 * Lo que impide guardar la unidad (un aviso), o null. Siempre hace falta un título; publicarla pide
 * al menos un storyboard; y no puede llevar storyboards que ya no salen en el hogar (la base los rechaza).
 */
export function faltaParaGuardar(form: FormUnidad, delHogar: Set<number>): string | null {
  if (!textoLimpio(form.titulo)) return 'Escribe el título de la unidad.'
  if (form.storyboards.some(id => !delHogar.has(id))) return 'Quita los storyboards que ya no salen en el hogar.'
  if (form.publicada && !form.storyboards.length) return 'Para publicarla, agrega al menos un storyboard.'
  return null
}

/** Mueve un elemento de la lista un lugar arriba (-1) o abajo (+1); en un extremo, no cambia. */
export function mover<T>(lista: T[], indice: number, delta: -1 | 1): T[] {
  const destino = indice + delta
  if (indice < 0 || indice >= lista.length || destino < 0 || destino >= lista.length) return lista
  const nueva = [...lista]
  ;[nueva[indice], nueva[destino]] = [nueva[destino]!, nueva[indice]!]
  return nueva
}

/** Agrega los elegidos al final, sin repetir los que ya estaban. */
export function agregar(lista: number[], elegidos: number[]): number[] {
  return [...lista, ...elegidos.filter(id => !lista.includes(id))]
}
