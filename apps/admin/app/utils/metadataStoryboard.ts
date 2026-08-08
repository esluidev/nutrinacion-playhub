// ─────────────────────────────────────────────────────────────────────────────
// Parseo y validación de la metadata que Studio copia y una persona pega acá.
//
// El registro es MANUAL a propósito (decisión 2026-07-28): la metadata solo evita
// retipear lo build-owned. Como el texto llega del portapapeles, puede venir cortado,
// de otra app o de una versión vieja — por eso se valida entero antes de tocar la base.
//
// El contrato lo define `apps/studio/app/utils/storyboardMetadata.ts`. Los códigos viajan
// como texto (ALIMENTACION, PREVENCION, KIDS) y se resuelven a ids contra los catálogos.
// ─────────────────────────────────────────────────────────────────────────────

export interface EscenaMetadata {
  orden: number
  folder: string
  titulo: Record<string, string>
}

export interface StoryboardMetadata {
  clave: string
  slug: string
  titulo: Record<string, string>
  tipo_codigo: string
  categoria_codigo: string | null
  audiencia_codigo: string
  idiomas: string[]
  numero_escenas: number
  escenas: EscenaMetadata[]
}

export interface ResultadoParseo {
  meta: StoryboardMetadata | null
  error: string | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esLocalizedConTexto(valor: unknown): valor is Record<string, string> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false
  const entradas = Object.entries(valor as Record<string, unknown>)
  return entradas.length > 0
    && entradas.every(([, v]) => typeof v === 'string')
    && entradas.some(([, v]) => (v as string).trim().length > 0)
}

export function parsearMetadata(texto: string): ResultadoParseo {
  const limpio = (texto ?? '').trim()
  if (!limpio) return { meta: null, error: 'Pegá la metadata que copiaste desde Studio.' }

  let crudo: unknown
  try {
    crudo = JSON.parse(limpio)
  }
  catch {
    return { meta: null, error: 'Esto no es un JSON válido. Copiá de nuevo desde Studio.' }
  }

  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) {
    return { meta: null, error: 'El JSON no tiene la forma esperada.' }
  }
  const o = crudo as Record<string, unknown>

  if (typeof o.clave !== 'string' || !UUID.test(o.clave)) {
    return { meta: null, error: 'Falta la clave del storyboard, o no es un UUID válido.' }
  }
  if (typeof o.slug !== 'string' || !o.slug.trim()) {
    return { meta: null, error: 'Falta el slug del storyboard.' }
  }
  if (!esLocalizedConTexto(o.titulo)) {
    return { meta: null, error: 'Falta el título, o no viene por idioma.' }
  }
  if (typeof o.tipo_codigo !== 'string' || !o.tipo_codigo.trim()) {
    return { meta: null, error: 'Falta el tipo del storyboard.' }
  }
  if (o.categoria_codigo !== null && typeof o.categoria_codigo !== 'string') {
    return { meta: null, error: 'La categoría tiene un valor inválido.' }
  }
  if (typeof o.audiencia_codigo !== 'string' || !o.audiencia_codigo.trim()) {
    return { meta: null, error: 'Falta la audiencia del storyboard.' }
  }
  if (!Array.isArray(o.idiomas) || !o.idiomas.length || !o.idiomas.every(l => typeof l === 'string' && l.trim())) {
    return { meta: null, error: 'Los idiomas del contenido faltan o son inválidos.' }
  }
  if (typeof o.numero_escenas !== 'number' || !Number.isInteger(o.numero_escenas) || o.numero_escenas < 0) {
    return { meta: null, error: 'El número de escenas es inválido.' }
  }
  if (!Array.isArray(o.escenas)) {
    return { meta: null, error: 'Falta la lista de escenas.' }
  }

  const escenas: EscenaMetadata[] = []
  for (const [i, cruda] of (o.escenas as unknown[]).entries()) {
    if (!cruda || typeof cruda !== 'object' || Array.isArray(cruda)) {
      return { meta: null, error: `La escena ${i + 1} tiene una forma inválida.` }
    }
    const e = cruda as Record<string, unknown>
    if (typeof e.orden !== 'number' || !Number.isInteger(e.orden) || e.orden < 1) {
      return { meta: null, error: `La escena ${i + 1} no tiene un orden válido.` }
    }
    if (typeof e.folder !== 'string' || !e.folder.trim()) {
      return { meta: null, error: `La escena ${i + 1} no tiene carpeta.` }
    }
    if (!esLocalizedConTexto(e.titulo)) {
      return { meta: null, error: `La escena ${i + 1} no tiene título por idioma.` }
    }
    escenas.push({ orden: e.orden, folder: e.folder, titulo: e.titulo as Record<string, string> })
  }

  // Coherencia interna: si el conteo y la lista no coinciden, la metadata llegó cortada.
  if (escenas.length !== o.numero_escenas) {
    return { meta: null, error: `La metadata declara ${o.numero_escenas} escenas pero trae ${escenas.length}. Copiala de nuevo.` }
  }
  // `storyboard_escenas` tiene unique(storyboard_id, orden): un duplicado reventaría el alta.
  const ordenes = escenas.map(e => e.orden)
  if (new Set(ordenes).size !== ordenes.length) {
    return { meta: null, error: 'Hay escenas con el mismo orden. Copiala de nuevo desde Studio.' }
  }
  const carpetas = escenas.map(e => e.folder)
  if (new Set(carpetas).size !== carpetas.length) {
    return { meta: null, error: 'Hay escenas con la misma carpeta. Copiala de nuevo desde Studio.' }
  }

  return {
    meta: {
      clave: o.clave,
      slug: o.slug.trim(),
      titulo: o.titulo as Record<string, string>,
      tipo_codigo: o.tipo_codigo.trim().toUpperCase(),
      categoria_codigo: o.categoria_codigo ? (o.categoria_codigo as string).trim().toUpperCase() : null,
      audiencia_codigo: o.audiencia_codigo.trim().toUpperCase(),
      idiomas: (o.idiomas as string[]).map(l => l.trim()),
      numero_escenas: o.numero_escenas,
      escenas: escenas.sort((a, b) => a.orden - b.orden),
    },
    error: null,
  }
}
