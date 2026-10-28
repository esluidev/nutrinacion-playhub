// Lógica pura de la sesión del educador (sin Nuxt): la ficha que devuelve la base y lo que se
// muestra de ella. Tiene tests en tests/sesion.test.ts.

export interface Comunidad {
  id: number
  nombre: string
}

export interface Organizacion {
  id: number
  nombre: string
  comunidades: Comunidad[]
}

/** La ficha del educador (educador_sesion): una misma persona puede trabajar en varias comunidades y organizaciones. */
export interface Educador {
  nombre: string
  apellido: string | null
  correo: string
  idioma: 'es' | 'en'
  organizaciones: Organizacion[]
}

/** Respuesta de educador_entrar y educador_activar. */
export type RespuestaEntrar =
  | { ok: true, token: string, expira_en: string, educador: Educador }
  | { ok: false, error: 'credenciales' | 'bloqueado' | 'definir_pin' | 'pin_invalido' }

export function nombreCompleto(educador: Educador): string {
  return [educador.nombre, educador.apellido].filter(Boolean).join(' ')
}

/** Todas sus comunidades, de todas sus organizaciones. */
export function comunidadesDe(educador: Educador): Comunidad[] {
  return (educador.organizaciones ?? []).flatMap(o => o.comunidades ?? [])
}

/**
 * Dónde trabaja, en una línea bajo su nombre: la comunidad si es una sola; la organización si
 * tiene varias comunidades de una misma organización; si no, cuántas comunidades.
 */
export function lugarDeTrabajo(educador: Educador): { nombre: string } | { comunidades: number } {
  const comunidades = comunidadesDe(educador)
  if (comunidades.length === 1) return { nombre: comunidades[0]!.nombre }
  if (educador.organizaciones?.length === 1) return { nombre: educador.organizaciones[0]!.nombre }
  return { comunidades: comunidades.length }
}
