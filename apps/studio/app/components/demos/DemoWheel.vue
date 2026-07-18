<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-6">
        <Wheel
          ref="wheelRef"
          :key="sectors"
          :sectors="sectors"
          :colors="colorsFor(sectors)"
          :size="300"
          @land="onLand"
          @tick="Sounds.play('tick')"
        />
        <button class="sp-action-btn" :disabled="spinning" @click="spin">GIRAR</button>
        <p v-if="lastResult !== null" class="text-sm font-bold" :style="{ color: 'var(--ink)' }">
          Cayo en el sector {{ lastResult + 1 }}
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sectores</p>
        <div class="flex gap-2">
          <button v-for="n in [4, 6, 8]" :key="n" :class="['chip', sectors === n ? 'chip-active' : 'chip-inactive']" @click="changeSectors(n)">
            {{ n }}
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        spin() · reset() · @land(sectorIndex) · @tick(count)
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Wheel from '~/primitives/Wheel/Wheel.vue'
import { Sounds } from '~/primitives/sounds'

const wheelRef = ref<InstanceType<typeof Wheel> | null>(null)
const sectors = ref(4)
const spinning = ref(false)
const lastResult = ref<number | null>(null)

const BASE_COLORS = [
  'var(--accent-red)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-yellow)',
]

function colorsFor(n: number): string[] {
  if (n === 6) return [...BASE_COLORS, 'var(--brand-primary)', 'var(--ink)']
  if (n === 8) return ['var(--accent-blue)', 'var(--accent-yellow)']
  return BASE_COLORS
}

function spin() {
  if (spinning.value) return
  spinning.value = true
  lastResult.value = null
  wheelRef.value?.spin()
}

function onLand(sectorIndex: number) {
  spinning.value = false
  lastResult.value = sectorIndex
}

function changeSectors(n: number) {
  sectors.value = n
  spinning.value = false
  lastResult.value = null
}
</script>

<style scoped>
/* Primary action button in game style (GIRAR from ruleta v2) */
.sp-action-btn {
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 2px;
  color: #fff;
  background: var(--accent-green);
  border: 3px solid var(--ink);
  border-radius: 20px;
  padding: 10px 44px;
  cursor: pointer;
  box-shadow: 0 3px var(--ink);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.sp-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px var(--ink);
}

.sp-action-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px var(--ink);
}

.sp-action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
