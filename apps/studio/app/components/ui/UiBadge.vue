<template>
  <span :class="['badge', variantClass]">
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full mr-1', dotColor]" />
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'green' | 'blue' | 'red' | 'gray' | 'coral' | 'purple' | 'yellow' | 'teal'
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
  yellow: 'badge-yellow',
  teal: 'badge-teal',
}

const dotColorMap: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  gray: 'bg-gray-400',
  coral: 'bg-brand-coral-500',
  purple: 'bg-brand-purple-500',
  yellow: 'bg-yellow-500',
  teal: 'bg-teal-500',
}

const variantClass = computed(() => variantMap[props.variant])
const dotColor = computed(() => dotColorMap[props.variant])
</script>
