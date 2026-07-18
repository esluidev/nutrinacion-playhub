<template>
  <div :class="['card', hover ? 'card-hover' : '']">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-100">
      <slot name="header" />
    </div>

    <div :class="padding ? 'p-6' : ''">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hover?: boolean
  padding?: boolean
}

withDefaults(defineProps<Props>(), {
  hover: true,
  padding: true,
})
</script>
