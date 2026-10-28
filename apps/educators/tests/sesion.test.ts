import { describe, expect, it } from 'vitest'
import { comunidadesDe, lugarDeTrabajo, nombreCompleto } from '~/utils/sesion'
import type { Educador } from '~/utils/sesion'

// La ficha de María en el seed local (educador_sesion): una organización con dos comunidades.
const MARIA: Educador = {
  nombre: 'María',
  apellido: 'López',
  correo: 'maria@ejemplo.test',
  idioma: 'es',
  organizaciones: [{ id: 1, nombre: 'Fundación Centro', comunidades: [{ id: 1, nombre: 'Comunidad Centro' }, { id: 2, nombre: 'Comunidad Sur' }] }],
}

describe('ficha del educador', () => {
  it('nombre completo, aunque no tenga apellido', () => {
    expect(nombreCompleto(MARIA)).toBe('María López')
    expect(nombreCompleto({ ...MARIA, apellido: null })).toBe('María')
  })

  it('reúne las comunidades de todas sus organizaciones', () => {
    const dos = { ...MARIA, organizaciones: [...MARIA.organizaciones, { id: 2, nombre: 'Escuela Norte', comunidades: [{ id: 9, nombre: 'Comunidad Norte' }] }] }
    expect(comunidadesDe(dos).map(c => c.id)).toEqual([1, 2, 9])
  })

  it('bajo el nombre: la comunidad, la organización o cuántas comunidades', () => {
    const una = { ...MARIA, organizaciones: [{ ...MARIA.organizaciones[0]!, comunidades: [{ id: 1, nombre: 'Comunidad Centro' }] }] }
    expect(lugarDeTrabajo(una)).toEqual({ nombre: 'Comunidad Centro' })
    expect(lugarDeTrabajo(MARIA)).toEqual({ nombre: 'Fundación Centro' })
    const dos = { ...MARIA, organizaciones: [...MARIA.organizaciones, { id: 2, nombre: 'Escuela Norte', comunidades: [{ id: 9, nombre: 'Comunidad Norte' }] }] }
    expect(lugarDeTrabajo(dos)).toEqual({ comunidades: 3 })
    expect(lugarDeTrabajo({ ...MARIA, organizaciones: [] })).toEqual({ comunidades: 0 })
  })
})
