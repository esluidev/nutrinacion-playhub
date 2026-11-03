import { describe, expect, it } from 'vitest'
import { cuadriculaDelMes, diasDeSemana, inicioDeSemana, moverRango, textoDelRango } from '~/utils/calendario'

describe('semana', () => {
  it('empieza en lunes, también desde un domingo', () => {
    expect(inicioDeSemana('2026-10-14')).toBe('2026-10-12')
    expect(inicioDeSemana('2026-10-18')).toBe('2026-10-12')
    expect(inicioDeSemana('2026-10-12')).toBe('2026-10-12')
  })

  it('tiene siete días aunque cruce de mes', () => {
    expect(diasDeSemana('2026-10-01')).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
  })
})

describe('mes', () => {
  it('cubre el mes con semanas completas de lunes a domingo', () => {
    const semanas = cuadriculaDelMes('2026-10-14')
    expect(semanas).toHaveLength(5)
    expect(semanas[0]![0]).toEqual({ iso: '2026-09-28', delMes: false })
    expect(semanas[4]![6]).toEqual({ iso: '2026-11-01', delMes: false })
    expect(semanas.flat().filter(d => d.delMes)).toHaveLength(31)
  })
})

describe('barra de fechas', () => {
  it('mueve un día, una semana o un mes', () => {
    expect(moverRango('2026-10-31', 'dia', 1)).toBe('2026-11-01')
    expect(moverRango('2026-10-14', 'dia', -1)).toBe('2026-10-13')
    expect(moverRango('2026-10-14', 'semana', 1)).toBe('2026-10-21')
    expect(moverRango('2026-10-14', 'semana', -1)).toBe('2026-10-07')
    expect(moverRango('2026-10-31', 'mes', 1)).toBe('2026-11-01')
    expect(moverRango('2026-01-15', 'mes', -1)).toBe('2025-12-01')
  })

  it('escribe el día, el rango de la semana y el mes', () => {
    expect(textoDelRango('2026-10-14', 'dia', 'es')).toBe('miércoles, 14 de octubre')
    expect(textoDelRango('2026-10-14', 'semana', 'es')).toBe('12 – 18 oct 2026')
    expect(textoDelRango('2026-10-01', 'semana', 'es')).toBe('28 sep – 4 oct 2026')
    expect(textoDelRango('2026-10-14', 'mes', 'es')).toBe('octubre de 2026')
  })
})
