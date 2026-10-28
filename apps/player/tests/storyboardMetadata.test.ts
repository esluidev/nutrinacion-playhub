import { describe, expect, it } from 'vitest'
import { compararConBase, construirMetadata, mensajeDeLaBase, validarMetadata } from '~/utils/storyboardMetadata'
import type { FilaCatalogo } from '~/utils/storyboardMetadata'
import type { StoryboardJson } from '~/types/storyboard'

// El contrato entre Player y la base: de esta metadata salen la fila de `storyboards` y las escenas
// de su guía (`sincronizar_storyboard`). Si algo acá se rompe, el registro escribe mal.

function def(parcial: Partial<StoryboardJson> = {}): StoryboardJson {
  return {
    key: '739230af-d56d-4bc4-a39a-8245157ac928',
    slug: 'los-frijoles',
    title: { es: 'Los Frijoles', en: 'Beans' },
    type: 'ALIMENTACION',
    category: 'PREVENCION',
    audience: 'KIDS',
    healthFocus: ['desnutricion'],
    languages: ['es', 'en'],
    estimatedDuration: 30,
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
    expect(meta.categoria).toBe('ALIMENTACION')
    expect(meta.subcategoria).toBe('PREVENCION')
    expect(meta.edicion).toBe('KIDS')
    expect(meta.enfoques_salud).toEqual(['DESNUTRICION'])
    expect(meta.idiomas).toEqual(['es', 'en'])
    expect(meta.idioma_principal).toBe('es')
    expect(meta.duracion_min).toBe(30)
  })

  it('numera las escenas desde 1 y en el orden del build', () => {
    // `storyboard_escenas` tiene unique(storyboard_id, orden): base 0 chocaría con el modelo.
    const meta = construirMetadata(def())
    expect(meta.escenas.map(e => e.orden)).toEqual([1, 2])
    expect(meta.escenas.map(e => e.carpeta)).toEqual(['bienvenida', 'descubrimiento'])
    expect(meta.escenas[0]!.titulo).toEqual({ es: 'Bienvenida', en: 'Welcome' })
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
  // idioma debe viajar como objeto, NUNCA como string plano. La guía también es jsonb, pero se
  // escribe en Admin: no existe en el build y no aparece acá.
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
    expect(typeof meta.duracion_min).toBe('number')   // integer
    expect(Array.isArray(meta.idiomas)).toBe(true)    // text[]
    expect(meta.escenas.every(e => typeof e.orden === 'number')).toBe(true)
  })
})

describe('construirMetadata — bordes', () => {
  it('sin languages, el storyboard es monolingüe en su idioma por defecto', () => {
    const meta = construirMetadata(def({ languages: undefined }))
    expect(meta.idiomas).toEqual(['es'])
  })

  it('subcategoria es null cuando el build no declara categoría (la columna es nullable)', () => {
    const meta = construirMetadata(def({ category: undefined }))
    expect(meta.subcategoria).toBeNull()
  })

  it('sin healthFocus, no hay enfoques de salud', () => {
    expect(construirMetadata(def({ healthFocus: undefined })).enfoques_salud).toEqual([])
  })

  it('normaliza los códigos a MAYUSCULA_GUION_BAJO como los catálogos', () => {
    const meta = construirMetadata(def({ type: 'actividad-fisica', audience: 'kids' }))
    expect(meta.categoria).toBe('ACTIVIDAD_FISICA')
    expect(meta.edicion).toBe('KIDS')
  })

  it('un storyboard sin escenas no revienta', () => {
    const meta = construirMetadata(def({ scenes: [] }))
    expect(meta.escenas).toEqual([])
  })
})

describe('compararConBase — ¿lo registrado está al día con el JSON?', () => {
  const meta = construirMetadata(def())
  const { clave: _clave, ...fila } = meta
  const base = (parcial: Partial<FilaCatalogo> = {}): FilaCatalogo => ({ ...structuredClone(fila), ...parcial })

  it('sin fila en la base, está sin registrar', () => {
    expect(compararConBase(meta, null)).toEqual({ estado: 'sin_registrar', cambios: [] })
  })

  it('con la misma metadata, está al día (aunque el jsonb venga con las claves en otro orden)', () => {
    expect(compararConBase(meta, base({ titulo: { en: 'Beans', es: 'Los Frijoles' } }))).toEqual({ estado: 'al_dia', cambios: [] })
  })

  it('idiomas y enfoques se comparan como conjuntos', () => {
    expect(compararConBase(meta, base({ idiomas: ['en', 'es'] })).estado).toBe('al_dia')
  })

  it('dice qué cambió, con las palabras del equipo', () => {
    const r = compararConBase(meta, base({
      idiomas: ['es'],
      enfoques_salud: [],
      escenas: [fila.escenas[0]!],
    }))
    expect(r.estado).toBe('desactualizado')
    expect(r.cambios).toEqual(['enfoques de salud', 'idiomas', 'escenas'])
  })

  it('un título de escena cambiado también cuenta', () => {
    const escenas = structuredClone(fila.escenas)
    escenas[1]!.titulo = { es: 'Otra', en: 'Other' }
    expect(compararConBase(meta, base({ escenas })).cambios).toEqual(['escenas'])
  })
})

describe('validarMetadata', () => {
  const base = {
    clave: 'k', slug: 'el-agua', version_build: '0.1.0', titulo: { es: 'El agua' }, categoria: 'ALIMENTACION',
    subcategoria: 'HIDRATACION', edicion: 'KIDS', enfoques_salud: ['OBESIDAD'], idiomas: ['es', 'en'],
    idioma_principal: 'es', duracion_min: 25, escenas: [],
  }

  it('acepta los códigos de las listas cerradas de la base', () => {
    expect(validarMetadata(base)).toEqual([])
  })

  it('avisa de cada código fuera de su lista, con palabras del equipo', () => {
    expect(validarMetadata({ ...base, categoria: 'DEPORTE', subcategoria: 'NUTRIENTE', enfoques_salud: ['DIABETIS'], idiomas: ['es', 'fr'] }))
      .toEqual([
        'la categoría «DEPORTE» no existe',
        'la subcategoría «NUTRIENTE» no existe',
        'el enfoque de salud «DIABETIS» no existe',
        'el idioma «fr» no está en las apps',
      ])
  })

  it('el idioma principal tiene que estar entre sus idiomas', () => {
    expect(validarMetadata({ ...base, idioma_principal: 'en', idiomas: ['es'] }))
      .toEqual(['el idioma principal «en» no está entre sus idiomas'])
  })

  it('traduce el error de la base cuando la subcategoría no es de su categoría', () => {
    expect(mensajeDeLaBase('new row violates check constraint "storyboards_subcategoria"'))
      .toBe('La subcategoría no es de la lista de su categoría (catalogo.md).')
  })
})
