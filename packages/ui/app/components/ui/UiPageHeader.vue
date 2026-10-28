<template>
  <header class="ui-page-header">
    <div class="min-w-0">
      <p v-if="eyebrow" class="eyebrow mb-2">{{ eyebrow }}</p>
      <h1 class="ui-heading">{{ title }}</h1>
      <p v-if="description" class="ui-text mt-1.5">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="ui-page-header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  eyebrow?: string
}>()
</script>
