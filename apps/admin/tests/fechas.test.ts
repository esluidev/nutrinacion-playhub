// Zona fija para que el resultado no dependa de la máquina: Guatemala, UTC−6 sin horario de verano.
process.env.TZ = 'America/Guatemala'

const { aFecha, diasHasta, fechaCorta, fechaHora, finDelDia, hoyLocal, isoLocal } = await import('~/utils/fechas')
const { describe, expect, it } = await import('vitest')

describe('aFecha', () => {
  it('una fecha sin hora es ese día local, no el anterior', () => {
    const d = aFecha('2026-10-16')
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()]).toEqual([2026, 10, 16, 0])
  })

  it('un instante se respeta', () => {
    expect(aFecha('2026-10-16T03:00:00+00:00').getDate()).toBe(15) // 21:00 del 15 en Guatemala
  })
})

describe('fechaCorta', () => {
  it('muestra el día guardado en las dos lenguas', () => {
    expect(fechaCorta('2026-10-16', 'es')).toContain('16')
    expect(fechaCorta('2026-10-16', 'en')).toBe('Oct 16, 2026')
  })
})

describe('fechaHora', () => {
  it('un instante con su hora local, sin el año', () => {
    // 16:32 UTC son las 10:32 en Guatemala
    expect(fechaHora('2026-11-01T16:32:00Z', 'es')).toBe('1 nov, 10:32')
    expect(fechaHora('2026-11-01T16:32:00Z', 'en')).toBe('Nov 1, 10:32 AM')
  })
})

describe('hoyLocal', () => {
  it('a las 19:00 en Guatemala sigue siendo hoy (en UTC ya es mañana)', () => {
    const ahora = new Date('2026-10-17T01:00:00Z') // 19:00 del 16 en Guatemala
    expect(ahora.toISOString().slice(0, 10)).toBe('2026-10-17')
    expect(hoyLocal(0, ahora)).toBe('2026-10-16')
    expect(hoyLocal(30, ahora)).toBe('2026-11-15')
  })

  it('isoLocal rellena con ceros', () => {
    expect(isoLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('diasHasta', () => {
  const ahora = new Date('2026-10-17T01:00:00Z') // 19:00 del 16 en Guatemala

  it('cuenta días del calendario', () => {
    expect(diasHasta('2026-10-16', ahora)).toBe(0)
    expect(diasHasta('2026-10-17', ahora)).toBe(1)
    expect(diasHasta('2026-10-15', ahora)).toBe(-1)
    expect(diasHasta('2026-11-15', ahora)).toBe(30)
  })
})

describe('finDelDia', () => {
  it('vence al final del día elegido en la hora local', () => {
    expect(finDelDia('2026-10-25')).toBe('2026-10-26T05:59:59.000Z')
  })
})
