import { describe, expect, it } from 'vitest'
import { esRutaPublica } from '~/utils/rutasPublicas'

// El runner tiene que abrir dentro del webview de la app de educadores, que NO tiene sesión
// de Studio. Si alguien protege /play/**, el juego deja de funcionar fuera de Studio y no se
// nota hasta que un educador abre un taller en el aula. Por eso está fijado con tests.

describe('esRutaPublica — el runner nunca queda detrás del login', () => {
  it('deja pasar la ruta del runner', () => {
    expect(esRutaPublica('/play/alimentacion/los-frijoles')).toBe(true)
  })

  it('deja pasar el runner con querystring de idioma y escena inicial', () => {
    expect(esRutaPublica('/play/actividad-fisica/buena-postura?lang=en&start=3')).toBe(true)
  })

  it('deja pasar cualquier tipo y slug', () => {
    for (const tipo of ['alimentacion', 'actividad-fisica', 'cuidado-personal', 'salud-emocional']) {
      expect(esRutaPublica(`/play/${tipo}/lo-que-sea`)).toBe(true)
    }
  })

  it('deja pasar el login', () => {
    expect(esRutaPublica('/login')).toBe(true)
  })
})

describe('esRutaPublica — la gestión sigue protegida', () => {
  it('exige sesión en las pantallas de gestión', () => {
    for (const ruta of [
      '/',
      '/storyboards',
      '/storyboards/alimentacion/los-frijoles',
      '/storyboards/alimentacion/los-frijoles/edit',
      '/storyboards/alimentacion/los-frijoles/scenes/bienvenida',
      '/primitives',
      '/sprites',
    ]) {
      expect(esRutaPublica(ruta)).toBe(false)
    }
  })

  it('no se cuela algo que solo PAREZCA el runner', () => {
    // El prefijo tiene barra final a propósito: `/players` no es el runner.
    expect(esRutaPublica('/players')).toBe(false)
    expect(esRutaPublica('/play')).toBe(false)
    expect(esRutaPublica('/storyboards/play/x')).toBe(false)
  })
})
