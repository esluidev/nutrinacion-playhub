<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-5">
        <ExerciseTimer
          ref="timerRef"
          :key="`${duration}-${withBeat}-${color}`"
          :duration="duration"
          :beat-ms="withBeat ? 600 : undefined"
          :color="color"
          @done="finished = true"
        />
        <p v-if="finished" class="text-sm font-bold" :style="{ color: 'var(--accent-green-dark)' }">
          ¡Tiempo completado!
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="primary" size="sm" @click="timerRef?.start()">Iniciar</UiButton>
        <UiButton variant="outline" size="sm" @click="timerRef?.reset(); finished = false">Reiniciar</UiButton>
      </div>
      <div class="flex flex-wrap gap-6">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duración</p>
          <div class="flex gap-2">
            <button v-for="n in [5, 10, 20]" :key="n" :class="['chip', duration === n ? 'chip-active' : 'chip-inactive']" @click="duration = n; finished = false">
              {{ n }}s
            </button>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Beat (ritmo)</p>
          <div class="flex gap-2">
            <button :class="['chip', withBeat ? 'chip-active' : 'chip-inactive']" @click="withBeat = true; finished = false">Con beat</button>
            <button :class="['chip', !withBeat ? 'chip-active' : 'chip-inactive']" @click="withBeat = false; finished = false">Silencioso</button>
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
        start() · stop() · reset() · @second(left) · @beat(n) · @done
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import ExerciseTimer from '~/primitives/ExerciseTimer/ExerciseTimer.vue'
import type { ExerciseTimerColor } from '~/primitives/ExerciseTimer/ExerciseTimer.types'

const timerRef = ref<InstanceType<typeof ExerciseTimer> | null>(null)
const colors: ExerciseTimerColor[] = ['green', 'red', 'blue', 'yellow']
const color = ref<ExerciseTimerColor>('green')
const duration = ref(10)
const withBeat = ref(true)
const finished = ref(false)
</script>
