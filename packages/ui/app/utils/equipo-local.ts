// Desarrollo compartido por la red (Tailscale, la IP de la red local): las apps y Supabase corren
// en el mismo equipo y su configuración apunta a `localhost`. Abierta desde otro equipo con el nombre
// de este (macbook….ts.net), `localhost` sería el equipo de quien la abre. Si la URL apunta a
// localhost y la página se abrió con otro nombre, se usa ese nombre (mismo protocolo y puerto).
//
// Publicadas con Tailscale Funnel (`scripts/funnel.sh`), la página es https y Funnel solo admite los
// puertos 443, 8443 y 10000: cada app va en uno de ellos y Supabase en `/supabase` de cada app.
// En producción las URLs no son locales: no cambia nada.

const LOCALES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

// El mismo reparto que `scripts/funnel.sh`: puerto local → puerto en Funnel.
const PUERTOS_FUNNEL: Record<string, string> = { 3000: '443', 3001: '8443', 3002: '10000' }
const PUERTO_SUPABASE = '54321'

type Pagina = Pick<Location, 'hostname' | 'protocol' | 'origin'>

export function esLocal(hostname: string): boolean {
  return LOCALES.has(hostname)
}

/** La URL tal cual, o la de este equipo tal como se abrió la página si apunta a localhost. */
export function urlEnEsteEquipo(url: string, pagina: Pagina | undefined = globalThis.location): string {
  if (!url || !pagina || esLocal(pagina.hostname)) return url
  try {
    const u = new URL(url)
    if (!esLocal(u.hostname)) return url
    // URL() deja una barra final que no estaba: se respeta la forma original.
    const barra = url.endsWith('/') ? '/' : ''
    if (pagina.protocol === 'https:') {
      if (u.port === PUERTO_SUPABASE) return `${pagina.origin}/supabase${barra}`
      u.protocol = 'https:'
      u.port = PUERTOS_FUNNEL[u.port] ?? u.port
    }
    u.hostname = pagina.hostname
    return barra ? u.toString() : u.toString().replace(/\/$/, '')
  }
  catch {
    return url
  }
}
