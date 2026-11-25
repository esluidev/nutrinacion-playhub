// Lo que una app lee de la base se guarda para pintarlo al momento, pero otra app, otra pestaña u otra persona puede
// cambiarlo mientras tanto: un educador que elige su PIN en Educators, un taller que Admin asigna. `useAlVolver` llama
// a `revisar` cuando la persona vuelve a la pestaña o a la ventana, para que vuelva a leer lo que haga falta. Se quita
// solo con el componente que lo registró; fuera de uno, no hace nada. Al volver llegan dos avisos (la pestaña y la
// ventana): `revisar` decide si de verdad hace falta leer.
export function useAlVolver(revisar: () => void) {
  if (!import.meta.client || !getCurrentScope()) return
  const alVolver = () => {
    if (document.visibilityState === 'visible') revisar()
  }
  document.addEventListener('visibilitychange', alVolver)
  window.addEventListener('focus', alVolver)
  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', alVolver)
    window.removeEventListener('focus', alVolver)
  })
}
