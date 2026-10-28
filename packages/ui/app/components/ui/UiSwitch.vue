<template>
  <label class="inline-flex items-center gap-3 font-bold" :class="disabled && 'opacity-50'">
    <button
      type="button"
      role="switch"
      class="ui-switch"
      :data-tone="tone"
      :aria-checked="modelValue"
      :disabled="disabled"
      @click="$emit('update:modelValue', !modelValue)"
    />
    <span v-if="label || $slots.default" :style="{ fontSize: 'var(--text-body)' }"><slot>{{ label }}</slot></span>
  </label>
</template>

<script setup lang="ts">
import type { UiTone } from '../../utils/ui-tones'

defineProps<{
  modelValue: boolean
  label?: string
  tone?: UiTone
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>
