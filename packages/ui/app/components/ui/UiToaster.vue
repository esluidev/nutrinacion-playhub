<template>
  <!-- Montado una vez en app.vue. aria-live anuncia cada aviso; pasar el puntero o enfocar
       un aviso pausa su cierre automático. -->
  <div class="toast-stack" role="region" aria-live="polite" :aria-label="regionLabel">
    <div
      v-for="item in items"
      :key="item.id"
      class="toast"
      role="status"
      @mouseenter="pause(item.id)"
      @mouseleave="resume(item)"
      @focusin="pause(item.id)"
      @focusout="resume(item)"
    >
      <span class="toast-symbol" :data-tone="TONE[item.variante]">
        <UiIcon :name="ICON[item.variante]" />
      </span>
      <span class="flex-1 leading-snug">{{ item.mensaje }}</span>
      <!-- La acción es un botón, nunca un enlace de texto (Luis, 2026-11-26: «eso no es un botón»). -->
      <UiButton v-if="item.accion" size="sm" @click="item.accion.onClick(); remove(item.id)">{{ item.accion.label }}</UiButton>
      <button type="button" class="opacity-70 hover:opacity-100" :aria-label="labels.close" @click="remove(item.id)">
        <UiIcon name="close" class="size-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'
import type { ToastItem, ToastVariante } from '../../composables/useToast'

withDefaults(defineProps<{ regionLabel?: string }>(), { regionLabel: 'Avisos' })

const labels = useUiLabels()
const { items, remove } = useToast()

const TONE: Record<ToastVariante, UiTone> = { success: 'lime', error: 'coral', warning: 'sun', info: 'sky' }
const ICON: Record<ToastVariante, UiIconName> = { success: 'check', error: 'warning', warning: 'warning', info: 'info' }

const timers = new Map<number, ReturnType<typeof setTimeout>>()

// Con duración 0 el aviso se queda hasta que se cierra o se elige su acción (la versión nueva de la app).
function schedule(item: ToastItem) {
  if (timers.has(item.id) || item.duracion <= 0) return
  timers.set(item.id, setTimeout(() => { timers.delete(item.id); remove(item.id) }, item.duracion))
}

function pause(id: number) {
  clearTimeout(timers.get(id))
  timers.delete(id)
}

function resume(item: ToastItem) {
  schedule(item)
}

watch(items, list => list.forEach(schedule), { immediate: true, deep: false })
onUnmounted(() => timers.forEach(clearTimeout))
</script>
