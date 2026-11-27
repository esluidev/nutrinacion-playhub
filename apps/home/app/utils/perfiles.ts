import { esAvatar, limpiarApodo } from '@playhub/ui/app/utils/avatares'
import type { Avatar } from '@playhub/ui/app/utils/avatares'

// Los perfiles de los niños, en el dispositivo (decisión de Luis del 2026-11-17: sin cuenta, todo en el dispositivo).
// Un perfil es un apodo (en pantalla, «nombre»; nunca el nombre real), un avatar, el mes y el año de nacimiento (no la
// fecha completa) y el género, niña o niño (solo para estadísticas generales). Con el mes y el año sale su edad y, con ella, la
// edición de los storyboards que le tocan. Sin dibujo ni Vue, con sus pruebas (tests/perfiles.test.ts).

export type Genero = 'nina' | 'nino'
export const GENEROS: readonly Genero[] = ['nina', 'nino']

export type Edicion = 'KIDS' | 'PREADOLESCENTES' | 'ADOLESCENTES'

export interface Perfil {
  /** Al azar, del dispositivo: con él el runner recuerda dónde iba. Nada que diga quién es. */
  id: string
  nombre: string
  avatar: Avatar
  /** 1 a 12. */
  mes: number
  anio: number
  genero: Genero
  /** Cuándo cambió por última vez (él, lo que terminó o dónde iba): con cuenta, gana el cambio más nuevo. */
  actualizado?: string
}

/** Las edades de Nutrinación Play: de 4 a 17 años. */
export const EDAD_MIN = 4
export const EDAD_MAX = 17

/** Los años de nacimiento que se ofrecen: de quien cumple 17 este año a quien cumple 4. */
export function aniosDeNacimiento(hoy = new Date()): number[] {
  const anio = hoy.getFullYear()
  return Array.from({ length: EDAD_MAX - EDAD_MIN + 1 }, (_, i) => anio - EDAD_MIN - i)
}

/** Su edad en años cumplidos, contando el mes (sin el día: se toma el primero del mes). */
export function edadDe(perfil: Pick<Perfil, 'mes' | 'anio'>, hoy = new Date()): number {
  const meses = (hoy.getFullYear() - perfil.anio) * 12 + (hoy.getMonth() + 1 - perfil.mes)
  return Math.floor(meses / 12)
}

/** La edición que le toca: Infantil hasta los 8, Preadolescencia de 9 a 12 y Adolescencia desde los 13. */
export function edicionDe(edad: number): Edicion {
  if (edad <= 8) return 'KIDS'
  if (edad <= 12) return 'PREADOLESCENTES'
  return 'ADOLESCENTES'
}

export interface BorradorPerfil {
  nombre: string
  avatar: string | null
  mes: number | null
  anio: number | null
  genero: Genero | null
}

/** Lo que le falta a un perfil para guardarse, en orden; vacío, se puede guardar. */
export function faltaEnPerfil(borrador: BorradorPerfil): ('nombre' | 'avatar' | 'nacimiento' | 'genero')[] {
  const falta: ('nombre' | 'avatar' | 'nacimiento' | 'genero')[] = []
  if (!limpiarApodo(borrador.nombre)) falta.push('nombre')
  if (!esAvatar(borrador.avatar)) falta.push('avatar')
  if (!borrador.mes || !borrador.anio || borrador.mes < 1 || borrador.mes > 12) falta.push('nacimiento')
  if (!borrador.genero || !GENEROS.includes(borrador.genero)) falta.push('genero')
  return falta
}

/** Un identificador al azar para un perfil nuevo. */
export function nuevoIdDePerfil(azar: () => number = Math.random): string {
  return `p-${Date.now().toString(36)}-${Math.floor(azar() * 36 ** 6).toString(36).padStart(6, '0')}`
}

/** Los perfiles guardados, solo los que se entienden (lo demás, se ignora). */
export function leerPerfiles(texto: string | null | undefined): Perfil[] {
  try {
    const lista = JSON.parse(texto ?? '[]')
    if (!Array.isArray(lista)) return []
    return lista.flatMap((p): Perfil[] => {
      const nombre = limpiarApodo(p?.nombre)
      if (typeof p?.id !== 'string' || !/^[\w-]{1,40}$/.test(p.id) || !nombre || !esAvatar(p.avatar)) return []
      const mes = Number(p.mes)
      const anio = Number(p.anio)
      if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(anio) || !GENEROS.includes(p.genero)) return []
      const actualizado = typeof p.actualizado === 'string' ? { actualizado: p.actualizado } : {}
      return [{ id: p.id, nombre, avatar: p.avatar, mes, anio, genero: p.genero as Genero, ...actualizado }]
    })
  }
  catch {
    return []
  }
}
