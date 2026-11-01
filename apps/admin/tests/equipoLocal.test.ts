// Compartir las apps por Tailscale: las URLs a localhost pasan a ser el equipo con que se abrió.
import { describe, expect, it } from 'vitest'
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'

const TS = 'macbook-pro-de-luis.tail1ce4ee.ts.net'
const pagina = (href: string) => new URL(href)

describe('urlEnEsteEquipo', () => {
  it('abierta en localhost, no cambia nada', () => {
    expect(urlEnEsteEquipo('http://127.0.0.1:54321', pagina('http://localhost:3000'))).toBe('http://127.0.0.1:54321')
  })
  it('abierta por Tailscale, localhost pasa a ser este equipo (mismo puerto)', () => {
    expect(urlEnEsteEquipo('http://127.0.0.1:54321', pagina(`http://${TS}:3000`))).toBe(`http://${TS}:54321`)
    expect(urlEnEsteEquipo('http://localhost:3001', pagina(`http://${TS}:3002`))).toBe(`http://${TS}:3001`)
    expect(urlEnEsteEquipo('http://localhost:3001/', pagina(`http://${TS}:3002`))).toBe(`http://${TS}:3001/`)
  })
  it('abierta con la IP de Tailscale, localhost pasa a ser esa IP', () => {
    expect(urlEnEsteEquipo('http://127.0.0.1:54321', pagina('http://100.85.6.50:3000'))).toBe('http://100.85.6.50:54321')
    expect(urlEnEsteEquipo('http://localhost:3001', pagina('http://100.85.6.50:3002'))).toBe('http://100.85.6.50:3001')
  })
  it('publicada con Funnel: cada app en su puerto https y Supabase en /supabase de la misma app', () => {
    expect(urlEnEsteEquipo('http://127.0.0.1:54321', pagina(`https://${TS}:10000/entrar`))).toBe(`https://${TS}:10000/supabase`)
    expect(urlEnEsteEquipo('http://127.0.0.1:54321', pagina(`https://${TS}/login`))).toBe(`https://${TS}/supabase`)
    expect(urlEnEsteEquipo('http://localhost:3001', pagina(`https://${TS}:10000`))).toBe(`https://${TS}:8443`)
    expect(urlEnEsteEquipo('http://localhost:3001/', pagina(`https://${TS}`))).toBe(`https://${TS}:8443/`)
    // Los orígenes que pueden incrustar el runner, vistos desde Player
    expect(urlEnEsteEquipo('http://localhost:3002', pagina(`https://${TS}:8443`))).toBe(`https://${TS}:10000`)
    expect(urlEnEsteEquipo('http://localhost:3000', pagina(`https://${TS}:8443`))).toBe(`https://${TS}`)
  })
  it('una URL que no es local (producción) no cambia', () => {
    expect(urlEnEsteEquipo('https://abc.supabase.co', pagina(`http://${TS}:3000`))).toBe('https://abc.supabase.co')
    expect(urlEnEsteEquipo('https://abc.supabase.co', pagina(`https://${TS}`))).toBe('https://abc.supabase.co')
  })
  it('lo que no es una URL se deja igual', () => {
    expect(urlEnEsteEquipo('', pagina(`http://${TS}:3000`))).toBe('')
    expect(urlEnEsteEquipo('no-es-url', pagina(`http://${TS}:3000`))).toBe('no-es-url')
  })
})
