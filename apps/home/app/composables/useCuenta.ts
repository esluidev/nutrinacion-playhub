import { combinar, porGuardar, sinEstos } from '~/utils/cuenta'
import type { PerfilDeCuenta } from '~/utils/cuenta'
import type { Perfil } from '~/utils/perfiles'

// La cuenta del adulto (0018, tarea 025; Luis, 2026-11-27): opcional, con su correo y un PIN de 6 dígitos, como
// Educators y sin Supabase Auth. El correo se confirma con un código que llega por correo (`enviar-codigo-hogar`); el
// mismo camino sirve para elegir un PIN nuevo. Con la cuenta, los perfiles, lo que terminó cada uno y dónde iba se
// guardan también en ella y bajan a cada dispositivo donde se entre (utils/cuenta.ts). El token se queda en el
// dispositivo hasta cerrar sesión; si deja de valer (error 28000), se olvida sin más.
const CUENTA = 'playhub-hogar-cuenta'

export interface Cuenta { token: string, correo: string }

/** Lo que puede salir mal al pedir el código, confirmarlo o entrar. */
export type ErrorDeCuenta = 'correo' | 'espera' | 'envio' | 'credenciales' | 'bloqueado' | 'pin_invalido' | 'red'

type Respuesta = { ok: true, token: string, cuenta: { correo: string } } | { ok: false, error: ErrorDeCuenta }

function leerCuenta(): Cuenta | null {
  if (!import.meta.client) return null
  try {
    const valor = JSON.parse(localStorage.getItem(CUENTA) ?? 'null')
    return typeof valor?.token === 'string' && typeof valor?.correo === 'string' ? valor as Cuenta : null
  }
  catch { return null }
}

function escribirCuenta(cuenta: Cuenta | null) {
  try {
    if (cuenta) localStorage.setItem(CUENTA, JSON.stringify(cuenta))
    else localStorage.removeItem(CUENTA)
  }
  catch { /* sin almacenamiento: dura lo que dure la página */ }
}

const sesionVencida = (error: { code?: string } | null) => error?.code === '28000'

export function useCuenta() {
  const cuenta = useState<Cuenta | null>('hogar-cuenta', () => leerCuenta())
  const enCurso = useState<boolean>('hogar-sincronizando', () => false)
  const otraVez = useState<boolean>('hogar-sincronizar-otra-vez', () => false)
  // Mientras se pregunta si los perfiles de este dispositivo se guardan en la cuenta, nada se sube.
  const preguntando = useState<boolean>('hogar-cuenta-preguntando', () => false)
  const { locale } = useT()
  const hogar = useHogar()

  function olvidar() {
    cuenta.value = null
    escribirCuenta(null)
  }

  /** Manda el código al correo: para crear la cuenta o para elegir un PIN nuevo. */
  async function pedirCodigo(correo: string): Promise<ErrorDeCuenta | null> {
    const limpio = correo.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(limpio)) return 'correo'
    try {
      const { data, error } = await useSupabaseClient().functions.invoke('enviar-codigo-hogar', { body: { correo: limpio, idioma: locale.value } })
      if (error) return 'red'
      return data?.ok ? null : (data?.error as ErrorDeCuenta | undefined) ?? 'envio'
    }
    catch { return 'red' }
  }

  async function abrir(llamada: PromiseLike<{ data: unknown, error: unknown }>): Promise<ErrorDeCuenta | null> {
    try {
      const { data, error } = await llamada
      if (error || !data) return 'red'
      const respuesta = data as Respuesta
      if (!respuesta.ok) return respuesta.error
      cuenta.value = { token: respuesta.token, correo: respuesta.cuenta.correo }
      escribirCuenta(cuenta.value)
      return null
    }
    catch { return 'red' }
  }

  /** Con el código del correo elige su PIN y entra (crear la cuenta o un PIN nuevo). */
  function confirmar(correo: string, codigo: string, pin: string) {
    return abrir(useSupabaseClient().rpc('hogar_confirmar', { p_correo: correo, p_codigo: codigo, p_pin: pin }))
  }

  function entrar(correo: string, pin: string) {
    return abrir(useSupabaseClient().rpc('hogar_entrar', { p_correo: correo, p_pin: pin }))
  }

  async function bajar(): Promise<PerfilDeCuenta[] | null> {
    if (!cuenta.value) return null
    const { data, error } = await useSupabaseClient().rpc('hogar_perfiles', { p_token: cuenta.value.token })
    if (sesionVencida(error)) olvidar()
    return error ? null : (data as unknown as PerfilDeCuenta[])
  }

  /**
   * Combina lo del dispositivo con la cuenta: baja lo de la cuenta, sube lo que tiene más nuevo y deja en el
   * dispositivo el resultado. Sin conexión, no pasa nada: se intenta con el siguiente cambio o al volver a la app.
   */
  async function sincronizar(): Promise<void> {
    if (!cuenta.value || preguntando.value) return
    if (enCurso.value) {
      otraVez.value = true
      return
    }
    enCurso.value = true
    try {
      let remoto = await bajar()
      if (!remoto || !cuenta.value) return
      let { datos, subir } = combinar(hogar.datos(), remoto)
      if (subir.length) {
        const { data, error } = await useSupabaseClient().rpc('hogar_guardar_perfiles', { p_token: cuenta.value.token, p_perfiles: subir as never })
        if (sesionVencida(error)) olvidar()
        if (error) return
        remoto = data as unknown as PerfilDeCuenta[]
        ;({ datos } = combinar(hogar.datos(), remoto))
      }
      hogar.aplicar(datos)
    }
    catch { /* sin conexión */ }
    finally {
      enCurso.value = false
      if (otraVez.value) {
        otraVez.value = false
        void sincronizar()
      }
    }
  }

  /**
   * Justo después de entrar: los perfiles de este dispositivo que la cuenta no conoce, para preguntar si se guardan en
   * ella. Sin ninguno que preguntar, ya quedó todo combinado.
   */
  async function alEntrar(): Promise<Perfil[]> {
    const remoto = await bajar().catch(() => null)
    const pendientes = remoto ? porGuardar(hogar.datos(), remoto) : []
    preguntando.value = pendientes.length > 0
    if (!pendientes.length) await sincronizar()
    return pendientes
  }

  /** La respuesta a esa pregunta: guardarlos en la cuenta o quitarlos de este dispositivo. */
  async function resolver(guardar: boolean, ids: string[]) {
    if (!guardar) hogar.aplicar(sinEstos(hogar.datos(), ids))
    preguntando.value = false
    await sincronizar()
  }

  /** Cerrar sesión: los perfiles se quedan en el dispositivo, sin cuenta. */
  async function salir() {
    const token = cuenta.value?.token
    olvidar()
    if (token) await Promise.resolve(useSupabaseClient().rpc('hogar_salir', { p_token: token })).catch(() => {})
  }

  /** Eliminar la cuenta y lo que guardaba; los perfiles se quedan en el dispositivo, sin cuenta. */
  async function eliminar(): Promise<boolean> {
    if (!cuenta.value) return false
    const { error } = await useSupabaseClient().rpc('hogar_eliminar_cuenta', { p_token: cuenta.value.token })
    if (sesionVencida(error)) olvidar()
    if (error) return false
    olvidar()
    return true
  }

  return { cuenta, pedirCodigo, confirmar, entrar, sincronizar, alEntrar, resolver, salir, eliminar }
}

/** El aviso de un error de la cuenta; `credenciales` dice otra cosa al escribir el código que al entrar con el PIN. */
export function avisoDeCuenta(error: ErrorDeCuenta | null, t: (clave: string) => string, alConfirmar = false) {
  const claves: Record<ErrorDeCuenta, [string, 'danger' | 'warning']> = {
    correo: ['cuenta.errorCorreo', 'danger'],
    espera: ['cuenta.errorEspera', 'warning'],
    envio: ['cuenta.errorEnvio', 'danger'],
    credenciales: [alConfirmar ? 'cuenta.errorCodigo' : 'cuenta.errorCredenciales', 'danger'],
    bloqueado: ['cuenta.errorBloqueado', 'warning'],
    pin_invalido: ['cuenta.errorPin', 'danger'],
    red: ['cuenta.errorRed', 'warning'],
  }
  if (!error) return null
  const [clave, tono] = claves[error] ?? claves.envio
  return { tono, texto: t(clave) }
}
