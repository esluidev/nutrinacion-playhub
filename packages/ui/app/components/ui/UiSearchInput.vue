<template>
  <label :class="['search-box', widthClass]">
    <UiIcon name="search" />
    <span class="sr-only">{{ placeholder ?? labels.search }}</span>
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder ?? labels.search"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </label>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  maxWidth?: 'xs' | 'sm' | 'md' | 'full'
}>(), {
  maxWidth: 'sm',
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const labels = useUiLabels()
const WIDTH = { xs: 'w-full max-w-xs', sm: 'w-full max-w-sm', md: 'w-full max-w-md', full: 'w-full' }
const widthClass = computed(() => WIDTH[props.maxWidth])
</script>
