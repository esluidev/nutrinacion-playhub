// Feedback de acciones: avisos flotantes, no textos sueltos pegados a la pantalla.
//
//   const { toast } = useToast()
//   toast.success('Invitación aceptada')
//   toast.error('No se pudo guardar')
//   toast.info('...', { accion: { label: 'Entrar', onClick: () => navigateTo('/dashboard') } })
//
// El render lo hace <UiToaster> (montado una vez en app.vue) sobre las primitivas Toast de Reka:
// aria-live, pausa al pasar el mouse, swipe y cierre por teclado salen de ahí. Aquí solo vive la
// cola.

export type ToastVariante = 'success' | 'error' | 'warning' | 'info'

export interface ToastAccion {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: number
  variante: ToastVariante
  mensaje: string
  duracion: number
  accion?: ToastAccion
}

export function useToast() {
  const items = useState<ToastItem[]>('toasts', () => [])
  const seq = useState('toast-seq', () => 0)

  function push(variante: ToastVariante, mensaje: string, opts: { duracion?: number, accion?: ToastAccion } = {}) {
    seq.value++
    items.value = [...items.value, {
      id: seq.value,
      variante,
      mensaje,
      // Un error se lee más despacio que un "listo": no lo escondas tan rápido.
      duracion: opts.duracion ?? (variante === 'error' ? 7000 : 4000),
      accion: opts.accion,
    }]
  }

  function remove(id: number) {
    items.value = items.value.filter(x => x.id !== id)
  }

  const toast = {
    success: (m: string, o?: { duracion?: number, accion?: ToastAccion }) => push('success', m, o),
    error: (m: string, o?: { duracion?: number, accion?: ToastAccion }) => push('error', m, o),
    warning: (m: string, o?: { duracion?: number, accion?: ToastAccion }) => push('warning', m, o),
    info: (m: string, o?: { duracion?: number, accion?: ToastAccion }) => push('info', m, o),
  }

  return { items, toast, remove }
}
