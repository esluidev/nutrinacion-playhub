import { describe, expect, it } from 'vitest'
import { FRESCO_MS, hayQueLeer, leerAnotando, lecturaNueva } from '~/utils/alDia'

describe('las listas se mantienen al día', () => {
  it('se leen la primera vez y al cambiar de organización', () => {
    expect(hayQueLeer(lecturaNueva(), 7, null)).toBe(true)
    expect(hayQueLeer({ leidoEn: 1_000, enCurso: false }, 8, 7, 1_001)).toBe(true)
  })

  it('al entrar a una página o volver a la pestaña, otra vez si lo leído tiene unos segundos', () => {
    const lectura = { leidoEn: 10_000, enCurso: false }
    expect(hayQueLeer(lectura, 7, 7, 10_000 + FRESCO_MS - 1)).toBe(false)
    expect(hayQueLeer(lectura, 7, 7, 10_000 + FRESCO_MS + 1)).toBe(true)
  })

  it('nunca dos lecturas a la vez, ni sin organización', () => {
    expect(hayQueLeer({ leidoEn: 0, enCurso: true }, 7, null)).toBe(false)
    expect(hayQueLeer(lecturaNueva(), null, null)).toBe(false)
  })

  it('anota cuándo leyó, también si la lectura falla', async () => {
    const lectura = lecturaNueva()
    let durante = false
    await leerAnotando(lectura, async () => { durante = lectura.enCurso }, () => 42)
    expect(durante).toBe(true)
    expect(lectura).toEqual({ leidoEn: 42, enCurso: false })
    await expect(leerAnotando(lectura, async () => { throw new Error('sin red') }, () => 43)).rejects.toThrow()
    expect(lectura).toEqual({ leidoEn: 43, enCurso: false })
  })
})
