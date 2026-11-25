import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { JornadaFila } from '~/composables/useJornadas'
import type { JornadaResumen } from '~/utils/jornadas'
import { bandasSemana, filasDeBandas, jornadasDelDia } from '~/utils/jornadas'

// «borrador» agrupa lo que aún no ven los educadores (borrador y en revisión).
export type PlannerStatus = 'programado' | 'completado' | 'sin_realizar' | 'borrador'
// Qué se ve: todos o un estado.
export type PlannerFiltro = 'todos' | PlannerStatus

export interface PlannerWorkshop {
  id: number
  title: string
  time: string
  educator: string
  location: string // dónde: el lugar y su espacio («Sede central · Aula 3A»)
  detalle: string  // solo el espacio («Aula 3A»): dentro de una jornada, el lugar ya es el de ella
  tone: UiTone // tono de la sesión (useWorkshops)
  fecha: string // 'YYYY-MM-DD'
  storyboard: string
  status?: PlannerStatus // sin status = programado
  statusLabel: string     // lo que dice su estado («Programado», «Hoy», «En revisión», «Borrador», «Realizado»…)
  publicado: boolean      // publicado (lo ve el educador); un borrador o uno en revisión, todavía no
  jornada: JornadaResumen | null
  programaId: number | null
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// El planificador: otra VISTA de los talleres reales y de sus jornadas (decisión 011): en la
// semana, una banda por jornada sobre sus días; en el mes, una marca en cada día. Las jornadas se
// crean en su sección (tarea 023); desde su banda se abre su panel para editarla o borrarla.

export function usePlanner() {
  const { locale } = useT()

  const weekOffset = useState('planner-weekOffset', () => 0)
  const activeView = useState<'kanban' | 'calendar'>('planner-activeView', () => 'kanban')
  const statusFilter = useState<PlannerFiltro>('planner-statusFilter', () => 'todos')
  // El programa que se ve (tarea 021): todos, uno o los talleres sin programa. Es un filtro, no una
  // banda: un programa dura meses y taparía el mes entero.
  const programaFilter = useState<'todos' | 'ninguno' | number>('planner-programaFilter', () => 'todos')

  // Los cancelados y los archivados no se planifican.
  const { workshops: talleres, updateFecha, refresh: refreshWorkshops } = useWorkshops()
  const workshops = computed<PlannerWorkshop[]>(() =>
    talleres.value
      .filter(w => w.status !== 'cancelado' && w.status !== 'archivado')
      .map(w => ({
        id: w.id,
        title: w.title,
        time: w.time,
        educator: w.educator,
        location: w.location,
        detalle: w.editable.espacio,
        tone: w.tone,
        fecha: w.date,
        storyboard: w.storyboard,
        status: w.status === 'programado' ? undefined : w.status === 'revision' ? 'borrador' : (w.status as PlannerStatus),
        statusLabel: w.statusLabel,
        publicado: w.status !== 'borrador' && w.status !== 'revision',
        jornada: w.jornada,
        programaId: w.programa?.id ?? null,
      })))

  // ── Jornadas de la organización: la lista compartida (useJornadas), al día como las demás ──
  const { jornadas: todasLasJornadas, refresh: refreshJornadas, actualizar, eliminar } = useJornadas()
  // Las jornadas del programa elegido (todas, sin filtro).
  const jornadas = computed<JornadaFila[]>(() => todasLasJornadas.value.filter((j) => {
    const p = programaFilter.value
    return p === 'todos' || (p === 'ninguno' ? j.programa_id === null : j.programa_id === p)
  }))

  function getJornada(id: number) {
    return jornadas.value.find(j => j.id === id) ?? null
  }

  const today = new Date()
  const todayStr = isoLocal(today)
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
    const p = programaFilter.value
    if (p !== 'todos' && (p === 'ninguno' ? ws.programaId !== null : ws.programaId !== p)) return false
    if (statusFilter.value === 'todos') return true
    return (ws.status ?? 'programado') === statusFilter.value
  }

  const visibleWorkshops = computed(() => workshops.value.filter(matchesFilter))

  const idioma = computed(() => (locale.value === 'en' ? 'en-US' : 'es-ES'))
  const nombreDia = (d: Date, forma: 'short' | 'long') => {
    const s = d.toLocaleDateString(idioma.value, { weekday: forma })
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  const weekDays = computed(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday.value)
      d.setDate(d.getDate() + i)
      const fecha = isoLocal(d)
      const dayWorkshops = visibleWorkshops.value.filter(ws => ws.fecha === fecha)

      return {
        key: fecha,
        shortName: nombreDia(d, 'short').replace('.', ''),
        fullName: nombreDia(d, 'long'),
        date: d.getDate(),
        fecha,
        isToday: fecha === todayStr,
        workshops: dayWorkshops,
      }
    })
  })

  // Las bandas de la semana: por jornada, las columnas que abarca (utils/jornadas).
  const weekBands = computed(() => filasDeBandas(bandasSemana(jornadas.value, isoLocal(currentMonday.value))))

  // Las jornadas de un día, para marcarlo en la vista de mes.
  function jornadasDe(fecha: string) {
    return jornadasDelDia(jornadas.value, fecha)
  }

  const weekLabel = computed(() => {
    const mon = currentMonday.value
    const sun = new Date(mon)
    sun.setDate(sun.getDate() + 6)
    const mes = (d: Date) => d.toLocaleDateString(idioma.value, { month: 'short' }).replace('.', '')
    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()} – ${sun.getDate()} ${mes(mon)} ${mon.getFullYear()}`
    }
    return `${mon.getDate()} ${mes(mon)} – ${sun.getDate()} ${mes(sun)} ${sun.getFullYear()}`
  })

  const monthLabel = computed(() => {
    const s = new Date(monthAnchor.value.y, monthAnchor.value.m, 1).toLocaleDateString(idioma.value, { month: 'long', year: 'numeric' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })

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

  // El drag & drop PERSISTE la fecha (optimista dentro de updateFecha). Si el día cae fuera de
  // la jornada del taller, la base lo rechaza: se avisa y el refresco lo devuelve a su día.
  async function moveWorkshop(id: number, newFecha: string) {
    const { error } = await updateFecha(id, newFecha)
    if (error) useToast().toast.error(error)
  }

  // ── Jornadas: edición y baja desde su panel (la lista y los talleres se refrescan) ───
  async function actualizarJornada(id: number, datos: Parameters<typeof actualizar>[1]) {
    const r = await actualizar(id, datos)
    if (!r.error) await refreshWorkshops()
    return r
  }

  async function eliminarJornada(id: number) {
    const r = await eliminar(id)
    if (!r.error) await refreshWorkshops()
    return r
  }

  // Los talleres (vivos) de una jornada, por fecha y hora.
  function workshopsDeJornada(id: number) {
    return workshops.value.filter(w => w.jornada?.id === id).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.time.localeCompare(b.time))
  }

  return {
    weekOffset,
    activeView,
    workshops,
    visibleWorkshops,
    statusFilter,
    programaFilter,
    today,
    todayStr,
    currentMonday,
    monthAnchor,
    weekDays,
    weekBands,
    weekLabel,
    monthLabel,
    rangeLabel,
    jornadas,
    getJornada,
    jornadasDe,
    workshopsDeJornada,
    refreshJornadas,
    actualizarJornada,
    eliminarJornada,
    navigateWeek,
    navigateMonth,
    navigateRange,
    goToToday,
    moveWorkshop,
    formatDate: isoLocal,
  }
}
