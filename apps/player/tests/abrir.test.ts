import { describe, expect, it } from 'vitest'
import { crackSpan, createOpening } from '~/runner/templates/abrir'

// Las reglas de la plantilla Abrir (app/runner/templates/abrir.ts): abrir a toques y tocar las partes.

describe('createOpening', () => {
  it('aguanta hasta el último toque y con él se abre', () => {
    const game = createOpening(3, 3)
    expect(game.tap()).toBe('grieta')
    expect(game.tap()).toBe('grieta')
    expect(game.phase()).toBe('cerrado')
    expect(game.tap()).toBe('abre')
    expect(game.phase()).toBe('abriendo')
    expect(game.taps()).toBe(3)
  })

  it('una vez abierto, tocar el entero no hace nada', () => {
    const game = createOpening(1, 2)
    expect(game.tap()).toBe('abre')
    expect(game.tap()).toBe(null)
    game.opened()
    expect(game.tap()).toBe(null)
    expect(game.taps()).toBe(1)
  })

  it('las partes no se tocan hasta que están en su sitio', () => {
    const game = createOpening(2, 3)
    expect(game.touch(0)).toBe(null)
    game.tap()
    game.tap()
    expect(game.touch(0)).toBe(null) // todavía salen del entero
    game.opened()
    expect(game.touch(0)).toEqual({ first: true, all: false })
  })

  it('se tocan en cualquier orden y la última distinta completa', () => {
    const game = createOpening(1, 3)
    game.tap()
    game.opened()
    expect(game.touch(2)).toEqual({ first: true, all: false })
    expect(game.touch(0)).toEqual({ first: true, all: false })
    expect(game.touch(1)).toEqual({ first: true, all: true })
    expect(game.seen(1)).toBe(true)
  })

  it('tocar otra vez una parte ya vista lo repite, sin contar ni completar de nuevo', () => {
    const game = createOpening(1, 2)
    game.tap()
    game.opened()
    game.touch(0)
    expect(game.touch(0)).toEqual({ first: false, all: false })
    game.touch(1)
    expect(game.touch(1)).toEqual({ first: false, all: false })
    expect(game.touch(0)).toEqual({ first: false, all: false })
  })

  it('una parte que no existe no cuenta', () => {
    const game = createOpening(1, 2)
    game.tap()
    game.opened()
    expect(game.touch(2)).toBe(null)
    expect(game.touch(-1)).toBe(null)
    expect(game.touch(0.5)).toBe(null)
  })

  it('el avance solo sube: abrir es la cuarta parte y el resto, las partes vistas', () => {
    const game = createOpening(3, 3)
    const steps = [game.progress()]
    game.tap(); steps.push(game.progress())
    game.tap(); steps.push(game.progress())
    game.tap(); steps.push(game.progress())
    game.opened(); steps.push(game.progress())
    game.touch(1); steps.push(game.progress())
    game.touch(1); steps.push(game.progress())
    game.touch(0); steps.push(game.progress())
    game.touch(2); steps.push(game.progress())
    expect(steps[0]).toBe(0)
    expect(steps[3]).toBeCloseTo(0.25)
    expect(steps[5]).toBeCloseTo(0.5)
    expect(steps[6]).toBeCloseTo(0.5)
    expect(steps.at(-1)).toBe(1)
    steps.forEach((value, i) => expect(value).toBeGreaterThanOrEqual(steps[i - 1] ?? 0))
  })

  it('sin toques que valgan, se abre con el primero', () => {
    expect(createOpening(0, 1).tap()).toBe('abre')
    expect(createOpening(Number.NaN, 1).tap()).toBe('abre')
  })
})

describe('crackSpan', () => {
  it('sin toques no se ve', () => {
    expect(crackSpan(0, 3, [0.33, 0.63])).toBe(null)
  })

  it('con tres toques: el tramo del primero y, con el segundo, entera', () => {
    expect(crackSpan(1, 3, [0.33, 0.63])).toEqual([0.33, 0.63])
    expect(crackSpan(2, 3, [0.33, 0.63])).toEqual([0, 1])
  })

  it('con más toques crece hacia los dos lados hasta verse entera en el penúltimo', () => {
    const spans = [1, 2, 3, 4].map(done => crackSpan(done, 5, [0.4, 0.6])!)
    expect(spans[0]).toEqual([0.4, 0.6])
    expect(spans[3]).toEqual([0, 1])
    spans.forEach((span, i) => {
      if (!i) return
      expect(span[0]).toBeLessThan(spans[i - 1]![0])
      expect(span[1]).toBeGreaterThan(spans[i - 1]![1])
    })
  })

  it('con dos toques, el único que se ve es la grieta entera', () => {
    expect(crackSpan(1, 2, [0.33, 0.63])).toEqual([0, 1])
  })

  it('sin tramo del primer toque, se ve entera desde el principio', () => {
    expect(crackSpan(1, 4)).toEqual([0, 1])
  })
})
