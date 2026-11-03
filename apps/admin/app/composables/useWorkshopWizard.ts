import type { Modalidad } from '~/composables/useWorkshops'
import type { EleccionJornada, JornadaFila } from '~/composables/useJornadas'
import { eleccionJornada, validarDatosJornada } from '~/composables/useJornadas'
import { ampliarJornada, fechaEnJornada, lugarDelTaller } from '~/utils/jornadas'

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
  location: string      // suelto, el lugar; dentro de una jornada, el detalle («Aula 3A»)
  group: string         // el grupo que asiste («2.º B»)
  language: string      // el idioma del contenido: uno de los del storyboard
  notes: string
  capacity: string
  date: string
  timeStart: string
  timeEnd: string
  modalidad: WizardModalidad
  estado: WizardEstado
  jornada: EleccionJornada
  // Los días a los que se amplía la jornada en curso elegida (confirmado), para que quepa la fecha.
  ampliacion: DiasJornada | null
}

// El asistente de un taller nuevo, en cinco pasos: storyboard, educadores, cuándo y dónde, grupo y
// resumen (donde se elige cómo se guarda: publicado, en revisión o borrador). Entra con
// `?storyboard=`, `?fecha=` (desde el planificador) o `?jornada=<id>&fecha=` (desde el panel de la
// jornada o «Agregar otro taller a esta jornada»). En «Cuándo y dónde» va suelto o dentro de una
// jornada: una en curso o una nueva (se escribe en su diálogo y se crea al guardar, antes del
// taller). Dentro de una jornada, el día es uno de los suyos y el lugar del taller es el detalle; una
// en curso se puede ampliar con otro día. No se propone jornada por la fecha: dos jornadas la misma
// semana en lugares distintos lo harían equivocarse.
export function useWorkshopWizard() {
  const route = useRoute()
  const { t, locale } = useT()
  const { orgActiva } = useContexto()
  const { getStoryboard } = useStoryboards()
  const { getEducator, getGroup, getGroupMembers } = useEducators()

  const currentStep = useState('wizard-step', () => 1)
  const direction = useState<'forward' | 'backward'>('wizard-direction', () => 'forward')
  const isSubmitting = useState('wizard-submitting', () => false)
  const isSuccess = useState('wizard-success', () => false)
  // Lo último guardado: su jornada y su fecha, para «Agregar otro taller a esta jornada».
  const ultimo = useState<{ jornadaId: number | null, fecha: string } | null>('wizard-ultimo', () => null)

  // Las jornadas de la organización, para elegir una y limitar la fecha.
  const jornadas = useState<JornadaFila[]>('wizard-jornadas', () => [])
  const jornadasDe = useState<number | null>('wizard-jornadas-org', () => null)
  if (import.meta.client && orgActiva.value && jornadasDe.value !== orgActiva.value.id) {
    const oid = orgActiva.value.id
    jornadasDe.value = oid
    useJornadas().listar(oid).then((lista) => { jornadas.value = lista })
  }

  function leerQuery() {
    const q = route.query
    return {
      storyboardId: q.storyboard ? Number(q.storyboard) : null,
      fecha: (q.fecha ?? q.date) ? String(q.fecha ?? q.date) : '',
      jornadaId: q.jornada ? Number(q.jornada) || null : null,
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
      location: '',
      group: '',
      language: 'es',
      notes: '',
      capacity: '25',
      date: q.fecha,
      timeStart: '',
      timeEnd: '',
      modalidad: 'PRESENCIAL',
      estado: 'PUBLICADO',
      jornada: eleccionJornada(q.jornadaId),
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

  // ── Jornada ──────────────────────────────────────────────────────────────────
  // La jornada en curso elegida (tal como está guardada).
  const selectedJornada = computed(() => {
    const e = state.value.jornada
    return e.modo === 'existente' ? jornadas.value.find(j => j.id === e.jornadaId) ?? null : null
  })

  // La jornada con la que se va a guardar: la en curso (con su ampliación, si se confirmó) o la
  // nueva tal como se está escribiendo. Para la revisión, el lugar efectivo y los límites de la fecha.
  const jornadaEfectiva = computed(() => {
    const e = state.value.jornada
    if (e.modo === 'nueva') {
      const n = e.nueva
      return { nombre: n.nombre.trim(), ubicacion: n.ubicacion.trim(), fecha_inicio: n.fecha_inicio, fecha_fin: n.fecha_fin || n.fecha_inicio, nueva: true, ampliada: false }
    }
    const j = selectedJornada.value
    if (!j) return null
    const a = state.value.ampliacion
    return { nombre: j.nombre, ubicacion: j.ubicacion, fecha_inicio: a?.fecha_inicio ?? j.fecha_inicio, fecha_fin: a?.fecha_fin ?? j.fecha_fin, nueva: false, ampliada: !!a }
  })

  // «Sede central · Aula 3A» dentro de una jornada; suelto, su lugar.
  const lugarEfectivo = computed(() => lugarDelTaller({ ubicacion: state.value.location }, jornadaEfectiva.value))

  // Con una jornada nueva, la fecha vive entre sus días (min/max). Con una en curso no se limita el
  // calendario: otro día ofrece ampliarla (comprobarFecha).
  const dateMin = computed(() => (state.value.jornada.modo === 'nueva' ? jornadaEfectiva.value?.fecha_inicio || undefined : undefined))
  const dateMax = computed(() => (state.value.jornada.modo === 'nueva' ? jornadaEfectiva.value?.fecha_fin || undefined : undefined))
  const dateFueraDeJornada = computed(() => {
    const j = jornadaEfectiva.value
    return state.value.jornada.modo === 'nueva' && !!j?.fecha_inicio && !!state.value.date && !fechaEnJornada(j, state.value.date)
  })

  // La jornada está respondida: suelto, una en curso elegida o una nueva completa.
  const jornadaLista = computed(() => {
    const e = state.value.jornada
    if (e.modo === 'existente') return !!selectedJornada.value
    if (e.modo === 'nueva') return validarDatosJornada(e.nueva) === null
    return true
  })

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

  // Los vigilantes de la jornada, una sola vez: los registra la página del asistente (varios
  // componentes usan este composable y cada uno los duplicaría).
  function vigilarJornada() {
    watch(() => selectedJornada.value?.id, (id, antes) => {
      if (id !== antes) alElegirJornada()
    })
    // Fuera de una jornada en curso no hay nada que ampliar.
    watch(() => state.value.jornada.modo, (modo) => {
      if (modo !== 'existente') {
        state.value.ampliacion = null
        ampliarPendiente.value = null
      }
    })
    // Una jornada nueva y un taller sin fecha: la fecha, su primer día.
    watch(() => state.value.jornada.nueva.fecha_inicio, (inicio) => {
      if (state.value.jornada.modo === 'nueva' && inicio && !state.value.date) state.value.date = inicio
    })
  }

  function selectStoryboard(id: number) {
    state.value.storyboardId = id
    const sb = getStoryboard(id)
    if (sb) {
      if (!state.value.title) {
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

  // Un grupo vale si tiene al menos un educador activo: un grupo vacío no asigna a nadie y un
  // taller publicado necesita educador. La fecha fuera de una jornada en curso no bloquea el botón:
  // al seguir se pregunta si se amplía.
  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1: return state.value.storyboardId !== null
      case 2: return state.value.educatorMode === 'group'
        ? selectedGroupsMembers.value.length > 0
        : state.value.educatorIds.length > 0
      case 3: return state.value.date !== '' && state.value.timeStart !== '' && jornadaLista.value && !dateFueraDeJornada.value
      case 4: return state.value.title.trim() !== ''
      case 5: return true
      default: return false
    }
  })

  const steps = computed(() => [
    { id: 1, label: t('wizard.stepStoryboard') },
    { id: 2, label: t('wizard.stepEducators') },
    { id: 3, label: t('wizard.stepWhen') },
    { id: 4, label: t('wizard.stepGroup') },
    { id: 5, label: t('wizard.stepSummary') },
  ])

  function goToStep(step: number) {
    if (step < currentStep.value) {
      direction.value = 'backward'
      currentStep.value = step
    }
    else if (step > currentStep.value && canProceed.value) {
      if (currentStep.value === 3 && !comprobarFecha()) return
      direction.value = 'forward'
      currentStep.value = step
    }
  }

  function nextStep() {
    if (canProceed.value && currentStep.value < 5) {
      if (currentStep.value === 3 && !comprobarFecha()) return
      direction.value = 'forward'
      currentStep.value++
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      direction.value = 'backward'
      currentStep.value--
    }
  }

  // Guarda el taller. Con una jornada nueva, primero la crea; con una en curso ampliada, primero
  // amplía sus días. Devuelve la jornada y la fecha del taller (para «Crear y agregar otro»), o null
  // si algo falló (con su aviso).
  async function submit(): Promise<{ jornadaId: number | null, fecha: string } | null> {
    if (!state.value.storyboardId) return null
    isSubmitting.value = true
    const { toast } = useToast()
    const api = useJornadas()

    let jornadaId: number | null = null
    let creada: number | null = null
    const eleccion = state.value.jornada
    if (eleccion.modo === 'existente' && selectedJornada.value) {
      jornadaId = selectedJornada.value.id
      if (state.value.ampliacion) {
        const { error } = await api.cambiarDias(jornadaId, state.value.ampliacion)
        if (error) {
          isSubmitting.value = false
          toast.error(error)
          return null
        }
      }
    }
    else if (eleccion.modo === 'nueva') {
      if (!orgActiva.value) {
        isSubmitting.value = false
        toast.error(t('ctx.noOrgActive'))
        return null
      }
      const { id, error } = await api.crear(orgActiva.value.id, eleccion.nueva)
      if (error || !id) {
        isSubmitting.value = false
        if (error) toast.error(error)
        return null
      }
      jornadaId = creada = id
    }

    // Una asignación por educador; si vino de un grupo, se recuerda el grupo. Grupos con
    // miembros solapados no duplican asignaciones (unique en la base, y aquí se dedupe).
    const crudas = state.value.educatorMode === 'group'
      ? selectedGroups.value.flatMap(g => getGroupMembers(g.id).map(m => ({ educadorId: m.id, grupoId: g.id })))
      : state.value.educatorIds.map(id => ({ educadorId: id, grupoId: null as number | null }))
    const vistos = new Set<number>()
    const asignaciones = crudas.filter((a) => {
      if (vistos.has(a.educadorId)) return false
      vistos.add(a.educadorId)
      return true
    })

    const { createTaller } = useWorkshops()
    const { id, error } = await createTaller({
      titulo: state.value.title,
      storyboardId: state.value.storyboardId,
      fecha: state.value.date,
      horaInicio: state.value.timeStart,
      horaFin: state.value.timeEnd,
      ubicacion: state.value.location,
      grupo: state.value.group,
      idioma: state.value.language,
      notas: state.value.notes,
      capacidad: state.value.capacity ? Number(state.value.capacity) : null,
      modalidad: state.value.modalidad,
      estado: state.value.estado,
      jornadaId,
      asignaciones,
    })

    if (error) {
      // La jornada recién creada sin su taller no se vería en ninguna parte: se deshace.
      if (creada && !id) await api.descartarSiVacia(creada)
      isSubmitting.value = false
      toast.error(error)
      return null
    }
    isSubmitting.value = false
    ultimo.value = { jornadaId, fecha: state.value.date }
    return ultimo.value
  }

  // Al abrir el asistente se vuelven a pedir las jornadas: una creada o ampliada en esta misma
  // sesión tiene que verse como está. La lista se vacía mientras tanto para no comprobar la fecha
  // contra días viejos; al llegar, la jornada preseleccionada se aplica (vigilarJornada).
  function resetWizard() {
    currentStep.value = 1
    direction.value = 'forward'
    isSubmitting.value = false
    isSuccess.value = false
    ultimo.value = null
    ampliarPendiente.value = null
    fechaAceptada.value = ''
    jornadas.value = []
    state.value = estadoInicial()
    const oid = orgActiva.value?.id
    if (oid) useJornadas().listar(oid).then((lista) => { jornadas.value = lista })
  }

  // «Lunes, 9 de noviembre de 2026», en el idioma de la UI.
  function formatDateLong(dateStr: string): string {
    if (!dateStr) return '--'
    const texto = aFecha(dateStr).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  return {
    currentStep,
    direction,
    state,
    steps,
    isSubmitting,
    isSuccess,
    ultimo,
    hasPreselectedStoryboard,
    hasPreselectedDate,
    jornadas,
    selectedJornada,
    jornadaEfectiva,
    lugarEfectivo,
    dateMin,
    dateMax,
    dateFueraDeJornada,
    ampliarPendiente,
    comprobarFecha,
    confirmarAmpliar,
    rechazarAmpliar,
    vigilarJornada,
    selectedStoryboard,
    selectedEducators,
    selectedGroups,
    selectedGroupsMembers,
    canProceed,
    selectStoryboard,
    toggleEducator,
    toggleGroup,
    onTimeStartChange,
    goToStep,
    nextStep,
    prevStep,
    submit,
    resetWizard,
    formatDateLong,
  }
}
