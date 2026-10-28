// Workshops de la comunidad activa sobre Supabase. ADAPTADOR: la UI (lista, detalle, planner,
// dashboard) consume la misma forma Workshop de siempre; aquí se resuelven storyboard, educadores
// asignados (workshop_educadores) y estado. En dev sin Supabase, filas demo.
//
// El estado guardado (estado_workshop, 0004) es el ciclo: borrador → en revisión → publicado →
// finalizado, más cancelado y archivado (descartado); la base hace cumplir las transiciones. Lo que
// pasó en la sesión no se guarda: se deduce de la fecha y de la ejecución de cada educador
// (`status`): programado, hoy o en curso si está publicado; realizado, falta el feedback o sin
// realizar si está finalizado.

import type { Enums } from '~/utils/db'
import type { Localized } from '~/utils/types'
import { UI_SESSION_TONES, type UiSessionState, type UiTone } from '@playhub/ui/app/utils/ui-tones'

export type Modalidad = Enums<'modalidad_workshop'>

/** El feedback del workshop (workshop_feedback): observación del grupo, nunca de una persona. */
export interface FeedbackWorkshop {
  calificacion: number
  asistentes_reales: number
  participacion_grupo: Enums<'participacion_grupo'>
  claridad_contenido: Enums<'claridad_contenido'>
  dificultades_grupo: string | null
  material_faltante: string | null
}

export interface Workshop {
  id: number
  title: string
  storyboardId: number
  storyboard: string
  educatorId: number
  educator: string
  initials: string
  date: string          // 'YYYY-MM-DD' ('' = sin fecha)
  time: string          // '09:00 - 10:30' ('' = sin horario)
  location: string
  capacity: number      // asistentes estimados
  group: string         // el grupo que asiste («2.º B»)
  language: string      // el idioma del contenido
  notes: string
  estado: Enums<'estado_workshop'>   // el guardado: decide qué acciones caben
  status: 'programado' | 'completado' | 'sin_realizar' | 'cancelado' | 'borrador' | 'revision' | 'archivado'
  statusLabel: string
  motivoCancelacion: string
  reprogramaciones: number
  // Tono de la sesión (hoy, próxima, cerrada…), el mismo que usa Educators: lo pinta la vista.
  tone: UiTone
  modalidad: Modalidad
  jornada: string       // la jornada de la organización a la que pertenece ('' = ninguna)
  // Los valores tal cual están guardados, para editarlos (los de arriba son para mostrar).
  editable: { titulo: string, horaInicio: string, horaFin: string, ubicacion: string, jornadaId: number | null }
  // Todos los asignados (educadores directos o vía grupo), con su ejecución real y su cierre.
  asignados: {
    id: number
    asignacionId: number
    nombre: string
    grupo: string | null
    estado: string
    iniciadoEn: string | null
    terminadoEn: string | null
    feedback: FeedbackWorkshop | null
  }[]
}

// Modalidades de la constitución: presencial, remota o híbrida.
export const MODALIDADES: Record<Modalidad, { label: string, desc: string }> = {
  PRESENCIAL: { label: 'Presencial', desc: 'El educador imparte el taller en vivo, en la misma sala que el grupo.' },
  REMOTO: { label: 'Remoto', desc: 'El educador lo conduce a distancia y el grupo lo sigue en su pantalla.' },
  HIBRIDO: { label: 'Híbrido', desc: 'Parte del grupo está en la sala y parte a distancia.' },
}

export const PARTICIPACION_LABELS: Record<FeedbackWorkshop['participacion_grupo'], string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' }
export const CLARIDAD_LABELS: Record<FeedbackWorkshop['claridad_contenido'], string> = { POCO_CLARA: 'Poco clara', CLARA: 'Clara', MUY_CLARA: 'Muy clara' }

const STATUS_LABELS: Record<Workshop['status'], string> = {
  programado: 'Programado',
  completado: 'Realizado',
  sin_realizar: 'Sin realizar',
  cancelado: 'Cancelado',
  borrador: 'Borrador',
  revision: 'En revisión',
  archivado: 'Archivado',
}

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Estado de la sesión para el color (DESIGN.md, «Roles de color»): hoy en sol, próxima en cielo,
// completada en lima, borrador neutro y cancelada en coral.
// Lo que nadie ve todavía (borrador, en revisión) y lo descartado, neutros; lo que pasó sin
// realizarse o sin feedback, coral (falta algo).
export function sessionState(status: Workshop['status'], date: string): UiSessionState {
  if (status === 'borrador' || status === 'revision' || status === 'archivado') return 'borrador'
  if (status === 'cancelado') return 'cancelado'
  if (status === 'completado') return 'cerrado'
  if (status === 'sin_realizar') return 'por_cerrar'
  return date === hoyISO() ? 'hoy' : 'proximo'
}

export function sessionTone(status: Workshop['status'], date: string): UiTone {
  return UI_SESSION_TONES[sessionState(status, date)]
}

const DEMO_WORKSHOPS: Workshop[] = [
  { id: 1, title: 'Los Frijoles Mágicos', storyboardId: 1, storyboard: 'Los Frijoles Mágicos', educatorId: 1, educator: 'Maria Lopez Hernandez', initials: 'ML', date: hoyISO(), time: '09:00 - 10:30', location: 'Aula 3A, Centro Comunitario', capacity: 25, group: '2.º B', language: 'es', notes: 'Traer frijoles reales para la demostración.', estado: 'PUBLICADO', status: 'programado', statusLabel: 'Programado', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('programado', hoyISO()), modalidad: 'PRESENCIAL', jornada: '', editable: { titulo: '', horaInicio: '', horaFin: '', ubicacion: '', jornadaId: null }, asignados: [{ id: 1, asignacionId: 1, nombre: 'Maria Lopez Hernandez', grupo: null, estado: 'PENDIENTE', iniciadoEn: null, terminadoEn: null, feedback: null }] },
  { id: 2, title: 'Piernas Fuertes', storyboardId: 2, storyboard: 'Piernas Fuertes', educatorId: 2, educator: 'Carlos Ramirez Torres', initials: 'CR', date: '2026-03-17', time: '10:00 - 11:30', location: 'Salón Principal', capacity: 30, group: '3.º A', language: 'es', notes: '', estado: 'PUBLICADO', status: 'programado', statusLabel: 'Programado', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('programado', '2026-03-17'), modalidad: 'PRESENCIAL', jornada: '', editable: { titulo: '', horaInicio: '', horaFin: '', ubicacion: '', jornadaId: null }, asignados: [{ id: 2, asignacionId: 2, nombre: 'Carlos Ramirez Torres', grupo: null, estado: 'PENDIENTE', iniciadoEn: null, terminadoEn: null, feedback: null }] },
  { id: 3, title: 'La Sopa de Verduras', storyboardId: 3, storyboard: 'La Sopa de Verduras', educatorId: 3, educator: 'Ana Torres Gutierrez', initials: 'AT', date: '2026-03-10', time: '11:00 - 12:30', location: 'Escuela Primaria Norte', capacity: 28, group: '1.º C', language: 'es', notes: 'Excelente participación.', estado: 'FINALIZADO', status: 'completado', statusLabel: 'Realizado', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('completado', '2026-03-10'), modalidad: 'PRESENCIAL', jornada: '', editable: { titulo: '', horaInicio: '', horaFin: '', ubicacion: '', jornadaId: null }, asignados: [{ id: 3, asignacionId: 3, nombre: 'Ana Torres Gutierrez', grupo: null, estado: 'COMPLETADO', iniciadoEn: null, terminadoEn: null, feedback: null }] },
  { id: 4, title: 'Lácteos y Calcio', storyboardId: 1, storyboard: 'Los Frijoles Mágicos', educatorId: 3, educator: 'Ana Torres Gutierrez', initials: 'AT', date: '', time: '', location: 'Sin asignar', capacity: 0, group: '', language: 'es', notes: 'Borrador inicial.', estado: 'BORRADOR', status: 'borrador', statusLabel: 'Borrador', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('borrador', ''), modalidad: 'PRESENCIAL', jornada: '', editable: { titulo: '', horaInicio: '', horaFin: '', ubicacion: '', jornadaId: null }, asignados: [] },
]

interface TallerRow {
  id: number
  titulo: string | null
  fecha: string | null
  hora_inicio: string | null
  hora_fin: string | null
  ubicacion: string | null
  grupo_asistente: string | null
  asistentes_estimados: number | null
  idioma_contenido: string
  estado: Enums<'estado_workshop'>
  modalidad: Modalidad
  notas: string | null
  motivo_cancelacion: string | null
  reprogramaciones: number
  jornada: { id: number, nombre: string } | null
  storyboard: { id: number, titulo: Localized } | null
  asignaciones: {
    id: number
    estado: string
    iniciado_en: string | null
    terminado_en: string | null
    educador: { id: number, nombre: string, apellido: string | null } | null
    grupo: { id: number, nombre: string } | null
    feedback: FeedbackWorkshop | null
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

    // Lo que muestra la UI: el estado guardado más lo que se deduce de la ejecución.
    const activas = row.asignaciones.filter(a => a.estado !== 'CANCELADO')
    const realizado = activas.length > 0 && activas.every(a => a.estado === 'COMPLETADO')
    const empezado = activas.some(a => a.iniciado_en)
    let status: Workshop['status']
    let statusLabel: string
    switch (row.estado) {
      case 'BORRADOR': status = 'borrador'; statusLabel = STATUS_LABELS.borrador; break
      case 'EN_REVISION': status = 'revision'; statusLabel = STATUS_LABELS.revision; break
      case 'CANCELADO': status = 'cancelado'; statusLabel = STATUS_LABELS.cancelado; break
      case 'ARCHIVADO': status = 'archivado'; statusLabel = STATUS_LABELS.archivado; break
      case 'FINALIZADO':
        status = realizado ? 'completado' : 'sin_realizar'
        statusLabel = realizado ? STATUS_LABELS.completado : empezado ? 'Falta el feedback' : STATUS_LABELS.sin_realizar
        break
      default:
        status = 'programado'
        statusLabel = empezado ? 'En curso' : row.fecha === hoyISO() ? 'Hoy' : STATUS_LABELS.programado
    }

    const extras = row.asignaciones.filter(a => a.educador).length - 1

    return {
      id: row.id,
      title: row.titulo || sbTitulo || '—',
      storyboardId: row.storyboard?.id ?? 0,
      storyboard: sbTitulo || '—',
      educatorId: primero?.id ?? 0,
      educator: primero ? nombreDe(primero) + (extras > 0 ? ` +${extras}` : '') : 'Sin asignar',
      initials: primero ? `${primero.nombre.charAt(0)}${(primero.apellido ?? '').charAt(0)}`.toUpperCase() : '—',
      date: row.fecha ?? '',
      time: row.hora_inicio && row.hora_fin ? `${row.hora_inicio.slice(0, 5)} - ${row.hora_fin.slice(0, 5)}` : '',
      location: row.ubicacion || 'Sin asignar',
      capacity: row.asistentes_estimados ?? 0,
      group: row.grupo_asistente ?? '',
      language: row.idioma_contenido,
      notes: row.notas ?? '',
      estado: row.estado,
      status,
      statusLabel,
      motivoCancelacion: row.motivo_cancelacion ?? '',
      reprogramaciones: row.reprogramaciones,
      tone: sessionTone(status, row.fecha ?? ''),
      modalidad: row.modalidad,
      jornada: row.jornada?.nombre ?? '',
      editable: {
        titulo: row.titulo ?? '',
        horaInicio: row.hora_inicio?.slice(0, 5) ?? '',
        horaFin: row.hora_fin?.slice(0, 5) ?? '',
        ubicacion: row.ubicacion ?? '',
        jornadaId: row.jornada?.id ?? null,
      },
      asignados: row.asignaciones
        .filter(a => a.educador)
        .map(a => ({
          id: a.educador!.id,
          asignacionId: a.id,
          nombre: nombreDe(a.educador!),
          grupo: a.grupo?.nombre ?? null,
          estado: a.estado,
          iniciadoEn: a.iniciado_en,
          terminadoEn: a.terminado_en,
          feedback: a.feedback,
        })),
    }
  }

  async function refresh() {
    if (demo) return
    const cid = comunidadActiva.value?.id
    if (!cid) return
    state.value.loading = true
    const { data } = await useSupabaseClient()
      .from('workshops')
      .select(`
        id, titulo, fecha, hora_inicio, hora_fin, ubicacion, grupo_asistente, asistentes_estimados, idioma_contenido,
        estado, modalidad, notas, motivo_cancelacion, reprogramaciones,
        jornada:jornadas ( id, nombre ),
        storyboard:storyboards ( id, titulo ),
        asignaciones:workshop_educadores ( id, estado, iniciado_en, terminado_en,
          educador:educadores ( id, nombre, apellido ), grupo:educador_grupos ( id, nombre ),
          feedback:workshop_feedback ( calificacion, asistentes_reales, participacion_grupo, claridad_contenido,
            dificultades_grupo, material_faltante ) )
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

  // ── Escritura ───────────────────────────────────────────────────────────────
  // Alta desde el wizard: el taller (nace en borrador o en revisión) + una asignación por educador
  // (con su grupo de educadores si vino de uno) y, si se eligió, se publica. La base comprueba que
  // el storyboard esté publicado, que la organización pueda verlo, que el idioma sea uno de los
  // suyos y que esté disponible en el país de la comunidad; para publicar, fecha, hora y educador.
  async function createTaller(payload: {
    titulo: string
    storyboardId: number
    fecha: string
    horaInicio: string
    horaFin: string
    ubicacion: string
    grupo: string
    idioma: string
    notas: string
    capacidad: number | null
    modalidad: Modalidad
    estado: 'BORRADOR' | 'EN_REVISION' | 'PUBLICADO'
    jornadaId: number | null
    asignaciones: { educadorId: number, grupoId: number | null }[]
  }): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: 1, error: null }
    if (!comunidadActiva.value) return { id: null, error: 'Sin comunidad activa' }
    const supabase = useSupabaseClient()

    const { data, error } = await supabase
      .from('workshops')
      .insert({
        titulo: payload.titulo.trim() || null,
        fecha: payload.fecha || null,
        hora_inicio: payload.horaInicio || null,
        hora_fin: payload.horaFin || null,
        ubicacion: payload.ubicacion.trim() || null,
        grupo_asistente: payload.grupo.trim() || null,
        asistentes_estimados: payload.capacidad,
        idioma_contenido: payload.idioma as Enums<'idioma'>,
        notas: payload.notas.trim() || null,
        estado: payload.estado === 'EN_REVISION' ? 'EN_REVISION' : 'BORRADOR',
        modalidad: payload.modalidad,
        comunidad_id: comunidadActiva.value.id,
        storyboard_id: payload.storyboardId,
        jornada_id: payload.jornadaId,
      })
      .select('id')
      .single()
    if (error) return { id: null, error: error.message }

    if (payload.asignaciones.length) {
      const comunidadId = comunidadActiva.value.id
      const { error: e2 } = await supabase.from('workshop_educadores').insert(
        payload.asignaciones.map(a => ({
          workshop_id: data.id,
          educador_id: a.educadorId,
          educador_grupo_id: a.grupoId,
          comunidad_id: comunidadId,
        })),
      )
      if (e2) return { id: null, error: e2.message }
    }

    if (payload.estado === 'PUBLICADO') {
      const { error: e3 } = await supabase.from('workshops').update({ estado: 'PUBLICADO' }).eq('id', data.id)
      if (e3) {
        await refresh()
        return { id: data.id, error: `Se guardó como borrador, pero no se pudo publicar: ${e3.message}` }
      }
    }

    await refresh()
    return { id: data.id, error: null }
  }

  // El planner mueve talleres de día: se persiste y se refleja optimista en la lista. Mover uno
  // finalizado sin realizar a hoy o después lo reprograma (vuelve a publicado).
  async function updateFecha(id: number, fecha: string) {
    const w = state.value.workshops.find(x => x.id === id)
    if (w) w.date = fecha
    if (demo) return { error: null }
    const reprogramar = w?.estado === 'FINALIZADO' && fecha >= hoyISO()
    const { error } = await useSupabaseClient().from('workshops')
      .update(reprogramar ? { fecha, estado: 'PUBLICADO' } : { fecha }).eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  // Editar los datos del taller (no su estado). La base valida idioma, jornada y storyboard; uno
  // archivado no se modifica.
  async function actualizarTaller(id: number, datos: {
    titulo: string
    fecha: string
    horaInicio: string
    horaFin: string
    ubicacion: string
    grupo: string
    capacidad: number | null
    idioma: string
    modalidad: Modalidad
    jornadaId: number | null
    notas: string
  }) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('workshops').update({
      titulo: datos.titulo.trim() || null,
      fecha: datos.fecha || null,
      hora_inicio: datos.horaInicio || null,
      hora_fin: datos.horaFin || null,
      ubicacion: datos.ubicacion.trim() || null,
      grupo_asistente: datos.grupo.trim() || null,
      asistentes_estimados: datos.capacidad,
      idioma_contenido: datos.idioma as Enums<'idioma'>,
      modalidad: datos.modalidad,
      jornada_id: datos.jornadaId,
      notas: datos.notas.trim() || null,
    }).eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  // Sumar o quitar educadores. La base exige que el educador esté activo en la comunidad y que uno
  // publicado conserve al menos uno (se asigna el nuevo antes de quitar al anterior).
  async function asignarEducador(workshopId: number, educadorId: number) {
    if (demo) return { error: null }
    if (!comunidadActiva.value) return { error: 'Sin comunidad activa' }
    // La comunidad la fija la base desde el workshop; se manda por el tipo de la tabla.
    const { error } = await useSupabaseClient().from('workshop_educadores')
      .insert({ workshop_id: workshopId, educador_id: educadorId, comunidad_id: comunidadActiva.value.id })
    await refresh()
    return { error: error?.message ?? null }
  }

  async function quitarAsignacion(asignacionId: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('workshop_educadores').delete().eq('id', asignacionId)
    await refresh()
    return { error: error?.message ?? null }
  }

  // ── El ciclo ──────────────────────────────────────────────────────────────────
  // Cada acción es un cambio de estado; la base rechaza lo que no cabe (con su mensaje).
  async function cambiarEstado(id: number, cambios: { estado: Enums<'estado_workshop'>, fecha?: string, motivo_cancelacion?: string | null }) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('workshops').update(cambios).eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  const enviarARevision = (id: number) => cambiarEstado(id, { estado: 'EN_REVISION' })
  const volverABorrador = (id: number) => cambiarEstado(id, { estado: 'BORRADOR' })
  const publicarTaller = (id: number) => cambiarEstado(id, { estado: 'PUBLICADO' })
  const cancelarTaller = (id: number, motivo = '') => cambiarEstado(id, { estado: 'CANCELADO', motivo_cancelacion: motivo.trim() || null })
  // Reprogramar: de finalizado (sin realizar) o cancelado, a otra fecha y publicado otra vez.
  const reprogramarTaller = (id: number, fecha: string) => cambiarEstado(id, { estado: 'PUBLICADO', fecha })
  // Archivar = descartar: deja de verse en las listas y no se modifica más.
  const archivarTaller = (id: number) => cambiarEstado(id, { estado: 'ARCHIVADO' })

  async function eliminarTaller(id: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('workshops').delete().eq('id', id)
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
      .from('workshops')
      .insert({
        titulo: w.title,
        ubicacion: w.location === 'Sin asignar' ? null : w.location,
        grupo_asistente: w.group || null,
        asistentes_estimados: w.capacity || null,
        idioma_contenido: w.language as Enums<'idioma'>,
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
    return { id: data.id, error: null }
  }

  return {
    workshops,
    loading,
    refresh,
    getWorkshop,
    createTaller,
    updateFecha,
    actualizarTaller,
    asignarEducador,
    quitarAsignacion,
    enviarARevision,
    volverABorrador,
    publicarTaller,
    cancelarTaller,
    reprogramarTaller,
    archivarTaller,
    eliminarTaller,
    duplicarTaller,
  }
}
