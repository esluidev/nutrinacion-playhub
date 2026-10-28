<template>
  <span
    :class="['ui-symbol', size !== 'lg' && `ui-symbol-${size === 'xl' ? 'lg' : size}`]"
    :data-tone="tone"
    aria-hidden="true"
  >
    <UiIcon v-if="icon" :name="icon" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { UiTone, UiSize } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'

// Cuadro con tinte que sostiene un pictograma: ventanas, tarjetas, pasos. Tamaños: sm 28 (listas),
// md 40 (cifras y tarjetas), lg 64 (ventanas y vacíos, por defecto) y xl 80.
withDefaults(defineProps<{
  icon?: UiIconName
  tone?: UiTone
  size?: UiSize | 'xl'
}>(), {
  size: 'lg',
})
</script>
