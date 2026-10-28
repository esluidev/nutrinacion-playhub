const STORAGE_KEY = 'player-sidebar-collapsed'

// Barra lateral colapsada o expandida, recordada en este navegador.
export function useSidebar() {
  const isCollapsed = useState('sidebar-collapsed', () => false)

  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) isCollapsed.value = stored === 'true'
    }
    catch { /* sin almacenamiento */ }
  }

  function toggleCollapsed() {
    isCollapsed.value = !isCollapsed.value
    try { localStorage.setItem(STORAGE_KEY, String(isCollapsed.value)) }
    catch { /* sin almacenamiento */ }
  }

  return { isCollapsed, toggleCollapsed }
}
