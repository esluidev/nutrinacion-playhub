import { describe, expect, it } from 'vitest'
import { aniosDeNacimiento, edadDe, edicionDe, faltaEnPerfil, leerPerfiles, nuevoIdDePerfil } from '../app/utils/perfiles'

const hoy = new Date(2026, 10, 27) // 27 de noviembre de 2026

describe('la edad y la edición de un perfil', () => {
  it('cuenta los años cumplidos por el mes', () => {
    expect(edadDe({ mes: 11, anio: 2018 }, hoy)).toBe(8)
    expect(edadDe({ mes: 12, anio: 2018 }, hoy)).toBe(7)
    expect(edadDe({ mes: 1, anio: 2014 }, hoy)).toBe(12)
  })

  it('Infantil hasta los 8, Preadolescencia de 9 a 12 y Adolescencia desde los 13', () => {
    expect(edicionDe(4)).toBe('KIDS')
    expect(edicionDe(8)).toBe('KIDS')
    expect(edicionDe(9)).toBe('PREADOLESCENTES')
    expect(edicionDe(12)).toBe('PREADOLESCENTES')
    expect(edicionDe(13)).toBe('ADOLESCENTES')
  })

  it('ofrece los años de quien tiene de 4 a 17', () => {
    const anios = aniosDeNacimiento(hoy)
    expect(anios[0]).toBe(2022)
    expect(anios.at(-1)).toBe(2009)
    expect(anios).toHaveLength(14)
  })
})

describe('guardar un perfil', () => {
  it('dice qué falta, en orden', () => {
    expect(faltaEnPerfil({ nombre: ' ', avatar: null, mes: null, anio: 2018, genero: null }))
      .toEqual(['nombre', 'avatar', 'nacimiento', 'genero'])
    expect(faltaEnPerfil({ nombre: 'Ana', avatar: 'zorro', mes: 3, anio: 2018, genero: 'nina' })).toEqual([])
    expect(faltaEnPerfil({ nombre: 'Ana', avatar: 'dragon', mes: 13, anio: 2018, genero: 'nina' })).toEqual(['avatar', 'nacimiento'])
  })

  it('un identificador nuevo, sin nada de quién es', () => {
    expect(nuevoIdDePerfil(() => 0.5)).toMatch(/^p-[a-z0-9]+-[a-z0-9]{6}$/)
  })

  it('lee solo los perfiles que se entienden (el género, niña o niño)', () => {
    const texto = JSON.stringify([
      { id: 'p-1', nombre: '  Ana   Sofía ', avatar: 'conejo', mes: 3, anio: 2018, genero: 'nina' },
      { id: 'p-2', nombre: 'Leo', avatar: 'dragon', mes: 3, anio: 2018, genero: 'nino' },
      { id: 'p-3', nombre: 'Rita', avatar: 'rana', mes: 2, anio: 2016, genero: 'x' },
      'basura',
    ])
    expect(leerPerfiles(texto)).toEqual([
      { id: 'p-1', nombre: 'Ana Sofía', avatar: 'conejo', mes: 3, anio: 2018, genero: 'nina' },
    ])
    expect(leerPerfiles('{no es json')).toEqual([])
    expect(leerPerfiles(null)).toEqual([])
  })
})
