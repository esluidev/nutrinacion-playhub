const STORAGE_KEY = 'sidebar-collapsed'

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

  return { isCollapsed, toggleCollapsed }
}
