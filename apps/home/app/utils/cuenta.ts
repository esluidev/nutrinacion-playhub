import { esAvatar, limpiarApodo } from '@playhub/ui/app/utils/avatares'
import type { Avance } from './catalogo'
import { GENEROS } from './perfiles'
import type { Genero, Perfil } from './perfiles'

// La cuenta del adulto (0018, tarea 025): los perfiles, lo que terminó cada uno y dónde iba suben a la cuenta y bajan a
// cada dispositivo donde se entre. De cada perfil gana el cambio más nuevo; uno eliminado viaja marcado, sin sus datos,
// para quitarlo de los demás dispositivos. Sin dibujo ni Vue, con sus pruebas (tests/cuenta.test.ts).

/** Un perfil como lo guarda la cuenta (`hogar_perfiles`). */
export interface PerfilDeCuenta {
  id: string
  nombre: string | null
  avatar: string | null
  mes: number | null
  anio: number | null
  genero: Genero | null
  terminados: string[]
  avance: Avance | null
  actualizado: string
  eliminado: boolean
}

/** Lo que el dispositivo guarda de los perfiles. */
export interface DatosDelDispositivo {
  perfiles: Perfil[]
  terminados: Record<string, string[]>
  avances: Record<string, Avance>
  /** Los perfiles eliminados aquí que la cuenta todavía no sabe, con cuándo se eliminaron. */
  eliminados: Record<string, string>
}

const EPOCA = new Date(0).toISOString()

function tiempo(fecha: string | null | undefined): number {
  const t = Date.parse(fecha ?? '')
  return Number.isNaN(t) ? 0 : t
}

/** Lo del dispositivo, como lo guarda la cuenta (los eliminados, sin sus datos). */
export function paraLaCuenta(datos: DatosDelDispositivo): PerfilDeCuenta[] {
  const vivos = new Set(datos.perfiles.map(p => p.id))
  return [
    ...datos.perfiles.map(p => ({
      id: p.id,
      nombre: p.nombre,
      avatar: p.avatar,
      mes: p.mes,
      anio: p.anio,
      genero: p.genero,
      terminados: datos.terminados[p.id] ?? [],
      avance: datos.avances[p.id] ?? null,
      actualizado: p.actualizado ?? EPOCA,
      eliminado: false,
    })),
    ...Object.entries(datos.eliminados)
      .filter(([id]) => !vivos.has(id))
      .map(([id, actualizado]) => ({
        id, nombre: null, avatar: null, mes: null, anio: null, genero: null, terminados: [], avance: null, actualizado, eliminado: true,
      })),
  ]
}

/** El perfil del dispositivo que sale de uno de la cuenta, si se entiende (si no, se ignora). */
export function aPerfil(p: PerfilDeCuenta): Perfil | null {
  const nombre = limpiarApodo(p.nombre)
  if (p.eliminado || !nombre || !esAvatar(p.avatar) || !p.genero || !GENEROS.includes(p.genero)) return null
  if (!Number.isInteger(p.mes) || p.mes! < 1 || p.mes! > 12 || !Number.isInteger(p.anio)) return null
  return { id: p.id, nombre, avatar: p.avatar, mes: p.mes!, anio: p.anio!, genero: p.genero, actualizado: p.actualizado }
}

/**
 * Lo del dispositivo con lo de la cuenta: de cada perfil, el cambio más nuevo (en un empate, el de la cuenta).
 * `datos` es lo que queda en el dispositivo, en su orden y después los que llegan de la cuenta; `subir`, lo que la
 * cuenta no tiene o tiene más viejo. Un eliminado aquí que la cuenta nunca tuvo no se sube.
 */
export function combinar(dispositivo: DatosDelDispositivo, cuenta: PerfilDeCuenta[]): { datos: DatosDelDispositivo, subir: PerfilDeCuenta[] } {
  const remotos = new Map(cuenta.map(r => [r.id, r]))
  const ganadores = new Map<string, PerfilDeCuenta>()
  const subir: PerfilDeCuenta[] = []

  for (const local of paraLaCuenta(dispositivo)) {
    const remoto = remotos.get(local.id)
    if (remoto && tiempo(remoto.actualizado) >= tiempo(local.actualizado)) {
      ganadores.set(local.id, remoto)
    }
    else if (remoto || !local.eliminado) {
      ganadores.set(local.id, local)
      subir.push(local)
    }
  }
  for (const remoto of cuenta) {
    if (!ganadores.has(remoto.id)) ganadores.set(remoto.id, remoto)
  }

  const datos: DatosDelDispositivo = { perfiles: [], terminados: {}, avances: {}, eliminados: {} }
  for (const id of new Set([...dispositivo.perfiles.map(p => p.id), ...cuenta.map(r => r.id)])) {
    const ganador = ganadores.get(id)
    const perfil = ganador && aPerfil(ganador)
    if (!ganador || !perfil) continue
    datos.perfiles.push(perfil)
    if (ganador.terminados.length) datos.terminados[id] = [...ganador.terminados]
    if (ganador.avance) datos.avances[id] = { ...ganador.avance }
  }
  // Los eliminados aquí que hay que contarle a la cuenta se quedan hasta que la cuenta los tenga.
  for (const s of subir) {
    if (s.eliminado) datos.eliminados[s.id] = s.actualizado
  }
  return { datos, subir }
}

/**
 * Al entrar en un dispositivo que ya tenía perfiles: los que la cuenta no conoce, para preguntar si se guardan en ella.
 * Si la cuenta todavía no tiene ninguno (se acaba de crear aquí), ninguno: suben todos sin preguntar.
 */
export function porGuardar(dispositivo: DatosDelDispositivo, cuenta: PerfilDeCuenta[]): Perfil[] {
  if (!cuenta.some(r => !r.eliminado)) return []
  const conocidos = new Set(cuenta.map(r => r.id))
  return dispositivo.perfiles.filter(p => !conocidos.has(p.id))
}

/** El dispositivo sin esos perfiles ni lo suyo, sin contárselo a la cuenta («Quitar de este dispositivo»). */
export function sinEstos(dispositivo: DatosDelDispositivo, ids: string[]): DatosDelDispositivo {
  const fuera = new Set(ids)
  const sin = <T>(mapa: Record<string, T>) => Object.fromEntries(Object.entries(mapa).filter(([id]) => !fuera.has(id)))
  return {
    perfiles: dispositivo.perfiles.filter(p => !fuera.has(p.id)),
    terminados: sin(dispositivo.terminados),
    avances: sin(dispositivo.avances),
    eliminados: sin(dispositivo.eliminados),
  }
}
