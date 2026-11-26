// La conexión del taller por Supabase (tarea 013): Realtime (solo Broadcast) para lo que pasa al
// instante y las funciones de la base (0006) para lo que manda y queda registrado. El runner y las
// páginas de /workshop/join la cargan solo cuando hay un código: la demostración no la descarga.
//
// Dos canales por conexión, para que con cientos de teléfonos nadie reciba las señales de los demás:
//   workshop-<código>           educador → dispositivos (estado, órdenes, aprobado, rechazado, cierre)
//   workshop-<código>-educador  dispositivos → educador (solicitud, presencia, hola, adiós); solo lo
//                               escucha el educador; los dispositivos mandan sin suscribirse.
// Todo lo que cambia de servicio (Supabase hoy, otro mañana) está en este archivo.

import { createClient, type REALTIME_SUBSCRIBE_STATES, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import type { Database } from '../../../../../supabase/database.types'
import type { Avatar } from '../avatares'
import type { CanalSesion, MensajeSesion } from './mensajes'

const EVENTO = 'taller'

let cliente: SupabaseClient<Database> | null = null

// Sin sesión de Auth: el runner es público. La anon key y las funciones con el código (y la llave).
function supabase(): SupabaseClient<Database> {
  if (cliente) return cliente
  const config = useRuntimeConfig()
  const url = urlEnEsteEquipo(config.public.supabaseUrl as string)
  const key = config.public.supabaseAnonKey as string
  if (!url || !key) throw new Error('La conexión del taller necesita NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_ANON_KEY')
  cliente = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  return cliente
}

export function conexionDisponible(): boolean {
  const config = useRuntimeConfig()
  return Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey)
}

/** El canal de la sesión para el educador o para un dispositivo, con la forma de un BroadcastChannel. */
export function abrirCanal(codigo: string, rol: 'educador' | 'dispositivo'): CanalSesion {
  const db = supabase()
  const principal = `workshop-${codigo}`
  const delEducador = `${principal}-educador`
  const canales: RealtimeChannel[] = []
  const canal: CanalSesion = {
    onmessage: null,
    postMessage: () => {},
    close: () => { canales.forEach(c => void db.removeChannel(c)) },
  }
  const recibir = (c: RealtimeChannel) => c.on('broadcast', { event: EVENTO }, ({ payload }) => canal.onmessage?.({ data: payload }))
  // Suscrito (también al volver a suscribirse tras perder la red): desde ahora llega lo que se le mande.
  const listo = (estado: `${REALTIME_SUBSCRIBE_STATES}`) => { if (estado === 'SUBSCRIBED') canal.alConectar?.() }

  if (rol === 'educador') {
    // Escucha a los dispositivos y habla por el principal (suscrito: va por el mismo socket).
    const entrada = recibir(db.channel(delEducador, { config: { broadcast: { self: false } } })).subscribe(listo)
    const salida = db.channel(principal, { config: { broadcast: { self: false } } }).subscribe()
    canales.push(entrada, salida)
    canal.postMessage = (m: MensajeSesion) => void salida.send({ type: 'broadcast', event: EVENTO, payload: m })
  }
  else {
    // Escucha al educador y le habla sin suscribirse a su canal (no recibe las señales de los demás).
    const entrada = recibir(db.channel(principal, { config: { broadcast: { self: false } } })).subscribe(listo)
    const salida = db.channel(delEducador)
    canales.push(entrada, salida)
    canal.postMessage = (m: MensajeSesion) => void salida.httpSend(EVENTO, m).catch(() => {})
  }
  return canal
}

export interface ParticipanteBase {
  dispositivo: string
  avatar: string
  apodo: string | null
  estado: 'esperando' | 'aprobado' | 'rechazado' | 'quitado'
  pidioEn: string
  conectado: boolean
  segundos: number
}

/** Lo que hace la pantalla del educador con la llave: ver, aprobar, rechazar o quitar y anotar quién entra y sale. */
export function conexionDelEducador(codigo: string, llave: string) {
  const db = supabase()
  return {
    async participantes(): Promise<ParticipanteBase[]> {
      const { data, error } = await db.rpc('conexion_participantes', { p_codigo: codigo, p_llave: llave })
      if (error) throw error
      return (data as unknown as ParticipanteBase[]) ?? []
    },
    /** A los indicados o, sin lista, a todos los que esperan. Devuelve los aprobados. */
    async aprobar(dispositivos: string[] | null): Promise<string[]> {
      const { data, error } = await db.rpc('conexion_aprobar', { p_codigo: codigo, p_llave: llave, p_dispositivos: dispositivos ?? undefined })
      if (error) throw error
      return (data as unknown as string[]) ?? []
    },
    async rechazar(dispositivo: string): Promise<boolean> {
      const { data, error } = await db.rpc('conexion_rechazar', { p_codigo: codigo, p_llave: llave, p_dispositivo: dispositivo })
      if (error) throw error
      return Boolean(data)
    },
    async presencia(entran: string[], salen: string[]) {
      if (!entran.length && !salen.length) return
      const { error } = await db.rpc('conexion_presencia', { p_codigo: codigo, p_llave: llave, p_entran: entran, p_salen: salen })
      if (error) throw error
    },
  }
}

export interface TallerDeLaConexion {
  codigo: string
  titulo: string
  idioma: string
  storyboard: { clave: string } // su clave (`key`): la URL del runner, /play/<clave>
}

export type EstadoParticipante = ParticipanteBase['estado']

/** Lo que hace el dispositivo con el código: buscar el taller, pedir entrar y ver su estado. */
export function conexionDelDispositivo(codigo: string) {
  const db = supabase()
  return {
    async buscar(): Promise<TallerDeLaConexion | null> {
      const { data, error } = await db.rpc('participante_buscar', { p_codigo: codigo })
      if (error) throw error
      return (data as unknown as TallerDeLaConexion | null) ?? null
    },
    async entrar(dispositivo: string, avatar: Avatar, apodo: string | null): Promise<EstadoParticipante> {
      const { data, error } = await db.rpc('participante_entrar', { p_codigo: codigo, p_dispositivo: dispositivo, p_avatar: avatar, p_apodo: apodo ?? undefined })
      if (error) throw error
      return (data as unknown as { estado: EstadoParticipante }).estado
    },
    /**
     * Null si la conexión ya no está abierta o este dispositivo no pidió entrar. Mientras espera, preguntarlo es su
     * señal: sin ella en 45 s, su solicitud deja de verse y de contar.
     */
    async estado(dispositivo: string): Promise<EstadoParticipante | null> {
      const { data, error } = await db.rpc('participante_estado', { p_codigo: codigo, p_dispositivo: dispositivo })
      if (error) throw error
      return (data as unknown as { estado: EstadoParticipante } | null)?.estado ?? null
    },
    /** Se va de la página mientras espera: retira su solicitud para que el educador no la siga viendo. */
    async retirar(dispositivo: string): Promise<void> {
      const { error } = await db.rpc('participante_retirar', { p_codigo: codigo, p_dispositivo: dispositivo })
      if (error) throw error
    },
  }
}
