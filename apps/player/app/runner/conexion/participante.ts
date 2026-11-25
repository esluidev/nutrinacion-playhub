// Quien se une a un taller desde su dispositivo (tarea 013): el código que escribe o trae el QR, y lo
// que el dispositivo recuerda de esa conexión para volver como el mismo al recargar (su identificador
// al azar, su avatar y su apodo). Se guarda por código: en otro taller es otro participante.

import { esLocal, urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import { esAvatar, limpiarApodo } from '../avatares'
import type { Avatar } from '../avatares'

/** El alfabeto del código: sin 0/O ni 1/I/L (el check de workshop_conexiones). */
const CODIGO = /^[A-HJKMNP-Z2-9]{6}$/

/** El código como se escribió («k7m 2qx», «K7M·2QX») en su forma: mayúsculas y sin separadores. */
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function codigoValido(codigo: string): boolean {
  return CODIGO.test(codigo)
}

/** El código para leerlo en voz alta o en la pantalla: «K7M 2QX». */
export function codigoLegible(codigo: string): string {
  return codigo.length === 6 ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : codigo
}

/** La dirección de Player para el QR: la de la base (`configuraciones.player_url`) o, si todavía no se leyó, la de la
 *  página. Compartida por la red, con el nombre de este equipo; y si se queda en localhost (desarrollo), con la IP de
 *  este equipo en la red local, para que un teléfono en el mismo Wi‑Fi la abra. */
export function origenParaUnirse(
  urlPlayer: string | null | undefined,
  pagina: Pick<Location, 'protocol' | 'hostname' | 'origin'>,
  ipEnLaRed?: string,
): string {
  const base = new URL(urlPlayer ? urlEnEsteEquipo(urlPlayer, pagina) : pagina.origin)
  return esLocal(base.hostname) && ipEnLaRed ? `${base.protocol}//${ipEnLaRed}${base.port ? `:${base.port}` : ''}` : base.origin
}

export interface Participante {
  dispositivo: string
  avatar: Avatar
  apodo: string | null
}

const clave = (codigo: string) => `playhub-participante-${codigo}`

/** Lo que este dispositivo recuerda de esa conexión, o null. */
export function participanteGuardado(codigo: string, almacen: Pick<Storage, 'getItem'> | null = guardado()): Participante | null {
  try {
    const p = JSON.parse(almacen?.getItem(clave(codigo)) ?? 'null')
    if (p && typeof p.dispositivo === 'string' && esAvatar(p.avatar)) return { dispositivo: p.dispositivo, avatar: p.avatar, apodo: limpiarApodo(p.apodo) }
  }
  catch { /* sin almacenamiento o dañado */ }
  return null
}

export function guardarParticipante(codigo: string, p: Participante, almacen: Pick<Storage, 'setItem'> | null = guardado()) {
  try { almacen?.setItem(clave(codigo), JSON.stringify(p)) }
  catch { /* sin almacenamiento: no podrá volver como el mismo */ }
}

/** Un identificador nuevo al azar para este dispositivo en esta conexión. */
export function dispositivoNuevo(): string {
  return crypto.randomUUID()
}

function guardado(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage }
  catch { return null }
}
