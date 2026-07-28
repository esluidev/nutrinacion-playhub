export type PlannerStatus = 'programado' | 'completado' | 'borrador'

export interface PlannerWorkshop {
  id: number
  title: string
  time: string
  educator: string
  location: string
  accentColor: string
  fecha: string // 'YYYY-MM-DD'
  storyboard: string
  status?: PlannerStatus // sin status = programado
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const DAY_SHORT = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const DAY_FULL = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export function usePlanner() {
  const weekOffset = useState('planner-weekOffset', () => 0)
  const activeView = useState<'kanban' | 'calendar'>('planner-activeView', () => 'kanban')
  const statusFilter = useState<'todos' | PlannerStatus>('planner-statusFilter', () => 'todos')

  // El planner es otra VISTA de los talleres reales (los cancelados no se planifican).
  const { workshops: talleres, updateFecha } = useWorkshops()
  const workshops = computed<PlannerWorkshop[]>(() =>
    talleres.value
      .filter(w => w.status !== 'cancelado')
      .map(w => ({
        id: w.id,
        title: w.title,
        time: w.time,
        educator: w.educator,
        location: w.location,
        accentColor: w.accentColor,
        fecha: w.date,
        storyboard: w.storyboard,
        status: w.status === 'programado' ? undefined : (w.status as PlannerStatus),
      })))

  const today = new Date()
  const todayStr = formatDate(today)
  const baseMonday = getMondayOfWeek(today)

  // Mes visible en la vista calendario. El toolbar navega semanas o meses según la vista,
  // como en el rediseño: un solo control de rango arriba, no dos.
  const monthAnchor = useState('planner-monthAnchor', () => ({ y: today.getFullYear(), m: today.getMonth() }))

  const currentMonday = computed(() => {
    const d = new Date(baseMonday)
    d.setDate(d.getDate() + weekOffset.value * 7)
    return d
  })

  function matchesFilter(ws: PlannerWorkshop) {
    if (statusFilter.value === 'todos') return true
    return (ws.status ?? 'programado') === statusFilter.value
  }

  const visibleWorkshops = computed(() => workshops.value.filter(matchesFilter))

  const weekDays = computed(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday.value)
      d.setDate(d.getDate() + i)
      const fecha = formatDate(d)
      const dayWorkshops = visibleWorkshops.value.filter(ws => ws.fecha === fecha)

      return {
        key: fecha,
        shortName: DAY_SHORT[i],
        fullName: DAY_FULL[i],
        date: d.getDate(),
        fecha,
        isToday: fecha === todayStr,
        workshops: dayWorkshops,
      }
    })
  })

  const weekLabel = computed(() => {
    const mon = currentMonday.value
    const sun = new Date(mon)
    sun.setDate(sun.getDate() + 6)

    const monMonth = MONTH_NAMES[mon.getMonth()]
    const sunMonth = MONTH_NAMES[sun.getMonth()]

    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()} – ${sun.getDate()} ${monMonth} ${mon.getFullYear()}`
    }
    return `${mon.getDate()} ${monMonth} – ${sun.getDate()} ${sunMonth} ${sun.getFullYear()}`
  })

  const MONTH_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const monthLabel = computed(() => `${MONTH_FULL[monthAnchor.value.m]} ${monthAnchor.value.y}`)

  // Etiqueta del rango según la vista activa (semana ↔ mes).
  const rangeLabel = computed(() => (activeView.value === 'calendar' ? monthLabel.value : weekLabel.value))

  function navigateWeek(dir: number) {
    weekOffset.value += dir
  }

  function navigateMonth(dir: number) {
    let m = monthAnchor.value.m + dir
    let y = monthAnchor.value.y
    if (m > 11) { m = 0; y++ }
    else if (m < 0) { m = 11; y-- }
    monthAnchor.value = { y, m }
  }

  // El prev/next del toolbar mueve la unidad que se está viendo.
  function navigateRange(dir: number) {
    if (activeView.value === 'calendar') navigateMonth(dir)
    else navigateWeek(dir)
  }

  function goToToday() {
    weekOffset.value = 0
    monthAnchor.value = { y: today.getFullYear(), m: today.getMonth() }
  }

  // El drag & drop PERSISTE la fecha (optimista dentro de updateFecha).
  function moveWorkshop(id: number, newFecha: string) {
    void updateFecha(id, newFecha)
  }

  return {
    weekOffset,
    activeView,
    workshops,
    visibleWorkshops,
    statusFilter,
    today,
    todayStr,
    currentMonday,
    monthAnchor,
    weekDays,
    weekLabel,
    monthLabel,
    rangeLabel,
    navigateWeek,
    navigateMonth,
    navigateRange,
    goToToday,
    moveWorkshop,
    formatDate,
  }
}
