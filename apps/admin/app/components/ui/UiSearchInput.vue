<template>
  <!-- Control de toolbar (mock): blanco con borde, no el estilo tinte de formulario. -->
  <div :class="['flex items-center gap-2 bg-white border border-gray-200 rounded-[10px] px-3.5 h-10 box-border focus-within:border-brand-primary-200 transition-colors', sizeClass]">
    <svg
      class="w-[15px] h-[15px] text-gray-400 shrink-0 pointer-events-none"
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
      class="w-full bg-transparent border-none outline-none text-[13px] text-gray-800 placeholder-gray-400"
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
  placeholder: 'Buscar…',
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
