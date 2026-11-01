import { describe, expect, it } from 'vitest'
import { idiomasEscritos, resumenGuia, siguientePaso, tonoGuia } from '~/utils/catalogoResumen'
import type { EscenaGuia } from '~/utils/catalogoResumen'

// Lo que la gestión resume de la base: la guía escrita (que escribe Admin) y qué toca hacer ahora.

const escena = (carpeta: string, parcial: Partial<EscenaGuia> = {}): EscenaGuia => ({
  orden: 1, carpeta, titulo: { es: carpeta }, ...parcial,
})

describe('resumenGuia — escenas escritas de N, por idioma', () => {
  const escenas = [
    escena('bienvenida', { verbo: { es: 'Conocer', en: 'Meet' } }),
    escena('origen', { objetivo: { es: 'Saber de dónde viene' }, verbo: { en: '   ' } }),
    escena('cierre'),
  ]

  it('cuenta una escena como escrita si alguna sección tiene texto en ese idioma', () => {
    expect(resumenGuia(escenas, ['es', 'en'])).toEqual([
      { idioma: 'es', escritas: 2, total: 3 },
      { idioma: 'en', escritas: 1, total: 3 },
    ])
  })

  it('un texto en blanco no cuenta', () => {
    expect(idiomasEscritos(escenas[1]!, ['es', 'en'])).toEqual(['es'])
  })

  it('sin escenas, cero de cero', () => {
    expect(resumenGuia([], ['es'])).toEqual([{ idioma: 'es', escritas: 0, total: 0 }])
  })

  it('el tono: completa en lima, empezada en sol, sin empezar neutra', () => {
    expect(tonoGuia(3, 3)).toBe('lime')
    expect(tonoGuia(1, 3)).toBe('sun')
    expect(tonoGuia(0, 3)).toBe('neutral')
    expect(tonoGuia(0, 0)).toBe('neutral')
  })
})

describe('siguientePaso — el hilo de JSON nuevo a publicado', () => {
  it('con errores en el JSON, primero corregirlos', () => {
    expect(siguientePaso('sin_registrar', null, ['la categoría «DEPORTE» no existe'])).toMatch(/errores/)
  })

  it('mientras no se lee la base, lo dice', () => {
    expect(siguientePaso(null, null)).toBe('Leyendo la base…')
  })

  it('sin registrar → registrar; desactualizado → actualizar', () => {
    expect(siguientePaso('sin_registrar', null)).toMatch(/^Regístralo/)
    expect(siguientePaso('desactualizado', { estado: 'REGISTRADO', paises: [] })).toMatch(/^Actualízalo/)
  })

  it('al día, según la publicación', () => {
    expect(siguientePaso('al_dia', { estado: 'REGISTRADO', paises: [] })).toMatch(/Elige sus países/)
    expect(siguientePaso('al_dia', { estado: 'REGISTRADO', paises: ['MX'] })).not.toMatch(/Elige sus países/)
    expect(siguientePaso('al_dia', { estado: 'EN_REVISION', paises: ['MX'] })).toMatch(/^En revisión/)
    expect(siguientePaso('al_dia', { estado: 'PUBLICADO', paises: ['MX'] })).toMatch(/un país/)
    expect(siguientePaso('al_dia', { estado: 'PUBLICADO', paises: ['MX', 'CO'] })).toMatch(/2 países/)
    expect(siguientePaso('al_dia', { estado: 'ARCHIVADO', paises: ['MX'] })).toMatch(/^Archivado/)
  })
})
