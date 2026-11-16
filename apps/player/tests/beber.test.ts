import { describe, expect, it } from 'vitest'
import { createSips, hollowHalf, waterLine } from '~/runner/templates/beber'
import type { Hollow } from '~/runner/templates/beber'

// Las reglas de la plantilla Beber (app/runner/templates/beber.ts): contar los sorbos y el agua dentro del vaso.

describe('createSips', () => {
  it('cada toque cuenta un sorbo y el último llena el vaso', () => {
    const glass = createSips(3)
    expect(glass.sip()).toEqual({ full: false })
    expect(glass.sip()).toEqual({ full: false })
    expect(glass.level()).toBeCloseTo(2 / 3)
    expect(glass.sip()).toEqual({ full: true })
    expect(glass.done()).toBe(3)
    expect(glass.level()).toBe(1)
  })

  it('con el vaso lleno, tocar ya no cuenta', () => {
    const glass = createSips(2)
    glass.sip()
    glass.sip()
    expect(glass.sip()).toBe(null)
    expect(glass.done()).toBe(2)
    expect(glass.level()).toBe(1)
  })

  it('empieza vacío', () => {
    const glass = createSips(3)
    expect(glass.done()).toBe(0)
    expect(glass.level()).toBe(0)
  })

  it('sin sorbos que valgan, se llena con el primero', () => {
    expect(createSips(0).sip()).toEqual({ full: true })
    expect(createSips(Number.NaN).total()).toBe(1)
  })
})

const HOLLOW: Hollow = { mouth: { y: 30, half: 76 }, floor: { y: 204, half: 54 } }

describe('el agua dentro del vaso', () => {
  it('la superficie sube del piso a la línea del vaso lleno, a partes iguales', () => {
    expect(waterLine(0, HOLLOW, 52)).toBe(204)
    expect(waterLine(1, HOLLOW, 52)).toBe(52)
    expect(waterLine(1 / 3, HOLLOW, 52)).toBeCloseTo(204 - 152 / 3)
    expect(waterLine(2 / 3, HOLLOW, 52)).toBeCloseTo(204 - 2 * 152 / 3)
  })

  it('no baja del piso ni sube de la línea del vaso lleno', () => {
    expect(waterLine(-0.5, HOLLOW, 52)).toBe(204)
    expect(waterLine(1.5, HOLLOW, 52)).toBe(52)
  })

  it('el hueco mide lo de la boca arriba y lo del piso abajo, y entre los dos se estrecha en línea recta', () => {
    expect(hollowHalf(30, HOLLOW)).toBe(76)
    expect(hollowHalf(204, HOLLOW)).toBe(54)
    expect(hollowHalf(117, HOLLOW)).toBeCloseTo(65)
    expect(hollowHalf(52, HOLLOW)).toBeGreaterThan(hollowHalf(153, HOLLOW))
  })
})
