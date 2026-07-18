export interface PlannerWorkshop {
  id: number
  title: string
  time: string
  educator: string
  location: string
  accentColor: string
  fecha: string // 'YYYY-MM-DD'
  storyboard: string
}

const ACCENT_COLORS = [
  'bg-brand-primary',
  'bg-brand-secondary',
  'bg-brand-accent',
  'bg-brand-coral',
  'bg-brand-purple',
]

function weekday(monday: Date, offset: number): string {
  const d = new Date(monday)
  d.setDate(d.getDate() + offset)
  return formatDate(d)
}

function buildMockWorkshops(): PlannerWorkshop[] {
  const mon = getMondayOfWeek(new Date())
  const todayStr = formatDate(new Date())
  return [
    { id: 1, title: 'Los Frijoles Magicos', time: '09:00 - 10:30', educator: 'Maria Lopez Hernandez', location: 'Aula 3A - Centro Comunitario', accentColor: 'bg-brand-primary', fecha: todayStr, storyboard: 'Los Frijoles Magicos' },
    { id: 2, title: 'El Huevo Alimento Diario', time: '10:00 - 11:30', educator: 'Carlos Ramirez Torres', location: 'Salon Principal', accentColor: 'bg-brand-secondary', fecha: weekday(mon, 1), storyboard: 'El Huevo Alimento Diario' },
    { id: 3, title: 'Agua: El Tesoro Azul', time: '09:30 - 11:00', educator: 'Ana Torres Gutierrez', location: 'Aula 1B', accentColor: 'bg-brand-accent', fecha: weekday(mon, 2), storyboard: 'Agua: El Superheroe Invisible' },
    { id: 4, title: 'Frutas del Arcoiris', time: '11:00 - 12:30', educator: 'Pedro Sanchez Morales', location: 'Escuela Primaria Norte', accentColor: 'bg-brand-coral', fecha: weekday(mon, 3), storyboard: 'Detectives de Nutrientes' },
    { id: 5, title: 'Verduras Heroicas', time: '10:00 - 11:30', educator: 'Maria Lopez Hernandez', location: 'Centro Cultural Sur', accentColor: 'bg-brand-primary', fecha: weekday(mon, 4), storyboard: 'La Huerta Magica' },
  ]
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
  const workshops = useState<PlannerWorkshop[]>('planner-workshops', () => buildMockWorkshops())
  const showMiniCalendar = useState('planner-showMiniCal', () => false)
  const showAddModal = useState('planner-showAddModal', () => false)
  const addModalDate = useState<string | null>('planner-addModalDate', () => null)

  const today = new Date()
  const todayStr = formatDate(today)
  const baseMonday = getMondayOfWeek(today)

  const currentMonday = computed(() => {
    const d = new Date(baseMonday)
    d.setDate(d.getDate() + weekOffset.value * 7)
    return d
  })

  const weekDays = computed(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday.value)
      d.setDate(d.getDate() + i)
      const fecha = formatDate(d)
      const dayWorkshops = workshops.value.filter(ws => ws.fecha === fecha)

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
      return `${mon.getDate()} - ${sun.getDate()} ${monMonth}, ${mon.getFullYear()}`
    }
    return `${mon.getDate()} ${monMonth} - ${sun.getDate()} ${sunMonth}, ${sun.getFullYear()}`
  })


  function navigateWeek(dir: number) {
    weekOffset.value += dir
  }

  function goToToday() {
    weekOffset.value = 0
  }

  function goToDate(date: Date) {
    const targetMonday = getMondayOfWeek(date)
    const diffMs = targetMonday.getTime() - baseMonday.getTime()
    weekOffset.value = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
  }

  function moveWorkshop(id: number, newFecha: string) {
    const idx = workshops.value.findIndex(ws => ws.id === id)
    if (idx !== -1) {
      workshops.value[idx] = { ...workshops.value[idx], fecha: newFecha }
    }
  }

  let nextId = 100
  function addWorkshop(ws: Omit<PlannerWorkshop, 'id' | 'accentColor'>) {
    const colorIndex = workshops.value.length % ACCENT_COLORS.length
    workshops.value.push({
      ...ws,
      id: nextId++,
      accentColor: ACCENT_COLORS[colorIndex],
    })
  }

  function openAddModal(fecha: string) {
    addModalDate.value = fecha
    showAddModal.value = true
  }

  return {
    weekOffset,
    activeView,
    workshops,
    showMiniCalendar,
    showAddModal,
    addModalDate,
    today,
    todayStr,
    currentMonday,
    weekDays,
    weekLabel,
    navigateWeek,
    goToToday,
    goToDate,
    moveWorkshop,
    addWorkshop,
    openAddModal,
    formatDate,
  }
}
