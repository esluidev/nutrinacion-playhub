import { describe, expect, it } from 'vitest'
import { agregar, faltaParaGuardar, formVacio, mover, textoLimpio, textoLocal } from '~/utils/unidadesEstudio'

describe('unidades de estudio', () => {
  it('el texto por idioma se guarda sin los idiomas vacíos', () => {
    expect(textoLimpio({ es: ' Ganando músculos ', en: '' })).toEqual({ es: 'Ganando músculos' })
    expect(textoLimpio({ es: '', en: '  ' })).toBeNull()
  })

  it('se muestra en español o en el primer idioma escrito', () => {
    expect(textoLocal({ es: 'Ganando músculos', en: 'Building muscle' })).toBe('Ganando músculos')
    expect(textoLocal({ en: 'Building muscle' })).toBe('Building muscle')
    expect(textoLocal(null)).toBe('')
  })

  it('lo que falta para guardar: título, storyboards del hogar y, para publicarla, al menos uno', () => {
    const delHogar = new Set([1, 2])
    const form = { ...formVacio(), titulo: { es: 'Ganando músculos', en: '' } }
    expect(faltaParaGuardar(formVacio(), delHogar)).toBe('Escribe el título de la unidad.')
    expect(faltaParaGuardar(form, delHogar)).toBeNull()
    expect(faltaParaGuardar({ ...form, publicada: true }, delHogar)).toBe('Para publicarla, agrega al menos un storyboard.')
    expect(faltaParaGuardar({ ...form, publicada: true, storyboards: [1, 2] }, delHogar)).toBeNull()
    expect(faltaParaGuardar({ ...form, storyboards: [1, 3] }, delHogar)).toBe('Quita los storyboards que ya no salen en el hogar.')
  })

  it('se ordena subiendo y bajando, sin salirse de la lista', () => {
    expect(mover([1, 2, 3], 2, -1)).toEqual([1, 3, 2])
    expect(mover([1, 2, 3], 0, 1)).toEqual([2, 1, 3])
    expect(mover([1, 2, 3], 0, -1)).toEqual([1, 2, 3])
    expect(mover([1, 2, 3], 2, 1)).toEqual([1, 2, 3])
  })

  it('agregar no repite los que ya estaban', () => {
    expect(agregar([1, 2], [2, 3, 4])).toEqual([1, 2, 3, 4])
  })
})
