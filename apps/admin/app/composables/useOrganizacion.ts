import type { Enums } from '~/utils/db'
// Capa de datos del nivel organización (/organizacion/*): lo que un admin gestiona de SU
// organización (licencia, administradores e invitaciones) y lo que cualquiera que la opera lee
// de ella (datos, países, licencia). A diferencia de usePlatform (consola del operador, cruza
// todas las orgs), aquí todo se acota a la organización activa del contexto.

export interface AdminDeOrg {
  id: number                // id del puente organizacion_administradores
  titular: boolean
  created_at: string        // cuándo se unió a la organización
  perfil: { id: number, nombre: string | null, apellido: string | null, email: string | null } | null
}

export interface InvitacionAdminPendiente {
  id: number
  token: string
  email: string | null
  nombre: string | null
  apellido: string | null
  estado: string
  expira_en: string | null
  created_at: string
}

export interface LicenciaDeOrg {
  id: number
  estado: string
  fecha_inicio: string
  fecha_fin: string | null
  notas: string | null
  created_at: string
}

// El detalle de la org tal como lo ve quien la opera: datos generales, países donde opera, su
// contrato (sin cupos, decisión 011) y sus administradores. Misma información que ve el
// superadmin en Platform, sin las acciones de operador.
export interface OrgDetalle {
  id: number
  nombre: string
  correo: string | null
  telefono: string | null
  website: string | null
  paises: string[]
  created_at: string
  tipo: { nombre: Record<string, string> } | null
  licencias: LicenciaDeOrg[]
  administradores: AdminDeOrg[]
}

// Filas demo para el dev sin Supabase (mismo criterio que la superficie demo del contexto).
const DEMO_ADMINS: AdminDeOrg[] = [
  { id: 1, titular: true, created_at: '2026-01-15T00:00:00Z', perfil: { id: 1, nombre: 'Luis', apellido: 'Rodríguez', email: 'luis@nutrinacion.com' } },
  { id: 2, titular: false, created_at: '2026-06-02T00:00:00Z', perfil: { id: 2, nombre: 'Marta', apellido: 'García', email: 'marta@nutrinacion.com' } },
]

const DEMO_ORG: OrgDetalle = {
  id: 1,
  nombre: 'Nutrinación',
  correo: 'hello@nutrinacion.com',
  telefono: '+52 55 1234 5678',
  website: 'nutrinacion.com',
  paises: ['MX', 'GT'],
  created_at: '2026-01-15T00:00:00Z',
  tipo: { nombre: { es: 'Empresa', en: 'Company' } },
  licencias: [{ id: 1, estado: 'ACTIVA', fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31', notas: null, created_at: '2026-01-01T00:00:00Z' }],
  administradores: DEMO_ADMINS,
}

export function useOrganizacion() {
  const { orgActiva } = useContexto()
  const { t } = useT()

  // El detalle completo de la org activa (lectura). La RLS lo permite a quien la opera:
  // organizaciones, licencias y el puente de admins se leen con `organizaciones_visibles()`.
  async function getOrganizacion(): Promise<OrgDetalle | null> {
    if (!isSupabaseConfigured()) return DEMO_ORG
    if (!orgActiva.value) return null
    const { data } = await useSupabaseClient()
      .from('organizaciones')
      .select(`
        id, nombre, correo, telefono, website, paises, created_at,
        tipo:tipos_organizacion ( nombre ),
        licencias:organizacion_licencias ( id, estado, fecha_inicio, fecha_fin, notas, created_at ),
        administradores:organizacion_administradores ( id, titular, created_at, perfil:perfiles ( id, nombre, apellido, email ) )
      `)
      .eq('id', orgActiva.value.id)
      .maybeSingle()
    return (data as unknown as OrgDetalle | null) ?? null
  }

  async function listAdministradores(): Promise<AdminDeOrg[]> {
    if (!isSupabaseConfigured()) return DEMO_ADMINS
    if (!orgActiva.value) return []
    const { data } = await useSupabaseClient()
      .from('organizacion_administradores')
      .select('id, titular, created_at, perfil:perfiles ( id, nombre, apellido, email )')
      .eq('organizacion_id', orgActiva.value.id)
      .order('titular', { ascending: false })
    return (data as AdminDeOrg[] | null) ?? []
  }

  async function getAdministrador(id: number): Promise<AdminDeOrg | null> {
    if (!isSupabaseConfigured()) return DEMO_ADMINS.find(a => a.id === id) ?? null
    const { data } = await useSupabaseClient()
      .from('organizacion_administradores')
      .select('id, titular, created_at, perfil:perfiles ( id, nombre, apellido, email )')
      .eq('id', id)
      .maybeSingle()
    return (data as AdminDeOrg | null) ?? null
  }

  // Corrige los datos del perfil de un admin (nombre/apellido). El correo NO se toca:
  // vive atado a auth.users y cambiarlo aquí lo desincronizaría.
  async function updateAdministrador(perfilId: number, datos: { nombre: string, apellido: string }) {
    if (!isSupabaseConfigured()) return { error: null }
    const { error } = await useSupabaseClient()
      .from('perfiles')
      .update({ nombre: datos.nombre.trim() || null, apellido: datos.apellido.trim() || null })
      .eq('id', perfilId)
    return { error: error?.message ?? null }
  }

  // Quita el ACCESO de administración (borra la fila del puente). La cuenta no se toca:
  // la persona puede volver con una nueva invitación. Al titular no se le quita desde
  // aquí — primero se designa otro titular en Platform.
  async function removeAdministrador(id: number) {
    if (!isSupabaseConfigured()) return { error: null }
    const { error } = await useSupabaseClient()
      .from('organizacion_administradores')
      .delete()
      .eq('id', id)
    return { error: error?.message ?? null }
  }

  // Invitaciones ADMIN aún pendientes de la org, con su token: cierran el ciclo «invité → ¿ya
  // entró?» y dejan copiar el enlace otra vez.
  async function listInvitacionesPendientes(): Promise<InvitacionAdminPendiente[]> {
    if (!isSupabaseConfigured() || !orgActiva.value) return []
    const { data } = await useSupabaseClient()
      .from('invitaciones')
      .select('id, token, email, nombre, apellido, estado, expira_en, created_at')
      .eq('organizacion_id', orgActiva.value.id)
      .eq('role', 'ADMIN')
      .eq('estado', 'PENDIENTE')
      .order('created_at', { ascending: false })
    return (data as InvitacionAdminPendiente[] | null) ?? []
  }

  // Invita un co-admin a la org activa. Solo el titular — la política RLS (0005) lo exige en
  // la base; `esTitularOrgActiva` solo gatea la UI. Devuelve el token: Admin no envía correos
  // (decisión 009), la página muestra el enlace para copiarlo.
  async function invitarAdministrador(payload: {
    email: string
    nombre: string
    apellido: string
    idioma: string
    expira_en: string | null
  }): Promise<{ token: string | null, error: string | null }> {
    if (!isSupabaseConfigured()) return { token: 'demo', error: null }
    if (!orgActiva.value) return { token: null, error: t('ctx.noOrgActive') }
    const { data, error } = await useSupabaseClient()
      .from('invitaciones')
      .insert({
        organizacion_id: orgActiva.value.id,
        role: 'ADMIN',
        email: payload.email || null,
        nombre: payload.nombre.trim() || null,
        apellido: payload.apellido.trim() || null,
        idioma: payload.idioma as Enums<'idioma'>,
        expira_en: payload.expira_en,
      })
      .select('token')
      .single()
    return { token: data?.token ?? null, error: error?.message ?? null }
  }

  async function revocarInvitacion(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await useSupabaseClient().from('invitaciones').update({ estado: 'REVOCADA' }).eq('id', id)
    return { error: error?.message ?? null }
  }

  return {
    getOrganizacion,
    listAdministradores,
    getAdministrador,
    updateAdministrador,
    removeAdministrador,
    listInvitacionesPendientes,
    invitarAdministrador,
    revocarInvitacion,
  }
}
