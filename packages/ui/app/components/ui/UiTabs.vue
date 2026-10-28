<template>
  <div :class="['ui-tabs', fit && 'ui-tabs-fit']" role="tablist" :aria-label="label" @keydown="onKey">
    <button
      v-for="(item, i) in items"
      :key="item.value"
      :ref="(el) => { buttons[i] = el as HTMLButtonElement }"
      type="button"
      role="tab"
      class="ui-tab"
      :aria-selected="modelValue === item.value"
      :tabindex="modelValue === item.value ? 0 : -1"
      @click="$emit('update:modelValue', item.value)"
    >
      <UiIcon v-if="item.icon" :name="item.icon" />
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '../../utils/ui-icons'

interface TabItem { value: string, label: string, icon?: UiIconName }

const props = defineProps<{
  items: TabItem[]
  modelValue: string
  label?: string
  // Ancho según el contenido (selector de vista en una barra) en lugar de ocupar la fila.
  fit?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const buttons = ref<HTMLButtonElement[]>([])

// Flechas para moverse entre pestañas (patrón ARIA de tabs).
function onKey(e: KeyboardEvent) {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
  e.preventDefault()
  const cur = props.items.findIndex(t => t.value === props.modelValue)
  const last = props.items.length - 1
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? last
    : e.key === 'ArrowRight' ? (cur + 1 > last ? 0 : cur + 1) : (cur - 1 < 0 ? last : cur - 1)
  const item = props.items[next]
  if (!item) return
  emit('update:modelValue', item.value)
  nextTick(() => buttons.value[next]?.focus())
}
</script>
