// Tipos alineados al esquema de Supabase (supabase/migrations). Los nombres de campo siguen el
// esquema (español). Tenancy = organización (decisión 011): la organización es la única unidad
// de operación; no hay comunidades.

export type Role = 'SUPERADMIN' | 'ADMIN' | 'COLABORADOR' | 'EDUCADOR'

// Texto multi-idioma tal como lo guarda la BD (jsonb Localized).
export type Localized = { es?: string, en?: string, [lang: string]: string | undefined }

// `superadmin` es lo único que define el tipo de usuario a nivel global (abre /platform).
// Ser admin o colaborador de una organización NO es propiedad de la persona: vive en
// organizacion_administradores / organizacion_colaboradores (por eso alguien puede ser ambas
// cosas en organizaciones distintas).
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
  logo: string | null
  paises: string[]      // donde opera (códigos de `paises`, uno o más): deciden su catálogo
  tipo_id: number | null
  created_at: string
}

// Usuario administrativo autenticado con su SUPERFICIE DE ACCESO resuelta.
// Las piezas responden «qué puedo tocar»: el flag global, las organizaciones que administro y
// aquellas donde colaboro (operación sin licencia, administradores ni colaboradores).
export interface AuthUser {
  id: string                        // auth.users.id (uuid)
  email: string
  perfil: Perfil                    // perfil.superadmin abre /platform
  organizaciones: Organizacion[]    // las que ADMINISTRO (via organizacion_administradores)
  colaboraEn: Organizacion[]        // donde soy COLABORADOR activo (organizacion_colaboradores)
  titularDe: number[]               // ids de orgs donde soy el TITULAR (puede invitar co-admins)
}

// Info de una invitación validada, tal como la devuelve la Edge Function `canjear-invitacion`.
export interface InvitacionInfo {
  role: Extract<Role, 'ADMIN' | 'COLABORADOR'>
  email: string | null
  nombre: string            // a quién se invitó: rellena el registro
  apellido: string
  titular: boolean          // invitación de administrador que será el titular
  organizacion: string
  // Si el correo invitado ya tiene cuenta, esta página no ofrece crear una: la invitación se
  // acepta dentro de la app, desde /invitaciones.
  cuentaExiste: boolean
}
