// Compartir las apps por Tailscale: las URLs a localhost pasan a ser el equipo con que se abrió.
import { describe, expect, it } from 'vitest'
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'

const TS = 'macbook-pro-de-luis.tail1ce4ee.ts.net'

describe('urlEnEsteEquipo', () => {
  it('abierta en localhost, no cambia nada', () => {
    expect(urlEnEsteEquipo('http://127.0.0.1:54321', 'localhost')).toBe('http://127.0.0.1:54321')
  })
  it('abierta por Tailscale, localhost pasa a ser este equipo (mismo puerto)', () => {
    expect(urlEnEsteEquipo('http://127.0.0.1:54321', TS)).toBe(`http://${TS}:54321`)
    expect(urlEnEsteEquipo('http://localhost:3001', TS)).toBe(`http://${TS}:3001`)
    expect(urlEnEsteEquipo('http://localhost:3001/', TS)).toBe(`http://${TS}:3001/`)
  })
  it('una URL que no es local (producción) no cambia', () => {
    expect(urlEnEsteEquipo('https://abc.supabase.co', TS)).toBe('https://abc.supabase.co')
  })
  it('lo que no es una URL se deja igual', () => {
    expect(urlEnEsteEquipo('', TS)).toBe('')
    expect(urlEnEsteEquipo('no-es-url', TS)).toBe('no-es-url')
  })
})
