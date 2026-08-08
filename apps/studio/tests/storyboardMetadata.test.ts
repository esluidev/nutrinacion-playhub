import { describe, expect, it } from 'vitest'
import { construirMetadata } from '~/utils/storyboardMetadata'
import type { StoryboardDef } from '~/types/scene'

// El contrato entre Studio y admin: este JSON se pega a mano en Platform y de él salen las
// filas de `storyboards` / `storyboard_escenas`. Si algo acá se rompe, el alta escribe mal.

function def(parcial: Partial<StoryboardDef> = {}): StoryboardDef {
  return {
    key: '739230af-d56d-4bc4-a39a-8245157ac928',
    slug: 'los-frijoles',
    title: { es: 'Los Frijoles', en: 'Beans' },
    type: 'ALIMENTACION',
    category: 'PREVENCION',
    audience: 'KIDS',
    languages: ['es', 'en'],
    defaultLanguage: 'es',
    scenes: [
      { folder: 'bienvenida', title: { es: 'Bienvenida', en: 'Welcome' } },
      { folder: 'descubrimiento', title: { es: 'La Ruleta', en: 'The Wheel' } },
    ],
    ...parcial,
  }
}

describe('construirMetadata — caso feliz', () => {
  it('mapea el build a la forma de las columnas de la BD', () => {
    const meta = construirMetadata(def())

    expect(meta.clave).toBe('739230af-d56d-4bc4-a39a-8245157ac928')
    expect(meta.slug).toBe('los-frijoles')
    expect(meta.titulo).toEqual({ es: 'Los Frijoles', en: 'Beans' })
    expect(meta.tipo_codigo).toBe('ALIMENTACION')
    expect(meta.categoria_codigo).toBe('PREVENCION')
    expect(meta.audiencia_codigo).toBe('KIDS')
    expect(meta.idiomas).toEqual(['es', 'en'])
    expect(meta.numero_escenas).toBe(2)
  })

  it('numera las escenas desde 1 y en el orden del build', () => {
    // `storyboard_escenas` tiene unique(storyboard_id, orden): base 0 chocaría con el modelo.
    const meta = construirMetadata(def())
    expect(meta.escenas.map(e => e.orden)).toEqual([1, 2])
    expect(meta.escenas.map(e => e.folder)).toEqual(['bienvenida', 'descubrimiento'])
    expect(meta.escenas[0]!.titulo).toEqual({ es: 'Bienvenida', en: 'Welcome' })
  })

  it('numero_escenas siempre coincide con la cantidad de escenas emitidas', () => {
    const meta = construirMetadata(def())
    expect(meta.numero_escenas).toBe(meta.escenas.length)
  })
})

describe('construirMetadata — títulos hacia jsonb', () => {
  it('envuelve un título plano en el idioma por defecto (la columna es jsonb NOT NULL)', () => {
    const meta = construirMetadata(def({ title: 'Los Frijoles' }))
    expect(meta.titulo).toEqual({ es: 'Los Frijoles' })
  })

  it('respeta defaultLanguage al envolver un título plano', () => {
    const meta = construirMetadata(def({ title: 'Beans', defaultLanguage: 'en', languages: ['en'] }))
    expect(meta.titulo).toEqual({ en: 'Beans' })
  })

  it('usa el folder cuando la escena no declara título', () => {
    const meta = construirMetadata(def({ scenes: [{ folder: 'despedida' }] }))
    expect(meta.escenas[0]!.titulo).toEqual({ es: 'despedida' })
  })

  it('recorta los idiomas no declarados: no se afirma una traducción inexistente', () => {
    const meta = construirMetadata(def({ languages: ['es'] }))
    expect(meta.titulo).toEqual({ es: 'Los Frijoles' })
    expect(meta.escenas[0]!.titulo).toEqual({ es: 'Bienvenida' })
  })

  it('descarta cadenas vacías o en blanco en vez de escribirlas', () => {
    const meta = construirMetadata(def({ title: { es: 'Los Frijoles', en: '   ' } }))
    expect(meta.titulo).toEqual({ es: 'Los Frijoles' })
  })
})

describe('construirMetadata — regla del contrato: lo que va a jsonb viaja como objeto', () => {
  // Regla dictada por el usuario (2026-07-28): todo campo que en la BD sea jsonb por
  // idioma debe viajar como objeto, NUNCA como string plano. `descripcion`, `objetivo`,
  // `bibliografia` y las 7 secciones de guía también son jsonb, pero son editoriales: no
  // existen en el build y se escriben en admin, por eso no aparecen acá.
  const camposJsonb = (meta: ReturnType<typeof construirMetadata>) => [
    meta.titulo,
    ...meta.escenas.map(e => e.titulo),
  ]

  it('ningún campo jsonb sale como string, ni con títulos planos en el build', () => {
    const meta = construirMetadata(def({
      title: 'Los Frijoles',
      scenes: [{ folder: 'bienvenida' }, { folder: 'cierre', title: 'Cierre' }],
    }))
    for (const campo of camposJsonb(meta)) {
      expect(typeof campo).toBe('object')
      expect(Array.isArray(campo)).toBe(false)
      expect(campo).not.toBeNull()
    }
  })

  it('los campos no localizados conservan su tipo escalar de columna', () => {
    const meta = construirMetadata(def())
    expect(typeof meta.clave).toBe('string')      // uuid
    expect(typeof meta.slug).toBe('string')       // text
    expect(typeof meta.numero_escenas).toBe('number') // integer
    expect(Array.isArray(meta.idiomas)).toBe(true)    // text[]
    expect(meta.escenas.every(e => typeof e.orden === 'number')).toBe(true)
  })
})

describe('construirMetadata — bordes', () => {
  it('sin languages, el storyboard es monolingüe en su idioma por defecto', () => {
    const meta = construirMetadata(def({ languages: undefined }))
    expect(meta.idiomas).toEqual(['es'])
  })

  it('categoria_codigo es null cuando el build no declara categoría (la columna es nullable)', () => {
    const meta = construirMetadata(def({ category: undefined }))
    expect(meta.categoria_codigo).toBeNull()
  })

  it('normaliza los códigos a MAYUSCULA_GUION_BAJO como los catálogos', () => {
    const meta = construirMetadata(def({ type: 'actividad-fisica', audience: 'kids' }))
    expect(meta.tipo_codigo).toBe('ACTIVIDAD_FISICA')
    expect(meta.audiencia_codigo).toBe('KIDS')
  })

  it('un storyboard sin escenas no revienta y reporta cero', () => {
    const meta = construirMetadata(def({ scenes: [] }))
    expect(meta.numero_escenas).toBe(0)
    expect(meta.escenas).toEqual([])
  })
})
