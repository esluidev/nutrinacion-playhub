// Lógica pura de la sesión del educador (sin Nuxt): la ficha que devuelve la base y lo que se
// muestra de ella. Tiene tests en tests/sesion.test.ts.

export interface Organizacion {
  id: number
  nombre: string
}

/** La ficha del educador (educador_sesion): una misma persona puede trabajar en varias organizaciones. */
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

/** Dónde trabaja, en una línea bajo su nombre: la organización si es una sola; si no, cuántas. */
export function lugarDeTrabajo(educador: Educador): { nombre: string } | { organizaciones: number } {
  const organizaciones = educador.organizaciones ?? []
  if (organizaciones.length === 1) return { nombre: organizaciones[0]!.nombre }
  return { organizaciones: organizaciones.length }
}
