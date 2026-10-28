import type { Modalidad } from '~/composables/useWorkshops'

export type EducatorSelectionMode = 'individual' | 'group'
export type WizardModalidad = Modalidad
// Cómo queda el taller al crearlo: borrador, en revisión (otro lo confirma) o publicado.
export type WizardEstado = 'BORRADOR' | 'EN_REVISION' | 'PUBLICADO'

export interface WizardState {
  storyboardId: number | null
  educatorMode: EducatorSelectionMode
  educatorIds: number[]
  groupIds: number[]
  title: string
  location: string
  group: string         // el grupo que asiste («2.º B»)
  language: string      // el idioma del contenido: uno de los del storyboard
  notes: string
  capacity: string
  date: string
  timeStart: string
  timeEnd: string
  modalidad: WizardModalidad
  estado: WizardEstado
  jornadaId: string     // '' = sin jornada
}

export function useWorkshopWizard() {
  const route = useRoute()
  const { storyboards, getStoryboard } = useStoryboards()
  const { activeEducators, getEducator, activeGroups, getGroup, getGroupMembers } = useEducators()

  const currentStep = useState('wizard-step', () => 1)
  const direction = useState<'forward' | 'backward'>('wizard-direction', () => 'forward')
  const isSubmitting = useState('wizard-submitting', () => false)
  const isSuccess = useState('wizard-success', () => false)

  const state = useState<WizardState>('wizard-state', () => {
    const queryStoryboard = route.query.storyboard ? Number(route.query.storyboard) : null
    const queryDate = route.query.date as string || ''

    return {
      storyboardId: queryStoryboard,
      educatorMode: 'individual' as EducatorSelectionMode,
      educatorIds: [],
      groupIds: [],
      title: '',
      location: '',
      group: '',
      language: 'es',
      notes: '',
      capacity: '25',
      date: queryDate,
      timeStart: '',
      timeEnd: '',
      modalidad: 'PRESENCIAL' as WizardModalidad,
      estado: 'PUBLICADO' as WizardEstado,
      jornadaId: '',
    }
  })

  const hasPreselectedStoryboard = computed(() => !!route.query.storyboard)
  const hasPreselectedDate = computed(() => !!route.query.date)

  const selectedStoryboard = computed(() =>
    state.value.storyboardId ? getStoryboard(state.value.storyboardId) : null,
  )

  const selectedEducators = computed(() =>
    state.value.educatorIds.map(id => getEducator(id)).filter((e): e is NonNullable<typeof e> => !!e),
  )

  const selectedGroups = computed(() =>
    state.value.groupIds.map(id => getGroup(id)).filter((g): g is NonNullable<typeof g> => !!g),
  )

  const selectedGroupsMembers = computed(() =>
    selectedGroups.value.flatMap(g => getGroupMembers(g.nombre)),
  )

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

  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1: return state.value.storyboardId !== null
      case 2: return state.value.educatorIds.length > 0 || state.value.groupIds.length > 0
      case 3: return state.value.title.trim() !== '' && state.value.date !== '' && state.value.timeStart !== ''
      case 4: return true
      default: return false
    }
  })

  const steps = [
    { id: 1, label: 'Storyboard' },
    { id: 2, label: 'Educadores' },
    { id: 3, label: 'Detalles' },
    { id: 4, label: 'Resumen' },
  ]

  function goToStep(step: number) {
    if (step < currentStep.value) {
      direction.value = 'backward'
      currentStep.value = step
    }
    else if (step > currentStep.value && canProceed.value) {
      direction.value = 'forward'
      currentStep.value = step
    }
  }

  function nextStep() {
    if (canProceed.value && currentStep.value < 4) {
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

  async function submit() {
    if (!state.value.storyboardId) return
    isSubmitting.value = true

    // Una asignación por educador; si vino de un grupo, se recuerda el grupo. Grupos con
    // miembros solapados no duplican asignaciones (unique en la base, y aquí se dedupe).
    const crudas = state.value.educatorMode === 'group'
      ? selectedGroups.value.flatMap(g => getGroupMembers(g.nombre).map(m => ({ educadorId: m.id, grupoId: g.id })))
      : state.value.educatorIds.map(id => ({ educadorId: id, grupoId: null as number | null }))
    const vistos = new Set<number>()
    const asignaciones = crudas.filter((a) => {
      if (vistos.has(a.educadorId)) return false
      vistos.add(a.educadorId)
      return true
    })

    const { createTaller } = useWorkshops()
    const { error } = await createTaller({
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
      jornadaId: state.value.jornadaId ? Number(state.value.jornadaId) : null,
      asignaciones,
    })

    isSubmitting.value = false
    if (error) {
      useToast().toast.error(error)
      return
    }
    isSuccess.value = true
  }

  function resetWizard() {
    currentStep.value = 1
    direction.value = 'forward'
    isSubmitting.value = false
    isSuccess.value = false
    const queryStoryboard = route.query.storyboard ? Number(route.query.storyboard) : null
    const queryDate = route.query.date as string || ''
    state.value = {
      storyboardId: queryStoryboard,
      educatorMode: 'individual',
      educatorIds: [],
      groupIds: [],
      title: '',
      location: '',
      group: '',
      language: 'es',
      notes: '',
      capacity: '25',
      date: queryDate,
      timeStart: '',
      timeEnd: '',
      modalidad: 'PRESENCIAL',
      estado: 'PUBLICADO',
      jornadaId: '',
    }
  }

  function formatDateLong(dateStr: string): string {
    if (!dateStr) return '--'
    const [y = 0, m = 1, d = 1] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${dayNames[date.getDay()]}, ${d} de ${monthNames[date.getMonth()]} ${y}`
  }

  return {
    currentStep,
    direction,
    state,
    steps,
    isSubmitting,
    isSuccess,
    hasPreselectedStoryboard,
    hasPreselectedDate,
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
