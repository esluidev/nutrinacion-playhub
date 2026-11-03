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

/** Respuesta de educador_entrar y educador_usar_acceso (0013). */
export type RespuestaEntrar =
  | { ok: true, token: string, expira_en: string, educador: Educador }
  | { ok: false, error: 'credenciales' | 'bloqueado' | 'pin_invalido' | 'no_vale' }

/** Respuesta de educador_acceso: a quién es el enlace, antes de elegir el PIN. */
export type RespuestaAcceso =
  | { ok: true, correo: string, nombre: string, organizacion: string, primera_vez: boolean, expira_en: string }
  | { ok: false, error: 'no_vale' }

export function nombreCompleto(educador: Educador): string {
  return [educador.nombre, educador.apellido].filter(Boolean).join(' ')
}
