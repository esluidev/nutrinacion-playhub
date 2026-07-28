<template>
  <div class="relative">
    <button
      ref="trigger"
      type="button"
      :disabled="disabled"
      :class="triggerClasses"
      @click="open = !open"
    >
      <span :class="['truncate', variant === 'toolbar' ? 'whitespace-nowrap' : '', selected ? '' : 'text-gray-400']">
        <template v-if="prefix">{{ prefix }}: </template>{{ selected ? selected.label : placeholder }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="['w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform', open ? 'rotate-180' : '']"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <div
      v-if="open"
      :class="[
        'absolute z-40 mt-1.5 bg-white rounded-[12px] shadow-dropdown border border-gray-200 p-1.5 max-h-64 overflow-y-auto scrollbar-thin',
        variant === 'toolbar' ? 'min-w-[210px] left-0' : 'w-full min-w-[9rem]',
      ]"
    >
      <button
        v-for="opt in options"
        :key="String(opt.value)"
        type="button"
        :class="[
          'w-full text-left px-2.5 py-2 rounded-[8px] text-sm flex items-center justify-between gap-2 transition-colors',
          opt.value === modelValue
            ? 'text-brand-primary-800 font-bold bg-brand-primary-50'
            : 'text-gray-700 font-semibold hover:bg-gray-50',
        ]"
        @click="choose(opt.value)"
      >
        <span class="truncate">{{ opt.label }}</span>
        <svg
          v-if="opt.value === modelValue"
          xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option { value: string | number | null, label: string }

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: Option[]
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  // 'form' = campo de formulario (fondo tinte); 'toolbar' = control de filtro (blanco, ancho al contenido)
  variant?: 'form' | 'toolbar'
  // Prefijo visible en el trigger: "Tipo: Todos" (patrón del mock para filtros)
  prefix?: string
}>(), {
  placeholder: 'Selecciona...',
  disabled: false,
  size: 'sm',
  variant: 'form',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const open = ref(false)
const trigger = ref<HTMLElement | null>(null)

const selected = computed(() => props.options.find(o => o.value === props.modelValue) ?? null)

const triggerClasses = computed(() => {
  if (props.variant === 'toolbar') {
    return 'inline-flex items-center gap-2 bg-white border border-gray-200 rounded-[10px] px-3.5 h-10 text-[13px] font-semibold text-gray-700 whitespace-nowrap hover:border-brand-primary-200 transition-colors disabled:opacity-50'
  }
  return [
    props.size === 'sm' ? 'input-sm' : 'input',
    'flex items-center justify-between gap-2 text-left',
  ].join(' ')
})

function choose(value: string | number | null) {
  emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (trigger.value && !trigger.value.parentElement?.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>
