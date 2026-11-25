import type { Modalidad, Workshop } from '~/composables/useWorkshops'
import { ampliarJornada, fechaEnJornada, lugarDelTaller } from '~/utils/jornadas'
import { faltasDelTaller, primeraIncompleta } from '~/utils/nuevoTaller'
import { leerPertenencia, pertenenciaDe, valorDePertenencia } from '~/utils/pertenencia'

export type EducatorSelectionMode = 'individual' | 'group'
export type WizardModalidad = Modalidad
// Cómo queda el taller al crearlo: borrador, en revisión (otro lo confirma) o publicado.
export type WizardEstado = 'BORRADOR' | 'EN_REVISION' | 'PUBLICADO'

interface DiasJornada { fecha_inicio: string, fecha_fin: string }

export interface WizardState {
  storyboardId: number | null
  educatorMode: EducatorSelectionMode
  educatorIds: number[]
  groupIds: number[]
  title: string
  lugarId: number | null      // fuera de una jornada, su lugar; dentro, el de ella (lo pone la base)
  espacio: string             // dónde dentro del lugar («Aula 3A»)
  audienciaId: number | null  // a quién se atiende («2.º B», «Público general»)
  programaId: number | null   // dentro de un programa (opcional); dentro de una jornada, el de ella
  language: string      // el idioma del contenido: uno de los del storyboard
  notes: string
  capacity: string
  date: string
  timeStart: string
  timeEnd: string
  modalidad: WizardModalidad
  estado: WizardEstado
  jornadaId: number | null    // dentro de una jornada: toma su lugar, sus días y su programa
  // Los días a los que se amplía la jornada en curso elegida (confirmado), para que quepa la fecha.
  ampliacion: DiasJornada | null
}

// «Nuevo Taller» en una sola tarjeta (tarea 023), con sus secciones a la vista: nombre, storyboard, educadores, cuándo y
// dónde (a qué pertenece, su fecha, su hora, su lugar de la lista y su espacio) y audiencia; abajo se elige cómo se
// guarda: publicado, en revisión o borrador. Cada sección dice lo que le falta (`faltas`, utils/nuevoTaller.ts) y,
// después de pulsar «Publicar» (`intentado`), sus campos lo marcan. Entra con `?storyboard=`, `?fecha=` (desde el planificador), `?programa=<id>` (desde la ficha
// del programa) o `?jornada=<id>&fecha=` (desde la ficha o el panel de la jornada, o «Agregar otro taller a esta
// jornada»). «Pertenece a» (tarea 023) es una sola pregunta: suelto, un programa (la fecha cae en las suyas) o una
// jornada (el día es uno de los suyos y el lugar el de ella; el taller solo añade su espacio). Una jornada se puede
// ampliar con otro día. Las jornadas y los programas se crean en su sección, nunca aquí. No se propone jornada por la
// fecha: dos jornadas la misma semana en lugares distintos lo harían equivocarse.
//
// El detalle de un taller (tarea 023) es la misma tarjeta y se edita igual: `cargarTaller` pone el taller guardado en el
// estado, `sinGuardar` dice si algo cambió y `guardarCambios` lo guarda todo de una vez.
export function useWorkshopWizard() {
  const route = useRoute()
  const { t, locale } = useT()
  const { getStoryboard } = useStoryboards()
  // El taller que se edita en su detalle (null en «Nuevo Taller»).
  const editando = useState<number | null>('wizard-editando', () => null)
  const { getEducator, getGroup, getGroupMembers } = useEducators()
  const { getLugar } = useLugares()
  const { getPrograma } = useProgramas()
  // Las jornadas de la organización (la lista compartida), para elegir una y limitar la fecha.
  const { jornadas, getJornada, refresh: refreshJornadas, cambiarDias } = useJornadas()
  const { getWorkshop, guardarTaller, createTaller } = useWorkshops()

  // Ya se pulsó «Publicar» con algo por completar: los campos que faltan se marcan.
  const intentado = useState('wizard-intentado', () => false)
  const isSubmitting = useState('wizard-submitting', () => false)
  const isSuccess = useState('wizard-success', () => false)
  // Lo último guardado: su jornada y su fecha, para «Agregar otro taller a esta jornada».
  const ultimo = useState<{ jornadaId: number | null, fecha: string } | null>('wizard-ultimo', () => null)

  function leerQuery() {
    const q = route.query
    return {
      storyboardId: q.storyboard ? Number(q.storyboard) : null,
      fecha: (q.fecha ?? q.date) ? String(q.fecha ?? q.date) : '',
      jornadaId: q.jornada ? Number(q.jornada) || null : null,
      programaId: q.programa ? Number(q.programa) || null : null,
    }
  }

  function estadoInicial(): WizardState {
    const q = leerQuery()
    return {
      storyboardId: q.storyboardId,
      educatorMode: 'individual',
      educatorIds: [],
      groupIds: [],
      title: '',
      lugarId: null,
      espacio: '',
      audienciaId: null,
      programaId: q.programaId,
      language: 'es',
      notes: '',
      capacity: '25',
      date: q.fecha,
      timeStart: '',
      timeEnd: '',
      modalidad: 'PRESENCIAL',
      estado: 'PUBLICADO',
      jornadaId: q.jornadaId,
      ampliacion: null,
    }
  }

  const state = useState<WizardState>('wizard-state', estadoInicial)

  const hasPreselectedStoryboard = computed(() => !!route.query.storyboard)
  const hasPreselectedDate = computed(() => !!(route.query.fecha ?? route.query.date))

  const selectedStoryboard = computed(() =>
    state.value.storyboardId ? getStoryboard(state.value.storyboardId) : null,
  )

  const selectedEducators = computed(() =>
    state.value.educatorIds.map(id => getEducator(id)).filter((e): e is NonNullable<typeof e> => !!e),
  )

  const selectedGroups = computed(() =>
    state.value.groupIds.map(id => getGroup(id)).filter((g): g is NonNullable<typeof g> => !!g),
  )

  // Los miembros, por id de grupo y sin repetir (dos grupos pueden compartir educadores).
  const selectedGroupsMembers = computed(() => {
    const vistos = new Set<number>()
    return selectedGroups.value
      .flatMap(g => getGroupMembers(g.id))
      .filter(m => (vistos.has(m.id) ? false : (vistos.add(m.id), true)))
  })

  // ── A qué pertenece: suelto, un programa o una jornada ─────────────────────────
  const pertenencia = computed(() => pertenenciaDe(state.value.jornadaId, state.value.programaId))
  const valorPertenencia = computed(() => valorDePertenencia(pertenencia.value))
  function elegirPertenencia(valor: string | number | null) {
    const { jornadaId, programaId } = leerPertenencia(valor)
    state.value.jornadaId = jornadaId
    state.value.programaId = programaId
  }

  // La jornada elegida (tal como está guardada).
  const selectedJornada = computed(() => getJornada(state.value.jornadaId))

  // La jornada con la que se va a guardar, con su ampliación si se confirmó. Para la revisión, el lugar efectivo y
  // los límites de la fecha.
  const jornadaEfectiva = computed(() => {
    const j = selectedJornada.value
    if (!j) return null
    const a = state.value.ampliacion
    return { nombre: j.nombre, ubicacion: j.ubicacion, programaId: j.programa_id, fecha_inicio: a?.fecha_inicio ?? j.fecha_inicio, fecha_fin: a?.fecha_fin ?? j.fecha_fin, ampliada: !!a }
  })

  // El programa con el que queda: el de su jornada, si va en una; si no, el elegido (o ninguno).
  // El taller tiene que caer en sus fechas (lo exige la base).
  const programaEfectivo = computed(() => getPrograma(jornadaEfectiva.value ? jornadaEfectiva.value.programaId : state.value.programaId))
  const dateFueraDePrograma = computed(() => {
    const p = programaEfectivo.value
    return !!p && !!state.value.date && !fechaEnJornada(p, state.value.date)
  })

  // «Sede central · Aula 3A»: el lugar (el de la jornada, si va en una) y su espacio.
  const lugarEfectivo = computed(() => lugarDelTaller(
    jornadaEfectiva.value ? jornadaEfectiva.value.ubicacion : getLugar(state.value.lugarId)?.nombre,
    state.value.espacio,
  ))

  // Dentro de un programa (sin jornada), la fecha vive entre sus fechas. Con una jornada no se limita el calendario:
  // otro día ofrece ampliarla (comprobarFecha). Uno ya publicado, en su detalle, se mueve desde hoy.
  const fechaDesde = useState('wizard-fecha-desde', () => '')
  const dateMin = computed(() => [!state.value.jornadaId ? programaEfectivo.value?.fecha_inicio ?? '' : '', fechaDesde.value].sort().at(-1) || undefined)
  const dateMax = computed(() => (!state.value.jornadaId ? programaEfectivo.value?.fecha_fin : undefined))

  // Ampliar la jornada en curso: la fecha que no cabe y los días que tendría. La última fecha
  // aceptada (dentro de sus días o con la ampliación confirmada) es a la que se vuelve con «No».
  const ampliarPendiente = useState<(DiasJornada & { fecha: string }) | null>('wizard-ampliar', () => null)
  const fechaAceptada = useState('wizard-fecha-aceptada', () => '')

  // El primer día de la jornada que no haya pasado: hoy si cae dentro, si no su inicio.
  function primerDia(j: DiasJornada) {
    const hoy = hoyLocal()
    return hoy > j.fecha_inicio && hoy <= j.fecha_fin ? hoy : j.fecha_inicio
  }

  // ¿La fecha cabe en la jornada en curso elegida? Si no, pregunta si se amplía (y devuelve false).
  function comprobarFecha(): boolean {
    const j = selectedJornada.value
    const fecha = state.value.date
    if (!j || !fecha) return true
    if (fechaEnJornada(j, fecha)) {
      state.value.ampliacion = null
      fechaAceptada.value = fecha
      return true
    }
    const dias = ampliarJornada(j, fecha)
    const a = state.value.ampliacion
    if (a && a.fecha_inicio === dias.fecha_inicio && a.fecha_fin === dias.fecha_fin) return true
    ampliarPendiente.value = { fecha, ...dias }
    return false
  }

  function confirmarAmpliar() {
    const p = ampliarPendiente.value
    if (!p) return
    state.value.ampliacion = { fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin }
    fechaAceptada.value = p.fecha
    ampliarPendiente.value = null
  }

  // «No»: se mantiene la fecha anterior (y la ampliación que le correspondía, si la había).
  function rechazarAmpliar() {
    const j = selectedJornada.value
    ampliarPendiente.value = null
    if (!j) return
    state.value.date = fechaAceptada.value || primerDia(j)
    if (fechaEnJornada(j, state.value.date)) state.value.ampliacion = null
  }

  // Al elegir una jornada en curso (o al llegar la lista con una preseleccionada): sin fecha, su
  // primer día; con una fecha fuera de sus días, se pregunta si se amplía.
  function alElegirJornada() {
    const j = selectedJornada.value
    if (!j) return
    state.value.ampliacion = null
    fechaAceptada.value = state.value.date && fechaEnJornada(j, state.value.date) ? state.value.date : primerDia(j)
    if (!state.value.date) state.value.date = fechaAceptada.value
    else comprobarFecha()
  }

  // Los vigilantes de la jornada, una sola vez: los registra la página de «Nuevo Taller» (varios
  // componentes usan este composable y cada uno los duplicaría).
  function vigilarJornada() {
    watch(() => selectedJornada.value?.id, (id, antes) => {
      if (id !== antes) alElegirJornada()
    })
    // Fuera de una jornada no hay nada que ampliar.
    watch(() => state.value.jornadaId, (id) => {
      if (!id) {
        state.value.ampliacion = null
        ampliarPendiente.value = null
      }
    })
  }

  function selectStoryboard(id: number) {
    // El nombre sigue al storyboard mientras no se haya escrito otro.
    const antes = selectedStoryboard.value?.title
    state.value.storyboardId = id
    const sb = getStoryboard(id)
    if (sb) {
      if (!state.value.title.trim() || state.value.title === antes) {
        state.value.title = sb.title
      }
      if (!sb.languages.includes(state.value.language)) {
        state.value.language = sb.languages[0] ?? 'es'
      }
      if (state.value.timeStart) {
        state.value.timeEnd = calculateEndTime(state.value.timeStart, sb.duration)
      }
    }
  }

  function toggleEducator(id: number) {
    state.value.educatorMode = 'individual'
    const idx = state.value.educatorIds.indexOf(id)
    if (idx === -1) {
      state.value.educatorIds.push(id)
    }
    else {
      state.value.educatorIds.splice(idx, 1)
    }
  }

  function toggleGroup(id: number) {
    state.value.educatorMode = 'group'
    const idx = state.value.groupIds.indexOf(id)
    if (idx === -1) {
      state.value.groupIds.push(id)
    }
    else {
      state.value.groupIds.splice(idx, 1)
    }
  }

  function onTimeStartChange(time: string) {
    state.value.timeStart = time
    if (selectedStoryboard.value) {
      state.value.timeEnd = calculateEndTime(time, selectedStoryboard.value.duration)
    }
  }

  function calculateEndTime(startTime: string, duration: string): string {
    if (!startTime) return ''
    const minutes = parseInt(duration) || 30
    const [h = 0, m = 0] = startTime.split(':').map(Number)
    const totalMin = h * 60 + m + minutes
    const endH = Math.floor(totalMin / 60) % 24
    const endM = totalMin % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  // Lo que falta para publicar, por sección. Un grupo cuenta por sus miembros activos: uno vacío no asigna a nadie, y un
  // taller publicado necesita educador.
  const faltas = computed(() => faltasDelTaller({
    titulo: state.value.title,
    storyboardId: state.value.storyboardId,
    educadores: state.value.educatorMode === 'group' ? selectedGroupsMembers.value.length : state.value.educatorIds.length,
    fecha: state.value.date,
    hora: state.value.timeStart,
    lugarId: state.value.lugarId,
    enJornada: !!selectedJornada.value,
    fueraDelPrograma: dateFueraDePrograma.value,
    audienciaId: state.value.audienciaId,
  }))
  const primeraSinCompletar = computed(() => primeraIncompleta(faltas.value))

  // Una asignación por educador; si vino de un grupo, se recuerda el grupo. Grupos con miembros solapados no duplican
  // asignaciones (unique en la base, y aquí se dedupe).
  function asignacionesElegidas() {
    const crudas = state.value.educatorMode === 'group'
      ? selectedGroups.value.flatMap(g => getGroupMembers(g.id).map(m => ({ educadorId: m.id, grupoId: g.id })))
      : state.value.educatorIds.map(id => ({ educadorId: id, grupoId: null as number | null }))
    const vistos = new Set<number>()
    return crudas.filter((a) => {
      if (vistos.has(a.educadorId)) return false
      vistos.add(a.educadorId)
      return true
    })
  }

  // ── El detalle: el taller guardado en la misma tarjeta ──────────────────────────
  // El estado con lo que tiene guardado. Sin nombre propio, el del storyboard (como en «Nuevo Taller»).
  function estadoDeTaller(w: Workshop): WizardState {
    return {
      storyboardId: w.storyboardId,
      educatorMode: 'individual',
      educatorIds: w.asignados.map(a => a.id),
      groupIds: [],
      title: w.editable.titulo || getStoryboard(w.storyboardId)?.title || '',
      lugarId: w.editable.lugarId,
      espacio: w.editable.espacio,
      audienciaId: w.editable.audienciaId,
      programaId: w.editable.programaId,
      language: w.language,
      notes: w.notes,
      capacity: w.capacity ? String(w.capacity) : '',
      date: w.date,
      timeStart: w.editable.horaInicio,
      timeEnd: w.editable.horaFin,
      modalidad: w.modalidad,
      estado: w.estado === 'EN_REVISION' || w.estado === 'PUBLICADO' ? w.estado : 'BORRADOR',
      jornadaId: w.editable.jornadaId,
      ampliacion: null,
    }
  }

  // Lo que cuenta para saber si algo cambió: los datos y a quién se asigna (un grupo cuenta por sus miembros).
  function huella(s: WizardState, educadores: number[]) {
    return JSON.stringify([
      s.title.trim(), s.storyboardId, s.date, s.timeStart, s.timeEnd, s.jornadaId, s.jornadaId ? null : s.lugarId,
      s.jornadaId ? null : s.programaId, s.espacio.trim(), s.audienciaId, s.capacity, s.language, s.modalidad,
      s.notes.trim(), s.ampliacion, [...educadores].sort((a, b) => a - b),
    ])
  }

  // Pone el taller en la tarjeta: lo guardado, sin preguntas pendientes (y sin marcas, si es otro taller). Uno publicado
  // se mueve desde hoy.
  function cargarTaller(w: Workshop) {
    if (editando.value !== w.id) intentado.value = false
    editando.value = w.id
    isSubmitting.value = false
    ampliarPendiente.value = null
    fechaAceptada.value = w.date
    fechaDesde.value = w.estado === 'PUBLICADO' ? hoyLocal() : ''
    state.value = estadoDeTaller(w)
  }

  // ¿La tarjeta tiene lo que este taller tiene guardado? Y, con el que se edita, si hay algo sin guardar.
  function coincideCon(w: Workshop) {
    return huella(state.value, asignacionesElegidas().map(a => a.educadorId)) === huella(estadoDeTaller(w), w.asignados.map(a => a.id))
  }
  const sinGuardar = computed(() => {
    const w = editando.value ? getWorkshop(editando.value) : undefined
    return !!w && !coincideCon(w)
  })

  // Guarda los cambios del taller que se edita. Con una jornada ampliada, primero amplía sus días. Devuelve si se
  // guardó (si no, con su aviso).
  async function guardarCambios(): Promise<boolean> {
    const id = editando.value
    if (!id || !state.value.storyboardId) return false
    isSubmitting.value = true
    const { toast } = useToast()
    const jornadaId = selectedJornada.value?.id ?? null
    if (jornadaId && state.value.ampliacion) {
      const { error } = await cambiarDias(jornadaId, state.value.ampliacion)
      if (error) {
        isSubmitting.value = false
        toast.error(error)
        return false
      }
    }
    const { error } = await guardarTaller(id, {
      titulo: state.value.title,
      storyboardId: state.value.storyboardId,
      fecha: state.value.date,
      horaInicio: state.value.timeStart,
      horaFin: state.value.timeEnd,
      jornadaId,
      lugarId: state.value.lugarId,
      espacio: state.value.espacio,
      audienciaId: state.value.audienciaId,
      programaId: state.value.programaId,
      capacidad: state.value.capacity ? Number(state.value.capacity) : null,
      idioma: state.value.language,
      modalidad: state.value.modalidad,
      notas: state.value.notes,
      asignaciones: asignacionesElegidas(),
    })
    isSubmitting.value = false
    if (error) {
      toast.error(error)
      return false
    }
    // Cuántos talleres lleva cada jornada (y sus días) pudo cambiar.
    void refreshJornadas()
    return true
  }

  // Guarda el taller. Con una jornada ampliada, primero amplía sus días. Devuelve la jornada y la fecha del taller
  // (para «Agregar otro taller a esta jornada»), o null si algo falló (con su aviso).
  async function submit(): Promise<{ jornadaId: number | null, fecha: string } | null> {
    if (!state.value.storyboardId) return null
    isSubmitting.value = true
    const { toast } = useToast()

    const jornadaId = selectedJornada.value?.id ?? null
    if (jornadaId && state.value.ampliacion) {
      const { error } = await cambiarDias(jornadaId, state.value.ampliacion)
      if (error) {
        isSubmitting.value = false
        toast.error(error)
        return null
      }
    }

    const asignaciones = asignacionesElegidas()
    const { error } = await createTaller({
      titulo: state.value.title,
      storyboardId: state.value.storyboardId,
      fecha: state.value.date,
      horaInicio: state.value.timeStart,
      horaFin: state.value.timeEnd,
      lugarId: jornadaId ? null : state.value.lugarId,
      espacio: state.value.espacio,
      audienciaId: state.value.audienciaId,
      programaId: jornadaId ? null : state.value.programaId,
      idioma: state.value.language,
      notas: state.value.notes,
      capacidad: state.value.capacity ? Number(state.value.capacity) : null,
      modalidad: state.value.modalidad,
      estado: state.value.estado,
      jornadaId,
      asignaciones,
    })

    if (error) {
      isSubmitting.value = false
      toast.error(error)
      return null
    }
    isSubmitting.value = false
    ultimo.value = { jornadaId, fecha: state.value.date }
    return ultimo.value
  }

  // Al abrir «Nuevo Taller» se vuelven a pedir las jornadas: una creada o ampliada en esta misma sesión tiene que verse
  // como está; al llegar, la jornada preseleccionada se aplica (vigilarJornada).
  function resetWizard() {
    editando.value = null
    fechaDesde.value = ''
    intentado.value = false
    isSubmitting.value = false
    isSuccess.value = false
    ultimo.value = null
    ampliarPendiente.value = null
    fechaAceptada.value = ''
    state.value = estadoInicial()
    void refreshJornadas()
  }

  // «Lunes, 9 de noviembre de 2026», en el idioma de la UI.
  function formatDateLong(dateStr: string): string {
    if (!dateStr) return '--'
    const texto = aFecha(dateStr).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  return {
    state,
    intentado,
    faltas,
    primeraSinCompletar,
    isSubmitting,
    isSuccess,
    ultimo,
    hasPreselectedStoryboard,
    hasPreselectedDate,
    jornadas,
    pertenencia,
    valorPertenencia,
    elegirPertenencia,
    selectedJornada,
    jornadaEfectiva,
    programaEfectivo,
    dateFueraDePrograma,
    lugarEfectivo,
    dateMin,
    dateMax,
    ampliarPendiente,
    comprobarFecha,
    confirmarAmpliar,
    rechazarAmpliar,
    vigilarJornada,
    selectedStoryboard,
    selectedEducators,
    selectedGroups,
    selectedGroupsMembers,
    selectStoryboard,
    toggleEducator,
    toggleGroup,
    onTimeStartChange,
    submit,
    resetWizard,
    cargarTaller,
    coincideCon,
    sinGuardar,
    guardarCambios,
    formatDateLong,
  }
}
