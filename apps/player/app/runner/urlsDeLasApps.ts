import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import { runnerOrigins } from '@playhub/ui/app/utils/runner-contract'
import { leerUrlsDeLasApps } from '@playhub/ui/app/utils/urls-de-las-apps'
import type { UrlsDeLasApps } from '@playhub/ui/app/utils/urls-de-las-apps'

// Las direcciones de las apps, de la base (`configuraciones`): con las de Admin, Educators y la app del hogar el runner
// sabe quién puede incrustarlo y hablarle; con la del hogar, a dónde lleva el QR para unirse a un taller (`/code`). Se leen una vez por página con la
// API de la base, sin el cliente de Supabase ni sesión, y se guardan en el aparato: si la base no responde (sin red),
// valen las últimas leídas.

const GUARDADAS = 'playhub-urls-de-las-apps'
let lectura: Promise<UrlsDeLasApps> | null = null

/** Las direcciones de las apps (una sola lectura por página). */
export function urlsDelRunner(): Promise<UrlsDeLasApps> {
  lectura ??= leer()
  return lectura
}

async function leer(): Promise<UrlsDeLasApps> {
  const { supabaseUrl, supabaseAnonKey } = useRuntimeConfig().public
  try {
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Sin base')
    const urls = await leerUrlsDeLasApps(urlEnEsteEquipo(String(supabaseUrl)), String(supabaseAnonKey))
    try { localStorage.setItem(GUARDADAS, JSON.stringify(urls)) }
    catch { /* sin almacenamiento: la próxima vez se vuelven a pedir */ }
    return urls
  }
  catch {
    try { return JSON.parse(localStorage.getItem(GUARDADAS) ?? '{}') as UrlsDeLasApps }
    catch { return {} }
  }
}

/** Los orígenes que pueden incrustar el runner: Admin, Educators y la app del hogar y, compartida por la red, los mismos con el nombre
 *  de este equipo (equipo-local). */
export function origenesPermitidos(urls: UrlsDeLasApps, pagina?: Pick<Location, 'hostname' | 'protocol' | 'origin'>): string[] {
  const origenes = runnerOrigins([urls.admin, urls.educators, urls.home].filter(Boolean).join(','))
  return [...new Set([...origenes, ...origenes.map(o => urlEnEsteEquipo(o, pagina))])]
}

/** A dónde lleva la página para unirse de Player cuando se abre directamente en este aparato: la app del hogar (tarea
 *  025), con el mismo nombre con que se abrió esta página (equipo-local), o null si la base no la tiene. El QR, que se
 *  escanea desde otro teléfono, usa en cambio `origenParaUnirse` (en desarrollo, la IP de la red). */
export async function hogarParaUnirse(): Promise<string | null> {
  const home = (await urlsDelRunner()).home
  if (!home || !import.meta.client) return null
  return urlEnEsteEquipo(home, window.location)
}
