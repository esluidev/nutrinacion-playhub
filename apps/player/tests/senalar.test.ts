import { describe, expect, it } from 'vitest'
import { createPointing } from '~/runner/templates/senalar'

// Las reglas de la plantilla Señalar (app/runner/templates/senalar.ts): elegir qué se busca y tocar dónde sirve.

describe('createPointing', () => {
  it('sin nada elegido, tocar una zona no hace nada', () => {
    const game = createPointing(['cuerpo', 'cara'])
    expect(game.chosen()).toBe(null)
    expect(game.point('cuerpo')).toBe(null)
    expect(game.progress()).toBe(0)
  })

  it('se elige en el orden que se quiera', () => {
    const game = createPointing(['cuerpo', 'cara'])
    expect(game.choose(1)).toBe('busca')
    expect(game.chosen()).toBe(1)
    expect(game.point('cara')).toEqual({ item: 1, hit: true, all: false })
    expect(game.found(1)).toBe(true)
    expect(game.chosen()).toBe(null)
  })

  it('tocar la zona que no es deja la misma cosa elegida y no cuenta', () => {
    const game = createPointing(['cuerpo', 'cara'])
    game.choose(0)
    expect(game.point('cara')).toEqual({ item: 0, hit: false, all: false })
    expect(game.point('cara')).toEqual({ item: 0, hit: false, all: false })
    expect(game.chosen()).toBe(0)
    expect(game.found(0)).toBe(false)
    expect(game.progress()).toBe(0)
    expect(game.point('cuerpo')).toEqual({ item: 0, hit: true, all: false })
  })

  it('se puede cambiar de cosa antes de encontrarla', () => {
    const game = createPointing(['cuerpo', 'cara'])
    game.choose(0)
    expect(game.choose(1)).toBe('busca')
    expect(game.point('cuerpo')).toEqual({ item: 1, hit: false, all: false })
  })

  it('con la última se completa y el avance llega a 1', () => {
    const game = createPointing(['cuerpo', 'cara'])
    game.choose(0)
    game.point('cuerpo')
    expect(game.progress()).toBe(0.5)
    expect(game.done()).toBe(false)
    game.choose(1)
    expect(game.point('cara')).toEqual({ item: 1, hit: true, all: true })
    expect(game.progress()).toBe(1)
    expect(game.done()).toBe(true)
  })

  it('elegir una ya encontrada la repite y no deja nada por buscar', () => {
    const game = createPointing(['cuerpo', 'cara'])
    game.choose(0)
    game.point('cuerpo')
    game.choose(1)
    expect(game.choose(0)).toBe('repite')
    expect(game.chosen()).toBe(null)
    expect(game.point('cuerpo')).toBe(null)
    expect(game.progress()).toBe(0.5)
  })

  it('una cosa que no existe no se elige', () => {
    const game = createPointing(['cuerpo'])
    expect(game.choose(3)).toBe(null)
    expect(game.choose(-1)).toBe(null)
    expect(game.choose(0.5)).toBe(null)
    expect(game.chosen()).toBe(null)
  })

  it('sin cosas, la escena ya está completa', () => {
    const game = createPointing([])
    expect(game.done()).toBe(true)
    expect(game.progress()).toBe(1)
  })
})
