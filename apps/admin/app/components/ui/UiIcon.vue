<template>
  <!-- El tamaño lo pone el consumidor con `class` (cae por atributos al svg). -->
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :stroke-width="strokeWidth">
    <path stroke-linecap="round" stroke-linejoin="round" :d="ICONS[name]" />
  </svg>
</template>

<script setup lang="ts">
import type { IconName } from '~/utils/icons'
import { ICONS } from '~/utils/icons'

withDefaults(defineProps<{
  name: IconName
  strokeWidth?: number | string
}>(), {
  strokeWidth: 1.75,
})
</script>
