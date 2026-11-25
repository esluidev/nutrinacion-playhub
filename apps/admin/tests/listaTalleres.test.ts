import { describe, expect, it } from 'vitest'
import type { Periodo } from '~/utils/listaTalleres'
import { fechaEnRango, ordenarTalleres, perteneceA, rangoDelFiltro } from '~/utils/listaTalleres'

// Jueves 26 de noviembre de 2026
const HOY = '2026-11-26'
const rango = (periodo: Periodo, hoy = HOY, desde = '', hasta = '') => rangoDelFiltro({ periodo, desde, hasta }, hoy)

describe('el rango de cada periodo', () => {
  it('hoy, la semana de lunes a domingo y el mes del calendario', () => {
    expect(rango('hoy')).toEqual({ desde: HOY, hasta: HOY })
    expect(rango('semana')).toEqual({ desde: '2026-11-23', hasta: '2026-11-29' })
    expect(rango('mes')).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' })
    expect(rango('mes', '2027-02-10')).toEqual({ desde: '2027-02-01', hasta: '2027-02-28' })
  })
  it('un domingo sigue en su semana, la que empezó el lunes anterior', () => {
    expect(rango('semana', '2026-11-29')).toEqual({ desde: '2026-11-23', hasta: '2026-11-29' })
  })
  it('próximos desde hoy; pasados hasta ayer', () => {
    expect(rango('proximos')).toEqual({ desde: HOY, hasta: null })
    expect(rango('pasados')).toEqual({ desde: null, hasta: '2026-11-25' })
  })
  it('entre dos fechas: las que haya escritas; sin ninguna, no filtra', () => {
    expect(rango('elegir', HOY, '2026-12-01')).toEqual({ desde: '2026-12-01', hasta: null })
    expect(rango('elegir', HOY, '2026-12-01', '2026-12-15')).toEqual({ desde: '2026-12-01', hasta: '2026-12-15' })
    expect(rango('elegir')).toBeNull()
    expect(rango('todas')).toBeNull()
  })
})

describe('si una fecha cae en el rango', () => {
  it('ambos extremos incluidos y sin límite donde no lo hay', () => {
    const semana = { desde: '2026-11-23', hasta: '2026-11-29' }
    expect(fechaEnRango('2026-11-23', semana)).toBe(true)
    expect(fechaEnRango('2026-11-29', semana)).toBe(true)
    expect(fechaEnRango('2026-11-30', semana)).toBe(false)
    expect(fechaEnRango('2030-01-01', { desde: HOY, hasta: null })).toBe(true)
  })
  it('un taller sin fecha solo sale sin filtro', () => {
    expect(fechaEnRango('', null)).toBe(true)
    expect(fechaEnRango('', { desde: HOY, hasta: null })).toBe(false)
  })
})

describe('el orden de la lista', () => {
  const w = (title: string, date: string, time = '') => ({ title, date, time })
  it('los próximos primero, por fecha y hora; luego sin fecha; al final los pasados, el más reciente arriba', () => {
    const lista = ordenarTalleres([
      w('Pasado lejano', '2026-10-01', '09:00 - 10:00'),
      w('Mañana', '2026-11-27', '08:00 - 09:00'),
      w('Sin fecha', ''),
      w('Hoy tarde', HOY, '15:00 - 16:00'),
      w('Ayer', '2026-11-25', '10:00 - 11:00'),
      w('Hoy temprano', HOY, '08:00 - 09:00'),
    ], HOY)
    expect(lista.map(x => x.title)).toEqual(['Hoy temprano', 'Hoy tarde', 'Mañana', 'Sin fecha', 'Ayer', 'Pasado lejano'])
  })
  it('a igual fecha y hora, por título', () => {
    expect(ordenarTalleres([w('B', HOY, '08:00'), w('A', HOY, '08:00')], HOY).map(x => x.title)).toEqual(['A', 'B'])
  })
})

describe('a qué pertenece', () => {
  const suelto = { jornada: null, programa: null }
  const enPrograma = { jornada: null, programa: { id: 3 } }
  const enJornadaDelPrograma = { jornada: { id: 5 }, programa: { id: 3 } }
  const enJornada = { jornada: { id: 6 }, programa: null }
  it('todos, sueltos, una jornada o un programa (también sus jornadas)', () => {
    expect([suelto, enPrograma, enJornadaDelPrograma, enJornada].every(x => perteneceA(x, 'todos'))).toBe(true)
    expect([suelto, enPrograma, enJornadaDelPrograma, enJornada].map(x => perteneceA(x, 'suelto'))).toEqual([true, false, false, false])
    expect([suelto, enPrograma, enJornadaDelPrograma, enJornada].map(x => perteneceA(x, 'j:5'))).toEqual([false, false, true, false])
    expect([suelto, enPrograma, enJornadaDelPrograma, enJornada].map(x => perteneceA(x, 'p:3'))).toEqual([false, true, true, false])
  })
})
