<template>
  <div class="flex items-end justify-between gap-4 mb-7 flex-wrap">
    <div class="min-w-0">
      <h1 class="text-[26px] font-display font-semibold text-brand-dark tracking-[-0.01em] leading-[1.15]">
        {{ title }}
      </h1>
      <p v-if="description" class="text-sm text-[#7d8d81] mt-1.5">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2.5 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>
