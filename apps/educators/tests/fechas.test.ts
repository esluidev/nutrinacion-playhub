import { describe, expect, it } from 'vitest'
import { diaCorto, fechaLarga, mesCorto, nombreDelDia, rangoDeDias } from '~/utils/fechas'

describe('fecha larga', () => {
  it('con el día de la semana, en español e inglés', () => {
    expect(fechaLarga('2026-11-04', 'es')).toBe('miércoles, 4 de noviembre')
    expect(fechaLarga('2026-11-04', 'en')).toBe('Wednesday, November 4')
  })
})

describe('la ficha de fecha', () => {
  it('el día de la semana y el mes, cortos', () => {
    expect(diaCorto('2026-11-04', 'es')).toBe('mié')
    expect(mesCorto('2026-11-04', 'es')).toBe('nov')
    expect(diaCorto('2026-11-04', 'en')).toBe('Wed')
    expect(mesCorto('2026-11-04', 'en')).toBe('Nov')
  })
})

describe('el día en una lista', () => {
  const palabras = { hoy: 'Hoy', manana: 'Mañana', ayer: 'Ayer' }
  it('hoy, mañana y ayer por su nombre, también al cambiar de mes; los demás, la fecha', () => {
    expect(nombreDelDia('2026-11-30', '2026-11-30', 'es', palabras)).toBe('Hoy · lunes, 30 de noviembre')
    expect(nombreDelDia('2026-12-01', '2026-11-30', 'es', palabras)).toBe('Mañana · martes, 1 de diciembre')
    expect(nombreDelDia('2026-11-29', '2026-11-30', 'es', palabras)).toBe('Ayer · domingo, 29 de noviembre')
    expect(nombreDelDia('2026-12-03', '2026-11-30', 'es', palabras)).toBe('jueves, 3 de diciembre')
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
