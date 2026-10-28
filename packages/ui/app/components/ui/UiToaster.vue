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
      <button v-if="item.accion" type="button" class="font-black underline underline-offset-4" @click="item.accion.onClick(); remove(item.id)">
        {{ item.accion.label }}
      </button>
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

function schedule(item: ToastItem) {
  if (timers.has(item.id)) return
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
