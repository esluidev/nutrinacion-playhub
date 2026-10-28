<template>
  <!-- Número con botones grandes de menos y más: más fácil que un teclado numérico en el aula. -->
  <div>
    <label :for="id" class="field-label">{{ label }}</label>
    <div class="flex items-center gap-3">
      <UiButton tone="neutral" icon="minus" icon-only :label="`${label} −1`" :disabled="modelValue <= 0" @click="$emit('update:modelValue', Math.max(0, modelValue - 1))" />
      <input
        :id="id"
        :value="modelValue"
        type="number"
        inputmode="numeric"
        min="0"
        class="field w-24 text-center font-black tabular-nums"
        :style="{ fontSize: 'var(--text-title)' }"
        @input="$emit('update:modelValue', Math.max(0, Number(($event.target as HTMLInputElement).value) || 0))"
      >
      <UiButton tone="neutral" icon="plus" icon-only :label="`${label} +1`" @click="$emit('update:modelValue', modelValue + 1)" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string, modelValue: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()
const id = useId()
</script>
