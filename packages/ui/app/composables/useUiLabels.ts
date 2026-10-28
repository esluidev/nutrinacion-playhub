import type { InjectionKey } from 'vue'

// Textos que los componentes del kit muestran por sí mismos. Español por defecto; cada app
// puede inyectar los suyos (p. ej. desde su i18n) con provideUiLabels() en app.vue.
export interface UiLabels {
  cancel: string
  close: string
  confirm: string
  loading: string
  empty: string
  emptyFiltered: string
  search: string
  all: string
  select: string
  optional: string
  previous: string
  next: string
  retry: string
  runner: string
  runnerFailed: string
  runnerFailedText: string
  showing: (from: number, to: number, total: number) => string
}

const DEFAULT_LABELS: UiLabels = {
  cancel: 'Cancelar',
  close: 'Cerrar',
  confirm: 'Confirmar',
  loading: 'Cargando…',
  empty: 'Sin datos.',
  emptyFiltered: 'Nada coincide con la búsqueda o los filtros.',
  search: 'Buscar…',
  all: 'Todos',
  select: 'Selecciona…',
  optional: '(opcional)',
  previous: 'Anterior',
  next: 'Siguiente',
  retry: 'Reintentar',
  runner: 'Taller',
  runnerFailed: 'No se pudo abrir el taller',
  runnerFailedText: 'Revisa la conexión e inténtalo de nuevo.',
  showing: (from, to, total) => `Mostrando ${from}–${to} de ${total}`,
}

const UI_LABELS_KEY: InjectionKey<() => Partial<UiLabels>> = Symbol('ui-labels')

export function provideUiLabels(labels: () => Partial<UiLabels>) {
  provide(UI_LABELS_KEY, labels)
}

export function useUiLabels() {
  const injected = inject(UI_LABELS_KEY, () => ({}))
  return computed<UiLabels>(() => ({ ...DEFAULT_LABELS, ...injected() }))
}
