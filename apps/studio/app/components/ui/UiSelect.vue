<template>
  <div class="relative">
    <select
      :value="modelValue"
      class="input appearance-none pr-9 cursor-pointer font-semibold text-gray-600"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}{{ opt.count !== undefined ? ` (${opt.count})` : '' }}
      </option>
    </select>
    <svg
      class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  </div>
</template>

<script setup lang="ts">
export interface UiSelectOption {
  value: string
  label: string
  count?: number
}

defineProps<{
  modelValue: string
  options: UiSelectOption[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
