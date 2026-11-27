// Instalar la app (PWA, pwa.ts) con un toque. Solo se ofrece donde el navegador la instala de verdad con su ventana
// (Chrome y Edge en Android y en el computador, Samsung Internet) y mientras no esté instalada; `instalar()` abre esa
// ventana. Donde no la hay (iPhone y iPad, Firefox), no se ofrece nada: un botón que solo diera instrucciones no
// instala (Luis, 2026-11-27). El aviso que el navegador sacaría por su cuenta tampoco sale (`client.installPrompt`).
export function useInstalarApp() {
  const puedeInstalar = computed(() => {
    if (!import.meta.client) return false
    const pwa = useNuxtApp().$pwa
    return Boolean(pwa?.showInstallPrompt && !pwa.isPWAInstalled)
  })

  /** La ventana del navegador para instalar. Devuelve si se instaló. */
  async function instalar(): Promise<boolean> {
    const eleccion = await useNuxtApp().$pwa?.install()
    return eleccion?.outcome === 'accepted'
  }

  return { puedeInstalar, instalar }
}
