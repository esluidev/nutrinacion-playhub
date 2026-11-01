import { describe, expect, it } from 'vitest'
import { cuadriculaDelMes, diasDeSemana, inicioDeSemana, moverRango, rangoDeDias, textoDelRango } from '~/utils/calendario'

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
  it('mueve una semana o un mes', () => {
    expect(moverRango('2026-10-14', 'semana', 1)).toBe('2026-10-21')
    expect(moverRango('2026-10-14', 'semana', -1)).toBe('2026-10-07')
    expect(moverRango('2026-10-31', 'mes', 1)).toBe('2026-11-01')
    expect(moverRango('2026-01-15', 'mes', -1)).toBe('2025-12-01')
  })

  it('escribe el rango de la semana y el mes', () => {
    expect(textoDelRango('2026-10-14', 'semana', 'es')).toBe('12 – 18 oct 2026')
    expect(textoDelRango('2026-10-01', 'semana', 'es')).toBe('28 sep – 4 oct 2026')
    expect(textoDelRango('2026-10-14', 'mes', 'es')).toBe('octubre de 2026')
  })
})

describe('días de la jornada', () => {
  it('de un mes a otro, dentro de un mes o un solo día', () => {
    expect(rangoDeDias('2026-10-25', '2026-11-13', 'es')).toBe('25 oct – 13 nov')
    expect(rangoDeDias('2026-10-12', '2026-10-16', 'es')).toBe('12 – 16 oct')
    expect(rangoDeDias('2026-10-12', '2026-10-12', 'es')).toBe('12 oct')
  })

  it('con el año solo si cambia', () => {
    expect(rangoDeDias('2026-12-28', '2027-01-08', 'es')).toBe('28 dic 2026 – 8 ene 2027')
  })

  it('en inglés, el mes delante', () => {
    expect(rangoDeDias('2026-10-25', '2026-11-13', 'en')).toBe('Oct 25 – Nov 13')
    expect(rangoDeDias('2026-10-12', '2026-10-16', 'en')).toBe('Oct 12 – 16')
    expect(rangoDeDias('2026-10-12', '2026-10-12', 'en')).toBe('Oct 12')
  })
})
