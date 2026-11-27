// Las direcciones de las apps de PlayHub viven en la base, en `configuraciones` (una fila por app): cada app conoce
// la suya y las de las demás sin nada fijo en el código, y en producción solo se cambian ahí. La tabla la lee
// cualquiera, también sin cuenta (no guarda secretos), y la escribe el superadmin. Vienen con las de desarrollo
// (localhost); compartida por la red, cada app las pasa por `urlEnEsteEquipo`.

export const CLAVES_URL = { admin: 'admin_url', player: 'player_url', educators: 'educators_url', home: 'home_url' } as const
export type AppPlayHub = keyof typeof CLAVES_URL
export type UrlsDeLasApps = Partial<Record<AppPlayHub, string>>

interface Fila { clave: string, valor: string | null }

/** Las direcciones de las filas de `configuraciones`, sin barra final. Una vacía o que no es http(s) no cuenta. */
export function urlsDeLasApps(filas: readonly Fila[] | null | undefined): UrlsDeLasApps {
  const urls: UrlsDeLasApps = {}
  for (const [app, clave] of Object.entries(CLAVES_URL) as [AppPlayHub, string][]) {
    const valor = filas?.find(f => f.clave === clave)?.valor?.trim().replace(/\/+$/, '')
    if (valor && /^https?:\/\/[^/\s]+/.test(valor)) urls[app] = valor
  }
  return urls
}

/**
 * Las lee con la API de la base, sin cliente ni sesión: para el runner de Player, que no carga el cliente de Supabase
 * para hablar con la app que lo contiene. Si la base no responde, lanza el error.
 */
export async function leerUrlsDeLasApps(supabaseUrl: string, anonKey: string, pedir: typeof fetch = fetch): Promise<UrlsDeLasApps> {
  const claves = Object.values(CLAVES_URL).join(',')
  const respuesta = await pedir(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/configuraciones?select=clave,valor&clave=in.(${claves})`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  if (!respuesta.ok) throw new Error(`No se pudieron leer las direcciones de las apps (${respuesta.status}).`)
  return urlsDeLasApps(await respuesta.json() as Fila[])
}
