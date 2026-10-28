<template>
  <!-- El tamaño sale de --ph-icon (densidad) o de una clase del consumidor (size-4…). -->
  <svg
    class="icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    :style="strokeWidth ? { strokeWidth } : undefined"
    v-html="markup"
  />
</template>

<script setup lang="ts">
import type { UiIconName } from '../../utils/ui-icons'
import { uiIconMarkup } from '../../utils/ui-icons'

const props = defineProps<{
  name: UiIconName
  strokeWidth?: number | string
}>()

const markup = computed(() => uiIconMarkup(props.name))
</script>
