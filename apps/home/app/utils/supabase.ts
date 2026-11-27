import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import type { Database } from '../../../../supabase/database.types'

// Cliente de Supabase de la app del hogar: sin cuenta (decisión de Luis del 2026-11-17, todo en el dispositivo). Con la
// anon key lee el catálogo del hogar (`hogar_catalogo`), los países y las direcciones de las apps; no guarda sesión.
let client: SupabaseClient<Database> | null = null

export function useSupabaseClient(): SupabaseClient<Database> {
  if (client) return client
  const config = useRuntimeConfig()
  // Abierta desde otro equipo de la red, `127.0.0.1` sería ese equipo: se usa este (equipo-local).
  const url = urlEnEsteEquipo(config.public.supabaseUrl as string)
  const key = config.public.supabaseAnonKey as string
  if (!url || !key) {
    throw new Error('Supabase no configurado. Agrega NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_ANON_KEY a .env.local')
  }
  client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
