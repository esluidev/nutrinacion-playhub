import { describe, expect, it } from 'vitest'
import { ALBUM_MAX, ALBUM_MIN, collageSpots, createAlbum } from '~/runner/templates/resumen'

// Las reglas de la plantilla Resumen (app/runner/templates/resumen.ts): el álbum de fotos del taller.

describe('createAlbum', () => {
  it('empieza con el primer logro arriba y nada hecho', () => {
    const album = createAlbum(5)
    expect(album.top()).toBe(0)
    expect(album.done()).toBe(false)
    expect(album.progress()).toBe(0)
  })

  it('cada toque pasa un logro, en orden, y después llega la invitación', () => {
    const album = createAlbum(3)
    expect(album.pass()).toEqual({ kind: 'logro', index: 0 })
    expect(album.pass()).toEqual({ kind: 'logro', index: 1 })
    expect(album.isPassed(1)).toBe(true)
    expect(album.isPassed(2)).toBe(false)
    expect(album.pass()).toEqual({ kind: 'logro', index: 2 })
    expect(album.top()).toBe(3)
    expect(album.done()).toBe(false)
    expect(album.pass()).toEqual({ kind: 'invitacion' })
    expect(album.done()).toBe(true)
  })

  it('después de la invitación ya no pasa nada', () => {
    const album = createAlbum(3)
    for (let i = 0; i < 4; i += 1) album.pass()
    expect(album.pass()).toBeNull()
    expect(album.progress()).toBe(1)
  })

  it('el avance cuenta los logros y la invitación', () => {
    const album = createAlbum(4)
    album.pass()
    expect(album.progress()).toBeCloseTo(1 / 5)
    album.pass()
    album.pass()
    album.pass()
    expect(album.progress()).toBeCloseTo(4 / 5)
    album.pass()
    expect(album.progress()).toBe(1)
  })

  it('sin logros, la invitación llega con el primer toque', () => {
    const album = createAlbum(0)
    expect(album.pass()).toEqual({ kind: 'invitacion' })
    expect(album.done()).toBe(true)
  })

  it('no pasa de cinco logros', () => {
    const album = createAlbum(8)
    for (let i = 0; i < ALBUM_MAX; i += 1) expect(album.pass()?.kind).toBe('logro')
    expect(album.pass()).toEqual({ kind: 'invitacion' })
  })
})

describe('collageSpots', () => {
  it('hay un sitio por logro, de tres a cinco', () => {
    for (let n = ALBUM_MIN; n <= ALBUM_MAX; n += 1) expect(collageSpots(n)).toHaveLength(n)
    expect(collageSpots(2)).toEqual([])
    expect(collageSpots(6)).toEqual([])
  })

  it('ningún sitio pisa la pila ni se sale del tablero', () => {
    // La pila mide 360 × 315 en el centro; una foto posada, 222 × 194, con un margen por su giro.
    const half = { w: 222 / 2 + 10, h: 194 / 2 + 10 }
    for (let n = ALBUM_MIN; n <= ALBUM_MAX; n += 1) {
      for (const spot of collageSpots(n)) {
        expect(Math.abs(spot.x - 640)).toBeGreaterThan(180 + half.w - 20)
        expect(spot.x - half.w).toBeGreaterThanOrEqual(120)
        expect(spot.x + half.w).toBeLessThanOrEqual(1160)
        expect(spot.y - half.h).toBeGreaterThanOrEqual(0)
        expect(spot.y + half.h).toBeLessThanOrEqual(600)
        expect(Math.abs(spot.r)).toBeGreaterThanOrEqual(2)
        expect(Math.abs(spot.r)).toBeLessThanOrEqual(5)
      }
    }
  })
})
