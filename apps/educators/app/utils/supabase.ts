import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import type { Database } from '../../../../supabase/database.types'

// Cliente de Supabase de Educators. El educador no usa Supabase Auth (decisión 005): entra con
// correo y PIN y todo lo pide a las funciones educador_* con la anon key y su token. Por eso el
// cliente no guarda ni renueva ninguna sesión de Auth.
let client: SupabaseClient<Database> | null = null

export function useSupabaseClient(): SupabaseClient<Database> {
  if (client) return client
  const config = useRuntimeConfig()
  // Compartida por Tailscale, `127.0.0.1` sería el equipo de quien la abre: se usa este (equipo-local).
  const url = urlEnEsteEquipo(config.public.supabaseUrl as string)
  const key = config.public.supabaseAnonKey as string
  if (!url || !key) {
    throw new Error('Supabase no configurado. Agrega NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_ANON_KEY a .env.local')
  }
  client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

/** Sin URL ni anon key, Educators funciona en modo demo con los datos de fixtures/. */
export function isSupabaseConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!(config.public.supabaseUrl && config.public.supabaseAnonKey)
}

/** La base responde 28000 cuando el token no vale o caducó: hay que volver a «Entrar». */
export function sesionNoValida(error: { code?: string } | null | undefined): boolean {
  return error?.code === '28000'
}
