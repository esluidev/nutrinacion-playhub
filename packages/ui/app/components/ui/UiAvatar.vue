<template>
  <span :class="['ui-avatar', size !== 'md' && `ui-avatar-${size}`]" :data-tone="tone ?? uiToneFor(name)" :title="name">
    {{ initials ?? uiInitials(name) }}
  </span>
</template>

<script setup lang="ts">
import { uiInitials, uiToneFor, type UiSize, type UiTone } from '../../utils/ui-tones'

// Iniciales de una persona. Sin `tone`, el tono sale del nombre y es siempre el mismo.
withDefaults(defineProps<{
  name: string
  initials?: string
  tone?: UiTone
  size?: UiSize
}>(), { size: 'md' })
</script>
