// Tipos alineados al esquema v1 de Supabase (supabase/migrations/0001_init.sql).
// La UI de gestión es español; los nombres de campo siguen el esquema (español).
// Tenancy = comunidad (nunca "workspace"): organizacion → comunidad → operacion.

export type Role = 'SUPERADMIN' | 'ADMIN' | 'COLABORADOR' | 'EDUCADOR' | 'PARTICIPANTE'

// Texto multi-idioma tal como lo guarda la BD (jsonb Localized).
export type Localized = { es?: string, en?: string, [lang: string]: string | undefined }

// `superadmin` es lo único que define el tipo de usuario a nivel global (abre /platform).
// Ser admin de una org o colaborador de una comunidad NO es propiedad de la persona: vive en
// organizacion_administradores / colaboradores (por eso alguien puede ser ambas cosas a la vez).
export interface Perfil {
  id: number
  nombre: string | null
  apellido: string | null
  email: string | null
  avatar: string | null
  idioma: string
  superadmin: boolean
  usuario_id: string   // FK a auth.users
  created_at: string
}

export interface Organizacion {
  id: number
  nombre: string
  correo: string | null
  telefono: string | null
  website: string | null
  tipo_id: number | null
  created_at: string
}

export interface Comunidad {
  id: number
  nombre: string
  descripcion: string | null
  correo: string | null
  telefono: string | null
  logo: string | null
  organizacion_id: number
  pais: string | null   // codigo ISO alpha-2
  created_at: string
}

// Comunidad con su organizacion resuelta: el switcher las agrupa por org, y para las
// comunidades donde solo colaboro necesito el nombre de una org que no administro.
export interface ComunidadConOrg extends Comunidad {
  organizaciones: { id: number, nombre: string } | null
}

// Usuario administrativo autenticado con su SUPERFICIE DE ACCESO resuelta.
// Las tres piezas responden "que puedo tocar": el flag global, las orgs que administro, y las
// comunidades a las que llego (por administrar su org o por colaborar en ellas).
export interface AuthUser {
  id: string                        // auth.users.id (uuid)
  email: string
  perfil: Perfil                    // perfil.superadmin abre /platform
  organizaciones: Organizacion[]    // las que ADMINISTRO (via organizacion_administradores)
  comunidades: ComunidadConOrg[]    // a las que tengo acceso (el RLS de 0002 las filtra)
  colaboraEn: number[]              // ids de comunidades donde soy COLABORADOR activo
  titularDe: number[]               // ids de orgs donde soy el TITULAR (puede invitar co-admins)
}

// Info de una invitacion validada, tal como la devuelve la Edge Function `canjear-invitacion`.
export interface InvitacionInfo {
  role: Extract<Role, 'ADMIN' | 'COLABORADOR'>
  email: string | null
  organizacion: string
  comunidad: string | null
  // Si el correo invitado ya tiene cuenta, esta pagina no ofrece crear una: la invitacion se
  // acepta dentro de la app, desde /invitaciones.
  cuentaExiste: boolean
}
