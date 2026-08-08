import type { I18nText, Localized } from '~/types/i18n'
import type { StoryboardDef } from '~/types/scene'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata de registro: lo BUILD-OWNED de un storyboard, con la forma exacta de las
// tablas `storyboards` / `storyboard_escenas` de Supabase.
//
// Studio NO escribe en la base (tarea 030): produce este JSON, la persona lo copia y lo
// pega en admin/Platform, que lo valida y hace el alta a mano. Por eso viajan CÓDIGOS
// (ALIMENTACION, PREVENCION, KIDS) y no ids: Studio no conoce los ids de la BD.
//
// Lógica PURA a propósito (sin Nuxt, sin glob): es el contrato entre las dos apps y tiene
// test propio. Si cambia una columna de la BD, cambia acá.
// ─────────────────────────────────────────────────────────────────────────────

export interface EscenaMetadata {
  orden: number            // storyboard_escenas.orden — unique(storyboard_id, orden), base 1
  folder: string           // storyboard_escenas.folder
  titulo: Localized        // storyboard_escenas.titulo (jsonb, NOT NULL)
}

export interface StoryboardMetadata {
  clave: string                     // storyboards.clave (uuid, unique) — la identidad
  slug: string                      // storyboards.slug
  titulo: Localized                 // storyboards.titulo (jsonb, NOT NULL)
  tipo_codigo: string               // → tipos_storyboard.codigo → storyboards.tipo_id
  categoria_codigo: string | null   // → categorias_storyboard.codigo → storyboards.categoria_id
  audiencia_codigo: string          // → edades_audiencia.codigo → storyboards.audiencia_id
  idiomas: string[]                 // storyboards.idiomas (text[])
  numero_escenas: number            // storyboards.numero_escenas
  escenas: EscenaMetadata[]
}

// Los catálogos usan MAYUSCULA_GUION_BAJO; el build ya viene así, pero no lo damos por hecho.
function aCodigo(valor: string): string {
  return valor.trim().toUpperCase().replace(/-/g, '_')
}

// `titulo` es jsonb NOT NULL en la BD, así que SIEMPRE tiene que salir objeto. En el build
// un título puede ser un string plano (I18nText lo permite): se envuelve en el idioma por
// defecto. Y se recorta a los idiomas declarados: si el json trae `en` pero el storyboard no
// declara inglés, publicarlo afirmaría una traducción que el educador no va a poder leer.
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

export function construirMetadata(def: StoryboardDef): StoryboardMetadata {
  const porDefecto = def.defaultLanguage ?? 'es'
  // `languages` es opcional en el build; sin él, el storyboard es monolingüe.
  const idiomas = def.languages?.length ? [...def.languages] : [porDefecto]

  return {
    clave: def.key,
    slug: def.slug,
    titulo: aLocalized(def.title, idiomas, porDefecto),
    tipo_codigo: aCodigo(def.type),
    categoria_codigo: def.category ? aCodigo(def.category) : null,
    audiencia_codigo: aCodigo(def.audience),
    idiomas,
    numero_escenas: def.scenes.length,
    escenas: def.scenes.map((escena, i) => ({
      orden: i + 1,
      folder: escena.folder,
      // Sin título en el json, el folder es el respaldo: la columna no admite null.
      titulo: aLocalized(escena.title ?? escena.folder, idiomas, porDefecto),
    })),
  }
}
