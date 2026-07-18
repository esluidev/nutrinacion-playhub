<template>
  <div :class="['relative', sizeClass]">
    <svg
      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="input pl-10"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  maxWidth?: 'xs' | 'sm' | 'md' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar...',
  maxWidth: 'sm',
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const widthMap: Record<string, string> = {
  xs: 'w-full max-w-xs',
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  full: 'w-full',
}

const sizeClass = computed(() => widthMap[props.maxWidth])
</script>
