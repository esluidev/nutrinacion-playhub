// Workshops de la organización activa sobre Supabase. ADAPTADOR: la UI (lista, detalle, planner,
// inicio) consume la misma forma Workshop de siempre; aquí se resuelven storyboard, jornada,
// educadores asignados (workshop_educadores) y estado. En dev sin Supabase, filas demo.
//
// El estado guardado (estado_workshop, 0004) es el ciclo: borrador → en revisión → publicado →
// finalizado, más cancelado y archivado (descartado); la base hace cumplir las transiciones. Lo que
// pasó en la sesión no se guarda: se deduce de la fecha y de la ejecución de cada educador
// (`status`): programado, hoy o en curso si está publicado; realizado, falta el feedback o sin
// realizar si está finalizado.

import type { Enums } from '~/utils/db'
import type { Localized } from '~/utils/types'
import type { JornadaResumen } from '~/utils/jornadas'
import { lugarDelTaller } from '~/utils/jornadas'
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
  location: string      // dónde: su lugar y su espacio («Sede central · Aula 3A»)
  capacity: number      // asistentes estimados
  audiencia: string     // a quién se atiende («2.º B», «Público general»)
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
  // La jornada a la que pertenece, con sus días y su lugar; null = suelto.
  jornada: JornadaResumen | null
  // El programa del que es parte (dentro de una jornada, el de ella); null = ninguno.
  programa: { id: number, nombre: string } | null
  // Los valores tal cual están guardados, para editarlos (los de arriba son para mostrar). Dentro
  // de una jornada, el lugar es el de ella (lo pone la base).
  editable: {
    titulo: string
    horaInicio: string
    horaFin: string
    lugarId: number | null
    lugar: string
    espacio: string
    audienciaId: number | null
    programaId: number | null
    jornadaId: number | null
  }
  // Todos los asignados (educadores directos o vía grupo), con su ejecución real y su cierre.
  asignados: {
    id: number
    asignacionId: number
    nombre: string
    grupo: string | null
    estado: string
    iniciadoEn: string | null
    terminadoEn: string | null
    dispositivos: number | null   // cuántos se unieron con el QR, según su cierre (tarea 013)
    feedback: FeedbackWorkshop | null
  }[]
}

// Modalidades de la constitución: presencial, remota o híbrida (las etiquetas, en i18n).
export const MODALIDADES: Modalidad[] = ['PRESENCIAL', 'REMOTO', 'HIBRIDO']

// Estado de la sesión para el color (DESIGN.md, «Roles de color»): hoy en sol, próxima en cielo,
// completada en lima, borrador neutro y cancelada en coral.
// Lo que nadie ve todavía (borrador, en revisión) y lo descartado, neutros; lo que pasó sin
// realizarse o sin feedback, coral (falta algo).
export function sessionState(status: Workshop['status'], date: string): UiSessionState {
  if (status === 'borrador' || status === 'revision' || status === 'archivado') return 'borrador'
  if (status === 'cancelado') return 'cancelado'
  if (status === 'completado') return 'cerrado'
  if (status === 'sin_realizar') return 'por_cerrar'
  return date === hoyLocal() ? 'hoy' : 'proximo'
}

export function sessionTone(status: Workshop['status'], date: string): UiTone {
  return UI_SESSION_TONES[sessionState(status, date)]
}

const DEMO_JORNADA: JornadaResumen = { id: 1, nombre: 'Semana de la nutrición', ubicacion: 'Centro Comunitario', fecha_inicio: hoyLocal(-2), fecha_fin: hoyLocal(4) }
const demoEditable = (lugarId: number | null, lugar: string, espacio: string, audienciaId: number | null, jornadaId: number | null) =>
  ({ titulo: '', horaInicio: '', horaFin: '', lugarId, lugar, espacio, audienciaId, programaId: jornadaId ? 1 : null, jornadaId })
const DEMO_PROGRAMA = { id: 1, nombre: 'Crecer sano' }
const DEMO_WORKSHOPS: Workshop[] = [
  { id: 1, title: 'Los Frijoles Mágicos', storyboardId: 1, storyboard: 'Los Frijoles Mágicos', educatorId: 1, educator: 'Maria Lopez Hernandez', initials: 'ML', date: hoyLocal(), time: '09:00 - 10:30', location: 'Centro Comunitario · Aula 3A', capacity: 25, audiencia: '2.º B', language: 'es', notes: 'Traer frijoles reales para la demostración.', estado: 'PUBLICADO', status: 'programado', statusLabel: 'Hoy', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('programado', hoyLocal()), modalidad: 'PRESENCIAL', jornada: DEMO_JORNADA, programa: DEMO_PROGRAMA, editable: demoEditable(1, 'Centro Comunitario', 'Aula 3A', 1, 1), asignados: [{ id: 1, asignacionId: 1, nombre: 'Maria Lopez Hernandez', grupo: null, estado: 'PENDIENTE', iniciadoEn: null, terminadoEn: null, dispositivos: null, feedback: null }] },
  { id: 2, title: 'Piernas Fuertes', storyboardId: 2, storyboard: 'Piernas Fuertes', educatorId: 2, educator: 'Carlos Ramirez Torres', initials: 'CR', date: hoyLocal(3), time: '10:00 - 11:30', location: 'Centro Comunitario · Salón Principal', capacity: 30, audiencia: '2.º B', language: 'es', notes: '', estado: 'PUBLICADO', status: 'programado', statusLabel: 'Programado', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('programado', hoyLocal(3)), modalidad: 'PRESENCIAL', jornada: DEMO_JORNADA, programa: DEMO_PROGRAMA, editable: demoEditable(1, 'Centro Comunitario', 'Salón Principal', 1, 1), asignados: [{ id: 2, asignacionId: 2, nombre: 'Carlos Ramirez Torres', grupo: null, estado: 'PENDIENTE', iniciadoEn: null, terminadoEn: null, dispositivos: null, feedback: null }] },
  { id: 3, title: 'La Sopa de Verduras', storyboardId: 3, storyboard: 'La Sopa de Verduras', educatorId: 3, educator: 'Ana Torres Gutierrez', initials: 'AT', date: hoyLocal(-9), time: '11:00 - 12:30', location: 'Escuela Primaria Norte', capacity: 28, audiencia: '2.º B', language: 'es', notes: 'Excelente participación.', estado: 'FINALIZADO', status: 'completado', statusLabel: 'Realizado', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('completado', hoyLocal(-9)), modalidad: 'PRESENCIAL', jornada: null, programa: null, editable: demoEditable(2, 'Escuela Primaria Norte', '', 1, null), asignados: [{ id: 3, asignacionId: 3, nombre: 'Ana Torres Gutierrez', grupo: null, estado: 'COMPLETADO', iniciadoEn: null, terminadoEn: null, dispositivos: null, feedback: null }] },
  { id: 4, title: 'Lácteos y Calcio', storyboardId: 1, storyboard: 'Los Frijoles Mágicos', educatorId: 3, educator: 'Ana Torres Gutierrez', initials: 'AT', date: '', time: '', location: '—', capacity: 0, audiencia: '', language: 'es', notes: 'Borrador inicial.', estado: 'BORRADOR', status: 'borrador', statusLabel: 'Borrador', motivoCancelacion: '', reprogramaciones: 0, tone: sessionTone('borrador', ''), modalidad: 'PRESENCIAL', jornada: null, programa: null, editable: demoEditable(null, '', '', null, null), asignados: [] },
]

interface TallerRow {
  id: number
  titulo: string | null
  fecha: string | null
  hora_inicio: string | null
  hora_fin: string | null
  espacio: string | null
  lugar_id: number | null
  grupo_audiencia_id: number | null
  programa_id: number | null
  asistentes_estimados: number | null
  idioma_contenido: string
  estado: Enums<'estado_workshop'>
  modalidad: Modalidad
  notas: string | null
  motivo_cancelacion: string | null
  reprogramaciones: number
  jornada: (Omit<JornadaResumen, 'ubicacion'> & { lugar: { nombre: string } | null }) | null
  lugar: { id: number, nombre: string } | null
  audiencia: { id: number, nombre: string } | null
  programa: { id: number, nombre: string } | null
  storyboard: { id: number, titulo: Localized } | null
  asignaciones: {
    id: number
    estado: string
    iniciado_en: string | null
    terminado_en: string | null
    dispositivos_unidos: number | null
    educador: { id: number, nombre: string, apellido: string | null } | null
    grupo: { id: number, nombre: string } | null
    feedback: FeedbackWorkshop | null
  }[]
}

// La última lectura de la lista, compartida por todas las piezas que la usan (utils/alDia.ts).
const lectura = lecturaNueva()

export function useWorkshops() {
  const demo = !isSupabaseConfigured()
  const { t, locale } = useT()
  const { orgActiva } = useContexto()

  const state = useState<{ orgId: number | null, workshops: Workshop[], loading: boolean }>(
    'workshops-data',
    () => ({ orgId: null, workshops: demo ? DEMO_WORKSHOPS : [], loading: false }),
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
      case 'BORRADOR': status = 'borrador'; statusLabel = t('workshops.st.borrador'); break
      case 'EN_REVISION': status = 'revision'; statusLabel = t('workshops.st.revision'); break
      case 'CANCELADO': status = 'cancelado'; statusLabel = t('workshops.st.cancelado'); break
      case 'ARCHIVADO': status = 'archivado'; statusLabel = t('workshops.st.archivado'); break
      case 'FINALIZADO':
        status = realizado ? 'completado' : 'sin_realizar'
        statusLabel = realizado ? t('workshops.st.completado') : empezado ? t('workshops.st.faltaFeedback') : t('workshops.st.sin_realizar')
        break
      default:
        status = 'programado'
        statusLabel = empezado ? t('workshops.st.enCurso') : row.fecha === hoyLocal() ? t('workshops.st.hoy') : t('workshops.st.programado')
    }

    const extras = row.asignaciones.filter(a => a.educador).length - 1

    return {
      id: row.id,
      title: row.titulo || sbTitulo || '—',
      storyboardId: row.storyboard?.id ?? 0,
      storyboard: sbTitulo || '—',
      educatorId: primero?.id ?? 0,
      educator: primero ? nombreDe(primero) + (extras > 0 ? ` +${extras}` : '') : t('workshops.unassigned'),
      initials: primero ? `${primero.nombre.charAt(0)}${(primero.apellido ?? '').charAt(0)}`.toUpperCase() : '—',
      date: row.fecha ?? '',
      time: row.hora_inicio && row.hora_fin ? `${row.hora_inicio.slice(0, 5)} - ${row.hora_fin.slice(0, 5)}` : '',
      location: lugarDelTaller(row.lugar?.nombre, row.espacio) || '—',
      capacity: row.asistentes_estimados ?? 0,
      audiencia: row.audiencia?.nombre ?? '',
      language: row.idioma_contenido,
      notes: row.notas ?? '',
      estado: row.estado,
      status,
      statusLabel,
      motivoCancelacion: row.motivo_cancelacion ?? '',
      reprogramaciones: row.reprogramaciones,
      tone: sessionTone(status, row.fecha ?? ''),
      modalidad: row.modalidad,
      jornada: row.jornada
        ? { id: row.jornada.id, nombre: row.jornada.nombre, ubicacion: row.jornada.lugar?.nombre ?? '', fecha_inicio: row.jornada.fecha_inicio, fecha_fin: row.jornada.fecha_fin }
        : null,
      programa: row.programa,
      editable: {
        titulo: row.titulo ?? '',
        horaInicio: row.hora_inicio?.slice(0, 5) ?? '',
        horaFin: row.hora_fin?.slice(0, 5) ?? '',
        lugarId: row.lugar_id,
        lugar: row.lugar?.nombre ?? '',
        espacio: row.espacio ?? '',
        audienciaId: row.grupo_audiencia_id,
        programaId: row.programa_id,
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
          dispositivos: a.dispositivos_unidos,
          feedback: a.feedback,
        })),
    }
  }

  // `educadores` se embebe por su FK directa: la compuesta (educador_id, organizacion_id) también
  // llega a `educadores` y PostgREST pide elegir una.
  async function leer() {
    if (demo) return
    const oid = orgActiva.value?.id
    if (!oid) return
    // Solo la primera lectura de una organización se ve cargando: volver a leer no tapa lo que ya se ve.
    if (state.value.orgId !== oid) state.value.loading = true
    const { data } = await useSupabaseClient()
      .from('workshops')
      .select(`
        id, titulo, fecha, hora_inicio, hora_fin, espacio, lugar_id, grupo_audiencia_id, programa_id, asistentes_estimados,
        idioma_contenido, estado, modalidad, notas, motivo_cancelacion, reprogramaciones,
        jornada:jornadas ( id, nombre, fecha_inicio, fecha_fin, lugar:lugares ( nombre ) ),
        lugar:lugares ( id, nombre ),
        audiencia:grupos_audiencia ( id, nombre ),
        programa:programas ( id, nombre ),
        storyboard:storyboards ( id, titulo ),
        asignaciones:workshop_educadores ( id, estado, iniciado_en, terminado_en, dispositivos_unidos,
          educador:educadores!workshop_educadores_educador_id_fkey ( id, nombre, apellido ), grupo:educador_grupos ( id, nombre ),
          feedback:workshop_feedback ( calificacion, asistentes_reales, participacion_grupo, claridad_contenido,
            dificultades_grupo, material_faltante ) )
      `)
      .eq('organizacion_id', oid)
      .order('fecha', { ascending: true, nullsFirst: false })
    state.value.workshops = (((data as unknown) as TallerRow[] | null) ?? []).map(mapRow)
    state.value.orgId = oid
    state.value.loading = false
  }

  // Leer y anotar cuándo; al entrar a la página y al volver a la pestaña, otra vez si hace falta (utils/alDia.ts).
  const refresh = () => leerAnotando(lectura, leer)
  if (!demo) useAlDia(lectura, () => state.value.orgId, refresh)

  const workshops = computed(() => state.value.workshops)
  const loading = computed(() => state.value.loading)

  function getWorkshop(id: number) {
    return workshops.value.find(w => w.id === id)
  }

  // ── Escritura ───────────────────────────────────────────────────────────────
  // Alta desde «Nuevo Taller»: el taller (nace en borrador o en revisión) + una asignación por educador
  // (con su grupo de educadores si vino de uno) y, si se eligió, se publica. La base comprueba que
  // el storyboard esté publicado y disponible para la organización (sus países o personalizado suyo),
  // que el idioma sea uno de los suyos y que la fecha caiga en los días de la jornada; para publicar,
  // fecha, hora, lugar, audiencia y educador. Dentro de una jornada, el lugar lo pone la base.
  async function createTaller(payload: {
    titulo: string
    storyboardId: number
    fecha: string
    horaInicio: string
    horaFin: string
    lugarId: number | null
    espacio: string
    audienciaId: number | null
    programaId: number | null
    idioma: string
    notas: string
    capacidad: number | null
    modalidad: Modalidad
    estado: 'BORRADOR' | 'EN_REVISION' | 'PUBLICADO'
    jornadaId: number | null
    asignaciones: { educadorId: number, grupoId: number | null }[]
  }): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: 1, error: null }
    if (!orgActiva.value) return { id: null, error: t('ctx.noOrgActive') }
    const supabase = useSupabaseClient()
    const organizacionId = orgActiva.value.id

    const { data, error } = await supabase
      .from('workshops')
      .insert({
        titulo: payload.titulo.trim() || null,
        fecha: payload.fecha || null,
        hora_inicio: payload.horaInicio || null,
        hora_fin: payload.horaFin || null,
        lugar_id: payload.lugarId,
        espacio: payload.espacio.trim() || null,
        grupo_audiencia_id: payload.audienciaId,
        programa_id: payload.programaId,
        asistentes_estimados: payload.capacidad,
        idioma_contenido: payload.idioma as Enums<'idioma'>,
        notas: payload.notas.trim() || null,
        estado: payload.estado === 'EN_REVISION' ? 'EN_REVISION' : 'BORRADOR',
        modalidad: payload.modalidad,
        organizacion_id: organizacionId,
        storyboard_id: payload.storyboardId,
        jornada_id: payload.jornadaId,
      })
      .select('id')
      .single()
    if (error) return { id: null, error: error.message }

    if (payload.asignaciones.length) {
      const { error: e2 } = await supabase.from('workshop_educadores').insert(
        payload.asignaciones.map(a => ({
          workshop_id: data.id,
          educador_id: a.educadorId,
          educador_grupo_id: a.grupoId,
          organizacion_id: organizacionId,
        })),
      )
      if (e2) return { id: null, error: e2.message }
    }

    if (payload.estado === 'PUBLICADO') {
      const { error: e3 } = await supabase.from('workshops').update({ estado: 'PUBLICADO' }).eq('id', data.id)
      if (e3) {
        await refresh()
        return { id: data.id, error: t('workshops.savedNotPublished', { error: e3.message }) }
      }
    }

    await refresh()
    return { id: data.id, error: null }
  }

  // El planner mueve talleres de día: se persiste y se refleja optimista en la lista. Mover uno
  // finalizado sin realizar a hoy o después lo reprograma (vuelve a publicado). Si el día cae
  // fuera de su jornada, la base lo rechaza y el refresco lo devuelve a su sitio.
  async function updateFecha(id: number, fecha: string) {
    const w = state.value.workshops.find(x => x.id === id)
    if (w) w.date = fecha
    if (demo) return { error: null }
    const reprogramar = w?.estado === 'FINALIZADO' && fecha >= hoyLocal()
    const { error } = await useSupabaseClient().from('workshops')
      .update(reprogramar ? { fecha, estado: 'PUBLICADO' } : { fecha }).eq('id', id)
    await refresh()
    return { error: error?.message ?? null }
  }

  // Guardar los cambios del detalle (tarea 023): lo mismo que se elige en «Nuevo Taller» (sus datos, su storyboard, a
  // qué pertenece y sus educadores), de una vez. Se edita mientras no se ha dado (borrador, en revisión o publicado sin
  // empezar). La base valida el storyboard, el idioma, que la fecha caiga en su jornada y en su programa, y que uno
  // publicado conserve fecha, hora, lugar, audiencia y un educador: por eso los educadores nuevos se asignan antes de
  // quitar a los que salen. Dentro de una jornada, el lugar y el programa son los de ella (los pone la base): no se
  // mandan. Al salir de una, el taller se queda con el lugar que se elija.
  async function guardarTaller(id: number, datos: {
    titulo: string
    storyboardId: number
    fecha: string
    horaInicio: string
    horaFin: string
    jornadaId: number | null
    lugarId: number | null
    espacio: string
    audienciaId: number | null
    programaId: number | null
    capacidad: number | null
    idioma: string
    modalidad: Modalidad
    notas: string
    asignaciones: { educadorId: number, grupoId: number | null }[]
  }) {
    if (demo) return { error: null }
    const w = getWorkshop(id)
    if (!w || !orgActiva.value) return { error: t('workshops.notFound') }
    const supabase = useSupabaseClient()
    const { error } = await supabase.from('workshops').update({
      titulo: datos.titulo.trim() || null,
      storyboard_id: datos.storyboardId,
      fecha: datos.fecha || null,
      hora_inicio: datos.horaInicio || null,
      hora_fin: datos.horaFin || null,
      jornada_id: datos.jornadaId,
      ...(datos.jornadaId ? {} : { lugar_id: datos.lugarId, programa_id: datos.programaId }),
      espacio: datos.espacio.trim() || null,
      grupo_audiencia_id: datos.audienciaId,
      asistentes_estimados: datos.capacidad,
      idioma_contenido: datos.idioma as Enums<'idioma'>,
      modalidad: datos.modalidad,
      notas: datos.notas.trim() || null,
    }).eq('id', id)
    if (error) {
      await refresh()
      return { error: error.message }
    }

    // Los educadores: entran los nuevos (con su grupo, si vienen de uno) y después salen los que ya no están.
    const actuales = new Set(w.asignados.map(a => a.id))
    const quedan = new Set(datos.asignaciones.map(a => a.educadorId))
    const entran = datos.asignaciones.filter(a => !actuales.has(a.educadorId))
    const salen = w.asignados.filter(a => !quedan.has(a.id)).map(a => a.asignacionId)
    const organizacionId = orgActiva.value.id
    if (entran.length) {
      const { error: e2 } = await supabase.from('workshop_educadores').insert(entran.map(a => ({
        workshop_id: id, educador_id: a.educadorId, educador_grupo_id: a.grupoId, organizacion_id: organizacionId,
      })))
      if (e2) {
        await refresh()
        return { error: e2.message }
      }
    }
    if (salen.length) {
      const { error: e3 } = await supabase.from('workshop_educadores').delete().in('id', salen)
      if (e3) {
        await refresh()
        return { error: e3.message }
      }
    }
    await refresh()
    return { error: null }
  }

  // Cuánto estuvieron conectados los dispositivos que se aprobaron en la conexión del taller (tarea 013), sumado. El
  // reporte lo cuenta igual.
  async function segundosConectados(id: number): Promise<number> {
    if (demo) return 0
    const { data } = await useSupabaseClient()
      .from('workshop_conexiones')
      .select('participantes:workshop_conexion_participantes ( segundos_conectado, aprobado_en )')
      .eq('workshop_id', id)
    const conexiones = ((data as unknown) as { participantes: { segundos_conectado: number, aprobado_en: string | null }[] }[] | null) ?? []
    return conexiones.flatMap(c => c.participantes).filter(p => p.aprobado_en).reduce((suma, p) => suma + p.segundos_conectado, 0)
  }

  // «Programar sesiones» de un programa (tarea 021): muchos talleres de una vez, en tres pasos y un
  // solo refresco: todos nacen en borrador, se asignan sus educadores y, si se pidió, se publican
  // juntos. Si publicar falla (una fecha fuera del programa, un educador inactivo), quedan en
  // borrador y se avisa. La base comprueba lo mismo que con uno.
  async function crearSerie(talleres: {
    titulo: string
    storyboardId: number
    fecha: string
    horaInicio: string
    horaFin: string
    lugarId: number
    espacio: string
    audienciaId: number
    programaId: number
    idioma: string
    capacidad: number | null
    educadorId: number
  }[], publicar: boolean): Promise<{ creados: number, error: string | null }> {
    if (demo) return { creados: talleres.length, error: null }
    if (!orgActiva.value) return { creados: 0, error: t('ctx.noOrgActive') }
    if (!talleres.length) return { creados: 0, error: null }
    const supabase = useSupabaseClient()
    const organizacionId = orgActiva.value.id
    const { data, error } = await supabase.from('workshops')
      .insert(talleres.map(w => ({
        titulo: w.titulo.trim() || null,
        fecha: w.fecha,
        hora_inicio: w.horaInicio,
        hora_fin: w.horaFin || null,
        lugar_id: w.lugarId,
        espacio: w.espacio.trim() || null,
        grupo_audiencia_id: w.audienciaId,
        programa_id: w.programaId,
        idioma_contenido: w.idioma as Enums<'idioma'>,
        asistentes_estimados: w.capacidad,
        estado: 'BORRADOR' as const,
        modalidad: 'PRESENCIAL' as const,
        storyboard_id: w.storyboardId,
        organizacion_id: organizacionId,
      })))
      .select('id, fecha, lugar_id, grupo_audiencia_id, storyboard_id')
    if (error || !data) return { creados: 0, error: error?.message ?? null }
    const ids = data.map(d => d.id)
    // Cada taller con su educador, por lo que lo distingue (fecha, lugar, audiencia y storyboard),
    // sin dar por hecho el orden en que vuelven.
    const clave = (x: { fecha: string | null, lugar_id: number | null, grupo_audiencia_id: number | null, storyboard_id: number }) =>
      `${x.fecha}|${x.lugar_id}|${x.grupo_audiencia_id}|${x.storyboard_id}`
    const educadorDe = new Map(talleres.map(w => [
      clave({ fecha: w.fecha, lugar_id: w.lugarId, grupo_audiencia_id: w.audienciaId, storyboard_id: w.storyboardId }), w.educadorId,
    ]))
    const { error: e2 } = await supabase.from('workshop_educadores').insert(
      data.map((d, i) => ({ workshop_id: d.id, educador_id: educadorDe.get(clave(d)) ?? talleres[i]!.educadorId, organizacion_id: organizacionId })),
    )
    if (e2) {
      await refresh()
      return { creados: ids.length, error: t('programs.seriesNotAssigned', { error: e2.message }) }
    }
    if (publicar) {
      const { error: e3 } = await supabase.from('workshops').update({ estado: 'PUBLICADO' }).in('id', ids)
      if (e3) {
        await refresh()
        return { creados: ids.length, error: t('programs.seriesNotPublished', { error: e3.message }) }
      }
    }
    await refresh()
    return { creados: ids.length, error: null }
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

  // Eliminar: solo mientras no se ha dado (borrador, en revisión o publicado sin empezar; lo exige la base). Lo dado
  // se archiva.
  async function eliminarTaller(id: number) {
    if (demo) return { error: null }
    const { error } = await useSupabaseClient().from('workshops').delete().eq('id', id)
    if (!error) await refresh()
    return { error: error?.message ?? null }
  }

  // Duplicar = mismo contenido, SIN fecha, sin jornada y en borrador (para reprogramarlo), con el
  // mismo lugar, espacio y audiencia.
  async function duplicarTaller(id: number): Promise<{ id: number | null, error: string | null }> {
    if (demo) return { id: null, error: null }
    const w = getWorkshop(id)
    if (!w || !orgActiva.value) return { id: null, error: t('workshops.notFound') }
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('workshops')
      .insert({
        titulo: w.title,
        lugar_id: w.editable.lugarId,
        espacio: w.editable.espacio || null,
        grupo_audiencia_id: w.editable.audienciaId,
        programa_id: w.editable.programaId,
        asistentes_estimados: w.capacity || null,
        idioma_contenido: w.language as Enums<'idioma'>,
        notas: w.notes || null,
        estado: 'BORRADOR',
        modalidad: w.modalidad,
        organizacion_id: orgActiva.value.id,
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
    crearSerie,
    updateFecha,
    guardarTaller,
    segundosConectados,
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
