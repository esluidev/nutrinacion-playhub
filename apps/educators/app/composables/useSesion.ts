import datos from '~/fixtures/talleres.json'
import type { Educador, RespuestaEntrar } from '~/utils/sesion'
import { isSupabaseConfigured, sesionNoValida, useSupabaseClient } from '~/utils/supabase'
import { codigoValido, correoValido, normalizarCodigo } from '~/utils/talleres'

// Sesión del educador: correo y PIN de 6 dígitos, sin Supabase Auth (decisión 005,
// supabase/migrations/0006). La primera vez (o tras un código nuevo de Admin) entra con el código
// de activación: la base responde `definir_pin` y el educador elige su PIN (educador_activar).
// El token se guarda en el dispositivo; la ficha (educador_sesion), solo en memoria.
// Sin Supabase configurado (modo demo), cualquier correo con 6 dígitos entra como el educador de
// fixtures/.

const TOKEN = 'playhub-educadores-token'
const DEMO = 'demo'

export type ErrorEntrada = 'correo' | 'pin' | 'credenciales' | 'bloqueado' | 'pin_invalido' | 'no_coinciden' | 'red'
export type ResultadoEntrada = 'dentro' | 'definir_pin' | ErrorEntrada
// 'sesion': el token ya no valía y la app vuelve a «Entrar».
export type ErrorPin = 'pin_invalido' | 'no_coinciden' | 'red' | 'sesion'

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
  // La activación en curso: el correo y el código que dio Admin, solo en memoria.
  const activacion = useState<{ correo: string, codigo: string } | null>('sesion-activacion', () => null)
  const demo = !isSupabaseConfigured()

  function abrir(nuevo: string, ficha: Educador) {
    token.value = nuevo
    educador.value = ficha
    activacion.value = null
    guardarToken(nuevo)
  }

  // Olvida la sesión en este dispositivo, con lo que se cargó con ella.
  function olvidar() {
    token.value = null
    educador.value = null
    activacion.value = null
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
    // Los 6 dígitos son su código de activación: ahora elige su PIN.
    if (respuesta.error === 'definir_pin') {
      activacion.value = { correo: correo.trim(), codigo: normalizarCodigo(pin) }
      return 'definir_pin'
    }
    return respuesta.error === 'bloqueado' ? 'bloqueado' : 'credenciales'
  }

  /** Elige el PIN con el código de activación de `entrar` y entra. */
  async function activar(pin: string, repetido: string): Promise<ResultadoEntrada> {
    if (!activacion.value) return 'credenciales'
    if (!codigoValido(pin)) return 'pin_invalido'
    if (normalizarCodigo(pin) !== normalizarCodigo(repetido)) return 'no_coinciden'
    const { correo, codigo } = activacion.value
    const { data, error } = await useSupabaseClient().rpc('educador_activar', { p_correo: correo, p_codigo: codigo, p_pin: normalizarCodigo(pin) })
    if (error || !data) return 'red'
    const respuesta = data as unknown as RespuestaEntrar
    if (respuesta.ok) {
      abrir(respuesta.token, respuesta.educador)
      return 'dentro'
    }
    // El código ya no vale (Admin generó otro o se bloqueó): se vuelve a empezar.
    if (respuesta.error !== 'pin_invalido') activacion.value = null
    return respuesta.error === 'definir_pin' ? 'credenciales' : respuesta.error
  }

  function cancelarActivacion() {
    activacion.value = null
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

  async function cambiarPin(pin: string, repetido: string): Promise<ErrorPin | null> {
    if (!codigoValido(pin)) return 'pin_invalido'
    if (normalizarCodigo(pin) !== normalizarCodigo(repetido)) return 'no_coinciden'
    if (demo || !token.value) return null
    const { error } = await useSupabaseClient().rpc('educador_cambiar_pin', { p_token: token.value, p_pin: normalizarCodigo(pin) })
    if (sesionNoValida(error)) {
      await caducada()
      return 'sesion'
    }
    if (error) return error.code === '22023' ? 'pin_invalido' : 'red'
    return null
  }

  return { token, educador, activacion, demo, entrar, activar, cancelarActivacion, comprobar, caducada, salir, cambiarPin }
}
