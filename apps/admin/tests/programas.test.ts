import { describe, expect, it } from 'vitest'
import { diaDeSemana, fechasDeSerie, fueraDelPrograma, mesInicial, mesesDelPrograma, rangoDelMes } from '../app/utils/programas'

// El lunes 7 de septiembre de 2026.
const LUNES = '2026-09-07'

describe('diaDeSemana', () => {
  it('lunes es 1 y domingo es 7', () => {
    expect(diaDeSemana(LUNES)).toBe(1)
    expect(diaDeSemana('2026-09-13')).toBe(7)
  })
})

describe('fechasDeSerie', () => {
  it('desde un lunes, los martes: el primero al día siguiente y uno por semana', () => {
    expect(fechasDeSerie(LUNES, 2, 3)).toEqual(['2026-09-08', '2026-09-15', '2026-09-22'])
  })
  it('si el primer día ya es el pedido, empieza ese mismo día', () => {
    expect(fechasDeSerie(LUNES, 1, 2)).toEqual(['2026-09-07', '2026-09-14'])
  })
  it('si el día ya pasó esa semana, empieza la siguiente', () => {
    expect(fechasDeSerie('2026-09-10', 2, 1)).toEqual(['2026-09-15'])
  })
  it('cruza meses y años', () => {
    expect(fechasDeSerie('2026-12-28', 4, 2)).toEqual(['2026-12-31', '2027-01-07'])
  })
  it('sin fecha o sin sesiones, nada', () => {
    expect(fechasDeSerie('', 2, 3)).toEqual([])
    expect(fechasDeSerie(LUNES, 2, 0)).toEqual([])
  })
})

describe('fueraDelPrograma', () => {
  it('las fechas que no caen en sus días', () => {
    const p = { fecha_inicio: '2026-09-01', fecha_fin: '2026-09-20' }
    expect(fueraDelPrograma(['2026-09-08', '2026-09-15', '2026-09-22'], p)).toEqual(['2026-09-22'])
  })
})

describe('los meses de la ficha del programa', () => {
  const programa = { fecha_inicio: '2026-09-15', fecha_fin: '2027-01-20' }
  it('del primero al último, también cruzando el año', () => {
    expect(mesesDelPrograma(programa)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'])
    expect(mesesDelPrograma({ fecha_inicio: '2026-11-02', fecha_fin: '2026-11-27' })).toEqual(['2026-11'])
  })
  it('abre en el mes de hoy; antes de empezar, en el primero; terminado, en el último', () => {
    const meses = mesesDelPrograma(programa)
    expect(mesInicial(meses, '2026-11-25')).toBe('2026-11')
    expect(mesInicial(meses, '2026-06-01')).toBe('2026-09')
    expect(mesInicial(meses, '2027-03-01')).toBe('2027-01')
  })
  it('los días de un mes', () => {
    expect(rangoDelMes('2026-11')).toEqual({ fecha_inicio: '2026-11-01', fecha_fin: '2026-11-30' })
    expect(rangoDelMes('2028-02')).toEqual({ fecha_inicio: '2028-02-01', fecha_fin: '2028-02-29' })
  })
})
