import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import type { Database } from '../../../../supabase/database.types'

// Cliente de Supabase de Player. Solo lo usa la gestión (la entrada del equipo de
// Nutrinación, superadmin): el runner `/play/**` es público y nunca lo crea.
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
  client = createClient<Database>(url, key)
  return client
}

export function isSupabaseConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!(config.public.supabaseUrl && config.public.supabaseAnonKey)
}
