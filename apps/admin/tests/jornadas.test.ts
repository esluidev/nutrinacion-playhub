// Reglas puras de las jornadas (utils/jornadas.ts): las que siguen en curso, el lugar efectivo de un
// taller, ampliar una jornada para que quepa un día y las bandas
// de la vista de semana del planificador.
import { describe, expect, it } from 'vitest'
import {
  ampliarJornada, bandasSemana, diasDeJornada, diasParaElegir, filasDeBandas, jornadasDelDia,
  jornadasEnCurso, lugarDelTaller, rangoJornada, sumarDias, talleresPorDia,
} from '~/utils/jornadas'

const SEMANA = { id: 1, nombre: 'Semana de la nutrición', fecha_inicio: '2026-11-09', fecha_fin: '2026-11-13' }   // lunes a viernes
const DIA = { id: 2, nombre: 'Día del corazón', fecha_inicio: '2026-11-11', fecha_fin: '2026-11-11' }
const MES = { id: 3, nombre: 'Mes de la salud', fecha_inicio: '2026-11-01', fecha_fin: '2026-11-30' }

describe('sumarDias, diasDeJornada y rangoJornada', () => {
  it('suma días del calendario sin pasar por UTC', () => {
    expect(sumarDias('2026-11-09', 6)).toBe('2026-11-15')
    expect(sumarDias('2026-11-01', -1)).toBe('2026-10-31')
  })
  it('una jornada de un solo día dura 1', () => {
    expect(diasDeJornada(DIA)).toBe(1)
    expect(diasDeJornada(SEMANA)).toBe(5)
  })
  it('un día se dice una vez; varios, desde y hasta', () => {
    expect(rangoJornada(DIA, 'es')).not.toContain('–')
    expect(rangoJornada(SEMANA, 'es').split(' – ')).toHaveLength(2)
  })
})

describe('jornadasEnCurso', () => {
  it('las que no han terminado: la que termina hoy sigue, la de ayer no', () => {
    expect(jornadasEnCurso([SEMANA, DIA], '2026-11-11').map(j => j.id)).toEqual([1, 2])
    expect(jornadasEnCurso([SEMANA, DIA], '2026-11-12').map(j => j.id)).toEqual([1])
    expect(jornadasEnCurso([SEMANA, DIA], '2026-11-14')).toEqual([])
  })
  it('también las que aún no empiezan, por inicio y, a igual inicio, por nombre', () => {
    const otra = { ...SEMANA, id: 4, nombre: 'Feria escolar' }
    expect(jornadasEnCurso([DIA, SEMANA, MES, otra], '2026-10-20').map(j => j.id)).toEqual([3, 4, 1, 2])
  })
})

describe('lugarDelTaller', () => {
  it('el lugar y su espacio', () => {
    expect(lugarDelTaller('Sede central', 'Aula 3A')).toBe('Sede central · Aula 3A')
  })
  it('sin espacio, solo el lugar', () => {
    expect(lugarDelTaller('Sede central', null)).toBe('Sede central')
    expect(lugarDelTaller('Sede central', '  ')).toBe('Sede central')
  })
  it('sin lugar todavía (un borrador), el espacio o nada', () => {
    expect(lugarDelTaller(null, 'Aula 3A')).toBe('Aula 3A')
    expect(lugarDelTaller(null, null)).toBe('')
  })
})

describe('ampliarJornada', () => {
  it('se alarga hasta un día posterior o desde uno anterior', () => {
    expect(ampliarJornada(SEMANA, '2026-11-16')).toEqual({ fecha_inicio: '2026-11-09', fecha_fin: '2026-11-16' })
    expect(ampliarJornada(SEMANA, '2026-11-06')).toEqual({ fecha_inicio: '2026-11-06', fecha_fin: '2026-11-13' })
  })
  it('si el día ya cabe (o no hay día), se queda como está', () => {
    expect(ampliarJornada(SEMANA, '2026-11-11')).toEqual({ fecha_inicio: '2026-11-09', fecha_fin: '2026-11-13' })
    expect(ampliarJornada(SEMANA, '')).toEqual({ fecha_inicio: '2026-11-09', fecha_fin: '2026-11-13' })
  })
})

describe('diasParaElegir', () => {
  const j = { fecha_inicio: '2026-11-04', fecha_fin: '2026-11-08' }
  it('todos sus días si aún no empieza', () => {
    expect(diasParaElegir(j, '2026-11-01')).toEqual(['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
  })
  it('desde hoy si ya empezó', () => {
    expect(diasParaElegir(j, '2026-11-06')).toEqual(['2026-11-06', '2026-11-07', '2026-11-08'])
  })
  it('un solo día', () => {
    expect(diasParaElegir({ fecha_inicio: '2026-11-04', fecha_fin: '2026-11-04' }, '2026-11-01')).toEqual(['2026-11-04'])
  })
  it('null si son demasiados para elegirlos uno a uno', () => {
    expect(diasParaElegir({ fecha_inicio: '2026-11-01', fecha_fin: '2026-11-30' }, '2026-10-01')).toBeNull()
  })
})

describe('jornadasDelDia', () => {
  it('las que pasan por el día, por inicio', () => {
    expect(jornadasDelDia([SEMANA, MES, DIA], '2026-11-11').map(j => j.id)).toEqual([3, 1, 2])
    expect(jornadasDelDia([SEMANA, DIA], '2026-12-01')).toEqual([])
  })
})

describe('bandasSemana', () => {
  it('una jornada dentro de la semana ocupa sus columnas', () => {
    const [banda] = bandasSemana([SEMANA], '2026-11-09')
    expect(banda).toMatchObject({ desde: 1, hasta: 5, empiezaAntes: false, sigueDespues: false })
  })
  it('un solo día es una banda de una columna', () => {
    expect(bandasSemana([DIA], '2026-11-09')[0]).toMatchObject({ desde: 3, hasta: 3 })
  })
  it('una jornada más larga que la semana se recorta y lo dice', () => {
    const [banda] = bandasSemana([MES], '2026-11-09')
    expect(banda).toMatchObject({ desde: 1, hasta: 7, empiezaAntes: true, sigueDespues: true })
    // La semana en la que termina: hasta el lunes 30
    expect(bandasSemana([MES], '2026-11-30')[0]).toMatchObject({ desde: 1, hasta: 1, empiezaAntes: true, sigueDespues: false })
  })
  it('las que no tocan la semana no salen; el orden es por inicio y, a igual inicio, la más larga', () => {
    expect(bandasSemana([SEMANA, DIA], '2026-11-16')).toEqual([])
    const bandas = bandasSemana([DIA, SEMANA, MES], '2026-11-09')
    expect(bandas.map(b => b.jornada.id)).toEqual([3, 1, 2])
  })
})

describe('las filas de las bandas de la semana', () => {
  it('las que no se cruzan comparten fila; las que se cruzan bajan', () => {
    const filas = filasDeBandas([{ desde: 1, hasta: 3 }, { desde: 2, hasta: 2 }, { desde: 4, hasta: 7 }, { desde: 3, hasta: 5 }])
    expect(filas.map(b => b.fila)).toEqual([1, 2, 1, 2])
  })
})

describe('los días de la ficha de una jornada', () => {
  const w = (id: number, date: string) => ({ id, date })
  it('todos sus días, también los vacíos, con sus talleres en el orden en que llegan', () => {
    const { dias, sinDia } = talleresPorDia(SEMANA, [w(1, '2026-11-11'), w(2, '2026-11-09'), w(3, '2026-11-11')])
    expect(dias.map(d => d.fecha)).toEqual(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'])
    expect(dias.map(d => d.talleres.map(x => x.id))).toEqual([[2], [], [1, 3], [], []])
    expect(sinDia).toEqual([])
  })
  it('sin fecha o fuera de sus días, aparte', () => {
    const { dias, sinDia } = talleresPorDia(DIA, [w(1, ''), w(2, '2026-12-01'), w(3, DIA.fecha_inicio)])
    expect(dias.map(d => d.talleres.map(x => x.id))).toEqual([[3]])
    expect(sinDia.map(x => x.id)).toEqual([1, 2])
  })
  it('más larga que el máximo: solo los días con talleres', () => {
    const { dias } = talleresPorDia(MES, [w(1, '2026-11-20'), w(2, '2026-11-05')])
    expect(dias.map(d => d.fecha)).toEqual(['2026-11-05', '2026-11-20'])
  })
})
