export interface EducatorGroup {
  id: number
  nombre: string
  descripcion: string
  miembros: number
  estado: 'activo' | 'inactivo'
  iconBg: string
  iconColor: string
}

export interface Educator {
  id: number
  nombre: string
  initials: string
  profesion: string
  email: string
  telefono: string
  estado: 'activo' | 'inactivo'
  grupo: string
  talleres: number
  avatarBg: string
  accentColor: string
}

const EDUCATORS_DATA: Educator[] = [
  {
    id: 1,
    nombre: 'Maria Lopez Hernandez',
    initials: 'ML',
    profesion: 'Nutriologa',
    email: 'maria.lopez@nutrinacion.org',
    telefono: '+52 55 1234 5678',
    estado: 'activo',
    grupo: 'Zona Norte',
    talleres: 8,
    avatarBg: 'bg-emerald-600',
    accentColor: 'bg-emerald-500',
  },
  {
    id: 2,
    nombre: 'Carlos Ramirez Torres',
    initials: 'CR',
    profesion: 'Educador en Salud',
    email: 'carlos.ramirez@nutrinacion.org',
    telefono: '+52 55 2345 6789',
    estado: 'activo',
    grupo: 'Zona Norte',
    talleres: 5,
    avatarBg: 'bg-blue-600',
    accentColor: 'bg-blue-500',
  },
  {
    id: 3,
    nombre: 'Ana Torres Gutierrez',
    initials: 'AT',
    profesion: 'Psicologa Infantil',
    email: 'ana.torres@nutrinacion.org',
    telefono: '+52 55 3456 7890',
    estado: 'activo',
    grupo: 'Zona Sur',
    talleres: 6,
    avatarBg: 'bg-violet-600',
    accentColor: 'bg-violet-500',
  },
  {
    id: 4,
    nombre: 'Pedro Sanchez Morales',
    initials: 'PS',
    profesion: 'Chef Educativo',
    email: 'pedro.sanchez@nutrinacion.org',
    telefono: '+52 55 4567 8901',
    estado: 'activo',
    grupo: 'Zona Norte',
    talleres: 4,
    avatarBg: 'bg-amber-600',
    accentColor: 'bg-amber-500',
  },
  {
    id: 5,
    nombre: 'Laura Diaz Fernandez',
    initials: 'LD',
    profesion: 'Pedagoga',
    email: 'laura.diaz@nutrinacion.org',
    telefono: '+52 55 5678 9012',
    estado: 'inactivo',
    grupo: 'Capacitacion Interna',
    talleres: 2,
    avatarBg: 'bg-rose-600',
    accentColor: 'bg-rose-500',
  },
  {
    id: 6,
    nombre: 'Roberto Mendez Aguilar',
    initials: 'RM',
    profesion: 'Nutriologa',
    email: 'roberto.mendez@nutrinacion.org',
    telefono: '+52 55 6789 0123',
    estado: 'activo',
    grupo: 'Zona Sur',
    talleres: 3,
    avatarBg: 'bg-teal-600',
    accentColor: 'bg-teal-500',
  },
]

const GROUPS_DATA: EducatorGroup[] = [
  {
    id: 1,
    nombre: 'Zona Norte',
    descripcion: 'Educadores asignados a escuelas y centros comunitarios de la zona norte de la ciudad',
    miembros: 3,
    estado: 'activo',
    iconBg: 'bg-brand-primary-50',
    iconColor: 'text-brand-primary-600',
  },
  {
    id: 2,
    nombre: 'Zona Sur',
    descripcion: 'Equipo dedicado a talleres en comunidades rurales y periurbanas del sur',
    miembros: 2,
    estado: 'activo',
    iconBg: 'bg-brand-secondary-50',
    iconColor: 'text-brand-secondary-600',
  },
  {
    id: 3,
    nombre: 'Capacitacion Interna',
    descripcion: 'Grupo temporal para formacion y actualizacion de nuevos educadores',
    miembros: 1,
    estado: 'inactivo',
    iconBg: 'bg-brand-purple-50',
    iconColor: 'text-brand-purple-600',
  },
]

export function useEducators() {
  const educators = useState<Educator[]>('educators', () => [...EDUCATORS_DATA])
  const groups = useState<EducatorGroup[]>('educator-groups', () => [...GROUPS_DATA])

  const activeEducators = computed(() =>
    educators.value.filter(e => e.estado === 'activo'),
  )

  const activeGroups = computed(() =>
    groups.value.filter(g => g.estado === 'activo'),
  )

  function getEducator(id: number) {
    return educators.value.find(e => e.id === id)
  }

  function getGroup(id: number) {
    return groups.value.find(g => g.id === id)
  }

  function getGroupMembers(groupName: string) {
    return activeEducators.value.filter(e => e.grupo === groupName)
  }

  return { educators, groups, activeEducators, activeGroups, getEducator, getGroup, getGroupMembers }
}
