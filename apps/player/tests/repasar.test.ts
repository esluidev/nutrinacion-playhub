import { describe, expect, it } from 'vitest'
import { createJourney } from '~/runner/templates/repasar'

// Las reglas de la plantilla Repasar (app/runner/templates/repasar.ts): armar el recorrido, una ficha por lugar.

describe('createJourney', () => {
  it('empieza con todos los lugares libres', () => {
    const game = createJourney(4)
    expect(game.next()).toBe(0)
    expect(game.done()).toBe(false)
    expect(game.progress()).toBe(0)
    expect(game.isFixed(0)).toBe(false)
  })

  it('una ficha solo se queda en su lugar; en otro, vuelve y no cuenta', () => {
    const game = createJourney(4)
    expect(game.drop(2, 0)).toBe('vuelve')
    expect(game.drop(2, 3)).toBe('vuelve')
    expect(game.isFixed(2)).toBe(false)
    expect(game.progress()).toBe(0)
    expect(game.drop(2, 2)).toBe('fija')
    expect(game.isFixed(2)).toBe(true)
    expect(game.progress()).toBe(0.25)
  })

  it('los lugares se llenan en cualquier orden, y el siguiente libre es el primero que falta', () => {
    const game = createJourney(4)
    game.drop(3, 3)
    game.drop(0, 0)
    expect(game.next()).toBe(1)
    game.drop(1, 1)
    expect(game.next()).toBe(2)
  })

  it('tocar una ficha la manda al primer lugar libre', () => {
    const game = createJourney(3)
    expect(game.tap(1)).toBe('vuelve')
    expect(game.tap(0)).toBe('fija')
    expect(game.tap(2)).toBe('vuelve')
    expect(game.tap(1)).toBe('fija')
    expect(game.tap(2)).toBe('fija')
    expect(game.done()).toBe(true)
    expect(game.progress()).toBe(1)
    expect(game.next()).toBe(-1)
  })

  it('una ficha ya fija no se vuelve a mover, ni otra ocupa su lugar', () => {
    const game = createJourney(3)
    game.drop(0, 0)
    expect(game.drop(0, 0)).toBe(null)
    expect(game.drop(0, 1)).toBe(null)
    expect(game.drop(1, 0)).toBe('vuelve')
    expect(game.isFixed(0)).toBe(true)
  })

  it('una ficha o un lugar que no existen no hacen nada', () => {
    const game = createJourney(2)
    expect(game.drop(-1, 0)).toBe(null)
    expect(game.drop(0, 2)).toBe(null)
    expect(game.drop(0.5, 0)).toBe(null)
    expect(game.progress()).toBe(0)
  })

  it('sin fichas, o con un número que no lo es, la escena ya está completa', () => {
    for (const count of [0, -2, 1.5, Number.NaN]) {
      const game = createJourney(count)
      expect(game.done()).toBe(true)
      expect(game.progress()).toBe(1)
      expect(game.next()).toBe(-1)
      expect(game.tap(0)).toBe(null)
    }
  })
})
