// Los mensajes de la sesión del taller entre la pantalla del educador y los dispositivos (tarea 013).
// Viajan por la conexión del taller (Realtime de Supabase) o, en la demostración, entre pestañas del
// mismo navegador. Del dispositivo solo vuelve su presencia: nunca respuestas, intentos ni si terminó.
// Todo lo que llega se lee con `leerMensaje`: lo puede mandar cualquiera que tenga el código.

import { esAvatar } from '../avatares'
import type { TonoAvatar } from '../avatares'

export type OrdenDispositivo = 'pausa' | 'libera' | 'reinicio' | 'quitar'

export type MensajeSesion =
  // Educador → dispositivos: la escena, la pausa y los reinicios de cada escena. `pausa` es la del taller (la pantalla
  // del educador también se detiene); `pausaDispositivos`, solo la de los dispositivos, desde su panel (opcional: añadida
  // el 2026-11-26).
  | { tipo: 'estado', escena: string, pausa: boolean, pausaDispositivos?: boolean, reinicios: Record<string, number> }
  // Educador → un dispositivo.
  | { tipo: 'orden', id: string, accion: OrdenDispositivo }
  // Educador → los que esperaban: ya pueden entrar, o no.
  | { tipo: 'aprobado', ids: string[] }
  | { tipo: 'rechazado', id: string }
  // Educador → todos: el taller terminó.
  | { tipo: 'cierre' }
  // Dispositivo → educador: pide entrar (mientras espera), está (cada pocos segundos), llega o se va.
  | { tipo: 'solicitud', id: string }
  | { tipo: 'presencia', id: string, nombre: string, tono: TonoAvatar, avatar?: string, escena: string | null, pausado: boolean }
  | { tipo: 'hola' }
  | { tipo: 'adios', id: string }

const ORDENES: OrdenDispositivo[] = ['pausa', 'libera', 'reinicio', 'quitar']
const TONOS: TonoAvatar[] = ['sky', 'grape', 'rose']

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const esTexto = (v: unknown, max = 80): v is string => typeof v === 'string' && v.length > 0 && v.length <= max
const esId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,64}$/.test(v)

/** Un mensaje de la sesión con la forma esperada, o null (se ignora). */
export function leerMensaje(data: unknown): MensajeSesion | null {
  if (!esObjeto(data)) return null
  switch (data.tipo) {
    case 'estado': {
      if (!esTexto(data.escena) || typeof data.pausa !== 'boolean' || !esObjeto(data.reinicios)) return null
      const reinicios: Record<string, number> = {}
      for (const [carpeta, n] of Object.entries(data.reinicios)) {
        if (esTexto(carpeta) && Number.isInteger(n) && (n as number) >= 0) reinicios[carpeta] = n as number
      }
      return { tipo: 'estado', escena: data.escena, pausa: data.pausa, ...(data.pausaDispositivos === true ? { pausaDispositivos: true } : {}), reinicios }
    }
    case 'orden':
      return esId(data.id) && ORDENES.includes(data.accion as OrdenDispositivo)
        ? { tipo: 'orden', id: data.id, accion: data.accion as OrdenDispositivo }
        : null
    case 'aprobado':
      return Array.isArray(data.ids) && data.ids.length <= 1000 && data.ids.every(esId) ? { tipo: 'aprobado', ids: data.ids as string[] } : null
    case 'rechazado':
      return esId(data.id) ? { tipo: 'rechazado', id: data.id } : null
    case 'cierre':
      return { tipo: 'cierre' }
    case 'solicitud':
      return esId(data.id) ? { tipo: 'solicitud', id: data.id } : null
    case 'presencia':
      if (!esId(data.id) || !esTexto(data.nombre, 40) || !TONOS.includes(data.tono as TonoAvatar) || typeof data.pausado !== 'boolean') return null
      if (data.escena !== null && !esTexto(data.escena)) return null
      return {
        tipo: 'presencia',
        id: data.id,
        nombre: data.nombre,
        tono: data.tono as TonoAvatar,
        avatar: esAvatar(data.avatar) ? data.avatar : undefined,
        escena: data.escena as string | null,
        pausado: data.pausado,
      }
    case 'hola':
      return { tipo: 'hola' }
    case 'adios':
      return esId(data.id) ? { tipo: 'adios', id: data.id } : null
    default:
      return null
  }
}

/** Un canal de la sesión, con la forma de un BroadcastChannel: lo que se manda y lo que llega. */
export interface CanalSesion {
  postMessage: (mensaje: MensajeSesion) => void
  onmessage: ((evento: { data: unknown }) => void) | null
  close: () => void
  /**
   * Ya escucha (y cada vez que vuelve a escuchar tras perder la red). Por la conexión del taller, suscribirse tarda: lo
   * que llega antes se pierde. Entre pestañas escucha desde el principio y no se llama.
   */
  alConectar?: (() => void) | null
}

// Cada cuánto da señales un dispositivo y cuándo se le da por ido. Por la conexión del taller se
// espacian: con cientos de teléfonos, cada señal cuenta.
export const RITMO = {
  demostracion: { senal: 2000, ido: 6000 },
  conexion: { senal: 10_000, ido: 30_000 },
} as const
