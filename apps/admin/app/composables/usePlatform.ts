import type { Enums } from '~/utils/db'
import type { ActividadItem, AtencionItem, LicenciaLigera, OrgLigera } from '~/utils/platformResumen'

// Capa de acceso a datos de la consola del superadmin (/platform).
// Todo pasa por Supabase. El acceso a /platform lo gatea el middleware (perfiles.superadmin);
// el RLS es simple (usuario autenticado) y no filtra por organización.
// La ORGANIZACION es el eje; licencias e invitaciones son vistas de monitoreo.
// Las listas paginan y filtran EN SERVIDOR (pensado para 100+ orgs / 1000+ licencias).


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
  comunidades: number          // cuántas usa de su licencia (platform_uso)
}

/** Lo que Platform ve de la operación de una organización: solo cifras (platform_uso, 0005). */
export interface UsoOrganizacion {
  comunidades: number
  educadores: number
  personalizados: number
  talleres: number
  participantes: number
  jornadas: number
  temarios: number
  educadores_sin_acceso: number   // aún no eligieron su PIN
  talleres_proximos: number
  ultima_actividad: string | null
}

/** Un administrador visto desde Platform (platform_administradores): con su último acceso. */
export interface AdminPlatform {
  id: number
  titular: boolean
  created_at: string
  ultimo_acceso: string | null
  perfil: { id: number, nombre: string | null, apellido: string | null, email: string | null }
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
  nombre: string | null
  apellido: string | null
  titular: boolean
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
  estado: Enums<'estado_licencia'>
  paises: string[]
  notas: string
}

// Vista rápida del estado de la plataforma (dashboard de entrada del operador).
// Las reglas de negocio (vigencia, atención, actividad) viven en utils/platformResumen.
export interface ResumenPlatform {
  organizaciones: { total: number, nuevas: number, operando: number, enAlta: number, sinLicencia: number }
  licencias: { vigentes: number, trials: number, porVencer: number, vencidas: number }
  atencion: AtencionItem[]
  actividad: ActividadItem[]
  invitacionesPendientes: number
  invitacionesRecientes: { id: number, email: string | null, nombre: string | null, apellido: string | null, created_at: string, organizaciones: { nombre: string } | null }[]
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
  organizaciones: { total: 0, nuevas: 0, operando: 0, enAlta: 0, sinLicencia: 0 },
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

  // ── Lo que Platform ve de la operación ─────────────────────────────────────
  // El superadmin administra organizaciones, no su operación: la RLS no le deja leer comunidades,
  // educadores ni talleres de las organizaciones ajenas. De eso solo recibe cifras y el nombre y
  // país de cada comunidad, por las funciones `platform_*` (0005).
  async function usoOrganizaciones(organizacionId: number | null = null): Promise<Map<number, UsoOrganizacion>> {
    const mapa = new Map<number, UsoOrganizacion>()
    if (!isSupabaseConfigured()) return mapa
    const { data } = await supabase().rpc('platform_uso', organizacionId ? { p_organizacion_id: organizacionId } : {})
    for (const fila of data ?? []) {
      const { organizacion_id, ...uso } = fila
      mapa.set(organizacion_id, uso)
    }
    return mapa
  }

  // ── Dashboard del operador ──────────────────────────────────────────────────
  // La administración de las organizaciones. Orgs y licencias se traen COMPLETAS pero ligeras
  // (al scale objetivo, ~100 orgs); de las comunidades, solo cuántas usa cada una (el cupo).
  // El desglose, la atención y la actividad se computan con las reglas puras de utils.
  async function getResumenPlatform(): Promise<ResumenPlatform> {
    if (!isSupabaseConfigured()) return RESUMEN_VACIO
    const head = { count: 'exact' as const, head: true }
    const hoy = hoyLocal()

    const [orgsRes, licRes, invPendientes, invRecientes, uso] = await Promise.all([
      supabase()
        .from('organizaciones')
        .select(`id, nombre, created_at,
                 administradores:organizacion_administradores ( id, created_at, perfil:perfiles ( nombre, apellido, email ) )`),
      supabase()
        .from('organizacion_licencias')
        .select('id, estado, fecha_inicio, fecha_fin, max_comunidades, organizacion_id, created_at'),
      supabase().from('invitaciones').select('id', head).eq('role', 'ADMIN').eq('estado', 'PENDIENTE'),
      supabase()
        .from('invitaciones')
        .select('id, email, nombre, apellido, created_at, organizaciones!inner ( nombre )')
        .eq('role', 'ADMIN')
        .eq('estado', 'PENDIENTE')
        .order('created_at', { ascending: false })
        .limit(5),
      usoOrganizaciones(),
    ])

    type FilaOrg = {
      id: number
      nombre: string
      created_at: string
      administradores: { id: number, created_at: string, perfil: { nombre: string | null, apellido: string | null, email: string | null } | null }[]
    }
    const orgs: OrgLigera[] = ((orgsRes.data as unknown as FilaOrg[] | null) ?? []).map(o => ({
      id: o.id,
      nombre: o.nombre,
      created_at: o.created_at,
      comunidades: uso.get(o.id)?.comunidades ?? 0,
      administradores: o.administradores.map(a => ({
        id: a.id,
        created_at: a.created_at,
        nombre: `${a.perfil?.nombre ?? ''} ${a.perfil?.apellido ?? ''}`.trim() || a.perfil?.email || '—',
      })),
    }))
    const licencias = (licRes.data as LicenciaLigera[] | null) ?? []

    return {
      organizaciones: resumenOrganizaciones(orgs, licencias, hoy),
      licencias: resumenLicencias(licencias, hoy),
      atencion: construirAtencion(orgs, licencias, hoy),
      actividad: construirActividad(orgs, licencias),
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
    const [from, to] = rangoDePagina(opts.page ?? 1)

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
        licencias:organizacion_licencias ( id, estado, created_at, fecha_fin )
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

    const [{ data, count }, uso] = await Promise.all([query, usoOrganizaciones()])
    const filas = ((data as unknown as Omit<OrgResumen, 'comunidades'>[] | null) ?? [])
      .map(o => ({ ...o, comunidades: uso.get(o.id)?.comunidades ?? 0 }))
    return { data: filas, total: count ?? 0 }
  }

  async function getOrganizacion(id: number) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    const { data, error } = await supabase()
      .from('organizaciones')
      .select(`
        id, nombre, correo, telefono, website, created_at, tipo_id, perfil_publico,
        tipo:tipos_organizacion ( nombre ),
        licencias:organizacion_licencias ( * ),
        invitaciones ( id, token, role, email, nombre, apellido, titular, estado, expira_en, comunidad_id, idioma, created_at )
      `)
      .eq('id', id)
      .maybeSingle()
    if (!data) return { data, error }
    // De su operación: sus comunidades con sus cifras, las cifras de la organización y sus
    // administradores con su último acceso (para el soporte).
    const [{ data: comunidades }, uso, { data: admins }] = await Promise.all([
      supabase().rpc('platform_comunidades', { p_organizacion_id: id }),
      usoOrganizaciones(id),
      supabase().rpc('platform_administradores', { p_organizacion_id: id }),
    ])
    const administradores: AdminPlatform[] = (admins ?? []).map(a => ({
      id: a.id,
      titular: a.titular,
      created_at: a.created_at,
      ultimo_acceso: a.ultimo_acceso,
      perfil: { id: a.perfil_id, nombre: a.nombre, apellido: a.apellido, email: a.email },
    }))
    return { data: { ...data, administradores, comunidades: comunidades ?? [], uso: uso.get(id) ?? null }, error }
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

  // Lo que se pierde al dar de baja una organización (conteos reales para la confirmación) y lo
  // que lo impide: sus storyboards personalizados, que se resuelven antes en Player.
  async function resumenBorradoOrganizacion(id: number) {
    const vacio = { licencias: 0, administradores: 0, comunidades: 0, educadores: 0, personalizados: 0, talleres: 0, participantes: 0, jornadas: 0, temarios: 0 }
    if (!isSupabaseConfigured()) return vacio
    const head = { count: 'exact' as const, head: true }
    const [licencias, administradores, uso] = await Promise.all([
      supabase().from('organizacion_licencias').select('id', head).eq('organizacion_id', id),
      supabase().from('organizacion_administradores').select('id', head).eq('organizacion_id', id),
      usoOrganizaciones(id),
    ])
    return { ...vacio, ...uso.get(id), licencias: licencias.count ?? 0, administradores: administradores.count ?? 0 }
  }

  // Baja entera (platform_eliminar_organizacion, 0005): sus comunidades con su operación y lo
  // demás en cascada. `bloqueada`: tiene storyboards personalizados.
  async function deleteOrganizacion(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null, bloqueada: false }
    const { error } = await supabase().rpc('platform_eliminar_organizacion', { p_organizacion_id: id })
    return { error: error?.message ?? null, bloqueada: error?.code === 'P0001' }
  }

  // El superadmin se une a una organización como administrador (o titular), a la vista de sus
  // administradores: así entra a su operación como cualquiera (decisión 008). Se recarga su árbol
  // de contexto para que la organización salga en el selector.
  async function unirmeComoAdmin(organizacionId: number, titular: boolean) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const perfilId = useAuth().user.value?.perfil.id
    if (!perfilId) return { error: 'Sin sesión' }
    const { data, error } = await supabase()
      .from('organizacion_administradores')
      .insert({ organizacion_id: organizacionId, perfil_id: perfilId })
      .select('id')
      .single()
    if (error) return { error: error.message }
    if (titular) {
      const { error: e2 } = await setTitular(organizacionId, data.id)
      if (e2) return { error: e2 }
    }
    await useAuth().fetchUser()
    return { error: null }
  }

  // Soporte: quitar a un administrador (deja la organización; su cuenta sigue).
  async function quitarAdministrador(adminId: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('organizacion_administradores').delete().eq('id', adminId)
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
    const [from, to] = rangoDePagina(opts.page ?? 1)
    let query = supabase()
      .from('organizacion_licencias')
      .select(`
        id, estado, max_comunidades, max_educadores, max_personalizados,
        fecha_inicio, fecha_fin, paises, notas,
        organizaciones!inner ( id, nombre )
      `, { count: 'exact' })
      .order('fecha_fin', { ascending: true, nullsFirst: false })
      .range(from, to)

    if (opts.estado && opts.estado !== 'todas') query = query.eq('estado', opts.estado as Enums<'estado_licencia'>)
    if (opts.q) query = query.ilike('organizaciones.nombre', `%${opts.q}%`)

    const { data, count } = await query
    return { data: (data as LicenciaResumen[] | null) ?? [], total: count ?? 0 }
  }

  async function getLicencia(id: number) {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase()
      .from('organizacion_licencias').select('*, organizaciones ( id, nombre )').eq('id', id).maybeSingle()
    return data
  }

  async function createLicencia(payload: DatosLicencia) {
    if (!isSupabaseConfigured()) return { id: null as number | null, error: null as string | null }
    const { data, error } = await supabase().from('organizacion_licencias').insert(payload).select('id').single()
    return { id: (data?.id as number) ?? null, error: error?.message ?? null }
  }

  async function updateLicencia(id: number, payload: Omit<DatosLicencia, 'organizacion_id'>) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('organizacion_licencias').update(payload).eq('id', id)
    return { error: error?.message ?? null }
  }

  async function deleteLicencia(id: number) {
    if (!isSupabaseConfigured()) return { error: null as string | null }
    const { error } = await supabase().from('organizacion_licencias').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  // ── Invitaciones ADMIN (monitoreo de onboarding) ────────────────────────────
  async function listInvitacionesAdmin(opts: { q?: string, estado?: string, page?: number } = {}) {
    if (!isSupabaseConfigured()) return { data: [] as InvitacionResumen[], total: 0 }
    const [from, to] = rangoDePagina(opts.page ?? 1)
    let query = supabase()
      .from('invitaciones')
      .select(`
        id, token, role, email, nombre, apellido, titular, estado, expira_en, idioma, created_at,
        organizaciones!inner ( id, nombre )
      `, { count: 'exact' })
      .eq('role', 'ADMIN')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (opts.estado && opts.estado !== 'todas') query = query.eq('estado', opts.estado as Enums<'estado_invitacion'>)
    if (opts.q) query = query.ilike('organizaciones.nombre', `%${opts.q}%`)

    const { data, count } = await query
    return { data: (data as InvitacionResumen[] | null) ?? [], total: count ?? 0 }
  }

  // Emite una invitación de ADMIN. El INSERT dispara el Database Webhook → correo.
  // El titular actual de una organización (para avisar al invitar a otro), o null.
  async function titularDe(organizacionId: number): Promise<string | null> {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase()
      .from('organizacion_administradores')
      .select('perfil:perfiles ( nombre, apellido, email )')
      .eq('organizacion_id', organizacionId).eq('titular', true).maybeSingle()
    const p = (data as unknown as { perfil: { nombre: string | null, apellido: string | null, email: string | null } | null } | null)?.perfil
    return p ? (`${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() || p.email || '—') : null
  }

  // A quién se invita (nombre y apellido) y si será el titular: solo el superadmin invita titulares.
  async function createInvitacionAdmin(payload: {
    organizacion_id: number
    email: string
    nombre: string
    apellido: string
    titular: boolean
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
        nombre: payload.nombre.trim() || null,
        apellido: payload.apellido.trim() || null,
        titular: payload.titular,
        idioma: payload.idioma as Enums<'idioma'>,
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
    resumenBorradoOrganizacion,
    unirmeComoAdmin,
    titularDe,
    quitarAdministrador,
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
