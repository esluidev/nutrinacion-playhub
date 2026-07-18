<template>
  <div :class="['relative', block ? 'w-full' : 'inline-block']">
    <!-- Trigger -->
    <button
      type="button"
      :aria-label="ariaLabel"
      :class="[
        'inline-flex items-center gap-2 h-10 px-3 rounded-lg border bg-white transition-colors text-sm w-full',
        open ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200 hover:bg-gray-50',
      ]"
      @click="toggleOpen"
    >
      <span :class="['flex-1 text-left font-semibold truncate', modelValue.length ? 'text-brand-dark' : 'text-gray-400']">
        {{ modelValue.length ? `${modelValue.length} seleccionado${modelValue.length === 1 ? '' : 's'}` : emptyLabel }}
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" :class="['w-3.5 h-3.5 text-gray-400 transition-transform shrink-0', open ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <!-- Telón para cerrar al click-fuera -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close" />

    <!-- Popover -->
    <div
      v-if="open"
      class="absolute top-full left-0 mt-2 w-full min-w-[16rem] bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden"
    >
      <!-- Búsqueda -->
      <div class="p-2 border-b border-gray-100">
        <div class="relative">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref="searchEl"
            v-model="query"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
          >
        </div>
      </div>

      <!-- Opciones -->
      <div class="max-h-56 overflow-y-auto py-1">
        <button
          v-for="o in filtered"
          :key="o.value"
          type="button"
          class="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
          @click="toggle(o.value)"
        >
          <span :class="['w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                         isSelected(o.value) ? 'bg-brand-primary border-brand-primary' : 'border-gray-300']">
            <svg v-if="isSelected(o.value)" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </span>
          <span v-if="o.icon" class="shrink-0">{{ o.icon }}</span>
          <span class="flex-1 min-w-0 text-sm font-semibold text-brand-dark truncate">{{ o.label }}</span>
          <span v-if="o.sublabel" class="text-xs text-gray-400 shrink-0">{{ o.sublabel }}</span>
        </button>
        <p v-if="!filtered.length" class="px-3 py-4 text-center text-sm text-gray-400">{{ noResultsLabel }}</p>
      </div>

      <!-- Pie: limpiar -->
      <div v-if="modelValue.length" class="p-2 border-t border-gray-100 flex justify-end">
        <button type="button" class="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1" @click="clearAll">
          Limpiar selección
        </button>
      </div>
    </div>

    <!-- Seleccionados como chips removibles -->
    <div v-if="modelValue.length" class="flex flex-wrap gap-1.5 mt-2">
      <span
        v-for="o in selectedOptions"
        :key="o.value"
        class="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-xs font-semibold border border-brand-primary bg-brand-primary/10 text-brand-dark"
      >
        <span v-if="o.icon">{{ o.icon }}</span>{{ o.label }}
        <button type="button" class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-brand-primary/20" :aria-label="`Quitar ${o.label}`" @click="toggle(o.value)">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface UiMultiSelectOption {
  value: string
  label: string
  icon?: string
  sublabel?: string
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  options: UiMultiSelectOption[]
  emptyLabel?: string
  searchPlaceholder?: string
  noResultsLabel?: string
  block?: boolean
  ariaLabel?: string
}>(), {
  emptyLabel: 'Seleccionar',
  searchPlaceholder: 'Buscar...',
  noResultsLabel: 'Sin resultados',
  block: true,
})

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const open = ref(false)
const query = ref('')
const searchEl = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
})

const selectedOptions = computed(() =>
  props.modelValue
    .map(v => props.options.find(o => o.value === v))
    .filter((o): o is UiMultiSelectOption => !!o))

function isSelected(value: string) {
  return props.modelValue.includes(value)
}

function toggle(value: string) {
  const next = isSelected(value)
    ? props.modelValue.filter(v => v !== value)
    : [...props.modelValue, value]
  emit('update:modelValue', next)
}

function clearAll() {
  emit('update:modelValue', [])
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) nextTick(() => searchEl.value?.focus())
}

function close() {
  open.value = false
  query.value = ''
}
</script>
