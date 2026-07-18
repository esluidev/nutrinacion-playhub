<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage">
        <ScoreCounter ref="scoreRef" :key="variant" :variant="variant" :initial="125" label="PUNTOS" />
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="primary" size="sm" @click="scoreRef?.add(10)">+10</UiButton>
        <UiButton variant="primary" size="sm" @click="scoreRef?.add(50)">+50</UiButton>
        <UiButton variant="danger" size="sm" @click="scoreRef?.subtract(25)">-25</UiButton>
        <UiButton variant="outline" size="sm" @click="scoreRef?.reset()">Reiniciar</UiButton>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Variante</p>
        <div class="flex gap-2">
          <button v-for="v in variants" :key="v" :class="['chip', variant === v ? 'chip-active' : 'chip-inactive']" @click="variant = v">
            {{ v }}
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        add(n) · subtract(n) · set(target, animate?) · reset()
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import ScoreCounter from '~/primitives/ScoreCounter/ScoreCounter.vue'
import type { ScoreCounterVariant } from '~/primitives/ScoreCounter/ScoreCounter.types'

const scoreRef = ref<InstanceType<typeof ScoreCounter> | null>(null)
const variants: ScoreCounterVariant[] = ['default', 'ink', 'red', 'blue']
const variant = ref<ScoreCounterVariant>('default')
</script>
