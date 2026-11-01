import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'

// El sidebar: su estado (colapsado) y la navegación del contexto activo. Una sección a la vez,
// la del tipo actual (Platform u organización); dentro de la organización, el colaborador solo
// ve la operación: Colaboradores y Administradores son de quien la administra (la RLS lo exige
// igual; aquí solo se evita mostrar lo que fallaría).

const STORAGE_KEY = 'sidebar-collapsed'

export interface NavItem { path: string, labelKey: string, icon: UiIconName }
export interface NavSeccion { titleKey: string, items: NavItem[] }

// Operar y administrar una organización, en este orden. La licencia se ve en Inicio: no es página.
const ORG_NAV: (NavItem & { soloAdmin?: boolean })[] = [
  { path: '/organizacion', labelKey: 'nav.dashboard', icon: 'grid' },
  { path: '/organizacion/workshops', labelKey: 'nav.workshops', icon: 'clapperboard' },
  { path: '/organizacion/planner', labelKey: 'nav.planner', icon: 'calendar' },
  { path: '/organizacion/educators', labelKey: 'nav.educators', icon: 'users' },
  { path: '/organizacion/colaboradores', labelKey: 'nav.collaborators', icon: 'user-plus', soloAdmin: true },
  { path: '/organizacion/storyboards', labelKey: 'nav.storyboards', icon: 'book' },
  { path: '/organizacion/administradores', labelKey: 'nav.admins', icon: 'license', soloAdmin: true },
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
  // organización), no hay nada que navegar.
  const seccion = computed<NavSeccion | null>(() => {
    if (tipo.value === 'platform') {
      return esSuperadmin.value ? { titleKey: 'nav.platform', items: PLATFORM_NAV } : null
    }
    if (!orgActiva.value) return null
    const items = ORG_NAV
      .filter(i => !i.soloAdmin || administraOrgActiva.value)
      .map(({ path, labelKey, icon }) => ({ path, labelKey, icon }))
    return { titleKey: 'ctx.org', items }
  })

  return { isCollapsed, toggleCollapsed, seccion }
}
