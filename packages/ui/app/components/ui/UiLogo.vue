<template>
  <div class="flex items-center gap-3">
    <img
      v-if="variant === 'isotipo'"
      src="/ui/nutrinacion-isotipo.png"
      alt="Nutrinación"
      width="182"
      height="192"
      :class="['h-auto', size === 'lg' ? 'w-14' : size === 'sm' ? 'w-8' : 'w-10']"
    >
    <img
      v-else
      src="/ui/nutrinacion.png"
      alt="Nutrinación"
      width="928"
      height="373"
      :class="['h-auto', size === 'lg' ? 'w-44' : size === 'sm' ? 'w-24' : 'w-32']"
    >
    <span v-if="showText && label" class="eyebrow">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import type { UiSize } from '../../utils/ui-tones'

// Logo de la marca. `variant="isotipo"` es solo el símbolo (barras laterales colapsadas,
// espacios pequeños). `label` nombra la superficie (Admin, Player, Educadores).
withDefaults(defineProps<{
  variant?: 'full' | 'isotipo'
  size?: UiSize
  label?: string
  showText?: boolean
}>(), {
  variant: 'full',
  size: 'md',
  showText: true,
})
</script>
