// Avisos flotantes de una acción («Guardado», «No se pudo guardar»). <UiToaster> se monta una vez
// en app.vue y pinta la cola:
//
//   const { toast } = useToast()
//   toast.success('Invitación enviada')
//   toast.error('No se pudo guardar')
//   toast.info('…', { accion: { label: 'Entrar', onClick: () => navigateTo('/dashboard') } })

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

interface ToastOpts { duracion?: number, accion?: ToastAccion }

export function useToast() {
  const items = useState<ToastItem[]>('ui-toasts', () => [])
  const seq = useState('ui-toast-seq', () => 0)

  function push(variante: ToastVariante, mensaje: string, opts: ToastOpts = {}) {
    seq.value++
    items.value = [...items.value, {
      id: seq.value,
      variante,
      mensaje,
      // Un error se lee más despacio que un «listo».
      duracion: opts.duracion ?? (variante === 'error' ? 7000 : 4000),
      accion: opts.accion,
    }]
  }

  function remove(id: number) {
    items.value = items.value.filter(x => x.id !== id)
  }

  const toast = {
    success: (m: string, o?: ToastOpts) => push('success', m, o),
    error: (m: string, o?: ToastOpts) => push('error', m, o),
    warning: (m: string, o?: ToastOpts) => push('warning', m, o),
    info: (m: string, o?: ToastOpts) => push('info', m, o),
  }

  return { items, toast, remove }
}
