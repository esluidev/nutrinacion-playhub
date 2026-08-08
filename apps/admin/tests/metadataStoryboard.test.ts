import { describe, expect, it } from 'vitest'
import { parsearMetadata } from '~/utils/metadataStoryboard'

// El texto llega del portapapeles: puede venir cortado, de otra app o de una versión
// vieja de Studio. Si algo inválido pasa el filtro, se escribe basura en el catálogo.

const VALIDA = {
  clave: 'a06e4000-42b3-4a7b-bdff-29200e2f4ebb',
  slug: 'buena-postura',
  titulo: { es: 'Creciendo con Buena Postura', en: 'Growing with Good Posture' },
  tipo_codigo: 'ACTIVIDAD_FISICA',
  categoria_codigo: 'PREVENCION',
  audiencia_codigo: 'KIDS',
  idiomas: ['es', 'en'],
  numero_escenas: 2,
  escenas: [
    { orden: 1, folder: 'bienvenida', titulo: { es: 'Bienvenida', en: 'Welcome' } },
    { orden: 2, folder: 'motricidad', titulo: { es: 'Quédate Así', en: 'Hold It' } },
  ],
}

const json = (o: unknown) => JSON.stringify(o)

describe('parsearMetadata — caso feliz', () => {
  it('acepta la metadata real que produce Studio', () => {
    const { meta, error } = parsearMetadata(json(VALIDA))
    expect(error).toBeNull()
    expect(meta?.clave).toBe(VALIDA.clave)
    expect(meta?.slug).toBe('buena-postura')
    expect(meta?.escenas).toHaveLength(2)
  })

  it('tolera espacios alrededor del pegado', () => {
    expect(parsearMetadata(`\n\n  ${json(VALIDA)}  \n`).error).toBeNull()
  })

  it('normaliza los códigos a mayúsculas para casar con los catálogos', () => {
    const { meta } = parsearMetadata(json({ ...VALIDA, tipo_codigo: 'actividad_fisica', audiencia_codigo: 'kids' }))
    expect(meta?.tipo_codigo).toBe('ACTIVIDAD_FISICA')
    expect(meta?.audiencia_codigo).toBe('KIDS')
  })

  it('ordena las escenas por orden aunque lleguen desordenadas', () => {
    const desordenadas = { ...VALIDA, escenas: [VALIDA.escenas[1], VALIDA.escenas[0]] }
    const { meta } = parsearMetadata(json(desordenadas))
    expect(meta?.escenas.map(e => e.orden)).toEqual([1, 2])
  })

  it('acepta categoría nula (la columna es nullable)', () => {
    const { meta, error } = parsearMetadata(json({ ...VALIDA, categoria_codigo: null }))
    expect(error).toBeNull()
    expect(meta?.categoria_codigo).toBeNull()
  })
})

describe('parsearMetadata — rechaza lo que rompería la base', () => {
  it('texto vacío', () => {
    expect(parsearMetadata('').error).toBeTruthy()
    expect(parsearMetadata('   ').error).toBeTruthy()
  })

  it('JSON inválido o pegado a medias', () => {
    expect(parsearMetadata('{ esto no es json').error).toContain('JSON')
    expect(parsearMetadata('hola').error).toBeTruthy()
  })

  it('un array o un escalar en vez de un objeto', () => {
    expect(parsearMetadata('[]').error).toBeTruthy()
    expect(parsearMetadata('42').error).toBeTruthy()
  })

  it('clave ausente o que no es UUID', () => {
    expect(parsearMetadata(json({ ...VALIDA, clave: undefined })).error).toContain('clave')
    expect(parsearMetadata(json({ ...VALIDA, clave: 'no-es-uuid' })).error).toContain('clave')
  })

  it('título que no viene por idioma', () => {
    expect(parsearMetadata(json({ ...VALIDA, titulo: 'Buena Postura' })).error).toContain('título')
    expect(parsearMetadata(json({ ...VALIDA, titulo: {} })).error).toContain('título')
    // Todas las claves en blanco = no hay título real
    expect(parsearMetadata(json({ ...VALIDA, titulo: { es: '  ' } })).error).toContain('título')
  })

  it('idiomas vacíos o inválidos', () => {
    expect(parsearMetadata(json({ ...VALIDA, idiomas: [] })).error).toContain('idiomas')
    expect(parsearMetadata(json({ ...VALIDA, idiomas: 'es' })).error).toContain('idiomas')
  })

  it('el conteo de escenas no coincide con la lista (pegado cortado)', () => {
    const { error } = parsearMetadata(json({ ...VALIDA, numero_escenas: 7 }))
    expect(error).toContain('7')
    expect(error).toContain('2')
  })

  it('escenas con el mismo orden — violaría unique(storyboard_id, orden)', () => {
    const chocan = {
      ...VALIDA,
      escenas: [VALIDA.escenas[0], { ...VALIDA.escenas[1], orden: 1 }],
    }
    expect(parsearMetadata(json(chocan)).error).toContain('orden')
  })

  it('escenas con la misma carpeta', () => {
    const chocan = {
      ...VALIDA,
      escenas: [VALIDA.escenas[0], { ...VALIDA.escenas[1], folder: 'bienvenida' }],
    }
    expect(parsearMetadata(json(chocan)).error).toContain('carpeta')
  })

  it('una escena sin carpeta, sin orden válido o sin título', () => {
    const sinFolder = { ...VALIDA, numero_escenas: 1, escenas: [{ orden: 1, titulo: { es: 'X' } }] }
    expect(parsearMetadata(json(sinFolder)).error).toContain('carpeta')

    const ordenCero = { ...VALIDA, numero_escenas: 1, escenas: [{ orden: 0, folder: 'a', titulo: { es: 'X' } }] }
    expect(parsearMetadata(json(ordenCero)).error).toContain('orden')

    const sinTitulo = { ...VALIDA, numero_escenas: 1, escenas: [{ orden: 1, folder: 'a' }] }
    expect(parsearMetadata(json(sinTitulo)).error).toContain('título')
  })

  it('número de escenas negativo o decimal', () => {
    expect(parsearMetadata(json({ ...VALIDA, numero_escenas: -1 })).error).toBeTruthy()
    expect(parsearMetadata(json({ ...VALIDA, numero_escenas: 2.5 })).error).toBeTruthy()
  })
})
