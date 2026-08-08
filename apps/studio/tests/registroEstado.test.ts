import { describe, expect, it } from 'vitest'
import { compararRegistro, etiquetaPublicacion, varianteBadgePublicacion } from '~/utils/registroEstado'
import type { FilaRegistrada } from '~/utils/registroEstado'
import type { StoryboardMetadata } from '~/utils/storyboardMetadata'

// Si esto falla, Studio muestra un estado que no es el de la base y alguien publica en
// admin un storyboard que no coincide con el runner desplegado.

function meta(parcial: Partial<StoryboardMetadata> = {}): StoryboardMetadata {
  return {
    clave: 'a06e4000-42b3-4a7b-bdff-29200e2f4ebb',
    slug: 'buena-postura',
    titulo: { es: 'Creciendo con Buena Postura' },
    tipo_codigo: 'ACTIVIDAD_FISICA',
    categoria_codigo: 'PREVENCION',
    audiencia_codigo: 'KIDS',
    idiomas: ['es', 'en'],
    numero_escenas: 7,
    escenas: [],
    ...parcial,
  }
}

function fila(parcial: Partial<FilaRegistrada> = {}): FilaRegistrada {
  return {
    estado: 'BORRADOR',
    numero_escenas: 7,
    idiomas: ['es', 'en'],
    tipo_codigo: 'ACTIVIDAD_FISICA',
    categoria_codigo: 'PREVENCION',
    audiencia_codigo: 'KIDS',
    ...parcial,
  }
}

describe('compararRegistro — los tres estados', () => {
  it('sin fila en la base ⇒ sin_registrar', () => {
    expect(compararRegistro(meta(), null).estado).toBe('sin_registrar')
    expect(compararRegistro(meta(), undefined).estado).toBe('sin_registrar')
  })

  it('fila que coincide con el build ⇒ al_dia, sin diferencias', () => {
    const r = compararRegistro(meta(), fila())
    expect(r.estado).toBe('al_dia')
    expect(r.diferencias).toEqual([])
  })

  it('el orden de los idiomas no cuenta como diferencia', () => {
    const r = compararRegistro(meta({ idiomas: ['en', 'es'] }), fila({ idiomas: ['es', 'en'] }))
    expect(r.estado).toBe('al_dia')
  })
})

describe('compararRegistro — detecta el drift que rompe al educador', () => {
  it('escena agregada al build después de registrar', () => {
    const r = compararRegistro(meta({ numero_escenas: 8 }), fila({ numero_escenas: 7 }))
    expect(r.estado).toBe('desactualizado')
    expect(r.diferencias[0]).toContain('escenas')
  })

  it('idioma nuevo en el build', () => {
    const r = compararRegistro(meta({ idiomas: ['es', 'en'] }), fila({ idiomas: ['es'] }))
    expect(r.estado).toBe('desactualizado')
    expect(r.diferencias.some(d => d.includes('idiomas'))).toBe(true)
  })

  it('reclasificación de tipo, categoría o audiencia', () => {
    expect(compararRegistro(meta(), fila({ tipo_codigo: 'ALIMENTACION' })).estado).toBe('desactualizado')
    expect(compararRegistro(meta(), fila({ categoria_codigo: 'BIENESTAR' })).estado).toBe('desactualizado')
    expect(compararRegistro(meta(), fila({ audiencia_codigo: 'ADULTOS' })).estado).toBe('desactualizado')
  })

  it('acumula todas las diferencias, no solo la primera', () => {
    const r = compararRegistro(
      meta({ numero_escenas: 9, idiomas: ['es'] }),
      fila({ numero_escenas: 7, idiomas: ['es', 'en'], audiencia_codigo: 'ADULTOS' }),
    )
    expect(r.diferencias).toHaveLength(3)
  })

  it('categoría nula en ambos lados no es diferencia', () => {
    const r = compararRegistro(meta({ categoria_codigo: null }), fila({ categoria_codigo: null }))
    expect(r.estado).toBe('al_dia')
  })

  it('el estado de publicación NO influye en si está al día', () => {
    // Un storyboard PUBLICADO puede estar perfectamente sincronizado, y uno en BORRADOR
    // puede estar desactualizado: son dos ejes distintos.
    expect(compararRegistro(meta(), fila({ estado: 'PUBLICADO' })).estado).toBe('al_dia')
    expect(compararRegistro(meta({ numero_escenas: 8 }), fila({ estado: 'PUBLICADO' })).estado).toBe('desactualizado')
  })
})

describe('etiquetas de publicación', () => {
  it('traduce los valores del enum de la base', () => {
    expect(etiquetaPublicacion('PUBLICADO')).toBe('Publicado')
    expect(etiquetaPublicacion('EN_REVISION')).toBe('En revisión')
    expect(etiquetaPublicacion('BORRADOR')).toBe('Borrador')
    expect(etiquetaPublicacion('ARCHIVADO')).toBe('Archivado')
  })

  it('sin estado no inventa nada', () => {
    expect(etiquetaPublicacion(null)).toBe('—')
    expect(etiquetaPublicacion(undefined)).toBe('—')
  })

  it('un valor desconocido se muestra tal cual en vez de romper', () => {
    expect(etiquetaPublicacion('LO_QUE_SEA')).toBe('LO_QUE_SEA')
  })

  it('cada estado tiene su color', () => {
    expect(varianteBadgePublicacion('PUBLICADO')).toBe('green')
    expect(varianteBadgePublicacion('EN_REVISION')).toBe('yellow')
    expect(varianteBadgePublicacion('ARCHIVADO')).toBe('coral')
    expect(varianteBadgePublicacion(null)).toBe('gray')
  })
})
