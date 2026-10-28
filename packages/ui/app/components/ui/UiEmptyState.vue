<template>
  <div class="flex flex-col items-center px-6 py-12 text-center">
    <UiSymbol v-if="icon" :icon="icon" :tone="tone" class="mb-5" />
    <h3 class="ui-title">{{ title }}</h3>
    <p v-if="text" class="ui-text mt-2 max-w-sm">{{ text }}</p>
    <div v-if="$slots.default" class="mt-6"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'

withDefaults(defineProps<{
  title: string
  text?: string
  icon?: UiIconName
  tone?: UiTone
}>(), {
  tone: 'neutral',
})
</script>
