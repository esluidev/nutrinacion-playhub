import { describe, expect, it } from 'vitest'
import { enumerar, faltasDelTaller, primeraIncompleta } from '~/utils/nuevoTaller'
import type { DatosDelTaller } from '~/utils/nuevoTaller'

const completo: DatosDelTaller = {
  titulo: 'El huevo', storyboardId: 1, educadores: 1, fecha: '2026-11-26', hora: '08:00',
  lugarId: 3, enJornada: false, fueraDelPrograma: false, audienciaId: 2,
}

describe('qué falta para publicar un taller nuevo', () => {
  it('completo, no falta nada', () => {
    const f = faltasDelTaller(completo)
    expect(Object.values(f).flat()).toEqual([])
    expect(primeraIncompleta(f)).toBeNull()
  })

  it('cada sección dice lo suyo, en el orden en que se ve', () => {
    const f = faltasDelTaller({ ...completo, educadores: 0, hora: '', audienciaId: null })
    expect(f.educadores).toEqual(['educadores'])
    expect(f.cuando).toEqual(['hora'])
    expect(f.audiencia).toEqual(['audiencia'])
    expect(primeraIncompleta(f)).toBe('educadores')
  })

  it('dentro de una jornada el lugar es el suyo; fuera, hay que elegirlo', () => {
    expect(faltasDelTaller({ ...completo, lugarId: null }).cuando).toEqual(['lugar'])
    expect(faltasDelTaller({ ...completo, lugarId: null, enJornada: true }).cuando).toEqual([])
  })

  it('una fecha fuera del programa no deja publicar', () => {
    expect(faltasDelTaller({ ...completo, fueraDelPrograma: true }).cuando).toEqual(['fueraDelPrograma'])
  })

  it('nada escrito: todo falta y la primera es el nombre', () => {
    const f = faltasDelTaller({ titulo: ' ', storyboardId: null, educadores: 0, fecha: '', hora: '', lugarId: null, enJornada: false, fueraDelPrograma: false, audienciaId: null })
    expect(f.cuando).toEqual(['dia', 'hora', 'lugar'])
    expect(primeraIncompleta(f)).toBe('nombre')
  })

  it('lo que falta se dice en una frase', () => {
    expect(enumerar(['el día'], 'y')).toBe('el día')
    expect(enumerar(['el día', 'la hora'], 'y')).toBe('el día y la hora')
    expect(enumerar(['el día', 'la hora', 'el lugar'], 'and')).toBe('el día, la hora and el lugar')
  })
})
