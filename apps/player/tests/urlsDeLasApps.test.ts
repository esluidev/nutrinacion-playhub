import { describe, expect, it, vi } from 'vitest'
import { leerUrlsDeLasApps, urlsDeLasApps } from '@playhub/ui/app/utils/urls-de-las-apps'
import { origenesPermitidos } from '~/runner/urlsDeLasApps'

const filas = [
  { clave: 'admin_url', valor: 'https://admin.nutrinacion.com/' },
  { clave: 'player_url', valor: ' https://player.nutrinacion.com ' },
  { clave: 'educators_url', valor: 'https://educators.nutrinacion.com' },
  { clave: 'otra', valor: 'x' },
]

describe('las direcciones de las apps, de la base', () => {
  it('se leen de las filas de configuraciones, sin barra final', () => {
    expect(urlsDeLasApps(filas)).toEqual({
      admin: 'https://admin.nutrinacion.com',
      player: 'https://player.nutrinacion.com',
      educators: 'https://educators.nutrinacion.com',
    })
  })

  it('una vacía o que no es http(s) no cuenta', () => {
    expect(urlsDeLasApps([{ clave: 'admin_url', valor: '' }, { clave: 'player_url', valor: 'javascript:alert(1)' }, { clave: 'educators_url', valor: null }])).toEqual({})
    expect(urlsDeLasApps(null)).toEqual({})
  })

  it('se piden a la API de la base con la anon key y sin sesión', async () => {
    const pedir = vi.fn(async () => new Response(JSON.stringify(filas)))
    expect((await leerUrlsDeLasApps('http://127.0.0.1:54331/', 'anon', pedir as typeof fetch)).player).toBe('https://player.nutrinacion.com')
    expect(pedir).toHaveBeenCalledWith(
      'http://127.0.0.1:54331/rest/v1/configuraciones?select=clave,valor&clave=in.(admin_url,player_url,educators_url)',
      { headers: { apikey: 'anon', Authorization: 'Bearer anon' } },
    )
    await expect(leerUrlsDeLasApps('http://127.0.0.1:54331', 'anon', (async () => new Response('', { status: 503 })) as typeof fetch)).rejects.toThrow()
  })
})

describe('quién puede incrustar el runner', () => {
  it('Admin y Educators, por su origen; Player no hace falta', () => {
    const pagina = { protocol: 'https:', hostname: 'player.nutrinacion.com', origin: 'https://player.nutrinacion.com' }
    expect(origenesPermitidos(urlsDeLasApps(filas), pagina)).toEqual(['https://admin.nutrinacion.com', 'https://educators.nutrinacion.com'])
    expect(origenesPermitidos({}, pagina)).toEqual([])
  })

  it('compartida por la red, también con el nombre de este equipo', () => {
    const tailnet = { protocol: 'https:', hostname: 'mac.tail.ts.net', origin: 'https://mac.tail.ts.net:8443' }
    expect(origenesPermitidos({ admin: 'http://localhost:3000', educators: 'http://localhost:3002' }, tailnet))
      .toEqual(['http://localhost:3000', 'http://localhost:3002', 'https://mac.tail.ts.net', 'https://mac.tail.ts.net:10000'])
  })
})
