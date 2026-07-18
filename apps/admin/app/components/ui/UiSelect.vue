<template>
  <div class="relative">
    <button
      ref="trigger"
      type="button"
      :disabled="disabled"
      :class="[
        size === 'sm' ? 'input-sm' : 'input',
        'flex items-center justify-between gap-2 text-left',
      ]"
      @click="open = !open"
    >
      <span :class="['truncate', selected ? 'text-brand-dark' : 'text-gray-400']">
        {{ selected ? selected.label : placeholder }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="['w-4 h-4 shrink-0 text-gray-400 transition-transform', open ? 'rotate-180' : '']"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute z-40 mt-1 w-full min-w-[9rem] bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-64 overflow-y-auto scrollbar-thin"
    >
      <button
        v-for="opt in options"
        :key="String(opt.value)"
        type="button"
        :class="[
          'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors',
          opt.value === modelValue
            ? 'text-brand-primary-700 font-semibold bg-brand-primary-50/60'
            : 'text-gray-600 hover:bg-gray-50',
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
}>(), {
  placeholder: 'Selecciona...',
  disabled: false,
  size: 'sm',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const open = ref(false)
const trigger = ref<HTMLElement | null>(null)

const selected = computed(() => props.options.find(o => o.value === props.modelValue) ?? null)

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
