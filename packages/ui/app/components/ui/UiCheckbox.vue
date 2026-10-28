<template>
  <label class="inline-flex items-center gap-2.5 font-bold" :style="{ fontSize: 'var(--text-body)' }">
    <input
      type="checkbox"
      class="check-control"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >
    <slot>{{ label }}</slot>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>
