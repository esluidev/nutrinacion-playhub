<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-5">
        <StepMeter ref="meterRef" :key="`${steps}-${color}`" :steps="steps" :color="color" class="w-full" @complete="completed = true" @change="completed = false" />
        <p v-if="completed" class="text-sm font-bold" :style="{ color: 'var(--accent-green-dark)' }">
          ¡Completado!
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="primary" size="sm" @click="meterRef?.next()">Siguiente paso</UiButton>
        <UiButton variant="outline" size="sm" @click="meterRef?.reset(); completed = false">Reiniciar</UiButton>
      </div>
      <div class="flex flex-wrap gap-6">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pasos</p>
          <div class="flex gap-2">
            <button v-for="n in [3, 5, 8]" :key="n" :class="['chip', steps === n ? 'chip-active' : 'chip-inactive']" @click="steps = n; completed = false">
              {{ n }}
            </button>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</p>
          <div class="flex gap-2">
            <button v-for="c in colors" :key="c" :class="['chip', color === c ? 'chip-active' : 'chip-inactive']" @click="color = c">
              {{ c }}
            </button>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        setStep(n) · next() · reset() · @change(step) · @complete
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import StepMeter from '~/primitives/StepMeter/StepMeter.vue'
import type { StepMeterColor } from '~/primitives/StepMeter/StepMeter.types'

const meterRef = ref<InstanceType<typeof StepMeter> | null>(null)
const colors: StepMeterColor[] = ['green', 'red', 'blue', 'yellow']
const color = ref<StepMeterColor>('green')
const steps = ref(5)
const completed = ref(false)
</script>
