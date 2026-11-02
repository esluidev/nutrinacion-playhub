// Equipo de la organización activa sobre Supabase: sus educadores (`educadores`, 0004) y sus
// grupos (`educador_grupos`). El educador es de la organización (decisión 011): no hay tabla
// puente; `activo` y la baja lógica (`deleted_at`) viven en su fila.
// ADAPTADOR: la UI consume las mismas formas de siempre (Educator/EducatorGroup, con
// initials calculadas aquí); la fuente es la base. En dev sin Supabase se sirven filas demo.
// La carga es perezosa y por organización: al invocarse con un contexto distinto al último
// cargado, se refresca solo.

import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'

// La URL de Educators (`configuracion.educators_url`, 0013), para el enlace de acceso. En
// desarrollo, si está vacía, la de este equipo en el puerto de Educators; por Tailscale, el nombre
// de este equipo (equipo-local).
export async function urlDeEducators(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const { data } = await useSupabaseClient().from('configuracion').select('valor').eq('clave', 'educators_url').maybeSingle()
  const url = (data?.valor ?? '').trim() || (import.meta.dev ? 'http://localhost:3002' : '')
  return url ? urlEnEsteEquipo(url.replace(/\/+$/, '')) : null
}

// El enlace de acceso de un educador: abre en Educators la página donde elige su PIN.
export function enlaceAcceso(base: string, token: string): string {
  return `${base}/acceso/${token}`
}

export interface EducatorGroup {
  id: number
  nombre: string
  descripcion: string
  miembros: number
  estado: 'activo' | 'inactivo'
}

export interface Educator {
  id: number
  nombre: string
  initials: string
  profesion: string
  email: string
  telefono: string
  estado: 'activo' | 'inactivo'
  // El acceso a Educators: con PIN o sin él todavía. El enlace de acceso (0013) va aparte: el
  // pendiente se ve y se copia mientras no venza, también si ya tiene PIN (para elegir uno nuevo).
  acceso: 'pin' | 'sin-pin'
  enlace: EnlaceAcceso | null
  grupo: string            // primer grupo (chip de la card); '' si no está en ninguno
  grupos: string[]         // todos (la membresía real es N:M)
  grupoIds: number[]
  talleres: number
}

// El enlace de acceso pendiente de un educador (0013) y cómo quedó su correo. Es de primer acceso
// si aún no tiene PIN y para restablecerlo si ya lo tiene.
export interface EnlaceAcceso {
  token: string
  creadoEn: string | null
  expiraEn: string
  vencido: boolean
  correoEnviadoEn: string | null
  correoError: string | null
}

// La ficha editable, con las columnas de `educadores` que Admin puede escribir (0005).
export interface EducadorDetalle {
  id: number
  nombre: string
  apellido: string | null
  correo: string
  telefono: string | null
  profesion: string | null
  activo: boolean
}

const DEMO_EDUCATORS: Educator[] = [
  { id: 1, nombre: 'Maria Lopez Hernandez', initials: 'ML', profesion: 'Nutrióloga', email: 'maria.lopez@nutrinacion.org', telefono: '+52 55 1234 5678', estado: 'activo', acceso: 'pin', enlace: null, grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 8 },
  { id: 2, nombre: 'Carlos Ramirez Torres', initials: 'CR', profesion: 'Educador en Salud', email: 'carlos.ramirez@nutrinacion.org', telefono: '+52 55 2345 6789', estado: 'activo', acceso: 'pin', enlace: null, grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 5 },
  { id: 3, nombre: 'Ana Torres Gutierrez', initials: 'AT', profesion: 'Psicóloga Infantil', email: 'ana.torres@nutrinacion.org', telefono: '+52 55 3456 7890', estado: 'activo', acceso: 'pin', enlace: null, grupo: 'Zona Sur', grupos: ['Zona Sur'], grupoIds: [2], talleres: 6 },
  { id: 4, nombre: 'Pedro Sanchez Morales', initials: 'PS', profesion: 'Chef Educativo', email: 'pedro.sanchez@nutrinacion.org', telefono: '+52 55 4567 8901', estado: 'activo', acceso: 'pin', enlace: null, grupo: 'Zona Norte', grupos: ['Zona Norte'], grupoIds: [1], talleres: 4 },
]

const DEMO_GROUPS: EducatorGroup[] = [
  { id: 1, nombre: 'Zona Norte', descripcion: 'Educadores asignados a escuelas y centros comunitarios de la zona norte', miembros: 3, estado: 'activo' },
  { id: 2, nombre: 'Zona Sur', descripcion: 'Equipo dedicado a talleres en comunidades rurales del sur', miembros: 1, estado: 'activo' },
]

interface EducadorRow {
  id: number
  nombre: string
  apellido: string | null
  correo: string | null
  telefono: string | null
  profesion: string | null
  activo: boolean
  tiene_pin: boolean
  acceso_token: string | null
  acceso_creado_en: string | null
  acceso_expira_en: string | null
  acceso_correo_enviado_en: string | null
  acceso_correo_error: string | null
  educador_grupo_miembros: { grupo: { id: number, nombre: string } | null }[]
}

interface GrupoRow {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  miembros: { count: number }[]
}

function iniciales(nombre: string, apellido: string | null) {
  return `${nombre.charAt(0)}${(apellido ?? '').charAt(0)}`.toUpperCase() || '?'
}

export function useEducators() {
  const demo = !isSupabaseConfigured()
  const { orgActiva } = useContexto()
  const { t } = useT()

  const state = useState<{ orgId: number | null, educators: Educator[], groups: EducatorGroup[], loading: boolean }>(
    'educators-data',
    () => ({ orgId: null, educators: demo ? DEMO_EDUCATORS : [], groups: demo ? DEMO_GROUPS : [], loading: false }),
  )

  async function refresh() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    state.value.loading = true
    const supabase = useSupabaseClient()

    // Los miembros se embeben por la FK directa a `educadores`: la compuesta (educador_id,
    // organizacion_id) también llega y PostgREST pide elegir una.
    const [{ data: filas }, { data: grupoRows }, { data: asignaciones }] = await Promise.all([
      supabase
        .from('educadores')
        .select(`
          id, nombre, apellido, correo, telefono, profesion, activo, tiene_pin,
          acceso_token, acceso_creado_en, acceso_expira_en, acceso_correo_enviado_en, acceso_correo_error,
          educador_grupo_miembros!educador_grupo_miembros_educador_id_fkey ( grupo:educador_grupos ( id, nombre ) )
        `)
        .eq('organizacion_id', oid)
        .is('deleted_at', null),
      supabase
        .from('educador_grupos')
        .select('id, nombre, descripcion, activo, miembros:educador_grupo_miembros ( count )')
        .eq('organizacion_id', oid)
        .order('nombre'),
      // Cuántos talleres tiene asignados cada educador.
      supabase.from('workshop_educadores').select('educador_id').eq('organizacion_id', oid),
    ])

    const talleres = new Map<number, number>()
    for (const a of asignaciones ?? []) talleres.set(a.educador_id, (talleres.get(a.educador_id) ?? 0) + 1)

    state.value.educators = (((filas as unknown) as EducadorRow[] | null) ?? [])
      .map((e) => {
        const grupos = e.educador_grupo_miembros
          .map(g => g.grupo)
          .filter((g): g is { id: number, nombre: string } => !!g)
        return {
          id: e.id,
          nombre: `${e.nombre} ${e.apellido ?? ''}`.trim(),
          initials: iniciales(e.nombre, e.apellido),
          profesion: e.profesion ?? '—',
          email: e.correo ?? '—',
          telefono: e.telefono ?? '—',
          estado: e.activo ? 'activo' : 'inactivo',
          acceso: e.tiene_pin ? 'pin' : 'sin-pin',
          enlace: e.acceso_token && e.acceso_expira_en
            ? {
                token: e.acceso_token,
                creadoEn: e.acceso_creado_en,
                expiraEn: e.acceso_expira_en,
                vencido: new Date(e.acceso_expira_en).getTime() <= Date.now(),
                correoEnviadoEn: e.acceso_correo_enviado_en,
                correoError: e.acceso_correo_error,
              }
            : null,
          grupo: grupos[0]?.nombre ?? '',
          grupos: grupos.map(g => g.nombre),
          grupoIds: grupos.map(g => g.id),
          talleres: talleres.get(e.id) ?? 0,
        } satisfies Educator
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    state.value.groups = (((grupoRows as unknown) as GrupoRow[] | null) ?? []).map(g => ({
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion ?? '',
      miembros: g.miembros?.[0]?.count ?? 0,
      estado: g.activo ? 'activo' : 'inactivo',
    }))

    state.value.orgId = oid
    state.value.loading = false
  }

  // Carga perezosa: al entrar con una organización distinta a la última cargada.
  if (import.meta.client && !demo) {
    const oid = orgActiva.value?.id ?? null
    if (oid && state.value.orgId !== oid && !state.value.loading) refresh()
  }

  const educators = computed(() => state.value.educators)
  const groups = computed(() => state.value.groups)
  const loading = computed(() => state.value.loading)

  const activeEducators = computed(() => educators.value.filter(e => e.estado === 'activo'))
  const activeGroups = computed(() => groups.value.filter(g => g.estado === 'activo'))

  function getEducator(id: number) {
    return educators.value.find(e => e.id === id)
  }

  function getGroup(id: number) {
    return groups.value.find(g => g.id === id)
  }

  // Los miembros ACTIVOS de un grupo (por id: dos grupos pueden llamarse igual). Son los que se
  // asignan al elegir el grupo en el asistente; un inactivo no recibe talleres.
  function getGroupMembers(groupId: number) {
    return activeEducators.value.filter(e => e.grupoIds.includes(groupId))
  }

  // Todos los miembros, activos o no: para gestionar el grupo.
  function getGroupMembersAll(groupId: number) {
    return educators.value.filter(e => e.grupoIds.includes(groupId))
  }

  // ── Escritura ───────────────────────────────────────────────────────────────
  // Alta en la organización. Si ya existe con ese correo (sin baja): inactivo, se reactiva;
  // activo, se avisa (un correo, una vez por organización, 0004).
  async function createEducador(datos: {
    nombre: string
    apellido: string
    correo: string
    telefono: string
    profesion: string
    grupoId?: number | null
  }): Promise<{ error: string | null, id?: number, reactivado?: boolean }> {
    if (demo) return { error: null }
    if (!orgActiva.value) return { error: t('ctx.noOrgActive') }
    const supabase = useSupabaseClient()
    const organizacionId = orgActiva.value.id
    const correo = datos.correo.trim().toLowerCase()

    const { data: existente } = await supabase
      .from('educadores')
      .select('id, activo')
      .eq('organizacion_id', organizacionId)
      .ilike('correo', correo)
      .is('deleted_at', null)
      .maybeSingle()

    let educadorId: number
    let reactivado = false
    if (existente) {
      if (existente.activo) return { error: t('educators.exists', { correo }) }
      const { error } = await supabase.from('educadores').update({ activo: true }).eq('id', existente.id)
      if (error) return { error: error.message }
      educadorId = existente.id
      reactivado = true
    }
    else {
      const { data, error } = await supabase
        .from('educadores')
        .insert({
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim() || null,
          correo,
          telefono: datos.telefono.trim() || null,
          profesion: datos.profesion.trim() || null,
          organizacion_id: organizacionId,
        })
        .select('id')
        .single()
      if (error) return { error: error.message }
      educadorId = data.id
    }

    if (datos.grupoId) {
      // La organización del miembro la fija la base desde el grupo; se manda por el tipo de la tabla.
      const { error: e2 } = await supabase
        .from('educador_grupo_miembros')
        .upsert({ educador_grupo_id: datos.grupoId, educador_id: educadorId, organizacion_id: organizacionId }, { onConflict: 'educador_grupo_id,educador_id' })
      if (e2) return { error: e2.message }
    }
    await refresh()
    return { error: null, id: educadorId, reactivado }
  }

  async function createGrupo(datos: { nombre: string, descripcion: string, educadorIds: number[] }): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: 1, error: null }
    if (!orgActiva.value) return { id: null, error: t('ctx.noOrgActive') }
    const supabase = useSupabaseClient()
    const organizacionId = orgActiva.value.id
    const { data, error } = await supabase
      .from('educador_grupos')
      .insert({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim() || null,
        organizacion_id: organizacionId,
      })
      .select('id')
      .single()
    if (error) return { id: null, error: error.message }
    if (datos.educadorIds.length) {
      const { error: e2 } = await supabase
        .from('educador_grupo_miembros')
        .insert(datos.educadorIds.map(id => ({ educador_grupo_id: data.id, educador_id: id, organizacion_id: organizacionId })))
      if (e2) return { id: data.id, error: e2.message }
    }
    await refresh()
    return { id: data.id, error: null }
  }

  async function updateGrupo(grupoId: number, datos: { nombre: string, descripcion: string }) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('educador_grupos')
      .update({ nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim() || null })
      .eq('id', grupoId)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  // Borrar el grupo no toca a sus educadores ni a los talleres que se asignaron por él
  // (`educador_grupo_id` queda en null).
  async function deleteGrupo(grupoId: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('educador_grupos').delete().eq('id', grupoId)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  // Varios educadores de una vez (el diálogo «Agregar educadores» del grupo). Los que ya estaban
  // no se duplican.
  async function addGroupMembers(grupoId: number, educadorIds: number[]) {
    if (demo || !educadorIds.length) return { error: null }
    if (!orgActiva.value) return { error: t('ctx.noOrgActive') }
    const organizacionId = orgActiva.value.id
    const { error } = await useSupabaseClient().from('educador_grupo_miembros')
      .upsert(
        educadorIds.map(educadorId => ({ educador_grupo_id: grupoId, educador_id: educadorId, organizacion_id: organizacionId })),
        { onConflict: 'educador_grupo_id,educador_id', ignoreDuplicates: true },
      )
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function removeGroupMember(grupoId: number, educadorId: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('educador_grupo_miembros')
      .delete().eq('educador_grupo_id', grupoId).eq('educador_id', educadorId)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  // La ficha tal cual está en la base, para editarla (la lista trae los campos ya compuestos).
  async function getEducadorDetalle(educadorId: number): Promise<EducadorDetalle | null> {
    if (demo) {
      const e = DEMO_EDUCATORS.find(x => x.id === educadorId)
      if (!e) return null
      const [nombre = '', ...apellido] = e.nombre.split(' ')
      return { id: e.id, nombre, apellido: apellido.join(' '), correo: e.email, telefono: e.telefono, profesion: e.profesion, activo: e.estado === 'activo' }
    }
    const { data } = await useSupabaseClient()
      .from('educadores')
      .select('id, nombre, apellido, correo, telefono, profesion, activo')
      .eq('id', educadorId)
      .is('deleted_at', null)
      .maybeSingle()
    return data ?? null
  }

  // Edita la ficha. El correo es con el que entra en Educators: cambiarlo cambia su entrada,
  // pero no su PIN ni sus sesiones. Inactivo (`activo`): no se le asignan talleres nuevos (la base
  // lo rechaza) y no entra en Educators; su historial se conserva.
  async function updateEducador(educadorId: number, datos: Omit<EducadorDetalle, 'id'>) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient()
      .from('educadores')
      .update({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido?.trim() || null,
        correo: datos.correo.trim().toLowerCase(),
        telefono: datos.telefono?.trim() || null,
        profesion: datos.profesion?.trim() || null,
        activo: datos.activo,
      })
      .eq('id', educadorId)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  // Baja lógica (`deleted_at`, 0004), para quien ya dio talleres, y solo de los administradores de
  // la organización: desaparece de la organización y de sus grupos (la base lo saca, 0012) y ya no
  // entra en Educators (0006 exige `deleted_at is null`). Sus talleres pasados conservan la
  // asignación. Para apartarlo sin darlo de baja está `activo` en la ficha.
  async function darDeBaja(educadorId: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient()
      .from('educadores')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', educadorId)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  // El enlace de acceso a Educators (0013), como las invitaciones: con él el educador ve su correo y
  // elige su PIN, la primera vez o cuando lo olvidó. Vence a los 7 días y vale una vez; crear otro
  // reemplaza al anterior. No toca su PIN ni sus sesiones hasta que lo use.
  async function crearAcceso(educadorId: number): Promise<{ token: string | null, error: string | null }> {
    if (demo) return { token: 'demo', error: null }
    const { data, error } = await useSupabaseClient().rpc('educador_crear_acceso', { p_educador_id: educadorId })
    if (error) return { token: null, error: error.message }
    await refresh()
    return { token: ((data as { token?: string } | null)?.token) ?? null, error: null }
  }

  // Si ya dio algún taller (0014): con historial se da de baja; sin él, se elimina. Si no se puede
  // saber, se trata como con historial: la baja no pierde nada.
  async function tieneHistorial(educadorId: number): Promise<boolean> {
    if (demo) return (DEMO_EDUCATORS.find(e => e.id === educadorId)?.talleres ?? 0) > 0
    const { data, error } = await useSupabaseClient().rpc('educador_tiene_historial', { p_educador_id: educadorId })
    return error ? true : data !== false
  }

  // Elimina de verdad a quien no ha dado ningún taller, solo un administrador (0014): con él se van
  // sus asignaciones a talleres que no dio, sus grupos y sus sesiones. La base no deja sin educador
  // un taller publicado.
  async function eliminarEducador(educadorId: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().rpc('educador_eliminar', { p_educador_id: educadorId })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  // Revoca el enlace pendiente, como una invitación: deja de valer. Su PIN, si lo tiene, sigue valiendo.
  async function revocarAcceso(educadorId: number): Promise<{ error: string | null }> {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().rpc('educador_revocar_acceso', { p_educador_id: educadorId })
    await refresh()
    return { error: error?.message ?? null }
  }

  // Lo manda por correo (Edge Function `enviar-acceso-educador`); después se relee el estado.
  async function enviarCorreoAcceso(educadorId: number): Promise<{ ok: boolean, error: string | null }> {
    if (demo) return { ok: false, error: t('invMail.demo') }
    const { data, error } = await useSupabaseClient().functions.invoke('enviar-acceso-educador', {
      body: { educador_id: educadorId, educators_url: await urlDeEducators() },
    })
    await refresh()
    if (error) return { ok: false, error: (await errorDeLaFuncion(error)) ?? t('invMail.unreachable') }
    if (!data?.ok) return { ok: false, error: (data?.error as string) || t('invMail.unreachable') }
    return { ok: true, error: null }
  }

  return {
    educators,
    groups,
    loading,
    activeEducators,
    activeGroups,
    getEducator,
    getGroup,
    getGroupMembers,
    getGroupMembersAll,
    refresh,
    createEducador,
    getEducadorDetalle,
    updateEducador,
    darDeBaja,
    tieneHistorial,
    eliminarEducador,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    addGroupMembers,
    removeGroupMember,
    crearAcceso,
    revocarAcceso,
    enviarCorreoAcceso,
  }
}
