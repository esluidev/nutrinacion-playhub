// Temporizadores de una plantilla: se limpian juntos al reiniciar o al desmontar.
export function useTimers() {
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => { timers.delete(id); fn() }, ms)
    timers.add(id)
  }
  const every = (fn: () => void, ms: number) => {
    timers.add(setInterval(fn, ms))
  }
  const clear = () => {
    timers.forEach((id) => { clearTimeout(id); clearInterval(id) })
    timers.clear()
  }
  onBeforeUnmount(clear)
  return { later, every, clear }
}

/** Vuelve a disparar una animación CSS de una sola vez. */
export function replay(node: Element | null | undefined, className: string) {
  if (!node) return
  node.classList.remove(className)
  void (node as HTMLElement).offsetWidth
  node.classList.add(className)
}
