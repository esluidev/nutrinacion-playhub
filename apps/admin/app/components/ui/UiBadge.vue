<template>
  <span :class="['badge', variantClass]">
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full', dotColor]" />
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'green' | 'blue' | 'red' | 'gray' | 'coral' | 'purple' | 'amber'
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'gray',
  dot: false,
})

const variantMap: Record<string, string> = {
  green: 'badge-green',
  blue: 'badge-blue',
  red: 'badge-red',
  gray: 'badge-gray',
  coral: 'badge-coral',
  purple: 'badge-purple',
  amber: 'badge-amber',
}

const dotColorMap: Record<string, string> = {
  green: 'bg-brand-primary-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  gray: 'bg-gray-400',
  coral: 'bg-brand-coral-500',
  purple: 'bg-brand-purple-500',
  amber: 'bg-amber-500',
}

const variantClass = computed(() => variantMap[props.variant])
const dotColor = computed(() => dotColorMap[props.variant])
</script>
