import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'

// El sidebar: su estado (colapsado) y la navegación del contexto activo. Una sección a la vez,
// la del tipo actual (Platform u organización); dentro de la organización, el colaborador solo
// ve la operación: Colaboradores y Administradores son de quien la administra (la RLS lo exige
// igual; aquí solo se evita mostrar lo que fallaría).

const STORAGE_KEY = 'sidebar-collapsed'

export interface NavItem { path: string, labelKey: string, icon: UiIconName }
/** Un grupo del menú: su título (el de la sección en Platform; en la organización, qué tienen en común) y sus elementos. */
export interface NavGrupo { titleKey?: string, items: NavItem[] }

// El menú de la organización, en grupos con título para que se entienda al entrar la primera vez.
// Inicio, solo. La operación, lo de cada semana: los talleres, su calendario, las jornadas (un lugar y
// unos días con varios talleres) y los programas que los juntan. Los recursos que pide un taller, en
// el orden d«Nuevo Taller» (storyboard, educadores, lugar, audiencia). El análisis: Reportes es una
// herramienta aparte, de cualquier periodo, programa, lugar o audiencia, no un paso del programa. Al
// final, el acceso: quién gestiona la organización, que solo ve quien la administra. La licencia se
// ve en Inicio: no es página.
const ORG_NAV: { titleKey?: string, items: (NavItem & { soloAdmin?: boolean })[] }[] = [
  { items: [
    { path: '/organizacion', labelKey: 'nav.dashboard', icon: 'grid' },
  ] },
  { titleKey: 'nav.groupOperation', items: [
    { path: '/organizacion/workshops', labelKey: 'nav.workshops', icon: 'clapperboard' },
    { path: '/organizacion/planner', labelKey: 'nav.planner', icon: 'calendar' },
    { path: '/organizacion/jornadas', labelKey: 'nav.jornadas', icon: 'layers' },
    { path: '/organizacion/programas', labelKey: 'nav.programs', icon: 'bookmark' },
  ] },
  { titleKey: 'nav.groupResources', items: [
    { path: '/organizacion/storyboards', labelKey: 'nav.storyboards', icon: 'book' },
    { path: '/organizacion/educators', labelKey: 'nav.educators', icon: 'users' },
    { path: '/organizacion/lugares', labelKey: 'nav.places', icon: 'map-pin' },
    { path: '/organizacion/audiencias', labelKey: 'nav.audiences', icon: 'heart' },
  ] },
  { titleKey: 'nav.groupAnalysis', items: [
    { path: '/organizacion/reportes', labelKey: 'nav.reports', icon: 'chart' },
  ] },
  { titleKey: 'nav.groupAccess', items: [
    { path: '/organizacion/colaboradores', labelKey: 'nav.collaborators', icon: 'user-plus', soloAdmin: true },
    { path: '/organizacion/administradores', labelKey: 'nav.admins', icon: 'license', soloAdmin: true },
  ] },
]

const PLATFORM_NAV: NavItem[] = [
  { path: '/platform', labelKey: 'nav.dashboard', icon: 'grid' },
  { path: '/platform/organizaciones', labelKey: 'nav.organizations', icon: 'building' },
  { path: '/platform/licencias', labelKey: 'nav.licenses', icon: 'license' },
  { path: '/platform/storyboards', labelKey: 'nav.storyboards', icon: 'book' },
  { path: '/platform/invitaciones', labelKey: 'nav.invitations', icon: 'mail' },
]

export function useSidebar() {
  const isCollapsed = useState('sidebar-collapsed', () => true)

  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      isCollapsed.value = stored === 'true'
    }
  }

  function toggleCollapsed() {
    isCollapsed.value = !isCollapsed.value
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed.value))
    }
  }

  const { tipo, esSuperadmin, orgActiva, administraOrgActiva } = useContexto()

  // Si el acceso que ese tipo requiere no está (p. ej. la bandeja /invitaciones de alguien sin
  // organización), no hay nada que navegar. Un grupo sin nada que mostrar (el acceso, para el
  // colaborador) no sale.
  const grupos = computed<NavGrupo[] | null>(() => {
    if (tipo.value === 'platform') {
      return esSuperadmin.value ? [{ titleKey: 'nav.platform', items: PLATFORM_NAV }] : null
    }
    if (!orgActiva.value) return null
    return ORG_NAV
      .map(g => ({
        titleKey: g.titleKey,
        items: g.items
          .filter(i => !i.soloAdmin || administraOrgActiva.value)
          .map(({ path, labelKey, icon }) => ({ path, labelKey, icon })),
      }))
      .filter(g => g.items.length)
  })

  return { isCollapsed, toggleCollapsed, grupos }
}
