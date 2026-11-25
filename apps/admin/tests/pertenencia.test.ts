import { describe, expect, it } from 'vitest'
import { leerPertenencia, opcionesDePertenencia, pertenenciaDe, valorDePertenencia } from '~/utils/pertenencia'

const textos = { suelto: 'Taller suelto', programas: 'Programas', jornadas: 'Jornadas' }
const programas = [
  { id: 1, nombre: 'Crecer sano', fecha_inicio: '2026-03-01', fecha_fin: '2026-06-30' },
  { id: 2, nombre: 'Viejo', fecha_inicio: '2025-01-01', fecha_fin: '2025-06-30' },
]
const jornadas = [
  { id: 7, nombre: 'Semana de la nutrición', ubicacion: 'Escuela Rural 2', fecha_inicio: '2026-03-03', fecha_fin: '2026-03-07' },
  { id: 8, nombre: 'Feria', ubicacion: 'Plaza', fecha_inicio: '2026-02-20', fecha_fin: '2026-02-20' },
]

describe('a qué pertenece un taller', () => {
  it('la jornada manda: su programa es el de ella', () => {
    expect(pertenenciaDe(7, 1)).toEqual({ tipo: 'jornada', id: 7 })
    expect(pertenenciaDe(null, 1)).toEqual({ tipo: 'programa', id: 1 })
    expect(pertenenciaDe(null, null)).toEqual({ tipo: 'suelto' })
  })

  it('va y vuelve del desplegable', () => {
    expect(valorDePertenencia({ tipo: 'jornada', id: 7 })).toBe('j:7')
    expect(leerPertenencia('j:7')).toEqual({ jornadaId: 7, programaId: null })
    expect(leerPertenencia('p:1')).toEqual({ jornadaId: null, programaId: 1 })
    expect(leerPertenencia('suelto')).toEqual({ jornadaId: null, programaId: null })
    expect(leerPertenencia('x:1')).toEqual({ jornadaId: null, programaId: null })
  })

  it('ofrece suelto y, en grupos, los programas y las jornadas que no han terminado, con sus fechas y su lugar', () => {
    const o = opcionesDePertenencia(programas, jornadas, '2026-03-01', { tipo: 'suelto' }, textos, 'es')
    expect(o.map(x => x.value)).toEqual(['suelto', 'p:1', 'j:7'])
    expect(o[1]!.group).toBe('Programas')
    expect(o[2]!.group).toBe('Jornadas')
    expect(o[2]!.label).toContain('Semana de la nutrición · Escuela Rural 2 · ')
  })

  it('el ya elegido sale aunque haya terminado', () => {
    const o = opcionesDePertenencia(programas, jornadas, '2026-03-01', { tipo: 'jornada', id: 8 }, textos, 'es')
    expect(o.map(x => x.value)).toEqual(['suelto', 'p:1', 'j:8', 'j:7'])
  })
})
