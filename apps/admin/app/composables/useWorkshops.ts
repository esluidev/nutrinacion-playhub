export interface Workshop {
  id: number
  title: string
  storyboardId: number
  storyboard: string
  educatorId: number
  educator: string
  initials: string
  avatarBg: string
  date: string
  time: string
  location: string
  capacity: number
  notes: string
  status: 'programado' | 'completado' | 'cancelado' | 'borrador'
  statusLabel: string
  thumbBg: string
  thumbColor: string
  accentColor: string
}

function todayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const WORKSHOPS_DATA: Workshop[] = [
  {
    id: 1,
    title: 'Los Frijoles Magicos',
    storyboardId: 1,
    storyboard: 'Los Frijoles Magicos',
    educatorId: 1,
    educator: 'Maria Lopez Hernandez',
    initials: 'ML',
    avatarBg: 'bg-emerald-600',
    date: todayDate(),
    time: '09:00 - 10:30',
    location: 'Aula 3A, Centro Comunitario',
    capacity: 25,
    notes: 'Traer frijoles reales para la demostracion. Confirmar asistencia con la directora del centro.',
    status: 'programado',
    statusLabel: 'Programado',
    thumbBg: 'bg-brand-primary-50',
    thumbColor: 'text-brand-primary-600',
    accentColor: 'bg-brand-primary',
  },
  {
    id: 2,
    title: 'El Huevo Alimento Diario',
    storyboardId: 2,
    storyboard: 'El Huevo Alimento Diario',
    educatorId: 2,
    educator: 'Carlos Ramirez Torres',
    initials: 'CR',
    avatarBg: 'bg-blue-600',
    date: '2026-03-17',
    time: '10:00 - 11:30',
    location: 'Salon Principal',
    capacity: 30,
    notes: 'Llevar huevos cocidos para la actividad practica. Verificar alergias con los padres.',
    status: 'programado',
    statusLabel: 'Programado',
    thumbBg: 'bg-brand-secondary-50',
    thumbColor: 'text-brand-secondary-600',
    accentColor: 'bg-brand-secondary',
  },
  {
    id: 3,
    title: 'Agua: El Tesoro Azul',
    storyboardId: 4,
    storyboard: 'Agua: El Superheroe Invisible',
    educatorId: 3,
    educator: 'Ana Torres Gutierrez',
    initials: 'AT',
    avatarBg: 'bg-violet-600',
    date: '2026-03-18',
    time: '09:30 - 11:00',
    location: 'Aula 1B',
    capacity: 20,
    notes: '',
    status: 'programado',
    statusLabel: 'Programado',
    thumbBg: 'bg-blue-50',
    thumbColor: 'text-blue-600',
    accentColor: 'bg-brand-accent',
  },
  {
    id: 4,
    title: 'Frutas del Arcoiris',
    storyboardId: 5,
    storyboard: 'Detectives de Nutrientes: Vitaminas y Minerales',
    educatorId: 4,
    educator: 'Pedro Sanchez Morales',
    initials: 'PS',
    avatarBg: 'bg-amber-600',
    date: '2026-03-10',
    time: '11:00 - 12:30',
    location: 'Escuela Primaria Norte',
    capacity: 28,
    notes: 'Taller completado con excelente participacion. 24 de 28 asistentes.',
    status: 'completado',
    statusLabel: 'Completado',
    thumbBg: 'bg-amber-50',
    thumbColor: 'text-amber-600',
    accentColor: 'bg-brand-coral',
  },
  {
    id: 5,
    title: 'Verduras Heroicas',
    storyboardId: 6,
    storyboard: 'La Huerta Magica: Del Campo a la Mesa',
    educatorId: 1,
    educator: 'Maria Lopez Hernandez',
    initials: 'ML',
    avatarBg: 'bg-emerald-600',
    date: '2026-03-09',
    time: '10:00 - 11:30',
    location: 'Centro Cultural Sur',
    capacity: 22,
    notes: 'Se requirio material extra de siembra. Buen feedback de los padres.',
    status: 'completado',
    statusLabel: 'Completado',
    thumbBg: 'bg-brand-primary-50',
    thumbColor: 'text-brand-primary-600',
    accentColor: 'bg-brand-primary',
  },
  {
    id: 6,
    title: 'Lacteos y Calcio',
    storyboardId: 7,
    storyboard: 'Desayuno de Campeones',
    educatorId: 3,
    educator: 'Ana Torres Gutierrez',
    initials: 'AT',
    avatarBg: 'bg-violet-600',
    date: '',
    time: '',
    location: 'Sin asignar',
    capacity: 0,
    notes: 'Borrador inicial. Pendiente definir fecha, ubicacion y capacidad.',
    status: 'borrador',
    statusLabel: 'Borrador',
    thumbBg: 'bg-gray-100',
    thumbColor: 'text-gray-400',
    accentColor: 'bg-gray-400',
  },
]

export function useWorkshops() {
  const workshops = useState('workshops', () => [...WORKSHOPS_DATA])

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

  return {
    workshops,
    getWorkshop,
    statusVariant,
  }
}
