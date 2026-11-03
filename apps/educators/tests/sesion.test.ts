import { describe, expect, it } from 'vitest'
import { nombreCompleto } from '~/utils/sesion'
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
})
