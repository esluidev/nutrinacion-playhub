import datos from '~/fixtures/talleres.json'
import type { Educador, RespuestaAcceso, RespuestaEntrar } from '~/utils/sesion'
import { isSupabaseConfigured, sesionNoValida, useSupabaseClient } from '~/utils/supabase'
import { codigoValido, correoValido, normalizarCodigo } from '~/utils/talleres'

// Sesión del educador: correo y PIN de 6 dígitos, sin Supabase Auth (decisión 005,
// supabase/migrations/0006). El PIN lo elige con el enlace de acceso que le manda Admin (0013,
// página /acceso/<token>): la primera vez o cuando lo olvidó. El token de la sesión se guarda en
// el dispositivo; la ficha (educador_sesion), solo en memoria.
// Sin Supabase configurado (modo demo), cualquier correo con 6 dígitos entra como el educador de
// fixtures/.

const TOKEN = 'playhub-educadores-token'
const DEMO = 'demo'

export type ErrorEntrada = 'correo' | 'pin' | 'credenciales' | 'bloqueado' | 'pin_invalido' | 'no_coinciden' | 'red'
export type ResultadoEntrada = 'dentro' | ErrorEntrada
// El enlace de acceso: a quién es (para mostrarlo) y qué pasó al elegir el PIN.
export interface InfoAcceso { correo: string, nombre: string, organizacion: string, primeraVez: boolean }
export type ResultadoAcceso = 'dentro' | 'no_vale' | 'pin_invalido' | 'no_coinciden' | 'red'
// 'sesion': el token ya no valía y la app vuelve a «Entrar».
export type ErrorPin = 'pin_actual' | 'bloqueado' | 'pin_invalido' | 'no_coinciden' | 'red' | 'sesion'

function leerToken(): string | null {
  try { return localStorage.getItem(TOKEN) }
  catch { return null }
}

function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN, token)
    else localStorage.removeItem(TOKEN)
  }
  catch { /* sin almacenamiento: la sesión dura lo que la pestaña */ }
}

// Una sola comprobación del token a la vez (el middleware la pide en cada navegación).
let comprobando: Promise<void> | null = null

export function useSesion() {
  const token = useState<string | null>('sesion-token', () => (import.meta.client ? leerToken() : null))
  const educador = useState<Educador | null>('educador', () => null)
  const demo = !isSupabaseConfigured()

  function abrir(nuevo: string, ficha: Educador) {
    token.value = nuevo
    educador.value = ficha
    guardarToken(nuevo)
  }

  // Olvida la sesión en este dispositivo, con lo que se cargó con ella.
  function olvidar() {
    token.value = null
    educador.value = null
    guardarToken(null)
    clearNuxtState(['talleres', 'talleres-carga', 'guias'], { reset: true })
  }

  async function entrar(correo: string, pin: string): Promise<ResultadoEntrada> {
    if (!correoValido(correo)) return 'correo'
    if (!codigoValido(pin)) return 'pin'
    if (demo) {
      abrir(DEMO, { ...(datos.educador as Educador), correo: correo.trim() })
      return 'dentro'
    }
    const { data, error } = await useSupabaseClient().rpc('educador_entrar', { p_correo: correo.trim(), p_pin: normalizarCodigo(pin) })
    if (error || !data) return 'red'
    const respuesta = data as unknown as RespuestaEntrar
    if (respuesta.ok) {
      abrir(respuesta.token, respuesta.educador)
      return 'dentro'
    }
    return respuesta.error === 'bloqueado' ? 'bloqueado' : 'credenciales'
  }

  /** A quién es el enlace de acceso (0013): su correo, su nombre y si es su primer PIN. */
  async function infoAcceso(enlace: string): Promise<InfoAcceso | 'no_vale' | 'red'> {
    if (demo) {
      const e = datos.educador as Educador
      return { correo: e.correo, nombre: e.nombre, organizacion: e.organizaciones[0]?.nombre ?? '', primeraVez: true }
    }
    const { data, error } = await useSupabaseClient().rpc('educador_acceso', { p_token: enlace })
    if (error || !data) return 'red'
    const r = data as unknown as RespuestaAcceso
    if (!r.ok) return 'no_vale'
    return { correo: r.correo, nombre: r.nombre, organizacion: r.organizacion, primeraVez: r.primera_vez }
  }

  /** Elige su PIN con el enlace de acceso y entra. El enlace vale una vez. */
  async function usarAcceso(enlace: string, pin: string, repetido: string): Promise<ResultadoAcceso> {
    if (!codigoValido(pin)) return 'pin_invalido'
    if (normalizarCodigo(pin) !== normalizarCodigo(repetido)) return 'no_coinciden'
    if (demo) {
      abrir(DEMO, datos.educador as Educador)
      return 'dentro'
    }
    const { data, error } = await useSupabaseClient().rpc('educador_usar_acceso', { p_token: enlace, p_pin: normalizarCodigo(pin) })
    if (error || !data) return 'red'
    const respuesta = data as unknown as RespuestaEntrar
    if (respuesta.ok) {
      abrir(respuesta.token, respuesta.educador)
      return 'dentro'
    }
    return respuesta.error === 'pin_invalido' ? 'pin_invalido' : 'no_vale'
  }

  /** Trae la ficha del token guardado; si ya no vale, olvida la sesión. Sin conexión, la conserva. */
  async function comprobar(): Promise<void> {
    if (!token.value || educador.value) return
    comprobando ??= (async () => {
      if (demo) {
        if (token.value === DEMO) educador.value = datos.educador as Educador
        else olvidar()
        return
      }
      const { data, error } = await useSupabaseClient().rpc('educador_sesion', { p_token: token.value! })
      if (sesionNoValida(error)) olvidar()
      else if (!error && data) educador.value = data as unknown as Educador
    })().finally(() => (comprobando = null))
    return comprobando
  }

  /** La base dijo que el token no vale (caducó o se cerró): vuelta a «Entrar». */
  async function caducada() {
    olvidar()
    await navigateTo('/entrar')
  }

  async function salir() {
    const actual = token.value
    olvidar()
    // Cierra la sesión también en la base; si no hay conexión, basta con olvidarla aquí.
    if (actual && !demo) await useSupabaseClient().rpc('educador_salir', { p_token: actual })
    await navigateTo('/entrar')
  }

  // Cambiar el PIN desde la cuenta, en dos pasos (0013): primero confirma que es él con el actual
  // (uno equivocado cuenta como un fallo al entrar) y después elige el nuevo, que vuelve a mandar el
  // actual para que la base lo compruebe otra vez.
  async function verificarPin(actual: string): Promise<ErrorPin | null> {
    if (!codigoValido(actual)) return 'pin_actual'
    if (demo || !token.value) return null
    const { data, error } = await useSupabaseClient().rpc('educador_verificar_pin', {
      p_token: token.value,
      p_pin: normalizarCodigo(actual),
    })
    return respuestaPin(data, error)
  }

  async function cambiarPin(actual: string, pin: string, repetido: string): Promise<ErrorPin | null> {
    if (!codigoValido(pin)) return 'pin_invalido'
    if (normalizarCodigo(pin) !== normalizarCodigo(repetido)) return 'no_coinciden'
    if (demo || !token.value) return null
    const { data, error } = await useSupabaseClient().rpc('educador_cambiar_pin', {
      p_token: token.value,
      p_pin_actual: normalizarCodigo(actual),
      p_pin: normalizarCodigo(pin),
    })
    return respuestaPin(data, error)
  }

  // Las dos responden { ok } o { ok: false, error }.
  async function respuestaPin(data: unknown, error: { code?: string } | null): Promise<ErrorPin | null> {
    if (sesionNoValida(error)) {
      await caducada()
      return 'sesion'
    }
    if (error) return 'red'
    const r = data as { ok?: boolean, error?: string } | null
    if (r?.ok) return null
    return r?.error === 'pin_actual' || r?.error === 'bloqueado' || r?.error === 'pin_invalido' ? r.error : 'red'
  }

  return { token, educador, demo, entrar, infoAcceso, usarAcceso, comprobar, caducada, salir, verificarPin, cambiarPin }
}
