<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <button
      v-for="item in items"
      :key="item.value"
      :class="[
        'inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap',
        modelValue === item.value
          ? (item.activeClass || 'bg-brand-dark text-white shadow-sm')
          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700',
      ]"
      @click="$emit('update:modelValue', item.value)"
    >
      <slot name="icon" :item="item" />
      {{ item.label }}
      <span
        v-if="item.count !== undefined"
        :class="[
          'px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
          modelValue === item.value ? 'bg-white/20' : 'bg-gray-200/60',
        ]"
      >
        {{ item.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface ChipItem {
  value: string
  label: string
  count?: number
  activeClass?: string
}

defineProps<{
  items: ChipItem[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
