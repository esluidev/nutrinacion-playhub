<template>
  <div class="alert" :data-tone="tone" :role="tone === 'danger' || tone === 'warning' ? 'alert' : 'status'">
    <UiIcon :name="icon ?? ICON[tone] ?? 'info'" />
    <div class="min-w-0">
      <p v-if="title" class="font-black">{{ title }}</p>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '../../utils/ui-icons'
import type { UiTone } from '../../utils/ui-tones'

// Aviso: color + icono + texto. Los tonos de sistema (success, info, warning, danger) o uno de
// significado (p. ej. coral: algo falta).
withDefaults(defineProps<{
  tone?: UiTone
  title?: string
  icon?: UiIconName
}>(), {
  tone: 'info',
})

const ICON: Partial<Record<UiTone, UiIconName>> = { success: 'check-circle', info: 'info', warning: 'warning', danger: 'warning', coral: 'warning' }
</script>
