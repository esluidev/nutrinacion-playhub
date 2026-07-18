import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function useSupabaseClient(): SupabaseClient {
  if (client) return client

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseAnonKey as string

  if (!url || !key) {
    throw new Error('Supabase no configurado. Agrega NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_ANON_KEY a tu archivo .env')
  }

  client = createClient(url, key)
  return client
}

export function isSupabaseConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!(config.public.supabaseUrl && config.public.supabaseAnonKey)
}
