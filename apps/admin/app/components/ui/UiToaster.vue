<template>
  <!-- Montado UNA vez en app.vue. Reka Toast aporta lo invisible pero necesario: aria-live para
       lectores de pantalla, pausa del temporizador al pasar el mouse o enfocar, swipe y Escape. -->
  <RekaToastProvider swipe-direction="up">
    <RekaToastRoot
      v-for="item in items"
      :key="item.id"
      :duration="item.duracion"
      :class="[
        'pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg bg-white',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=open]:fade-in',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-2',
        'data-[swipe=end]:animate-out data-[swipe=end]:fade-out',
        estilos[item.variante].borde,
      ]"
      @update:open="(abierto: boolean) => !abierto && remove(item.id)"
    >
      <span :class="['mt-0.5 shrink-0', estilos[item.variante].icono]">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9">
          <path stroke-linecap="round" stroke-linejoin="round" :d="estilos[item.variante].path" />
        </svg>
      </span>

      <RekaToastDescription class="flex-1 text-sm text-brand-dark leading-snug pt-0.5">
        {{ item.mensaje }}
      </RekaToastDescription>

      <RekaToastAction
        v-if="item.accion"
        :alt-text="item.accion.label"
        as-child
      >
        <button
          class="shrink-0 text-xs font-bold text-brand-primary-600 hover:underline pt-0.5"
          @click="item.accion.onClick()"
        >
          {{ item.accion.label }}
        </button>
      </RekaToastAction>

      <RekaToastClose class="shrink-0 text-gray-300 hover:text-gray-500 transition-colors" :aria-label="t('common.close')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </RekaToastClose>
    </RekaToastRoot>

    <!-- Bajan desde arriba, centrados. pointer-events-none para no bloquear la app detrás. -->
    <RekaToastViewport
      class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[min(28rem,calc(100vw-2rem))] outline-none pointer-events-none"
    />
  </RekaToastProvider>
</template>

<script setup lang="ts">
import type { ToastVariante } from '~/composables/useToast'

const { t } = useT()
const { items, remove } = useToast()

const estilos: Record<ToastVariante, { borde: string, icono: string, path: string }> = {
  success: {
    borde: 'border-brand-primary/30',
    icono: 'text-brand-primary-600',
    path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  error: {
    borde: 'border-red-200',
    icono: 'text-red-500',
    path: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
  },
  warning: {
    borde: 'border-amber-200',
    icono: 'text-amber-500',
    path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  },
  info: {
    borde: 'border-blue-200',
    icono: 'text-blue-500',
    path: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
  },
}
</script>
