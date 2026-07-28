// Talleres de la comunidad activa sobre Supabase. ADAPTADOR: la UI (lista, detalle,
// planner, dashboard) consume la misma forma Workshop de siempre; aquí se resuelven
// storyboard, asignaciones y estado. "Completado" NO es una columna: se deriva de las
// asignaciones (todas COMPLETADO). En dev sin Supabase, filas demo.

import type { Localized } from '~/utils/types'

export interface Workshop {
  id: number
  title: string
  storyboardId: number
  storyboard: string
  educatorId: number
  educator: string
  initials: string
  avatarBg: string
  date: string          // 'YYYY-MM-DD' ('' = sin fecha)
  time: string          // '09:00 - 10:30' ('' = sin horario)
  location: string
  capacity: number
  notes: string
  status: 'programado' | 'completado' | 'cancelado' | 'borrador'
  statusLabel: string
  thumbBg: string
  thumbColor: string
  accentColor: string
  modalidad: 'PRESENCIAL' | 'ASIGNADO'
  // Todos los asignados (educadores directos o vía grupo), para el detalle.
  asignados: { id: number, nombre: string, grupo: string | null, estado: string }[]
}

const STATUS_LABELS: Record<Workshop['status'], string> = {
  programado: 'Programado',
  completado: 'Completado',
  cancelado: 'Cancelado',
  borrador: 'Borrador',
}

// Paleta determinista por id (mismo lenguaje visual del mock).
const AVATAR_COLORS = ['bg-emerald-600', 'bg-blue-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'] as const
const THUMBS = [
  { thumbBg: 'bg-brand-primary-50', thumbColor: 'text-brand-primary-600', accentColor: 'bg-brand-primary' },
  { thumbBg: 'bg-brand-secondary-50', thumbColor: 'text-brand-secondary-600', accentColor: 'bg-brand-secondary' },
  { thumbBg: 'bg-blue-50', thumbColor: 'text-blue-600', accentColor: 'bg-brand-accent' },
  { thumbBg: 'bg-amber-50', thumbColor: 'text-amber-600', accentColor: 'bg-brand-coral' },
] as const

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEMO_WORKSHOPS: Workshop[] = [
  { id: 1, title: 'Los Frijoles Mágicos', storyboardId: 1, storyboard: 'Los Frijoles Mágicos', educatorId: 1, educator: 'Maria Lopez Hernandez', initials: 'ML', avatarBg: AVATAR_COLORS[0], date: hoyISO(), time: '09:00 - 10:30', location: 'Aula 3A, Centro Comunitario', capacity: 25, notes: 'Traer frijoles reales para la demostración.', status: 'programado', statusLabel: 'Programado', ...THUMBS[0], modalidad: 'PRESENCIAL', asignados: [{ id: 1, nombre: 'Maria Lopez Hernandez', grupo: null, estado: 'PENDIENTE' }] },
  { id: 2, title: 'Piernas Fuertes', storyboardId: 2, storyboard: 'Piernas Fuertes', educatorId: 2, educator: 'Carlos Ramirez Torres', initials: 'CR', avatarBg: AVATAR_COLORS[1], date: '2026-03-17', time: '10:00 - 11:30', location: 'Salón Principal', capacity: 30, notes: '', status: 'programado', statusLabel: 'Programado', ...THUMBS[1], modalidad: 'PRESENCIAL', asignados: [{ id: 2, nombre: 'Carlos Ramirez Torres', grupo: null, estado: 'PENDIENTE' }] },
  { id: 3, title: 'La Sopa de Verduras', storyboardId: 3, storyboard: 'La Sopa de Verduras', educatorId: 3, educator: 'Ana Torres Gutierrez', initials: 'AT', avatarBg: AVATAR_COLORS[2], date: '2026-03-10', time: '11:00 - 12:30', location: 'Escuela Primaria Norte', capacity: 28, notes: 'Excelente participación.', status: 'completado', statusLabel: 'Completado', ...THUMBS[3], modalidad: 'PRESENCIAL', asignados: [{ id: 3, nombre: 'Ana Torres Gutierrez', grupo: null, estado: 'COMPLETADO' }] },
  { id: 4, title: 'Lácteos y Calcio', storyboardId: 1, storyboard: 'Los Frijoles Mágicos', educatorId: 3, educator: 'Ana Torres Gutierrez', initials: 'AT', avatarBg: AVATAR_COLORS[2], date: '', time: '', location: 'Sin asignar', capacity: 0, notes: 'Borrador inicial.', status: 'borrador', statusLabel: 'Borrador', thumbBg: 'bg-gray-100', thumbColor: 'text-gray-400', accentColor: 'bg-gray-400', modalidad: 'PRESENCIAL', asignados: [] },
]

interface TallerRow {
  id: number
  titulo: string | null
  fecha: string | null
  hora_inicio: string | null
  hora_fin: string | null
  ubicacion: string | null
  estado: 'BORRADOR' | 'PROGRAMADO' | 'CANCELADO'
  modalidad: 'PRESENCIAL' | 'ASIGNADO'
  notas: string | null
  storyboard: { id: number, titulo: Localized } | null
  asignaciones: {
    id: number
    estado: string
    asistentes_estimados: number | null
    educador: { id: number, nombre: string, apellido: string | null } | null
    grupo: { id: number, nombre: string } | null
  }[]
}

export function useWorkshops() {
  const demo = !isSupabaseConfigured()
  const { locale } = useT()
  const { comunidadActiva } = useContexto()

  const state = useState<{ comunidadId: number | null, workshops: Workshop[], loading: boolean }>(
    'workshops-data',
    () => ({ comunidadId: null, workshops: demo ? DEMO_WORKSHOPS : [], loading: false }),
  )

  function mapRow(row: TallerRow): Workshop {
    const sbTitulo = row.storyboard ? (row.storyboard.titulo[locale.value] ?? row.storyboard.titulo.es ?? '') : ''
    const primero = row.asignaciones.find(a => a.educador)?.educador ?? null
    const nombreDe = (e: { nombre: string, apellido: string | null }) => `${e.nombre} ${e.apellido ?? ''}`.trim()

    // Estado que la UI entiende: cancelado/borrador directos; "completado" se deriva de
    // que TODAS las asignaciones estén completadas.
    let status: Workshop['status']
    if (row.estado === 'CANCELADO') status = 'cancelado'
    else if (row.estado === 'BORRADOR') status = 'borrador'
    else status = row.asignaciones.length && row.asignaciones.every(a => a.estado === 'COMPLETADO') ? 'completado' : 'programado'

    const estilos = status === 'borrador'
      ? { thumbBg: 'bg-gray-100', thumbColor: 'text-gray-400', accentColor: 'bg-gray-400' }
      : THUMBS[row.id % THUMBS.length]!

    const extras = row.asignaciones.filter(a => a.educador).length - 1

    return {
      id: row.id,
      title: row.titulo || sbTitulo || '—',
      storyboardId: row.storyboard?.id ?? 0,
      storyboard: sbTitulo || '—',
      educatorId: primero?.id ?? 0,
      educator: primero ? nombreDe(primero) + (extras > 0 ? ` +${extras}` : '') : 'Sin asignar',
      initials: primero ? `${primero.nombre.charAt(0)}${(primero.apellido ?? '').charAt(0)}`.toUpperCase() : '—',
      avatarBg: primero ? AVATAR_COLORS[primero.id % AVATAR_COLORS.length]! : 'bg-gray-400',
      date: row.fecha ?? '',
      time: row.hora_inicio && row.hora_fin ? `${row.hora_inicio.slice(0, 5)} - ${row.hora_fin.slice(0, 5)}` : '',
      location: row.ubicacion || 'Sin asignar',
      capacity: row.asignaciones.find(a => a.asistentes_estimados != null)?.asistentes_estimados ?? 0,
      notes: row.notas ?? '',
      status,
      statusLabel: STATUS_LABELS[status],
      ...estilos,
      modalidad: row.modalidad,
      asignados: row.asignaciones
        .filter(a => a.educador)
        .map(a => ({ id: a.educador!.id, nombre: nombreDe(a.educador!), grupo: a.grupo?.nombre ?? null, estado: a.estado })),
    }
  }

  async function refresh() {
    if (demo) return
    const cid = comunidadActiva.value?.id
    if (!cid) return
    state.value.loading = true
    const { data } = await useSupabaseClient()
      .from('talleres')
      .select(`
        id, titulo, fecha, hora_inicio, hora_fin, ubicacion, estado, modalidad, notas,
        storyboard:storyboards ( id, titulo ),
        asignaciones:taller_asignaciones_educadores ( id, estado, asistentes_estimados,
          educador:educadores ( id, nombre, apellido ), grupo:grupos ( id, nombre ) )
      `)
      .eq('comunidad_id', cid)
      .order('fecha', { ascending: true, nullsFirst: false })
    state.value.workshops = (((data as unknown) as TallerRow[] | null) ?? []).map(mapRow)
    state.value.comunidadId = cid
    state.value.loading = false
  }

  if (import.meta.client && !demo) {
    const cid = comunidadActiva.value?.id ?? null
    if (cid && state.value.comunidadId !== cid && !state.value.loading) refresh()
  }

  const workshops = computed(() => state.value.workshops)
  const loading = computed(() => state.value.loading)

  function getWorkshop(id: number) {
    return workshops.value.find(w => w.id === id)
  }

  function statusVariant(status: string): 'blue' | 'green' | 'red' | 'gray' {
    const map: Record<string, 'blue' | 'green' | 'red' | 'gray'> = {
      programado: 'blue',
      completado: 'green',
      cancelado: 'red',
      borrador: 'gray',
    }
    return map[status] || 'gray'
  }

  // ── Escritura ───────────────────────────────────────────────────────────────
  // Alta desde el wizard: el taller + una asignación por educador (con su grupo si vino
  // de un grupo). `asistentes_estimados` = estimación por sesión (mismo valor por asignación).
  async function createTaller(payload: {
    titulo: string
    storyboardId: number
    fecha: string
    horaInicio: string
    horaFin: string
    ubicacion: string
    notas: string
    capacidad: number | null
    modalidad: 'PRESENCIAL' | 'ASIGNADO'
    estado: 'BORRADOR' | 'PROGRAMADO'
    asignaciones: { educadorId: number, grupoId: number | null }[]
  }): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: 1, error: null }
    if (!comunidadActiva.value) return { id: null, error: 'Sin comunidad activa' }
    const supabase = useSupabaseClient()

    const { data, error } = await supabase
      .from('talleres')
      .insert({
        titulo: payload.titulo.trim() || null,
        fecha: payload.fecha || null,
        hora_inicio: payload.horaInicio || null,
        hora_fin: payload.horaFin || null,
        ubicacion: payload.ubicacion.trim() || null,
        notas: payload.notas.trim() || null,
        estado: payload.estado,
        modalidad: payload.modalidad,
        comunidad_id: comunidadActiva.value.id,
        storyboard_id: payload.storyboardId,
      })
      .select('id')
      .single()
    if (error) return { id: null, error: error.message }

    if (payload.asignaciones.length) {
      const { error: e2 } = await supabase.from('taller_asignaciones_educadores').insert(
        payload.asignaciones.map(a => ({
          taller_id: data.id as number,
          educador_id: a.educadorId,
          grupo_id: a.grupoId,
          asistentes_estimados: payload.capacidad,
        })),
      )
      if (e2) return { id: null, error: e2.message }
    }

    await refresh()
    return { id: data.id as number, error: null }
  }

  // El planner mueve talleres de día: se persiste y se refleja optimista en la lista.
  async function updateFecha(id: number, fecha: string) {
    const w = state.value.workshops.find(x => x.id === id)
    if (w) w.date = fecha
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('talleres').update({ fecha }).eq('id', id)
    if (error) await refresh()
    return { error: error?.message ?? null }
  }

  async function cancelarTaller(id: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('talleres').update({ estado: 'CANCELADO' }).eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  async function eliminarTaller(id: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('talleres').delete().eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  // Duplicar = mismo contenido y equipo, SIN fecha y en borrador (para reprogramarlo).
  async function duplicarTaller(id: number): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: null, error: null }
    const w = getWorkshop(id)
    if (!w || !comunidadActiva.value) return { id: null, error: 'Taller no encontrado' }
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('talleres')
      .insert({
        titulo: w.title,
        ubicacion: w.location === 'Sin asignar' ? null : w.location,
        notas: w.notes || null,
        estado: 'BORRADOR',
        modalidad: w.modalidad,
        comunidad_id: comunidadActiva.value.id,
        storyboard_id: w.storyboardId,
      })
      .select('id')
      .single()
    if (error) return { id: null, error: error.message }
    await refresh()
    return { id: data.id as number, error: null }
  }

  return {
    workshops,
    loading,
    refresh,
    getWorkshop,
    statusVariant,
    createTaller,
    updateFecha,
    cancelarTaller,
    eliminarTaller,
    duplicarTaller,
  }
}
