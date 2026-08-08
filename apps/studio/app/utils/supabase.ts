import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Mismo patrón que admin (`apps/admin/app/utils/supabase.ts`). Studio usa este cliente SOLO
// PARA LEER: el registro y la administración del catálogo viven en admin/Platform (tarea 030).
// La escritura además está cerrada del lado de la base por la migración 0009.

let client: SupabaseClient | null = null

export function useSupabaseClient(): SupabaseClient {
  if (client) return client

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseAnonKey as string

  if (!url || !key) {
    throw new Error('Supabase no configurado. Agrega NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_ANON_KEY a tu archivo .env.local')
  }

  client = createClient(url, key)
  return client
}

export function isSupabaseConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!(config.public.supabaseUrl && config.public.supabaseAnonKey)
}
