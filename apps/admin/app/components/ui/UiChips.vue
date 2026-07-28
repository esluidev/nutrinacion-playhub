<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <button
      v-for="item in items"
      :key="item.value"
      :class="[
        'inline-flex items-center gap-1.5 px-[15px] h-9 rounded-full text-[12.5px] font-bold transition-all duration-150 cursor-pointer whitespace-nowrap',
        modelValue === item.value
          ? (item.activeClass || 'bg-brand-dark text-white')
          : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-primary-200 hover:text-gray-800',
      ]"
      @click="$emit('update:modelValue', item.value)"
    >
      <slot name="icon" :item="item" />
      {{ item.label }}
      <span
        v-if="item.count !== undefined"
        :class="[
          'px-[7px] py-0.5 rounded-full text-[10.5px] font-extrabold leading-none',
          modelValue === item.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
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
