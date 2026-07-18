<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-6">
        <Dice ref="diceRef" :key="color" :color="color" :size="160" :initial="5" @result="onResult" />
        <p v-if="lastResult !== null" class="text-sm font-bold" :style="{ color: 'var(--ink)' }">
          Salio el {{ lastResult }}
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="primary" size="sm" @click="roll">Rodar</UiButton>
        <UiButton v-for="n in 6" :key="n" variant="outline" size="sm" @click="diceRef?.setValue(n)">
          {{ n }}
        </UiButton>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</p>
        <div class="flex gap-2">
          <button v-for="c in colors" :key="c" :class="['chip', color === c ? 'chip-active' : 'chip-inactive']" @click="color = c">
            {{ c }}
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        roll() · setValue(n) · @result(value)
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Dice from '~/primitives/Dice/Dice.vue'
import type { DiceColor } from '~/primitives/Dice/Dice.types'

const diceRef = ref<InstanceType<typeof Dice> | null>(null)
const colors: DiceColor[] = ['ink', 'red', 'blue']
const color = ref<DiceColor>('ink')
const lastResult = ref<number | null>(null)

function roll() {
  lastResult.value = null
  diceRef.value?.roll()
}

function onResult(value: number) {
  lastResult.value = value
}
</script>
