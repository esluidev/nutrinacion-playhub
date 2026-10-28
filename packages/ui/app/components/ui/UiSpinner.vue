<template>
  <span class="spinner" role="status" :aria-label="label ?? labels.loading" />
</template>

<script setup lang="ts">
defineProps<{ label?: string }>()
const labels = useUiLabels()
</script>
