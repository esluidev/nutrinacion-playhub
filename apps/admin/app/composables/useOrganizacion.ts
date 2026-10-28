import type { Enums } from '~/utils/db'
// Capa de datos del nivel organización (/organizacion/*): lo que un admin gestiona de SU
// org. A diferencia de usePlatform (consola del operador, cruza todas las orgs), aquí todo
// se acota a la organización activa del contexto.

export interface AdminDeOrg {
  id: number                // id del puente organizacion_administradores
  titular: boolean
  created_at: string        // cuándo se unió a la organización
  perfil: { id: number, nombre: string | null, apellido: string | null, email: string | null } | null
}

export interface InvitacionAdminPendiente {
  id: number
  email: string | null
  nombre: string | null
  apellido: string | null
  estado: string
  expira_en: string | null
  created_at: string
}

// El detalle de la org tal como lo ve su admin (titular o no): datos generales +
// licencias + comunidades con su operación (educadores/talleres, mismos embeds de
// conteo que usa la página Comunidades). Misma información que ve el superadmin en
// Platform, sin las acciones de operador.
export interface ComunidadDeOrg {
  id: number
  nombre: string
  pais: string | null
  educadores: { count: number }[]
  talleres: { count: number }[]
}

export interface OrgDetalle {
  id: number
  nombre: string
  correo: string | null
  telefono: string | null
  website: string | null
  created_at: string
  tipo: { nombre: Record<string, string> } | null
  licencias: {
    id: number
    estado: string
    max_comunidades: number
    max_educadores: number
    max_personalizados: number
    fecha_inicio: string
    fecha_fin: string | null
    paises: string[]
    notas: string | null
    created_at: string
  }[]
  comunidades: ComunidadDeOrg[]
  administradores: AdminDeOrg[]
  // Storyboards personalizados de la org (uso contra max_personalizados).
  personalizadosUsados: number
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
  created_at: '2026-01-15T00:00:00Z',
  tipo: { nombre: { es: 'Empresa', en: 'Company' } },
  licencias: [{
    id: 1,
    estado: 'ACTIVA',
    max_comunidades: 5,
    max_educadores: 25,
    max_personalizados: 3,
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    paises: ['MX'],
    notas: null,
    created_at: '2026-01-01T00:00:00Z',
  }],
  comunidades: [
    { id: 1, nombre: 'Comunidad Centro', pais: 'MX', educadores: [{ count: 6 }], talleres: [{ count: 6 }] },
    { id: 2, nombre: 'Comunidad Norte', pais: 'MX', educadores: [{ count: 2 }], talleres: [{ count: 0 }] },
  ],
  administradores: DEMO_ADMINS,
  personalizadosUsados: 1,
}

export function useOrganizacion() {
  const { orgActiva } = useContexto()

  // El detalle completo de la org activa (lectura). El RLS lo permite: organizaciones,
  // licencias y el puente de admins siguen en `authenticated using(true)`, y comunidades
  // ya viene filtrada a las visibles.
  async function getOrganizacion(): Promise<OrgDetalle | null> {
    if (!isSupabaseConfigured()) return DEMO_ORG
    if (!orgActiva.value) return null
    const supabase = useSupabaseClient()
    const [{ data }, { count: personalizados }] = await Promise.all([
      supabase
        .from('organizaciones')
        .select(`
          id, nombre, correo, telefono, website, created_at,
          tipo:tipos_organizacion ( nombre ),
          licencias:organizacion_licencias ( id, estado, max_comunidades, max_educadores, max_personalizados,
            fecha_inicio, fecha_fin, paises, notas, created_at ),
          comunidades ( id, nombre, pais, educadores:comunidad_educadores ( count ), talleres:workshops ( count ) ),
          administradores:organizacion_administradores ( id, titular, perfil:perfiles ( nombre, apellido, email ) )
        `)
        .eq('id', orgActiva.value.id)
        .maybeSingle(),
      supabase
        .from('storyboards')
        .select('id', { count: 'exact', head: true })
        .eq('organizacion_id', orgActiva.value.id),
    ])
    if (!data) return null
    return { ...(data as unknown as Omit<OrgDetalle, 'personalizadosUsados'>), personalizadosUsados: personalizados ?? 0 }
  }

  // Cupo de comunidades contra la licencia VIGENTE (mismo criterio que el trigger 0007:
  // ACTIVA/TRIAL, iniciada, sin fecha_fin o aún no pasada). Esto solo GATEA la UI con un
  // mensaje amable; la regla de verdad vive en la base y frena cualquier insert.
  async function getCupoComunidades(): Promise<{ max: number | null, usadas: number }> {
    if (!isSupabaseConfigured()) return { max: 5, usadas: 2 }
    if (!orgActiva.value) return { max: null, usadas: 0 }
    const supabase = useSupabaseClient()
    // UTC a propósito: replica el trigger, que compara con `current_date` de la base (UTC).
    const hoy = new Date().toISOString().slice(0, 10)
    const [{ data: lic }, { count }] = await Promise.all([
      supabase
        .from('organizacion_licencias')
        .select('max_comunidades')
        .eq('organizacion_id', orgActiva.value.id)
        .in('estado', ['ACTIVA', 'TRIAL'])
        .lte('fecha_inicio', hoy)
        .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('comunidades')
        .select('id', { count: 'exact', head: true })
        .eq('organizacion_id', orgActiva.value.id),
    ])
    return { max: (lic?.max_comunidades as number | undefined) ?? null, usadas: count ?? 0 }
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

  // Invitaciones ADMIN aún pendientes de la org: cierran el ciclo de "invité → ¿ya entró?".
  async function listInvitacionesPendientes(): Promise<InvitacionAdminPendiente[]> {
    if (!isSupabaseConfigured() || !orgActiva.value) return []
    const { data } = await useSupabaseClient()
      .from('invitaciones')
      .select('id, email, nombre, apellido, estado, expira_en, created_at')
      .eq('organizacion_id', orgActiva.value.id)
      .eq('role', 'ADMIN')
      .eq('estado', 'PENDIENTE')
      .order('created_at', { ascending: false })
    return (data as InvitacionAdminPendiente[] | null) ?? []
  }

  // Invita un co-admin a la org activa. Solo el titular — la política RLS (0006) lo exige
  // en la base; `esTitularOrgActiva` solo gatea la UI. El INSERT dispara el Database
  // Webhook → correo (mismo flujo que las invitaciones de Platform).
  async function invitarAdministrador(payload: {
    email: string
    nombre: string
    apellido: string
    idioma: string
    expira_en: string | null
  }): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured()) return { error: null }
    if (!orgActiva.value) return { error: 'Sin organización activa' }
    const { error } = await useSupabaseClient()
      .from('invitaciones')
      .insert({
        organizacion_id: orgActiva.value.id,
        role: 'ADMIN',
        comunidad_id: null,
        email: payload.email || null,
        nombre: payload.nombre.trim() || null,
        apellido: payload.apellido.trim() || null,
        idioma: payload.idioma as Enums<'idioma'>,
        expira_en: payload.expira_en,
      })
    return { error: error?.message ?? null }
  }

  return {
    getOrganizacion,
    getCupoComunidades,
    listAdministradores,
    getAdministrador,
    updateAdministrador,
    removeAdministrador,
    listInvitacionesPendientes,
    invitarAdministrador,
  }
}
