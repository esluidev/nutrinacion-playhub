import { runnerOrigins } from '../../../../packages/ui/app/utils/runner-contract'
import { leerUrlsDeLasApps } from '../../../../packages/ui/app/utils/urls-de-las-apps'

// Quién puede poner el runner (/play/**) en un iframe: Player y las apps con su dirección en la base (`configuraciones`:
// Admin y Educators), con la cabecera frame-ancestors. Se lee de la base y se recuerda un minuto, así que cambiar una
// dirección en producción no pide recompilar Player. Si la base no responde, valen las últimas leídas; sin ninguna,
// solo Player. En desarrollo, además, este equipo con cualquiera de sus nombres (`ancestrosDev`, en nuxt.config).
// Lo pone el servidor de Player: servido como archivos estáticos, la cabecera tendría que ponerla el proveedor.

const MINUTO = 60_000
let memoria: { origenes: string[], hasta: number } | null = null

async function origenesDeLaBase(supabaseUrl: string, anonKey: string): Promise<string[]> {
  if (memoria && memoria.hasta > Date.now()) return memoria.origenes
  try {
    const urls = await leerUrlsDeLasApps(supabaseUrl, anonKey)
    memoria = { origenes: runnerOrigins([urls.admin, urls.educators].filter(Boolean).join(',')), hasta: Date.now() + MINUTO }
  }
  catch {
    // Sin respuesta: las últimas leídas, y se vuelve a intentar en un minuto.
    if (memoria) memoria.hasta = Date.now() + MINUTO
  }
  return memoria?.origenes ?? []
}

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/play/')) return
  const config = useRuntimeConfig(event)
  const origenes = await origenesDeLaBase(String(config.public.supabaseUrl ?? ''), String(config.public.supabaseAnonKey ?? ''))
  const ancestros = ["'self'", ...origenes, ...String(config.ancestrosDev ?? '').split(/\s+/).filter(Boolean)]
  setResponseHeader(event, 'Content-Security-Policy', `frame-ancestors ${ancestros.join(' ')}`)
})
