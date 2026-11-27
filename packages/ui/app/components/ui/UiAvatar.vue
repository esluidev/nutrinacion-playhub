<template>
  <!-- Una persona: sus iniciales o, si tiene una imagen (el animal del avatar de un niño, `src`), la imagen, siempre en
       la forma del kit (un rectángulo redondeado). -->
  <span :class="['ui-avatar', size !== 'md' && `ui-avatar-${size}`]" :data-tone="tone ?? uiToneFor(name)" :title="name">
    <img v-if="src" :src="src" alt="" decoding="sync">
    <template v-else>{{ initials ?? uiInitials(name) }}</template>
  </span>
</template>

<script setup lang="ts">
import { uiInitials, uiToneFor, type UiSize, type UiTone } from '../../utils/ui-tones'

// Iniciales de una persona. Sin `tone`, el tono sale del nombre y es siempre el mismo. `xl` (80) es para elegir a
// alguien en grande («¿Quién juega?», la app del hogar).
withDefaults(defineProps<{
  name: string
  initials?: string
  tone?: UiTone
  size?: UiSize | 'xl'
  src?: string
}>(), { size: 'md' })
</script>
