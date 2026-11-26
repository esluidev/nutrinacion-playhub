import { describe, expect, it } from 'vitest'
import { parseRunnerCommand, parseRunnerEvent, RUNNER_CHANNEL, runnerMessage, runnerOrigins, runnerUrl } from '@playhub/ui/app/utils/runner-contract'

// El contrato entre el runner y las apps que lo incrustan (docs/runner.md).

describe('mensajes del runner a la app', () => {
  it('van con canal y versión, y se leen igual', () => {
    const message = runnerMessage({ tipo: 'listo', storyboard: 'alimentacion/el-huevo', modo: 'educator', idioma: 'es', escenas: 4 })
    expect(message).toMatchObject({ canal: RUNNER_CHANNEL, v: 1 })
    expect(parseRunnerEvent(message)).toEqual({ tipo: 'listo', storyboard: 'alimentacion/el-huevo', modo: 'educator', idioma: 'es', escenas: 4 })
    expect(parseRunnerEvent(runnerMessage({ tipo: 'escena', indice: 2, carpeta: 'origen' }))).toEqual({ tipo: 'escena', indice: 2, carpeta: 'origen' })
    expect(parseRunnerEvent(runnerMessage({ tipo: 'terminado' }))).toEqual({ tipo: 'terminado' })
    expect(parseRunnerEvent(runnerMessage({ tipo: 'salir', indice: 0, carpeta: 'bienvenida' }))).toEqual({ tipo: 'salir', indice: 0, carpeta: 'bienvenida' })
  })

  it('ignora lo que no es del canal o no tiene la forma esperada', () => {
    expect(parseRunnerEvent(null)).toBeNull()
    expect(parseRunnerEvent('terminado')).toBeNull()
    expect(parseRunnerEvent({ tipo: 'terminado' })).toBeNull()
    expect(parseRunnerEvent({ canal: 'otro', v: 1, tipo: 'terminado' })).toBeNull()
    expect(parseRunnerEvent({ canal: RUNNER_CHANNEL, tipo: 'terminado' })).toBeNull()
    expect(parseRunnerEvent({ canal: RUNNER_CHANNEL, v: 1, tipo: 'escena', indice: -1, carpeta: 'x' })).toBeNull()
    expect(parseRunnerEvent({ canal: RUNNER_CHANNEL, v: 1, tipo: 'listo', storyboard: 'a/b', modo: 'admin', idioma: 'es', escenas: 1 })).toBeNull()
    expect(parseRunnerEvent({ canal: RUNNER_CHANNEL, v: 1, tipo: 'listo', storyboard: 'a/b', modo: 'preview', idioma: 'es', escenas: 1 })).toMatchObject({ modo: 'preview' })
    expect(parseRunnerEvent({ canal: RUNNER_CHANNEL, v: 1, tipo: 'error', codigo: 'otro' })).toBeNull()
  })

  it('acepta una versión más nueva con campos de más y descarta un tipo desconocido', () => {
    expect(parseRunnerEvent({ canal: RUNNER_CHANNEL, v: 2, tipo: 'terminado', duracion: 1800 })).toEqual({ tipo: 'terminado' })
    expect(parseRunnerEvent({ canal: RUNNER_CHANNEL, v: 2, tipo: 'nuevo' })).toBeNull()
  })
})

describe('órdenes de la app al runner', () => {
  it('la vista previa conduce: ir a una escena por número o por carpeta, y reiniciar', () => {
    expect(parseRunnerCommand(runnerMessage({ tipo: 'ir', indice: 2 }))).toEqual({ tipo: 'ir', indice: 2 })
    expect(parseRunnerCommand(runnerMessage({ tipo: 'ir', escena: 'origen' }))).toEqual({ tipo: 'ir', escena: 'origen' })
    // La conexión del taller (tarea 013): un código del alfabeto y una llave hexadecimal; lo demás se ignora.
    const llave = 'a'.repeat(48)
    expect(parseRunnerCommand(runnerMessage({ tipo: 'conexion', codigo: 'K7M2QX', llave }))).toEqual({ tipo: 'conexion', codigo: 'K7M2QX', llave })
    expect(parseRunnerCommand({ canal: RUNNER_CHANNEL, v: 1, tipo: 'conexion', codigo: 'k7m2qx', llave })).toBeNull()
    expect(parseRunnerCommand({ canal: RUNNER_CHANNEL, v: 1, tipo: 'conexion', codigo: 'K7M2QX', llave: '<script>' })).toBeNull()
    expect(parseRunnerCommand(runnerMessage({ tipo: 'reiniciar' }))).toEqual({ tipo: 'reiniciar' })
    expect(parseRunnerCommand({ canal: RUNNER_CHANNEL, v: 1, tipo: 'ir', indice: -1 })).toBeNull()
    expect(parseRunnerCommand({ canal: RUNNER_CHANNEL, v: 1, tipo: 'ir' })).toBeNull()
  })

  it('iniciar con o sin guía', () => {
    expect(parseRunnerCommand(runnerMessage({ tipo: 'iniciar' }))).toEqual({ tipo: 'iniciar' })
    const guia = { bienvenida: { verb: 'Situar', objective: 'Que el grupo espere el recorrido.' } }
    expect(parseRunnerCommand(runnerMessage({ tipo: 'iniciar', guia }))).toEqual({ tipo: 'iniciar', guia })
  })

  it('de la guía solo pasan los campos de texto conocidos', () => {
    const command = parseRunnerCommand({
      canal: RUNNER_CHANNEL,
      v: 1,
      tipo: 'iniciar',
      guia: { bienvenida: { verb: 'Situar', html: '<img src=x>', tips: 42 }, origen: 'texto suelto' },
    })
    expect(command).toEqual({ tipo: 'iniciar', guia: { bienvenida: { verb: 'Situar' } } })
  })

  it('rechaza una guía que no es un objeto', () => {
    expect(parseRunnerCommand({ canal: RUNNER_CHANNEL, v: 1, tipo: 'iniciar', guia: [] })).toBeNull()
    expect(parseRunnerCommand({ canal: RUNNER_CHANNEL, v: 1, tipo: 'cerrar' })).toBeNull()
  })
})

describe('orígenes permitidos', () => {
  it('lee una lista separada por comas o espacios y se queda con el origen', () => {
    expect(runnerOrigins('https://educator.nutrinacion.com, https://admin.nutrinacion.com/ruta  http://localhost:3002'))
      .toEqual(['https://educator.nutrinacion.com', 'https://admin.nutrinacion.com', 'http://localhost:3002'])
  })

  it('descarta lo que no es http(s) y los repetidos', () => {
    expect(runnerOrigins('javascript:alert(1),*,https://educator.nutrinacion.com,https://educator.nutrinacion.com/')).toEqual(['https://educator.nutrinacion.com'])
    expect(runnerOrigins(undefined)).toEqual([])
  })
})

describe('URL del runner', () => {
  it('lleva el storyboard por su clave, el modo, el idioma y la escena', () => {
    expect(runnerUrl('https://player.nutrinacion.com/', { clave: '6f375f8d-0467-4dd2-958a-91d6d6d1c060', modo: 'educator', idioma: 'es', escena: 'origen' }))
      .toBe('https://player.nutrinacion.com/play/6f375f8d-0467-4dd2-958a-91d6d6d1c060?mode=educator&lang=es&escena=origen')
    expect(runnerUrl('http://localhost:3001', { clave: '6f375f8d-0467-4dd2-958a-91d6d6d1c060', modo: 'home' }))
      .toBe('http://localhost:3001/play/6f375f8d-0467-4dd2-958a-91d6d6d1c060?mode=home')
  })

  it('el ensayo del educador es un modo, como el dispositivo: ?mode=rehearsal', () => {
    expect(runnerUrl('http://localhost:3001', { clave: '6f375f8d-0467-4dd2-958a-91d6d6d1c060', modo: 'rehearsal', idioma: 'es' }))
      .toBe('http://localhost:3001/play/6f375f8d-0467-4dd2-958a-91d6d6d1c060?mode=rehearsal&lang=es')
    expect(parseRunnerEvent(runnerMessage({ tipo: 'listo', storyboard: '6f375f8d-0467-4dd2-958a-91d6d6d1c060', modo: 'rehearsal', idioma: 'es', escenas: 9 })))
      .toMatchObject({ tipo: 'listo', modo: 'rehearsal' })
  })
})
