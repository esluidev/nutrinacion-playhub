// Reglas puras de las jornadas (utils/jornadas.ts): las que siguen en curso, el lugar efectivo de un
// taller, ampliar una jornada para que quepa un día, el agrupado de la lista de talleres y las bandas
// de la vista de semana del planificador.
import { describe, expect, it } from 'vitest'
import {
  agruparPorJornada, ampliarJornada, bandasSemana, diasDeJornada, diasParaElegir, jornadasDelDia, jornadasEnCurso,
  lugarDelTaller, rangoJornada, sumarDias,
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
  const SEDE = { ubicacion: 'Sede central' }
  it('dentro de una jornada, su lugar y el detalle del taller', () => {
    expect(lugarDelTaller({ ubicacion: 'Aula 3A' }, SEDE)).toBe('Sede central · Aula 3A')
  })
  it('sin detalle, solo el lugar de la jornada', () => {
    expect(lugarDelTaller({ ubicacion: null }, SEDE)).toBe('Sede central')
    expect(lugarDelTaller({ ubicacion: '  ' }, SEDE)).toBe('Sede central')
  })
  it('suelto, su propio lugar (o nada)', () => {
    expect(lugarDelTaller({ ubicacion: 'Escuela Norte' }, null)).toBe('Escuela Norte')
    expect(lugarDelTaller({ ubicacion: null }, null)).toBe('')
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

describe('agruparPorJornada', () => {
  const w = (id: number, jornada: typeof SEMANA | null) => ({ id, jornada })
  it('un grupo por jornada en el orden de sus fechas y los sueltos al final', () => {
    const grupos = agruparPorJornada([w(1, null), w(2, SEMANA), w(3, DIA), w(4, SEMANA), w(5, MES)])
    expect(grupos.map(g => g.jornada?.id ?? null)).toEqual([3, 1, 2, null])
    expect(grupos[1]!.workshops.map(x => x.id)).toEqual([2, 4])
    expect(grupos[3]!.workshops.map(x => x.id)).toEqual([1])
  })
  it('sin sueltos no hay grupo vacío al final; sin jornadas, un solo grupo suelto', () => {
    expect(agruparPorJornada([w(1, DIA)]).map(g => g.jornada?.id ?? null)).toEqual([2])
    expect(agruparPorJornada([w(1, null), w(2, null)]).map(g => g.jornada)).toEqual([null])
    expect(agruparPorJornada([])).toEqual([])
  })
})
