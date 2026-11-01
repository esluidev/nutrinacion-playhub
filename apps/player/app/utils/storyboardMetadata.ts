import { Constants } from '../../../../supabase/database.types'
import type { I18nText, Localized } from '~/types/i18n'
import type { StoryboardJson } from '~/types/storyboard'

// ─────────────────────────────────────────────────────────────────────────────
// La metadata de un storyboard para el catálogo de la base: lo que Player registra en
// `storyboards` y en las escenas de su guía (`guia_escenas`) con `sincronizar_storyboard`
// (supabase/migrations/0007). Sale del JSON del storyboard y de nada más. Lo que se decide al
// publicar (estado, países y organización, también desde Player con `publicar_storyboard`) y lo
// escrito en la guía (Admin/Platform) no viajan aquí: sincronizar nunca lo pisa (decisiones 006 y 007).
//
// Lógica PURA a propósito (sin Nuxt, sin glob): es el contrato con la base y tiene test propio.
// Si cambia una columna, cambia acá, en la función de la base y en su prueba pgTAP.
// ─────────────────────────────────────────────────────────────────────────────

export interface EscenaMetadata {
  orden: number            // guia_escenas.orden, base 1
  carpeta: string          // guia_escenas.carpeta (la carpeta de la escena en el build)
  titulo: Localized        // guia_escenas.titulo
}

export interface StoryboardMetadata {
  clave: string                   // `key` → storyboards.clave (la identidad)
  slug: string                    // `slug`
  version_build: string | null    // `version`
  titulo: Localized               // `title`
  categoria: string               // `type`: ALIMENTACION…
  subcategoria: string | null     // `category`: NUTRIENTES…
  edicion: string                 // `audience`: KIDS…
  enfoques_salud: string[]        // `healthFocus`: DIABETES…
  idiomas: string[]               // `languages`
  idioma_principal: string        // `defaultLanguage`
  duracion_min: number | null     // `estimatedDuration`
  escenas: EscenaMetadata[]       // `scenes`
}

// Los códigos van en MAYUSCULA_GUION_BAJO; el build ya viene así, pero no lo damos por hecho.
function aCodigo(valor: string): string {
  return valor.trim().toUpperCase().replace(/-/g, '_')
}

// `titulo` es jsonb NOT NULL en la base, así que SIEMPRE sale objeto. En el build un título
// puede ser un string plano (I18nText lo permite): se envuelve en el idioma por defecto. Y se
// recorta a los idiomas declarados: si el json trae `en` pero el storyboard no declara inglés,
// publicarlo afirmaría una traducción que el educador no va a poder leer.
export function aLocalized(valor: I18nText | undefined, idiomas: string[], porDefecto: string): Localized {
  const salida: Localized = {}

  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    for (const idioma of idiomas) {
      const texto = (valor as Localized)[idioma]
      if (typeof texto === 'string' && texto.trim()) salida[idioma] = texto.trim()
    }
  }
  else if (typeof valor === 'string' && valor.trim()) {
    salida[porDefecto] = valor.trim()
  }

  return salida
}

export function construirMetadata(def: StoryboardJson): StoryboardMetadata {
  const porDefecto = def.defaultLanguage ?? 'es'
  // `languages` es opcional en el build; sin él, el storyboard es monolingüe.
  const idiomas = def.languages?.length ? [...def.languages] : [porDefecto]

  return {
    clave: def.key,
    slug: def.slug,
    version_build: def.version ?? null,
    titulo: aLocalized(def.title, idiomas, porDefecto),
    categoria: aCodigo(def.type),
    subcategoria: def.category ? aCodigo(def.category) : null,
    edicion: aCodigo(def.audience),
    enfoques_salud: (def.healthFocus ?? []).map(aCodigo),
    idiomas,
    idioma_principal: porDefecto,
    duracion_min: def.estimatedDuration ?? null,
    escenas: def.scenes.map((escena, i) => ({
      orden: i + 1,
      carpeta: escena.folder,
      // Sin título en el json, la carpeta es el respaldo: la columna no admite null.
      titulo: aLocalized(escena.title ?? escena.folder, idiomas, porDefecto),
    })),
  }
}

// ── Comparación con lo registrado en la base ──────────────────────────────────

/** Lo que hay en la base para un storyboard: su fila y las escenas de su guía. */
export type FilaCatalogo = Omit<StoryboardMetadata, 'clave'>

export type EstadoCatalogo = 'sin_registrar' | 'al_dia' | 'desactualizado'

const ordenado = (valor: unknown): string => JSON.stringify(valor, (_k, v) =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
    : v)
const mismo = (a: unknown, b: unknown) => ordenado(a) === ordenado(b)
const mismoConjunto = (a: string[], b: string[]) => mismo([...a].sort(), [...b].sort())

// Cómo se le enseña un valor al equipo cuando difiere: nada de JSON crudo.
const textoLocalizado = (valor: Localized) => Object.entries(valor).map(([idioma, texto]) => `${idioma.toUpperCase()}: ${texto}`).join(' · ') || '—'
const textoLista = (valor: string[]) => (valor.length ? [...valor].sort().join(', ') : '—')
const textoPlano = (valor: string | number | null | undefined, sufijo = '') => (valor === null || valor === undefined ? '—' : `${valor}${sufijo}`)
const tituloCorto = (escena: EscenaMetadata) => Object.values(escena.titulo)[0] ?? escena.carpeta

/** Una diferencia entre el JSON del build y la fila de la base, dicha para el equipo. */
export interface Diferencia {
  /** El campo, con las palabras del equipo: «título», «escenas»… */
  campo: string
  /** Cómo está en la base. */
  base: string
  /** Cómo está en el JSON. */
  json: string
  /** Solo en las escenas: qué pasa con cada una (nueva, se quita, cambia de orden o de título). */
  detalle?: string[]
}

/** Qué le pasa a cada escena al actualizar: las escenas se casan por carpeta (como hace la base). */
function detalleEscenas(json: EscenaMetadata[], base: EscenaMetadata[]): string[] {
  const enBase = new Map(base.map(e => [e.carpeta, e]))
  const enJson = new Set(json.map(e => e.carpeta))
  const lineas: string[] = []
  for (const e of [...json].sort((a, b) => a.orden - b.orden)) {
    const b = enBase.get(e.carpeta)
    if (!b) {
      lineas.push(`Nueva: ${e.carpeta} («${tituloCorto(e)}»), en la posición ${e.orden}`)
      continue
    }
    if (b.orden !== e.orden) lineas.push(`Cambia de orden: ${e.carpeta}, de la ${b.orden} a la ${e.orden}`)
    if (!mismo(b.titulo, e.titulo)) lineas.push(`Cambia el título: ${e.carpeta}, de «${tituloCorto(b)}» a «${tituloCorto(e)}»`)
  }
  for (const b of [...base].sort((a, c) => a.orden - c.orden)) {
    if (!enJson.has(b.carpeta)) lineas.push(`Se quita: ${b.carpeta} («${tituloCorto(b)}»); su guía se borra al actualizar`)
  }
  return lineas
}

/**
 * Qué cambió entre el JSON del build y lo registrado, campo por campo y con los dos valores.
 * Vacío si coinciden o si no está registrado. Las escenas se comparan en su orden, con carpeta y título.
 */
export function diferenciasConBase(meta: StoryboardMetadata, base: FilaCatalogo | null): Diferencia[] {
  if (!base) return []

  const diferencias: Diferencia[] = []
  const campo = (nombre: string, distinto: boolean, enBase: string, enJson: string, detalle?: string[]) => {
    if (distinto) diferencias.push({ campo: nombre, base: enBase, json: enJson, ...(detalle ? { detalle } : {}) })
  }
  campo('slug', meta.slug !== base.slug, base.slug, meta.slug)
  campo('versión', (meta.version_build ?? null) !== (base.version_build ?? null), textoPlano(base.version_build), textoPlano(meta.version_build))
  campo('título', !mismo(meta.titulo, base.titulo), textoLocalizado(base.titulo), textoLocalizado(meta.titulo))
  campo('categoría', meta.categoria !== base.categoria, base.categoria, meta.categoria)
  campo('subcategoría', (meta.subcategoria ?? null) !== (base.subcategoria ?? null), textoPlano(base.subcategoria), textoPlano(meta.subcategoria))
  campo('edición', meta.edicion !== base.edicion, base.edicion, meta.edicion)
  campo('enfoques de salud', !mismoConjunto(meta.enfoques_salud, base.enfoques_salud), textoLista(base.enfoques_salud), textoLista(meta.enfoques_salud))
  campo('idiomas', !mismoConjunto(meta.idiomas, base.idiomas), textoLista(base.idiomas), textoLista(meta.idiomas))
  campo('idioma principal', meta.idioma_principal !== base.idioma_principal, base.idioma_principal, meta.idioma_principal)
  campo('duración', (meta.duracion_min ?? null) !== (base.duracion_min ?? null), textoPlano(base.duracion_min, ' min'), textoPlano(meta.duracion_min, ' min'))
  const escenas = (lista: EscenaMetadata[]) => [...lista].sort((a, b) => a.orden - b.orden).map(e => [e.orden, e.carpeta, e.titulo])
  campo('escenas', !mismo(escenas(meta.escenas), escenas(base.escenas)),
    `${base.escenas.length} escenas`, `${meta.escenas.length} escenas`, detalleEscenas(meta.escenas, base.escenas))

  return diferencias
}

/** Las carpetas de las escenas que están en la base y ya no en el JSON: al actualizar, su guía se borra. */
export function escenasQueSeQuitan(meta: StoryboardMetadata, base: FilaCatalogo | null): string[] {
  if (!base) return []
  const enJson = new Set(meta.escenas.map(e => e.carpeta))
  return base.escenas.filter(e => !enJson.has(e.carpeta)).map(e => e.carpeta)
}

/**
 * ¿Lo registrado en la base coincide con el JSON del build? Devuelve qué cambió, con las palabras
 * que ve el equipo (los valores, en `diferenciasConBase`).
 */
export function compararConBase(meta: StoryboardMetadata, base: FilaCatalogo | null): { estado: EstadoCatalogo, cambios: string[] } {
  if (!base) return { estado: 'sin_registrar', cambios: [] }
  const cambios = diferenciasConBase(meta, base).map(d => d.campo)
  return { estado: cambios.length ? 'desactualizado' : 'al_dia', cambios }
}

// ── Validación contra las listas cerradas de la base ──────────────────────────
// Los códigos de la taxonomía y los idiomas son enums en la base (`npm run db:types` los exporta en
// Constants): un código fuera de la lista no se registra. Aquí se avisa antes, con palabras del
// equipo. Que la subcategoría y los enfoques sean de SU categoría lo comprueba la base (catalogo.md).
const ENUMS = Constants.public.Enums

export function validarMetadata(meta: StoryboardMetadata): string[] {
  const errores: string[] = []
  const fuera = (valor: string, lista: readonly string[]) => !lista.includes(valor)
  if (fuera(meta.categoria, ENUMS.categoria_storyboard)) errores.push(`la categoría «${meta.categoria}» no existe`)
  if (meta.subcategoria && fuera(meta.subcategoria, ENUMS.subcategoria_storyboard)) errores.push(`la subcategoría «${meta.subcategoria}» no existe`)
  if (fuera(meta.edicion, ENUMS.edicion_storyboard)) errores.push(`la edición «${meta.edicion}» no existe`)
  for (const e of meta.enfoques_salud) if (fuera(e, ENUMS.enfoque_salud)) errores.push(`el enfoque de salud «${e}» no existe`)
  for (const i of meta.idiomas) if (fuera(i, ENUMS.idioma)) errores.push(`el idioma «${i}» no está en las apps`)
  if (!meta.idiomas.includes(meta.idioma_principal)) errores.push(`el idioma principal «${meta.idioma_principal}» no está entre sus idiomas`)
  return errores
}

/**
 * El error de la base, dicho para el equipo. Se reconocen las restricciones de `storyboards`, lo
 * que levantan `sincronizar_storyboard`, `publicar_storyboard` y el trigger de publicación
 * (migraciones 0003 y 0007) y los fallos de sesión o de red; lo demás pasa tal cual.
 */
export function mensajeDeLaBase(mensaje: string): string {
  if (mensaje.includes('storyboards_subcategoria')) return 'La subcategoría no es de la lista de su categoría (catalogo.md).'
  if (mensaje.includes('storyboards_enfoques')) return 'Algún enfoque de salud no es de la lista de su categoría (catalogo.md).'
  if (mensaje.includes('storyboards_idioma_principal')) return 'El idioma principal tiene que estar entre los idiomas del storyboard.'
  if (mensaje.includes('storyboards_categoria_slug_key')) return 'Ya hay otro storyboard con ese slug en el mismo eje: cambia el slug en el JSON.'
  if (mensaje.includes('duracion_min')) return 'La duración (estimatedDuration) tiene que ser mayor que cero.'
  if (mensaje.includes('invalid input value for enum')) return 'Algún código del JSON (categoría, subcategoría, edición, enfoque o idioma) no está en las listas de la base.'
  if (mensaje.includes('Solo el superadmin')) return 'Solo el superadmin puede hacerlo: vuelve a entrar con una cuenta del equipo.'
  if (mensaje.includes('no está registrado')) return 'Ese storyboard no está registrado en la base: regístralo primero.'
  if (mensaje.includes('elige al menos un país')) return 'Para publicarlo elige al menos un país.'
  if (mensaje.includes('archívalo en lugar de despublicarlo')) return 'Ya se usa en workshops, temarios o publicaciones: archívalo en lugar de volverlo a registrado o a revisión.'
  if (mensaje.includes('no puede cambiar de organización')) return 'Ya tiene workshops: no puede cambiar de organización.'
  if (mensaje.includes('no está en el catálogo de países')) return 'Alguno de los países elegidos ya no está activo en el catálogo.'
  if (/JWT|jwt expired|refresh_token|not authenticated/i.test(mensaje)) return 'La sesión caducó: vuelve a entrar.'
  if (/permission denied|42501/i.test(mensaje)) return 'La base no te deja hacerlo: entra con una cuenta del equipo (superadmin).'
  if (/Failed to fetch|NetworkError|fetch failed|ECONNREFUSED/i.test(mensaje)) return 'No hay conexión con la base.'
  // «No se puede quitar MX: hay 2 workshop(s) publicado(s) ahí por venir» ya viene para el equipo.
  return mensaje
}
