// «Nuevo Taller» en una sola tarjeta (tarea 023): qué falta en cada sección para publicarlo. Cada sección lo dice en su
// cabecera («Falta la hora») y, después de pulsar «Publicar», el campo que falta se marca y la página baja a la primera
// sección incompleta. Un borrador o uno en revisión solo necesitan el storyboard (la base no pide más). Puro y con tests.

export const SECCIONES_TALLER = ['nombre', 'storyboard', 'educadores', 'cuando', 'audiencia'] as const
export type SeccionTaller = typeof SECCIONES_TALLER[number]
export type FaltaTaller = 'nombre' | 'storyboard' | 'educadores' | 'dia' | 'hora' | 'lugar' | 'fueraDelPrograma' | 'audiencia'

export interface DatosDelTaller {
  titulo: string
  storyboardId: number | null
  educadores: number          // las asignaciones que saldrían (en un grupo, sus miembros activos)
  fecha: string
  hora: string
  lugarId: number | null
  enJornada: boolean          // con jornada, el lugar es el de ella
  fueraDelPrograma: boolean   // la fecha cae fuera de las del programa (la base lo rechazaría)
  audienciaId: number | null
}

/** Lo que falta para publicar, por sección y en el orden en que se ve. Una sección sin nada está completa. */
export function faltasDelTaller(d: DatosDelTaller): Record<SeccionTaller, FaltaTaller[]> {
  return {
    nombre: d.titulo.trim() ? [] : ['nombre'],
    storyboard: d.storyboardId ? [] : ['storyboard'],
    educadores: d.educadores > 0 ? [] : ['educadores'],
    cuando: [
      ...(d.fecha ? [] : ['dia' as const]),
      ...(d.hora ? [] : ['hora' as const]),
      ...(d.enJornada || d.lugarId ? [] : ['lugar' as const]),
      ...(d.fecha && d.fueraDelPrograma ? ['fueraDelPrograma' as const] : []),
    ],
    audiencia: d.audienciaId ? [] : ['audiencia'],
  }
}

/** La primera sección que no está completa, o null si se puede publicar. */
export function primeraIncompleta(faltas: Record<SeccionTaller, FaltaTaller[]>): SeccionTaller | null {
  return SECCIONES_TALLER.find(s => faltas[s].length > 0) ?? null
}

/** «el día, la hora y el lugar»: lo que falta, con comas y una «y» antes del último. */
export function enumerar(partes: string[], y: string): string {
  if (partes.length < 2) return partes[0] ?? ''
  return `${partes.slice(0, -1).join(', ')} ${y} ${partes.at(-1)}`
}
