<template>
  <!-- Ventana del taller (puntos, confirmaciones): la anatomía de los paneles laterales sobre el
       velo. <dialog> nativo: foco atrapado y Escape los da el navegador. -->
  <dialog ref="el" class="panel-window" :aria-labelledby="`${uid}-title`" @close="onClose" @cancel.prevent="emit('update:open', false)">
    <div class="panel-head">
      <span class="ui-symbol window-symbol" :data-tone="tone" aria-hidden="true"><UiIcon :name="symbol" /></span>
      <div class="window-titles">
        <p v-if="caption" class="panel-caption">{{ caption }}</p>
        <h2 :id="`${uid}-title`" class="ui-heading">{{ title }}</h2>
      </div>
      <UiButton tone="neutral" size="sm" icon="close" icon-only :label="closeLabel" @click="emit('update:open', false)" />
    </div>
    <p v-if="text" class="window-text">{{ text }}</p>
    <div v-if="stats?.length" class="window-stats">
      <div v-for="[name, value] in stats" :key="name" class="window-box">
        <p class="panel-label">{{ name }}</p>
        <p class="window-figure">{{ value }}</p>
      </div>
    </div>
    <slot />
    <div v-if="$slots.actions" class="window-actions">
      <slot name="actions" />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'

const props = defineProps<{
  open: boolean
  title: string
  caption?: string
  text?: string
  symbol: UiIconName
  tone?: UiTone
  stats?: [string, string][]
  closeLabel: string
}>()

const emit = defineEmits<{ 'update:open': [value: boolean], 'closed': [] }>()

const uid = useId()
const el = ref<HTMLDialogElement | null>(null)

watch(() => props.open, (open) => {
  const d = el.value
  if (!d) return
  if (open && !d.open) d.showModal()
  if (!open && d.open) d.close()
})

function onClose() {
  if (props.open) emit('update:open', false)
  emit('closed')
}
</script>
