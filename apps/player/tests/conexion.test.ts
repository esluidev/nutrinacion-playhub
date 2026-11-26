import { describe, expect, it } from 'vitest'
import { limpiarApodo, nombreVisible, nombresSinRepetir, tonoDe } from '../app/runner/avatares'
import { leerMensaje } from '../app/runner/conexion/mensajes'
import { codigoAlEscribir, codigoLegible, codigoValido, dispositivoNuevo, estanAhora, guardarParticipante, normalizarCodigo, olvidarParticipante, origenParaUnirse, participanteGuardado } from '../app/runner/conexion/participante'

describe('avatares', () => {
  it('sin apodo, se le llama por el nombre del avatar', () => {
    expect(nombreVisible(null, 'oso')).toBe('Bruno')
    expect(nombreVisible('  ', 'rana')).toBe('Rita')
    expect(nombreVisible('Pedrito', 'oso')).toBe('Pedrito')
  })
  it('el apodo se limpia y se corta a 20 letras', () => {
    expect(limpiarApodo('  Pe   dro  ')).toBe('Pe dro')
    expect(limpiarApodo('Pedritoelgrandeyfuerte')).toBe('Pedritoelgrandeyfuer')
    expect(limpiarApodo('')).toBeNull()
  })
  it('dos con el mismo nombre: el segundo lleva un número, en el orden en que llegaron', () => {
    const n = nombresSinRepetir([{ id: 'a', nombre: 'Bruno' }, { id: 'b', nombre: 'Rita' }, { id: 'c', nombre: 'bruno' }, { id: 'd', nombre: 'Bruno' }])
    expect([...n.values()]).toEqual(['Bruno', 'Rita', 'bruno 2', 'Bruno 3'])
  })
  it('cada avatar con su tono', () => {
    expect(tonoDe('gato')).toBe('rose')
    expect(tonoDe('desconocido')).toBe('sky')
  })
})

describe('código para unirse', () => {
  it('se escribe como sea y se lee en su forma', () => {
    expect(normalizarCodigo('k7m 2qx')).toBe('K7M2QX')
    expect(normalizarCodigo('K7M·2QX')).toBe('K7M2QX')
    expect(codigoLegible('K7M2QX')).toBe('K7M-2QX')
    expect(normalizarCodigo('k7m-2qx')).toBe('K7M2QX')
  })
  it('el QR lleva la dirección de Player de la base, que el teléfono puede abrir', () => {
    const local = { protocol: 'http:', hostname: 'localhost', origin: 'http://localhost:3001' }
    // En desarrollo, localhost pasa a ser este equipo en el Wi‑Fi.
    expect(origenParaUnirse('http://localhost:3001', local, '192.168.1.20')).toBe('http://192.168.1.20:3001')
    expect(origenParaUnirse('http://localhost:3001/', local, '')).toBe('http://localhost:3001')
    // En producción, la de la base aunque la página se haya abierto con otro nombre.
    const publica = { protocol: 'https:', hostname: 'player-123.proveedor.app', origin: 'https://player-123.proveedor.app' }
    expect(origenParaUnirse('https://player.nutrinacion.com', publica, '')).toBe('https://player.nutrinacion.com')
    // Sin leerla todavía, la de la página.
    expect(origenParaUnirse(null, publica, '192.168.1.20')).toBe('https://player-123.proveedor.app')
    // Compartida por Tailscale, el nombre de este equipo.
    const tailnet = { protocol: 'https:', hostname: 'mac.tail.ts.net', origin: 'https://mac.tail.ts.net:8443' }
    expect(origenParaUnirse('http://localhost:3001', tailnet, '192.168.1.20')).toBe('https://mac.tail.ts.net:8443')
  })
  it('solo vale con el alfabeto sin letras que se confunden', () => {
    expect(codigoValido('K7M2QX')).toBe(true)
    expect(codigoValido('K7M2Q')).toBe(false)
    expect(codigoValido('O0I1LX')).toBe(false)
  })
})

describe('el código mientras se escribe', () => {
  it('en mayúsculas, sin lo que no es letra o número, con el guion tras los tres primeros y no más de seis', () => {
    expect(codigoAlEscribir('k7')).toBe('K7')
    expect(codigoAlEscribir('k7m')).toBe('K7M')
    expect(codigoAlEscribir('k7m2')).toBe('K7M-2')
    expect(codigoAlEscribir('K7M 2QX')).toBe('K7M-2QX')
    expect(codigoAlEscribir('K7M-2QXZ')).toBe('K7M-2QX')
    // Al borrar el guion con lo que sigue, vuelve a los tres primeros
    expect(codigoAlEscribir('K7M-')).toBe('K7M')
  })
})

describe('el identificador del dispositivo', () => {
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

  it('en la red local (http, sin randomUUID) también es un UUID v4, y cada vez otro', () => {
    const sinRandomUUID = { getRandomValues: crypto.getRandomValues.bind(crypto) } as Pick<Crypto, 'getRandomValues'>
    const a = dispositivoNuevo(sinRandomUUID)
    expect(a).toMatch(UUID_V4)
    expect(dispositivoNuevo(sinRandomUUID)).not.toBe(a)
  })

  it('en una página segura usa randomUUID', () => {
    expect(dispositivoNuevo()).toMatch(UUID_V4)
  })
})

describe('quiénes están ahora (para numerar los nombres)', () => {
  const p = (dispositivo: string, estado: string, conectado = false) => ({ dispositivo, estado, conectado })
  it('los que esperan y los aprobados conectados; no los quitados, rechazados ni los que se fueron', () => {
    const lista = [p('a', 'quitado'), p('b', 'aprobado'), p('c', 'rechazado'), p('d', 'aprobado', true), p('e', 'esperando'), p('f', 'aprobado')]
    expect(estanAhora(lista, new Set(['f'])).map(x => x.dispositivo)).toEqual(['d', 'e', 'f'])
  })
})

describe('el participante que recuerda el dispositivo', () => {
  const almacen = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
  }
  it('por código: en otro taller es otro', () => {
    const a = almacen()
    guardarParticipante('K7M2QX', { dispositivo: 'd1', avatar: 'oso', apodo: 'Pedrito' }, a)
    expect(participanteGuardado('K7M2QX', a)).toEqual({ dispositivo: 'd1', avatar: 'oso', apodo: 'Pedrito' })
    expect(participanteGuardado('ABCDEF', a)).toBeNull()
  })
  it('al salir lo olvida: si vuelve, empieza de cero', () => {
    const a = almacen()
    guardarParticipante('K7M2QX', { dispositivo: 'd1', avatar: 'oso', apodo: 'Pedrito' }, a)
    guardarParticipante('ABCDEF', { dispositivo: 'd2', avatar: 'gato', apodo: null }, a)
    olvidarParticipante('K7M2QX', a)
    expect(participanteGuardado('K7M2QX', a)).toBeNull()
    expect(participanteGuardado('ABCDEF', a)).not.toBeNull()
  })
  it('lo dañado no cuenta', () => {
    const a = almacen()
    a.setItem('playhub-participante-K7M2QX', '{"dispositivo":"d1","avatar":"perro"}')
    expect(participanteGuardado('K7M2QX', a)).toBeNull()
    a.setItem('playhub-participante-K7M2QX', 'no es json')
    expect(participanteGuardado('K7M2QX', a)).toBeNull()
  })
})

describe('mensajes de la sesión', () => {
  it('lee los que tienen la forma esperada', () => {
    expect(leerMensaje({ tipo: 'estado', escena: 'origen', pausa: false, reinicios: { origen: 2, malo: -1 } }))
      .toEqual({ tipo: 'estado', escena: 'origen', pausa: false, reinicios: { origen: 2 } })
    // La pausa solo de los dispositivos: si viene y es sí; cualquier otra cosa no pausa.
    expect(leerMensaje({ tipo: 'estado', escena: 'origen', pausa: false, pausaDispositivos: true, reinicios: {} }))
      .toEqual({ tipo: 'estado', escena: 'origen', pausa: false, pausaDispositivos: true, reinicios: {} })
    expect(leerMensaje({ tipo: 'estado', escena: 'origen', pausa: false, pausaDispositivos: 'sí', reinicios: {} }))
      .toEqual({ tipo: 'estado', escena: 'origen', pausa: false, reinicios: {} })
    expect(leerMensaje({ tipo: 'aprobado', ids: ['d1', 'd2'] })).toEqual({ tipo: 'aprobado', ids: ['d1', 'd2'] })
    expect(leerMensaje({ tipo: 'presencia', id: 'd1', nombre: 'Bruno', tono: 'sky', avatar: 'oso', escena: null, pausado: false }))
      .toMatchObject({ tipo: 'presencia', id: 'd1', avatar: 'oso' })
  })
  it('ignora lo que no: lo puede mandar cualquiera que tenga el código', () => {
    expect(leerMensaje(null)).toBeNull()
    expect(leerMensaje({ tipo: 'otro' })).toBeNull()
    expect(leerMensaje({ tipo: 'orden', id: 'd1', accion: 'borrar' })).toBeNull()
    expect(leerMensaje({ tipo: 'presencia', id: 'd1', nombre: 'x'.repeat(41), tono: 'sky', escena: null, pausado: false })).toBeNull()
    expect(leerMensaje({ tipo: 'presencia', id: 'd1', nombre: 'Bruno', tono: 'coral', escena: null, pausado: false })).toBeNull()
    expect(leerMensaje({ tipo: 'aprobado', ids: ['<script>'] })).toBeNull()
  })
  it('un avatar que no existe se descarta, no el mensaje', () => {
    expect(leerMensaje({ tipo: 'presencia', id: 'd1', nombre: 'Bruno', tono: 'sky', avatar: 'perro', escena: 'origen', pausado: true }))
      .toMatchObject({ avatar: undefined, escena: 'origen' })
  })
})
