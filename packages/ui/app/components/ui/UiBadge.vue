<template>
  <span class="badge" :data-tone="resolvedTone">
    <span v-if="dot" class="badge-dot" aria-hidden="true" />
    <UiIcon v-if="icon" :name="icon" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { UiTone } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'

// Etiqueta corta con el tono de su significado (DESIGN.md, «Roles de color»); neutra por defecto.
const props = defineProps<{
  tone?: UiTone
  dot?: boolean
  icon?: UiIconName
}>()

const resolvedTone = computed(() => props.tone ?? 'neutral')
</script>
