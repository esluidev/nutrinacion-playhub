// Quien se une a un taller desde su dispositivo (tarea 013): el código que escribe o trae el QR, y lo
// que el dispositivo recuerda de esa conexión para volver como el mismo al recargar (su identificador
// al azar, su avatar y su apodo). Se guarda por código (en otro taller es otro participante) y por pestaña
// (`sessionStorage`): recargar, o que el navegador descarte la pestaña y la reabra, lo deja donde estaba;
// cerrarla y volver a escanear el QR, o salir del taller, empieza de cero (Luis, 2026-11-26: al volver a
// escanear entraba directo, con el mismo avatar y nombre).

import { esLocal, urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import { esAvatar, limpiarApodo } from '@playhub/ui/app/utils/avatares'
import type { Avatar } from '@playhub/ui/app/utils/avatares'

// El código del taller vive en el kit (lo usa también la app del hogar); se reexporta para el runner.
export { codigoAlEscribir, codigoLegible, codigoValido, normalizarCodigo } from '@playhub/ui/app/utils/codigo-taller'

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

/**
 * Un identificador nuevo al azar para este dispositivo en esta conexión (un UUID v4, como pide la base).
 * `crypto.randomUUID` solo existe en una página segura (https o localhost): en la red local el teléfono abre
 * http://192.168…, y ahí se arma con `crypto.getRandomValues`, que sí existe.
 */
export function dispositivoNuevo(azar: Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>> = crypto): string {
  if (typeof azar.randomUUID === 'function') return azar.randomUUID()
  const b = azar.getRandomValues(new Uint8Array(16))
  b[6] = (b[6]! & 0x0F) | 0x40 // versión 4
  b[8] = (b[8]! & 0x3F) | 0x80 // variante RFC 4122
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/**
 * Para numerar los nombres repetidos («Lila 2»), solo cuentan los que están ahora: los que esperan (la base ya no da las
 * solicitudes sin señal) y los aprobados conectados. Un quitado, un rechazado o un aprobado que se fue no ocupa un nombre
 * (Luis, 2026-11-26: tras quitar a Lila y volver a pedirlo, salía «Lila 3» con una sola Lila).
 */
export function estanAhora<T extends { dispositivo: string, estado: string, conectado: boolean }>(lista: T[], presentes: { has: (id: string) => boolean }): T[] {
  return lista.filter(p => p.estado === 'esperando' || (p.estado === 'aprobado' && (p.conectado || presentes.has(p.dispositivo))))
}

/** Sale del taller: el dispositivo lo olvida y, si vuelve, elige avatar y nombre y lo solicita de nuevo. */
export function olvidarParticipante(codigo: string, almacen: Pick<Storage, 'removeItem'> | null = guardado()) {
  try { almacen?.removeItem(clave(codigo)) }
  catch { /* sin almacenamiento */ }
}

function guardado(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.sessionStorage }
  catch { return null }
}
