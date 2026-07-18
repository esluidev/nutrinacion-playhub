<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage">
        <ProgressBar ref="barRef" :color="color" :size="size" :initial="0.4" class="w-full" />
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton v-for="v in [0, 0.25, 0.5, 0.75, 1]" :key="v" variant="outline" size="sm" @click="barRef?.setProgress(v)">
          {{ Math.round(v * 100) }}%
        </UiButton>
        <UiButton variant="primary" size="sm" @click="barRef?.animate(0, 1, 1500)">Animar 0 → 100</UiButton>
      </div>
      <div class="flex flex-wrap gap-6">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</p>
          <div class="flex gap-2">
            <button v-for="c in colors" :key="c" :class="['chip', color === c ? 'chip-active' : 'chip-inactive']" @click="color = c">
              {{ c }}
            </button>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tamanio</p>
          <div class="flex gap-2">
            <button v-for="s in sizes" :key="s" :class="['chip', size === s ? 'chip-active' : 'chip-inactive']" @click="size = s">
              {{ s }}
            </button>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        setProgress(0..1) · animate(from, to, duration)
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import ProgressBar from '~/primitives/ProgressBar/ProgressBar.vue'
import type { ProgressBarColor, ProgressBarSize } from '~/primitives/ProgressBar/ProgressBar.types'

const barRef = ref<InstanceType<typeof ProgressBar> | null>(null)
const colors: ProgressBarColor[] = ['green', 'red', 'blue', 'yellow']
const sizes: ProgressBarSize[] = ['sm', 'md', 'lg']
const color = ref<ProgressBarColor>('green')
const size = ref<ProgressBarSize>('md')
</script>
