<template>
  <div class="flex flex-wrap items-center gap-1.5" role="group">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      :class="['filter', size === 'sm' && 'filter-sm']"
      :aria-pressed="modelValue === item.value"
      @click="$emit('update:modelValue', item.value)"
    >
      <slot name="icon" :item="item" />
      {{ item.label }}
      <span v-if="item.count !== undefined" class="filter-count">{{ item.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// Filtros de una sola elección («Todos · Activos · Archivados»).
interface ChipItem {
  value: string
  label: string
  count?: number
}

// Filtros en relieve. `md` (por defecto) mide lo mismo que botones y campos para alinearse en una barra.
withDefaults(defineProps<{
  items: ChipItem[]
  modelValue: string
  size?: 'sm' | 'md'
}>(), { size: 'md' })

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
