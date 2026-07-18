<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-5">
        <Glass :level="level" />
        <p v-if="level >= 1" class="text-sm font-bold" :style="{ color: 'var(--accent-green-dark)' }">
          ¡Vaso lleno!
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="primary" size="sm" @click="level = Math.min(1, level + 0.2)">Agregar sorbo (+0.2)</UiButton>
        <UiButton variant="outline" size="sm" @click="level = 0">Vaciar</UiButton>
        <span class="text-sm text-gray-500 ml-2">level: {{ level.toFixed(1) }}</span>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        :level (0-1) · maxFill · --glass-water (color tematizable)
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Glass from '~/primitives/Glass/Glass.vue'

const level = ref(0.4)
</script>
