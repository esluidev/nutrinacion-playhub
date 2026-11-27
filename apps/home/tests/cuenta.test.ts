import { describe, expect, it } from 'vitest'
import { combinar, paraLaCuenta, porGuardar, sinEstos } from '../app/utils/cuenta'
import type { DatosDelDispositivo, PerfilDeCuenta } from '../app/utils/cuenta'
import type { Perfil } from '../app/utils/perfiles'

const antes = '2026-11-27T10:00:00.000Z'
const despues = '2026-11-27T12:00:00.000Z'

const perfil = (id: string, nombre: string, actualizado = antes): Perfil =>
  ({ id, nombre, avatar: 'zorro', mes: 3, anio: 2018, genero: 'nino', actualizado })

const deCuenta = (id: string, nombre: string, actualizado = antes, extra: Partial<PerfilDeCuenta> = {}): PerfilDeCuenta =>
  ({ id, nombre, avatar: 'zorro', mes: 3, anio: 2018, genero: 'nino', terminados: [], avance: null, actualizado, eliminado: false, ...extra })

const eliminado = (id: string, actualizado = despues): PerfilDeCuenta =>
  ({ id, nombre: null, avatar: null, mes: null, anio: null, genero: null, terminados: [], avance: null, actualizado, eliminado: true })

const dispositivo = (perfiles: Perfil[], extra: Partial<DatosDelDispositivo> = {}): DatosDelDispositivo =>
  ({ perfiles, terminados: {}, avances: {}, eliminados: {}, ...extra })

describe('lo que sube a la cuenta', () => {
  it('cada perfil con lo que terminó y dónde iba; un eliminado, sin sus datos', () => {
    const datos = dispositivo([perfil('p-leo', 'Leo')], {
      terminados: { 'p-leo': ['GT-HUEVO'] },
      avances: { 'p-leo': { clave: 'GT-LECHE', indice: 2, escenas: 6 } },
      eliminados: { 'p-ana': despues },
    })
    expect(paraLaCuenta(datos)).toEqual([
      deCuenta('p-leo', 'Leo', antes, { terminados: ['GT-HUEVO'], avance: { clave: 'GT-LECHE', indice: 2, escenas: 6 } }),
      eliminado('p-ana'),
    ])
  })

  it('un perfil de antes de la cuenta, sin fecha, cuenta como el más viejo', () => {
    const { actualizado: _, ...sinFecha } = perfil('p-leo', 'Leo')
    expect(paraLaCuenta(dispositivo([sinFecha]))[0]!.actualizado).toBe(new Date(0).toISOString())
  })
})

describe('combinar el dispositivo con la cuenta', () => {
  it('la primera vez, todo lo del dispositivo sube', () => {
    const { datos, subir } = combinar(dispositivo([perfil('p-leo', 'Leo'), perfil('p-ana', 'Ana')]), [])
    expect(subir.map(p => p.id)).toEqual(['p-leo', 'p-ana'])
    expect(datos.perfiles.map(p => p.nombre)).toEqual(['Leo', 'Ana'])
  })

  it('en otro dispositivo, bajan los de la cuenta con lo suyo', () => {
    const { datos, subir } = combinar(dispositivo([]), [deCuenta('p-leo', 'Leo', antes, { terminados: ['GT-HUEVO'] })])
    expect(subir).toEqual([])
    expect(datos.perfiles).toEqual([perfil('p-leo', 'Leo')])
    expect(datos.terminados).toEqual({ 'p-leo': ['GT-HUEVO'] })
  })

  it('de cada perfil gana el cambio más nuevo; en un empate, el de la cuenta', () => {
    const local = dispositivo([perfil('p-leo', 'Leíto', despues), perfil('p-ana', 'Anita', antes), perfil('p-sol', 'Sol', antes)])
    const cuenta = [deCuenta('p-leo', 'Leo', antes), deCuenta('p-ana', 'Ana', despues), deCuenta('p-sol', 'Solecito', antes)]
    const { datos, subir } = combinar(local, cuenta)
    expect(datos.perfiles.map(p => p.nombre)).toEqual(['Leíto', 'Ana', 'Solecito'])
    expect(subir.map(p => p.id)).toEqual(['p-leo'])
  })

  it('el orden es el del dispositivo y, después, los que llegan de la cuenta', () => {
    const { datos } = combinar(dispositivo([perfil('p-ana', 'Ana')]), [deCuenta('p-leo', 'Leo'), deCuenta('p-ana', 'Ana')])
    expect(datos.perfiles.map(p => p.id)).toEqual(['p-ana', 'p-leo'])
  })

  it('uno eliminado en otro dispositivo se quita de este', () => {
    const { datos, subir } = combinar(dispositivo([perfil('p-leo', 'Leo'), perfil('p-ana', 'Ana')]), [deCuenta('p-leo', 'Leo'), eliminado('p-ana')])
    expect(datos.perfiles.map(p => p.id)).toEqual(['p-leo'])
    expect(subir).toEqual([])
  })

  it('uno eliminado aquí se sube y se recuerda hasta que la cuenta lo tenga', () => {
    const local = dispositivo([perfil('p-leo', 'Leo')], { eliminados: { 'p-ana': despues } })
    const primero = combinar(local, [deCuenta('p-leo', 'Leo'), deCuenta('p-ana', 'Ana')])
    expect(primero.subir).toEqual([eliminado('p-ana')])
    expect(primero.datos.perfiles.map(p => p.id)).toEqual(['p-leo'])
    expect(primero.datos.eliminados).toEqual({ 'p-ana': despues })

    const despuesDeSubir = combinar(primero.datos, [deCuenta('p-leo', 'Leo'), eliminado('p-ana')])
    expect(despuesDeSubir.subir).toEqual([])
    expect(despuesDeSubir.datos.eliminados).toEqual({})
  })

  it('uno eliminado aquí que la cuenta nunca tuvo no se sube', () => {
    const { datos, subir } = combinar(dispositivo([], { eliminados: { 'p-viejo': despues } }), [])
    expect(subir).toEqual([])
    expect(datos.eliminados).toEqual({})
  })

  it('lo que no se entiende de la cuenta se ignora', () => {
    const { datos } = combinar(dispositivo([]), [deCuenta('p-raro', 'Raro', antes, { avatar: 'dragon' })])
    expect(datos.perfiles).toEqual([])
  })
})

describe('al entrar en un dispositivo que ya tenía perfiles', () => {
  it('pregunta por los que la cuenta no conoce', () => {
    const aqui = dispositivo([perfil('p-leo', 'Leo'), perfil('p-sol', 'Sol')])
    expect(porGuardar(aqui, [deCuenta('p-leo', 'Leo'), deCuenta('p-ana', 'Ana')]).map(p => p.id)).toEqual(['p-sol'])
  })

  it('si la cuenta no tiene ninguno, no pregunta: suben todos', () => {
    expect(porGuardar(dispositivo([perfil('p-leo', 'Leo')]), [])).toEqual([])
    expect(porGuardar(dispositivo([perfil('p-leo', 'Leo')]), [eliminado('p-ana')])).toEqual([])
  })

  it('quitarlos del dispositivo se lleva también lo suyo', () => {
    const aqui = dispositivo([perfil('p-leo', 'Leo'), perfil('p-sol', 'Sol')], { terminados: { 'p-sol': ['GT-HUEVO'] } })
    const sin = sinEstos(aqui, ['p-sol'])
    expect(sin.perfiles.map(p => p.id)).toEqual(['p-leo'])
    expect(sin.terminados).toEqual({})
  })
})
