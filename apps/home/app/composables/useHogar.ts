import type { Avance } from '~/utils/catalogo'
import type { DatosDelDispositivo } from '~/utils/cuenta'
import { leerPerfiles } from '~/utils/perfiles'
import type { Perfil } from '~/utils/perfiles'

// Lo que la app del hogar guarda en el dispositivo (tarea 025; sin cuenta, decisión de Luis del 2026-11-17): el país
// (se pregunta la primera vez), los perfiles de los niños, los storyboards que cada uno terminó y en qué escena va del
// último que dejó a medias («Sigue jugando»). Quién juega se elige
// al abrir la app y se recuerda mientras siga abierta (sessionStorage): al volver a abrirla, otra vez «¿Quién juega?».
// Con la cuenta del adulto (useCuenta), cada cambio de un perfil lleva su fecha y avisa (`hogar-cambios`) para subirlo;
// lo eliminado se recuerda hasta que la cuenta lo sepa.
const PAIS = 'playhub-hogar-pais'
const PERFILES = 'playhub-hogar-perfiles'
const TERMINADOS = 'playhub-hogar-terminados'
const AVANCES = 'playhub-hogar-avances'
const ELIMINADOS = 'playhub-hogar-eliminados'
const ACTUAL = 'playhub-hogar-perfil'

function leer(almacen: 'local' | 'session', clave: string): string | null {
  if (!import.meta.client) return null
  try { return (almacen === 'local' ? localStorage : sessionStorage).getItem(clave) }
  catch { return null }
}
function leerMapa<T>(clave: string): Record<string, T> {
  try {
    const valor = JSON.parse(leer('local', clave) ?? '{}')
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor as Record<string, T> : {}
  }
  catch { return {} }
}
function escribir(almacen: 'local' | 'session', clave: string, valor: string | null) {
  if (!import.meta.client) return
  try {
    const store = almacen === 'local' ? localStorage : sessionStorage
    if (valor === null) store.removeItem(clave)
    else store.setItem(clave, valor)
  }
  catch { /* sin almacenamiento: dura lo que dure la página */ }
}

export function useHogar() {
  const pais = useState<string | null>('hogar-pais', () => leer('local', PAIS))
  const perfiles = useState<Perfil[]>('hogar-perfiles', () => leerPerfiles(leer('local', PERFILES)))
  const terminados = useState<Record<string, string[]>>('hogar-terminados', () => leerMapa(TERMINADOS))
  const avances = useState<Record<string, Avance>>('hogar-avances', () => leerMapa(AVANCES))
  const eliminados = useState<Record<string, string>>('hogar-eliminados', () => leerMapa(ELIMINADOS))
  const cambios = useState<number>('hogar-cambios', () => 0)
  const actualId = useState<string | null>('hogar-actual', () => leer('session', ACTUAL))
  const actual = computed(() => perfiles.value.find(p => p.id === actualId.value) ?? null)

  function elegirPais(codigo: string) {
    pais.value = codigo
    escribir('local', PAIS, codigo)
  }

  // Un perfil cambió: su fecha y el aviso para la cuenta.
  function tocar(id: string) {
    const ahora = new Date().toISOString()
    perfiles.value = perfiles.value.map(p => (p.id === id ? { ...p, actualizado: ahora } : p))
    escribir('local', PERFILES, JSON.stringify(perfiles.value))
    cambios.value++
  }

  function guardarPerfil(perfil: Perfil) {
    const i = perfiles.value.findIndex(p => p.id === perfil.id)
    perfiles.value = i === -1 ? [...perfiles.value, perfil] : perfiles.value.map(p => (p.id === perfil.id ? perfil : p))
    tocar(perfil.id)
  }

  function eliminarPerfil(id: string) {
    perfiles.value = perfiles.value.filter(p => p.id !== id)
    escribir('local', PERFILES, JSON.stringify(perfiles.value))
    const { [id]: _, ...resto } = terminados.value
    terminados.value = resto
    escribir('local', TERMINADOS, JSON.stringify(resto))
    const { [id]: __, ...otros } = avances.value
    avances.value = otros
    escribir('local', AVANCES, JSON.stringify(otros))
    eliminados.value = { ...eliminados.value, [id]: new Date().toISOString() }
    escribir('local', ELIMINADOS, JSON.stringify(eliminados.value))
    if (actualId.value === id) elegir(null)
    cambios.value++
  }

  /** Todo lo de los perfiles en el dispositivo, para combinarlo con la cuenta. */
  function datos(): DatosDelDispositivo {
    return { perfiles: perfiles.value, terminados: terminados.value, avances: avances.value, eliminados: eliminados.value }
  }

  /** Deja en el dispositivo lo que resultó de combinarlo con la cuenta (sin avisar otro cambio). */
  function aplicar(nuevos: DatosDelDispositivo) {
    const cambia = <T>(actual: T, nuevo: T) => JSON.stringify(actual) !== JSON.stringify(nuevo)
    if (cambia(perfiles.value, nuevos.perfiles)) {
      perfiles.value = nuevos.perfiles
      escribir('local', PERFILES, JSON.stringify(nuevos.perfiles))
    }
    if (cambia(terminados.value, nuevos.terminados)) {
      terminados.value = nuevos.terminados
      escribir('local', TERMINADOS, JSON.stringify(nuevos.terminados))
    }
    if (cambia(avances.value, nuevos.avances)) {
      avances.value = nuevos.avances
      escribir('local', AVANCES, JSON.stringify(nuevos.avances))
    }
    if (cambia(eliminados.value, nuevos.eliminados)) {
      eliminados.value = nuevos.eliminados
      escribir('local', ELIMINADOS, JSON.stringify(nuevos.eliminados))
    }
    if (actualId.value && !nuevos.perfiles.some(p => p.id === actualId.value)) elegir(null)
  }

  function elegir(id: string | null) {
    actualId.value = id
    escribir('session', ACTUAL, id)
  }

  /** En qué escena va quien juega (lo cuenta el runner). */
  function anotarAvance(clave: string, indice: number, escenas: number) {
    const id = actualId.value
    if (!id) return
    avances.value = { ...avances.value, [id]: { clave, indice, escenas } }
    escribir('local', AVANCES, JSON.stringify(avances.value))
    tocar(id)
  }

  function marcarTerminado(clave: string) {
    const id = actualId.value
    if (!id) return
    if (avances.value[id]?.clave === clave) {
      const { [id]: _, ...otros } = avances.value
      avances.value = otros
      escribir('local', AVANCES, JSON.stringify(otros))
    }
    const suyos = terminados.value[id] ?? []
    if (!suyos.includes(clave)) {
      terminados.value = { ...terminados.value, [id]: [...suyos, clave] }
      escribir('local', TERMINADOS, JSON.stringify(terminados.value))
    }
    tocar(id)
  }

  const terminado = (clave: string) => Boolean(actualId.value && terminados.value[actualId.value]?.includes(clave))
  const terminadosDelActual = computed(() => (actualId.value ? terminados.value[actualId.value] ?? [] : []))
  const avanceDelActual = computed(() => (actualId.value ? avances.value[actualId.value] ?? null : null))

  return { pais, perfiles, actual, elegirPais, guardarPerfil, eliminarPerfil, elegir, anotarAvance, marcarTerminado, terminado, terminadosDelActual, avanceDelActual, datos, aplicar }
}
