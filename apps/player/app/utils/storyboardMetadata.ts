import { Constants } from '../../../../supabase/database.types'
import type { I18nText, Localized } from '~/types/i18n'
import type { StoryboardJson } from '~/types/storyboard'

// ─────────────────────────────────────────────────────────────────────────────
// La metadata de un storyboard para el catálogo de la base: lo que Player registra en
// `storyboards` y en las escenas de su guía (`guia_escenas`) con `sincronizar_storyboard`
// (supabase/migrations/0007). Sale del JSON del storyboard; lo que decide Nutrinación en Admin
// (publicación, países, organización) y lo escrito en la guía no viajan aquí.
//
// Lógica PURA a propósito (sin Nuxt, sin glob): es el contrato con la base y tiene test propio.
// Si cambia una columna, cambia acá, en la función de la base y en su prueba pgTAP. Los estados,
// países y organización NO viajan aquí: se eligen al publicar (publicar_storyboard).
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

/**
 * ¿Lo registrado en la base coincide con el JSON del build? Devuelve qué cambió, con las palabras
 * que ve el equipo. Las escenas se comparan en su orden, con carpeta y título.
 */
export function compararConBase(meta: StoryboardMetadata, base: FilaCatalogo | null): { estado: EstadoCatalogo, cambios: string[] } {
  if (!base) return { estado: 'sin_registrar', cambios: [] }

  const cambios: string[] = []
  if (meta.slug !== base.slug) cambios.push('slug')
  if ((meta.version_build ?? null) !== (base.version_build ?? null)) cambios.push('versión')
  if (!mismo(meta.titulo, base.titulo)) cambios.push('título')
  if (meta.categoria !== base.categoria) cambios.push('categoría')
  if ((meta.subcategoria ?? null) !== (base.subcategoria ?? null)) cambios.push('subcategoría')
  if (meta.edicion !== base.edicion) cambios.push('edición')
  if (!mismoConjunto(meta.enfoques_salud, base.enfoques_salud)) cambios.push('enfoques de salud')
  if (!mismoConjunto(meta.idiomas, base.idiomas)) cambios.push('idiomas')
  if (meta.idioma_principal !== base.idioma_principal) cambios.push('idioma principal')
  if ((meta.duracion_min ?? null) !== (base.duracion_min ?? null)) cambios.push('duración')
  const escenas = (lista: EscenaMetadata[]) => [...lista].sort((a, b) => a.orden - b.orden).map(e => [e.orden, e.carpeta, e.titulo])
  if (!mismo(escenas(meta.escenas), escenas(base.escenas))) cambios.push('escenas')

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

/** El error de la base, dicho para el equipo cuando se reconoce. */
export function mensajeDeLaBase(mensaje: string): string {
  if (mensaje.includes('storyboards_subcategoria')) return 'La subcategoría no es de la lista de su categoría (catalogo.md).'
  if (mensaje.includes('storyboards_enfoques')) return 'Algún enfoque de salud no es de la lista de su categoría (catalogo.md).'
  if (mensaje.includes('storyboards_idioma_principal')) return 'El idioma principal tiene que estar entre los idiomas del storyboard.'
  return mensaje
}
