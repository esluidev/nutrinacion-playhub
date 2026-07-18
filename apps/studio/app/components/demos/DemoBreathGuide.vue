<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-5" style="min-height: 420px">
        <BreathGuide
          ref="breathRef"
          :key="cycles"
          :cycles="cycles"
          label-in="Inhala"
          label-out="Exhala"
          @done="finished = true"
        />
        <p v-if="finished" class="text-sm font-bold" :style="{ color: 'var(--accent-green-dark)' }">
          ¡Respiración completada!
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="primary" size="sm" @click="breathRef?.start()">Iniciar</UiButton>
        <UiButton variant="outline" size="sm" @click="breathRef?.reset(); finished = false">Reiniciar</UiButton>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ciclos</p>
        <div class="flex gap-2">
          <button v-for="n in [2, 3, 5]" :key="n" :class="['chip', cycles === n ? 'chip-active' : 'chip-inactive']" @click="cycles = n; finished = false">
            {{ n }}
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        start() · reset() · @phase(in|out) · @cycle(n) · @done
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import BreathGuide from '~/primitives/BreathGuide/BreathGuide.vue'

const breathRef = ref<InstanceType<typeof BreathGuide> | null>(null)
const cycles = ref(3)
const finished = ref(false)
</script>
