// Desarrollo compartido por la red (Tailscale, la IP de la red local): las apps y Supabase corren
// en el mismo equipo y su configuración apunta a `localhost`. Abierta desde otro equipo con el nombre
// de este (macbook….ts.net), `localhost` sería el equipo de quien la abre. Si la URL apunta a
// localhost y la página se abrió con otro nombre, se usa ese nombre (mismo protocolo y puerto).
// En producción las URLs no son locales: no cambia nada.

const LOCALES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function esLocal(hostname: string): boolean {
  return LOCALES.has(hostname)
}

/** La URL tal cual, o con el nombre con que se abrió la página si apunta a localhost. */
export function urlEnEsteEquipo(url: string, paginaHostname: string | undefined = globalThis.location?.hostname): string {
  if (!url || !paginaHostname || esLocal(paginaHostname)) return url
  try {
    const u = new URL(url)
    if (!esLocal(u.hostname)) return url
    u.hostname = paginaHostname
    // URL() deja una barra final que no estaba: se respeta la forma original.
    return url.endsWith('/') ? u.toString() : u.toString().replace(/\/$/, '')
  }
  catch {
    return url
  }
}
