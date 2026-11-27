// La versión nueva de la app instalada (pwa.ts). Se descarga sola en segundo plano y espera: nunca recarga la app por
// su cuenta, que cortaría un taller. Cuando está lista sale un aviso con «Actualizar», que recarga con la nueva. Fuera
// de las rutas donde estorbaría (`omitir`: el taller en curso); si llega estando en una, el aviso sale al salir de ella.
// Se llama una vez, en app.vue.
export function useActualizacionApp(textos: () => { mensaje: string, accion: string }, omitir: (ruta: string) => boolean = () => false) {
  if (!import.meta.client) return
  const pwa = useNuxtApp().$pwa
  if (!pwa) return
  const route = useRoute()
  const { toast } = useToast()
  let avisado = false
  watch(() => [pwa.needRefresh, route.path] as const, ([nueva, ruta]) => {
    if (!nueva || avisado || omitir(ruta)) return
    avisado = true
    const { mensaje, accion } = textos()
    toast.info(mensaje, { duracion: 0, accion: { label: accion, onClick: () => { void pwa.updateServiceWorker(true) } } })
  }, { immediate: true })
}
