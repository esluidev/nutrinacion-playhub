import type { ActividadItem, AtencionItem, LicenciaLigera, OrgLigera } from '~/utils/platformResumen'

// Capa de acceso a datos de la consola del superadmin (/platform).
// Todo pasa por Supabase. El acceso a /platform lo gatea el middleware (perfiles.superadmin);
// el RLS es simple (usuario autenticado) y no filtra por organización.
// La ORGANIZACION es el eje; licencias e invitaciones son vistas de monitoreo.
// Las listas paginan y filtran EN SERVIDOR (pensado para 100+ orgs / 1000+ licencias).

export const PAGE_SIZE = 20

export interface OrgResumen {
  id: number
  nombre: string
  correo: string | null
  telefono: string | null
  website: string | null
  created_at: string
  tipo_id: number | null
  tipo: { nombre: Record<string, string> } | null
  administradores: { titular: boolean, perfil: { nombre: string | null, apellido: string | null } | null }[]
  licencias: { id: number, estado: string, created_at: string, fecha_fin: string | null }[]
  comunidades: { count: number }[]
}

export interface LicenciaResumen {
  id: number
  estado: string
  max_comunidades: number
  max_educadores: number
  max_personalizados: number
  fecha_inicio: string
  fecha_fin: string | null
  paises: string[]
  notas: string | null
  organizaciones: { id: number, nombre: string } | null
}

export interface InvitacionResumen {
  id: number
  token: string
  role: string
  email: string | null
  estado: string
  expira_en: string | null
  idioma: string
  created_at: string
  organizaciones: { id: number, nombre: string } | null
}

export interface DatosOrganizacion {
  nombre: string
  correo: string
  telefono: string
  website: string
  tipo_id: number | null
}

export interface DatosLicencia {
  organizacion_id: number
  max_comunidades: number
  max_educadores: number
  max_personalizados: number
  fecha_inicio: string
  fecha_fin: string | null
  estado: string
  paises: string[]
  notas: string
}

// Vista rápida del estado de la plataforma (dashboard de entrada del operador).
// Las reglas de negocio (vigencia, atención, actividad) viven en utils/platformResumen.
export interface ResumenPlatform {
  organizaciones: number
  orgsConLicenciaVigente: number
  comunidades: number
  educadores: number
  talleres: number
  talleresProgramados: number
  licencias: { vigentes: number, trials: number, porVencer: number, vencidas: number }
  atencion: AtencionItem[]
  actividad: ActividadItem[]
  invitacionesPendientes: number
  invitacionesRecientes: { id: number, email: string | null, created_at: string, organizaciones: { nombre: string } | null }[]
}

function rango(page: number): [number, number] {
  const from = (page - 1) * PAGE_SIZE
  return [from, from + PAGE_SIZE - 1]
}

// Trim + vacío→null para el payload de una organización.
function normalizarOrg(p: DatosOrganizacion) {
  return {
    nombre: p.nombre.trim(),
    correo: p.correo.trim() || null,
    telefono: p.telefono.trim() || null,
    website: p.website.trim() || null,
    tipo_id: p.tipo_id,
  }
}

// Platform no tiene filas demo: es la consola del operador y sus datos son reales por
// definición. En dev sin Supabase cada función devuelve su valor NEUTRO, para que el
// chrome (sidebar, toolbars, estados vacíos) se pueda recorrer sin sesión.
const RESUMEN_VACIO: ResumenPlatform = {
  organizaciones: 0,
  orgsConLicenciaVigente: 0,
  comunidades: 0,
  educadores: 0,
  talleres: 0,
  talleresProgramados: 0,
  licencias: { vigentes: 0, trials: 0, porVencer: 0, vencidas: 0 },
  atencion: [],
  actividad: [],
  invitacionesPendientes: 0,
  invitacionesRecientes: [],
}

export function usePlatform() {
  // El cliente se resuelve POR LLAMADA, no al invocar el composable: `utils/supabase.ts`
  // lanza si faltan las env vars, así que construirlo aquí hacía que bastara con llamar a
  // este composable para tumbar la página en dev sin Supabase.
  const supabase = () => useSupabaseClient()

  // ── Dashboard del operador ──────────────────────────────────────────────────
  // Orgs y licencias se traen COMPLETAS pero ligeras (al scale objetivo, ~100 orgs):
  // el desglose y la lista de atención se computan con las reglas puras de utils.
  async function getResumenPlatform(): Promise<ResumenPlatform> {
    if (!isSupabaseConfigured()) return RESUMEN_VACIO
    const head = { count: 'exact' as const, head: true }
    const hoy = new Date().toISOString().slice(0, 10)

    const [orgsRes, licRes, educadores, talleres, programados, invPendientes, invRecientes] = await Promise.all([
      supabase()
        .from('organizaciones')
        .select('id, nombre, created_at, comunidades ( id, nombre, created_at ), administradores:organizacion_administradores ( id )'),
      supabase()
        .from('licencias')
        .select('id, estado, fecha_inicio, fecha_fin, max_comunidades, organizacion_id, created_at'),
      supabase().from('educadores').select('id', head).is('deleted_at', null),
      supabase().from('talleres').select('id', head),
      supabase().from('talleres').select('id', head).eq('estado', 'PROGRAMADO'),
      supabase().from('invitaciones').select('id', head).eq('role', 'ADMIN').eq('estado', 'PENDIENTE'),
      supabase()
        .from('invitaciones')
        .select('id, email, created_at, organizaciones!inner ( nombre )')
        .eq('role', 'ADMIN')
        .eq('estado', 'PENDIENTE')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const orgs = (orgsRes.data as unknown as OrgLigera[] | null) ?? []
    const licencias = (licRes.data as LicenciaLigera[] | null) ?? []

    return {
      organizaciones: orgs.length,
      orgsConLicenciaVigente: orgs.filter(o => licenciaVigenteDe(licencias, o.id, hoy)).length,
      comunidades: orgs.reduce((total, o) => total + o.comunidades.length, 0),
      educadores: educadores.count ?? 0,
      talleres: talleres.count ?? 0,
      talleresProgramados: programados.count ?? 0,
      licencias: resumenLicencias(licencias, hoy),
      atencion: construirAtencion(orgs, licencias, hoy),
      actividad: construirActividad(orgs),
      invitacionesPendientes: invPendientes.count ?? 0,
      invitacionesRecientes: (invRecientes.data as ResumenPlatform['invitacionesRecientes'] | null) ?? [],
    }
  }

  // ── Catálogo ──────────────────────────────────────────────────────────────
  async function listTiposOrganizacion() {
    if (!isSupabaseConfigured()) return [] as { id: number, codigo: string, nombre: Record<string, string> }[]
    const { data } = await supabase()
      .from('tipos_organizacion').select('id, codigo, nombre').eq('activo', true).order('orden')
    return (data as { id: number, codigo: string, nombre: Record<string, string> }[] | null) ?? []
  }

  async function listPaises() {
    if (!isSupabaseConfigured()) return [] as { codigo: string, nombre: Record<string, string>, bandera: string | null }[]
    const { data } = await supabase()
      .from('paises').select('codigo, nombre, bandera').eq('activo', true).order('codigo')
    return (data as { codigo: string, nombre: Record<string, string>, bandera: string | null }[] | null) ?? []
  }

  // Orgs para dropdowns (id + nombre, sin paginar).
  async function listOrganizacionesSimple() {
    if (!isSupabaseConfigured()) return [] as { id: number, nombre: string }[]
    const { data } = await supabase().from('organizaciones').select('id, nombre').order('nombre')
    return (data as { id: number, nombre: string }[] | null) ?? []
  }

  // ── Organizaciones (eje, paginado en servidor) ──────────────────────────────
  async function listOrganizaciones(opts: {
    q?: string
    tipo_id?: number | null
    admins?: 'todos' | 'con' | 'sin'
    page?: number
  } = {}) {
    if (!isSupabaseConfigured()) return { data: [] as OrgResumen[], total: 0 }
    const [from, to] = rango(opts.page ?? 1)

    // Filtro con/sin administradores: PostgREST no hace anti-join, así que resolvemos aparte
    // los ids de organización que tienen algún admin (barato al scale objetivo, ~100 orgs).
    let idsConAdmin: number[] | null = null
    if (opts.admins === 'con' || opts.admins === 'sin') {
      const { data: rows } = await supabase().from('organizacion_administradores').select('organizacion_id')
      idsConAdmin = [...new Set(((rows as { organizacion_id: number }[] | null) ?? []).map(r => r.organizacion_id))]
    }

    let query = supabase()
      .from('organizaciones')
      .select(`
        id, nombre, correo, telefono, website, created_at, tipo_id,
        tipo:tipos_organizacion ( nombre ),
        administradores:organizacion_administradores ( titular, perfil:perfiles ( nombre, apellido ) ),
        licencias ( id, estado, created_at, fecha_fin ),
        comunidades ( count )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (opts.q) query = query.ilike('nombre', `%${opts.q}%`)
    if (opts.tipo_id) query = query.eq('tipo_id', opts.tipo_id)
    if (opts.admins === 'con') {
      if (!idsConAdmin!.length) return { data: [], total: 0 }
      query = query.in('id', idsConAdmin!)
    }
    if (opts.admins === 'sin' && idsConAdmin!.length) {
      query = query.not('id', 'in', `(${idsConAdmin!.join(',')})`)
    }

    const { data, count } = await query
    return { data: (data as OrgResumen[] | null) ?? [], total: count ?? 0 }
  }

  async function getOrganizacion(id: number) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    const { data, error } = await supabase()
      .from('organizaciones')
      .select(`
        id, nombre, correo, telefono, website, created_at, tipo_id,
        tipo:tipos_organizacion ( nombre ),
        administradores:organizacion_administradores ( id, titular, perfil:perfiles ( id, nombre, apellido, email ) ),
        licencias ( * ),
        comunidades ( id, nombre, pais, created_at ),
        invitaciones ( id, token, role, email, estado, expira_en, comunidad_id, idioma, created_at )
      `)
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  }

  async function createOrganizacion(payload: DatosOrganizacion) {
    if (!isSupabaseConfigured()) return { id: null as number | null, error: null as string | null }
    const { data, error } = await supabase()
      .from('organizaciones')
      .insert(normalizarOrg(payload))
      .select('id').single()
    return { id: (data?.id as number) ?? null, error: error?.message ?? null }
  }

  async function updateOrganizacion(id: number, payload: DatosOrganizacion) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase()
      .from('organizaciones')
      .update(normalizarOrg(payload))
      .eq('id', id)
    return { error: error?.message ?? null }
  }

  // Las FK (comunidades, licencias, admins) son restrict: si tiene datos colgando,
  // Postgres lo rechaza y el error se muestra tal cual — no hay borrado en cascada.
  async function deleteOrganizacion(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase()
      .from('organizaciones')
      .delete()
      .eq('id', id)
    return { error: error?.message ?? null }
  }

  // Designa el titular de una organización: marca UN administrador y desmarca al resto.
  async function setTitular(organizacionId: number, adminId: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error: e1 } = await supabase()
      .from('organizacion_administradores')
      .update({ titular: false })
      .eq('organizacion_id', organizacionId)
    if (e1) return { error: e1.message }
    const { error: e2 } = await supabase()
      .from('organizacion_administradores')
      .update({ titular: true })
      .eq('id', adminId)
    return { error: e2?.message ?? null }
  }

  // ── Licencias (monitoreo + CRUD) ────────────────────────────────────────────
  async function listLicencias(opts: { q?: string, estado?: string, page?: number } = {}) {
    if (!isSupabaseConfigured()) return { data: [] as LicenciaResumen[], total: 0 }
    const [from, to] = rango(opts.page ?? 1)
    let query = supabase()
      .from('licencias')
      .select(`
        id, estado, max_comunidades, max_educadores, max_personalizados,
        fecha_inicio, fecha_fin, paises, notas,
        organizaciones!inner ( id, nombre )
      `, { count: 'exact' })
      .order('fecha_fin', { ascending: true, nullsFirst: false })
      .range(from, to)

    if (opts.estado && opts.estado !== 'todas') query = query.eq('estado', opts.estado)
    if (opts.q) query = query.ilike('organizaciones.nombre', `%${opts.q}%`)

    const { data, count } = await query
    return { data: (data as LicenciaResumen[] | null) ?? [], total: count ?? 0 }
  }

  async function getLicencia(id: number) {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase()
      .from('licencias').select('*, organizaciones ( id, nombre )').eq('id', id).maybeSingle()
    return data
  }

  async function createLicencia(payload: DatosLicencia) {
    if (!isSupabaseConfigured()) return { id: null as number | null, error: null as string | null }
    const { data, error } = await supabase().from('licencias').insert(payload).select('id').single()
    return { id: (data?.id as number) ?? null, error: error?.message ?? null }
  }

  async function updateLicencia(id: number, payload: Omit<DatosLicencia, 'organizacion_id'>) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('licencias').update(payload).eq('id', id)
    return { error: error?.message ?? null }
  }

  async function deleteLicencia(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('licencias').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  // ── Invitaciones ADMIN (monitoreo de onboarding) ────────────────────────────
  async function listInvitacionesAdmin(opts: { q?: string, estado?: string, page?: number } = {}) {
    if (!isSupabaseConfigured()) return { data: [] as InvitacionResumen[], total: 0 }
    const [from, to] = rango(opts.page ?? 1)
    let query = supabase()
      .from('invitaciones')
      .select(`
        id, token, role, email, estado, expira_en, idioma, created_at,
        organizaciones!inner ( id, nombre )
      `, { count: 'exact' })
      .eq('role', 'ADMIN')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (opts.estado && opts.estado !== 'todas') query = query.eq('estado', opts.estado)
    if (opts.q) query = query.ilike('organizaciones.nombre', `%${opts.q}%`)

    const { data, count } = await query
    return { data: (data as InvitacionResumen[] | null) ?? [], total: count ?? 0 }
  }

  // Emite una invitación de ADMIN. El INSERT dispara el Database Webhook → correo.
  async function createInvitacionAdmin(payload: {
    organizacion_id: number
    email: string
    idioma: string
    expira_en: string | null
  }) {
    if (!isSupabaseConfigured()) return { data: null, error: null as string | null }
    const { data, error } = await supabase()
      .from('invitaciones')
      .insert({
        organizacion_id: payload.organizacion_id,
        role: 'ADMIN',
        comunidad_id: null,
        email: payload.email || null,
        idioma: payload.idioma,
        expira_en: payload.expira_en,
      })
      .select('id, token').single()
    return { data, error: error?.message ?? null }
  }

  async function revokeInvitacion(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('invitaciones').update({ estado: 'REVOCADA' }).eq('id', id)
    return { error: error?.message ?? null }
  }

  return {
    getResumenPlatform,
    listTiposOrganizacion,
    listPaises,
    listOrganizacionesSimple,
    listOrganizaciones,
    getOrganizacion,
    createOrganizacion,
    updateOrganizacion,
    deleteOrganizacion,
    setTitular,
    listLicencias,
    getLicencia,
    createLicencia,
    updateLicencia,
    deleteLicencia,
    listInvitacionesAdmin,
    createInvitacionAdmin,
    revokeInvitacion,
  }
}
