<template>
  <!-- Montado UNA vez en app.vue. Reka Toast aporta lo invisible pero necesario: aria-live para
       lectores de pantalla, pausa del temporizador al pasar el mouse o enfocar, swipe y Escape. -->
  <RekaToastProvider swipe-direction="up">
    <RekaToastRoot
      v-for="item in items"
      :key="item.id"
      :duration="item.duracion"
      :class="[
        'pointer-events-auto flex items-start gap-3 rounded-[14px] p-3.5 shadow-lift text-white',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=open]:fade-in',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-2',
        'data-[swipe=end]:animate-out data-[swipe=end]:fade-out',
        estilos[item.variante].bg,
      ]"
      @update:open="(abierto: boolean) => !abierto && remove(item.id)"
    >
      <span class="w-8 h-8 rounded-[10px] bg-white/20 text-white flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="estilos[item.variante].path" />
        </svg>
      </span>

      <RekaToastDescription class="flex-1 text-[13px] font-semibold text-white/95 leading-snug pt-1">
        {{ item.mensaje }}
      </RekaToastDescription>

      <RekaToastAction
        v-if="item.accion"
        :alt-text="item.accion.label"
        as-child
      >
        <button
          class="shrink-0 text-xs font-bold text-white underline pt-1"
          @click="item.accion.onClick()"
        >
          {{ item.accion.label }}
        </button>
      </RekaToastAction>

      <RekaToastClose class="shrink-0 w-6 h-6 rounded-[8px] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors" :aria-label="t('common.close')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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

const estilos: Record<ToastVariante, { bg: string, path: string }> = {
  success: {
    bg: 'bg-[#2f9426]',
    path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  error: {
    bg: 'bg-[#dc2626]',
    path: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
  },
  warning: {
    bg: 'bg-[#d97706]',
    path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  },
  info: {
    bg: 'bg-[#2563eb]',
    path: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
  },
}
</script>
