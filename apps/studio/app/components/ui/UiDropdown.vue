<template>
  <div :class="['relative', block ? 'w-full' : 'inline-block']">
    <button
      type="button"
      :aria-label="ariaLabel"
      :disabled="disabled"
      :class="[
        'inline-flex items-center gap-2 rounded-lg border bg-white transition-colors text-sm',
        size === 'md' ? 'h-10 px-3' : 'h-9 px-3',
        block ? 'w-full' : 'min-w-[10.5rem]',
        disabled ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
             : open ? 'border-brand-primary ring-2 ring-brand-primary/20'
             : dirty ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200 hover:bg-gray-50',
      ]"
      @click="disabled || (open = !open)"
    >
      <span v-if="current?.dot" :class="['w-2 h-2 rounded-full shrink-0', current.dot]" />
      <span :class="['flex-1 text-left font-semibold truncate', current ? 'text-brand-dark' : 'text-gray-400']">
        {{ current?.label ?? placeholder ?? 'Seleccionar' }}
      </span>
      <span v-if="dirty" class="text-[10px] font-bold uppercase text-amber-600 shrink-0">sin guardar</span>
      <svg xmlns="http://www.w3.org/2000/svg" :class="['w-3.5 h-3.5 text-gray-400 transition-transform shrink-0', open ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <!-- Telón para cerrar al click-fuera -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />

    <div
      v-if="open"
      :class="[
        'absolute top-full mt-2 min-w-full w-max max-w-[20rem] bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50',
        align === 'right' ? 'right-0' : 'left-0',
      ]"
    >
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        class="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
        @click="select(o.value)"
      >
        <span v-if="o.dot" :class="['w-2 h-2 rounded-full shrink-0', o.dot]" />
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-semibold text-brand-dark">{{ o.label }}</span>
          <span v-if="o.description" class="block text-xs text-gray-400">{{ o.description }}</span>
        </span>
        <svg v-if="o.value === modelValue" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-brand-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface UiDropdownOption {
  value: string
  label: string
  dot?: string
  description?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: UiDropdownOption[]
  dirty?: boolean
  disabled?: boolean
  placeholder?: string
  block?: boolean
  align?: 'left' | 'right'
  size?: 'sm' | 'md'
  ariaLabel?: string
}>(), {
  align: 'left',
  size: 'sm',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const current = computed(() => props.options.find(o => o.value === props.modelValue))

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}
</script>
