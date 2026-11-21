import { describe, expect, it } from 'vitest'
import { createFeeding } from '~/runner/templates/comer'

// Las reglas de la plantilla Comer (app/runner/templates/comer.ts): darle al personaje los alimentos de las tarjetas.

describe('darle de comer', () => {
  it('se le da cualquiera, en cualquier orden, y termina con todos comidos', () => {
    const game = createFeeding(2)
    expect(game.give(1)).toBe(true)
    expect(game.eating()).toBe(1)
    expect(game.swallow(1)).toEqual({ all: false })
    expect(game.progress()).toBe(0.5)
    expect(game.give(0)).toBe(true)
    expect(game.swallow(0)).toEqual({ all: true })
    expect(game.done()).toBe(true)
    expect(game.progress()).toBe(1)
  })

  it('mientras come uno no se le da otro, ni dos veces el mismo', () => {
    const game = createFeeding(2)
    game.give(0)
    expect(game.canGive(1)).toBe(false)
    expect(game.give(1)).toBe(false)
    expect(game.give(0)).toBe(false)
    game.swallow(0)
    expect(game.canGive(0)).toBe(false)
    expect(game.canGive(1)).toBe(true)
  })

  it('con un toque se elige; otro toque lo suelta; dárselo lo suelta también', () => {
    const game = createFeeding(2)
    expect(game.choose(0)).toBe('elige')
    expect(game.chosen()).toBe(0)
    expect(game.choose(1)).toBe('elige')
    expect(game.chosen()).toBe(1)
    expect(game.choose(1)).toBe('quita')
    expect(game.chosen()).toBeNull()
    game.choose(1)
    game.give(1)
    expect(game.chosen()).toBeNull()
  })

  it('tocar uno ya comido lo vuelve a mostrar; uno en la boca no hace nada', () => {
    const game = createFeeding(2)
    game.give(0)
    expect(game.choose(0)).toBeNull()
    game.swallow(0)
    expect(game.choose(0)).toBe('repite')
    expect(game.chosen()).toBeNull()
  })

  it('lo que no existe no cuenta', () => {
    const game = createFeeding(1)
    expect(game.choose(3)).toBeNull()
    expect(game.give(-1)).toBe(false)
    expect(game.swallow(0)).toBeNull()
    expect(game.stateOf(2)).toBeNull()
    expect(createFeeding(0).progress()).toBe(1)
  })
})
