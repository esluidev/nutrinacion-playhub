<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-4">
        <PoseGuide :key="`${moveKey}-${variant}-${age}`" :frames="currentMove.frames" :interval="currentMove.interval" :playing="playing" :variant="variant" :age="age" :size="200" />
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="primary" size="sm" @click="playing = !playing">{{ playing ? 'Detener' : 'Reproducir' }}</UiButton>
      </div>
      <div class="flex flex-wrap gap-6">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Movimiento</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(m, key) in MOVES"
              :key="key"
              :class="['chip', moveKey === key ? 'chip-active' : 'chip-inactive']"
              @click="moveKey = key"
            >
              {{ m.label }}
            </button>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Variante</p>
          <div class="flex gap-2">
            <button :class="['chip', variant === 'boy' ? 'chip-active' : 'chip-inactive']" @click="variant = 'boy'">Niño</button>
            <button :class="['chip', variant === 'girl' ? 'chip-active' : 'chip-inactive']" @click="variant = 'girl'">Niña</button>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Edad</p>
          <div class="flex gap-2">
            <button :class="['chip', age === 'kid' ? 'chip-active' : 'chip-inactive']" @click="age = 'kid'">Infantil</button>
            <button :class="['chip', age === 'teen' ? 'chip-active' : 'chip-inactive']" @click="age = 'teen'">Mayor</button>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        :frames · :interval · :playing · play() · pause() · reset() · @step(index)
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import type { PoseFrame } from '~/primitives/PoseGuide/PoseGuide.types'
import type { KidAge, KidVariant } from '~/sprites/kid-poses'

const MOVES: Record<string, { label: string, interval: number, frames: PoseFrame[] }> = {
  march: {
    label: 'Marchar',
    interval: 640,
    frames: [{ pose: 'march' }, { pose: 'stand' }, { pose: 'march', mirror: true }, { pose: 'stand' }],
  },
  kneeUp: {
    label: 'Rodillas arriba',
    interval: 420,
    frames: [{ pose: 'knee-up' }, { pose: 'stand' }, { pose: 'knee-up', mirror: true }, { pose: 'stand' }],
  },
  jump: {
    label: 'Saltitos',
    interval: 380,
    frames: [{ pose: 'squat' }, { pose: 'jump' }, { pose: 'stand' }],
  },
  sideStep: {
    label: 'Pasos laterales',
    interval: 460,
    frames: [{ pose: 'side-step' }, { pose: 'stand' }, { pose: 'side-step', mirror: true }, { pose: 'stand' }],
  },
  stretch: {
    label: 'Estirar',
    interval: 1000,
    frames: [{ pose: 'stretch-up' }, { pose: 'stand' }],
  },
}

const moveKey = ref<string>('march')
const playing = ref(false)
const variant = ref<KidVariant>('boy')
const age = ref<KidAge>('kid')

const currentMove = computed(() => MOVES[moveKey.value] ?? MOVES.march!)
</script>
