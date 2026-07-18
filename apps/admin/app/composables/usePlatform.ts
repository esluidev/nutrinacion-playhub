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

export function usePlatform() {
  const supabase = useSupabaseClient()

  // ── Catálogo ──────────────────────────────────────────────────────────────
  async function listTiposOrganizacion() {
    const { data } = await supabase
      .from('tipos_organizacion').select('id, codigo, nombre').eq('activo', true).order('orden')
    return (data as { id: number, codigo: string, nombre: Record<string, string> }[] | null) ?? []
  }

  async function listPaises() {
    const { data } = await supabase
      .from('paises').select('codigo, nombre, bandera').eq('activo', true).order('codigo')
    return (data as { codigo: string, nombre: Record<string, string>, bandera: string | null }[] | null) ?? []
  }

  // Orgs para dropdowns (id + nombre, sin paginar).
  async function listOrganizacionesSimple() {
    const { data } = await supabase.from('organizaciones').select('id, nombre').order('nombre')
    return (data as { id: number, nombre: string }[] | null) ?? []
  }

  // ── Organizaciones (eje, paginado en servidor) ──────────────────────────────
  async function listOrganizaciones(opts: {
    q?: string
    tipo_id?: number | null
    admins?: 'todos' | 'con' | 'sin'
    page?: number
  } = {}) {
    const [from, to] = rango(opts.page ?? 1)

    // Filtro con/sin administradores: PostgREST no hace anti-join, así que resolvemos aparte
    // los ids de organización que tienen algún admin (barato al scale objetivo, ~100 orgs).
    let idsConAdmin: number[] | null = null
    if (opts.admins === 'con' || opts.admins === 'sin') {
      const { data: rows } = await supabase.from('organizacion_administradores').select('organizacion_id')
      idsConAdmin = [...new Set(((rows as { organizacion_id: number }[] | null) ?? []).map(r => r.organizacion_id))]
    }

    let query = supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('organizaciones')
      .insert(normalizarOrg(payload))
      .select('id').single()
    return { id: (data?.id as number) ?? null, error: error?.message ?? null }
  }

  async function updateOrganizacion(id: number, payload: DatosOrganizacion) {
    const { error } = await supabase
      .from('organizaciones')
      .update(normalizarOrg(payload))
      .eq('id', id)
    return { error: error?.message ?? null }
  }

  // Designa el titular de una organización: marca UN administrador y desmarca al resto.
  async function setTitular(organizacionId: number, adminId: number) {
    const { error: e1 } = await supabase
      .from('organizacion_administradores')
      .update({ titular: false })
      .eq('organizacion_id', organizacionId)
    if (e1) return { error: e1.message }
    const { error: e2 } = await supabase
      .from('organizacion_administradores')
      .update({ titular: true })
      .eq('id', adminId)
    return { error: e2?.message ?? null }
  }

  // ── Licencias (monitoreo + CRUD) ────────────────────────────────────────────
  async function listLicencias(opts: { q?: string, estado?: string, page?: number } = {}) {
    const [from, to] = rango(opts.page ?? 1)
    let query = supabase
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
    const { data } = await supabase
      .from('licencias').select('*, organizaciones ( id, nombre )').eq('id', id).maybeSingle()
    return data
  }

  async function createLicencia(payload: DatosLicencia) {
    const { data, error } = await supabase.from('licencias').insert(payload).select('id').single()
    return { id: (data?.id as number) ?? null, error: error?.message ?? null }
  }

  async function updateLicencia(id: number, payload: Omit<DatosLicencia, 'organizacion_id'>) {
    const { error } = await supabase.from('licencias').update(payload).eq('id', id)
    return { error: error?.message ?? null }
  }

  async function deleteLicencia(id: number) {
    const { error } = await supabase.from('licencias').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  // ── Invitaciones ADMIN (monitoreo de onboarding) ────────────────────────────
  async function listInvitacionesAdmin(opts: { q?: string, estado?: string, page?: number } = {}) {
    const [from, to] = rango(opts.page ?? 1)
    let query = supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase.from('invitaciones').update({ estado: 'REVOCADA' }).eq('id', id)
    return { error: error?.message ?? null }
  }

  return {
    listTiposOrganizacion,
    listPaises,
    listOrganizacionesSimple,
    listOrganizaciones,
    getOrganizacion,
    createOrganizacion,
    updateOrganizacion,
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
