<template>
  <div class="flex items-center gap-2.5">
    <div class="w-9 h-9 rounded-lg bg-brand-purple flex items-center justify-center">
      <span class="text-white font-display font-bold text-lg leading-none">S</span>
    </div>
    <span v-if="showText" class="font-display font-bold text-lg text-gray-900">
      StoryPlay Studio
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showText?: boolean
}

withDefaults(defineProps<Props>(), {
  showText: true,
})
</script>
