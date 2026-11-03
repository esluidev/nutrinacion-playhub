import { describe, expect, it } from 'vitest'
import { fechaLarga, rangoDeDias } from '~/utils/fechas'

describe('fecha larga', () => {
  it('con el día de la semana, en español e inglés', () => {
    expect(fechaLarga('2026-11-04', 'es')).toBe('miércoles, 4 de noviembre')
    expect(fechaLarga('2026-11-04', 'en')).toBe('Wednesday, November 4')
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
