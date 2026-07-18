// ─────────────────────────────────────────────────────────────────────────────
// Mock data layer for dashboard statistics.
// Swap internals for Supabase queries when the DB is ready.
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStoryboards: number
  publishedStoryboards: number
  draftOrReviewStoryboards: number
  archivedStoryboards: number
  totalScenes: number
  languagesCovered: string[]
  pillarsDistribution: { pillar: string; label: string; count: number; color: string }[]
  communitiesAssigned: number
}

export interface RecentActivity {
  id: string
  type: 'created' | 'updated' | 'published' | 'archived'
  title: string
  description: string
  date: string
}

const MOCK_STATS: DashboardStats = {
  totalStoryboards: 3,
  publishedStoryboards: 1,
  draftOrReviewStoryboards: 2,
  archivedStoryboards: 0,
  totalScenes: 14,
  languagesCovered: ['Espanol', 'Ingles'],
  pillarsDistribution: [
    { pillar: 'alimentacion', label: 'Alimentación', count: 1, color: 'bg-emerald-500' },
    { pillar: 'actividad-fisica', label: 'Actividad Fisica', count: 1, color: 'bg-sky-500' },
    { pillar: 'cuidado-personal', label: 'Cuidado Personal', count: 1, color: 'bg-violet-500' },
    { pillar: 'salud-emocional', label: 'Salud Emocional', count: 0, color: 'bg-rose-400' },
  ],
  communitiesAssigned: 1,
}

const MOCK_ACTIVITY: RecentActivity[] = [
  {
    id: '1',
    type: 'published',
    title: 'Los Frijoles',
    description: 'Storyboard publicado con 7 escenas jugables. Disponible para todos.',
    date: '2026-06-10',
  },
  {
    id: '2',
    type: 'created',
    title: 'Muevete y Crece: Actividad Fisica para Ninos',
    description: 'Storyboard creado con 4 escenas. En proceso de revision.',
    date: '2026-06-09',
  },
  {
    id: '3',
    type: 'created',
    title: 'Habitos Diarios: Cuido Mi Cuerpo',
    description: 'Storyboard creado con 3 escenas. Asignado a Escuela Verde.',
    date: '2026-06-08',
  },
]

export function useDashboardStats() {
  const stats = useState<DashboardStats>('dashboard-stats', () => ({ ...MOCK_STATS }))
  const recentActivity = useState<RecentActivity[]>('dashboard-activity', () => [...MOCK_ACTIVITY])

  const activityTypeLabels: Record<RecentActivity['type'], string> = {
    created: 'Creado',
    updated: 'Actualizado',
    published: 'Publicado',
    archived: 'Archivado',
  }

  const activityTypeColors: Record<RecentActivity['type'], string> = {
    created: 'bg-blue-100 text-blue-700',
    updated: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-600',
  }

  return {
    stats,
    recentActivity,
    activityTypeLabels,
    activityTypeColors,
  }
}
