import { describe, expect, it } from 'vitest'
import { categoriasDe, delPerfil, explorar, idiomaDeJuego, paraSeguir, recientes, textoEn } from '../app/utils/catalogo'
import type { CatalogoHogar, StoryboardHogar } from '../app/utils/catalogo'

function storyboard(clave: string, extra: Partial<StoryboardHogar> = {}): StoryboardHogar {
  return {
    clave, eje: 'alimentacion', slug: clave, titulo: { es: clave }, categoria: 'ALIMENTACION', subcategoria: null,
    edicion: 'KIDS', enfoques_salud: [], idiomas: ['es'], idioma_principal: 'es', duracion_min: 30, numero_escenas: 9,
    creado: '2026-11-01T00:00:00Z', portada: null, ...extra,
  }
}

const catalogo: CatalogoHogar = {
  storyboards: [
    storyboard('huevo', { titulo: { es: 'El huevo' }, creado: '2026-11-10T00:00:00Z' }),
    storyboard('agua', { titulo: { es: 'El agua', en: 'Water' }, categoria: 'CUIDADO_PERSONAL', creado: '2026-11-20T00:00:00Z' }),
    storyboard('emociones', { edicion: 'ADOLESCENTES', categoria: 'SALUD_EMOCIONAL' }),
  ],
  unidades: [
    { id: 1, titulo: { es: 'Ganando músculos' }, descripcion: null, storyboards: ['emociones', 'huevo'] },
    { id: 2, titulo: { es: 'Solo para grandes' }, descripcion: null, storyboards: ['emociones'] },
  ],
}

describe('el catálogo de un perfil', () => {
  it('solo su edición, y las unidades con lo suyo (sin las que quedan vacías)', () => {
    const kids = delPerfil(catalogo, 'KIDS')
    expect(kids.storyboards.map(s => s.clave)).toEqual(['huevo', 'agua'])
    expect(kids.unidades).toEqual([{ id: 1, titulo: { es: 'Ganando músculos' }, descripcion: null, storyboards: ['huevo'] }])
  })

  it('los recientes primero, hasta 10', () => {
    expect(recientes(catalogo.storyboards).map(s => s.clave)).toEqual(['agua', 'huevo', 'emociones'])
    const muchos = Array.from({ length: 14 }, (_, i) => storyboard(`s${i}`, { creado: `2026-11-${String(i + 1).padStart(2, '0')}T00:00:00Z` }))
    expect(recientes(muchos)).toHaveLength(10)
    expect(recientes(muchos)[0]!.clave).toBe('s13')
  })

  it('explorar filtra por categoría y por el título, sin tildes', () => {
    expect(explorar(catalogo.storyboards, { categoria: 'CUIDADO_PERSONAL' }, 'es').map(s => s.clave)).toEqual(['agua'])
    expect(explorar(catalogo.storyboards, { busqueda: 'HUÉVO' }, 'es').map(s => s.clave)).toEqual(['huevo'])
    expect(explorar(catalogo.storyboards, { busqueda: 'water' }, 'en').map(s => s.clave)).toEqual(['agua'])
    expect(categoriasDe(catalogo.storyboards)).toEqual(['ALIMENTACION', 'CUIDADO_PERSONAL', 'SALUD_EMOCIONAL'])
  })

  it('los textos en el idioma de la app o en el primero que haya', () => {
    expect(textoEn({ es: 'El agua', en: 'Water' }, 'en')).toBe('Water')
    expect(textoEn({ es: 'El huevo' }, 'en')).toBe('El huevo')
    expect(textoEn(null, 'es')).toBe('')
  })

  it('se juega en el idioma de la app si el storyboard lo tiene', () => {
    expect(idiomaDeJuego({ idiomas: ['es', 'en'], idioma_principal: 'es' }, 'en')).toBe('en')
    expect(idiomaDeJuego({ idiomas: ['es'], idioma_principal: 'es' }, 'en')).toBe('es')
  })
})

describe('lo que sale arriba del inicio', () => {
  it('el juego a medias, con su avance', () => {
    const seguir = paraSeguir(catalogo.storyboards, { clave: 'huevo', indice: 2, escenas: 9 }, [])
    expect(seguir?.storyboard.clave).toBe('huevo')
    expect(seguir?.avance).toEqual({ clave: 'huevo', indice: 2, escenas: 9 })
  })

  it('sin uno a medias (o en la primera escena), lo más nuevo que no terminó', () => {
    expect(paraSeguir(catalogo.storyboards, null, [])?.storyboard.clave).toBe('agua')
    expect(paraSeguir(catalogo.storyboards, { clave: 'huevo', indice: 0, escenas: 9 }, ['agua'])?.storyboard.clave).toBe('huevo')
    expect(paraSeguir(catalogo.storyboards, null, ['agua', 'huevo', 'emociones'])).toBeNull()
  })

  it('un avance de un juego que ya no está en su catálogo no cuenta', () => {
    expect(paraSeguir(catalogo.storyboards, { clave: 'viejo', indice: 3, escenas: 5 }, [])?.avance).toBeNull()
  })
})

