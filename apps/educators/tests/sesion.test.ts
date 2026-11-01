import { describe, expect, it } from 'vitest'
import { lugarDeTrabajo, nombreCompleto } from '~/utils/sesion'
import type { Educador } from '~/utils/sesion'

// La ficha de María en el seed local (educador_sesion): una organización.
const MARIA: Educador = {
  nombre: 'María',
  apellido: 'López',
  correo: 'maria@ejemplo.test',
  idioma: 'es',
  organizaciones: [{ id: 1, nombre: 'Fundación Centro' }],
}

describe('ficha del educador', () => {
  it('nombre completo, aunque no tenga apellido', () => {
    expect(nombreCompleto(MARIA)).toBe('María López')
    expect(nombreCompleto({ ...MARIA, apellido: null })).toBe('María')
  })

  it('bajo el nombre: la organización o, si son varias, cuántas', () => {
    expect(lugarDeTrabajo(MARIA)).toEqual({ nombre: 'Fundación Centro' })
    const dos = { ...MARIA, organizaciones: [...MARIA.organizaciones, { id: 2, nombre: 'Escuela Norte' }] }
    expect(lugarDeTrabajo(dos)).toEqual({ organizaciones: 2 })
    expect(lugarDeTrabajo({ ...MARIA, organizaciones: [] })).toEqual({ organizaciones: 0 })
  })
})
