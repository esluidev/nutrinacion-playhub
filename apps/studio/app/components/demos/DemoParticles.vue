<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Ambiente de cocina</h3>
        <span class="text-xs text-gray-400">Particles sobre el sprite del utensilio</span>
      </div>
      <div class="demo-stage flex-col gap-4" style="min-height: 280px; padding-top: 70px">
        <div class="relative">
          <Particles :key="kind" :kind="kind" :active="active" class="demo-particles" />
          <div style="width: 150px; height: 102px">
            <PanSticker v-if="kind === 'splatter'" />
            <PotSticker v-else :lid="kind === 'steam'" :lid-bouncing="kind === 'steam' && active" />
          </div>
        </div>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap gap-6">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</p>
          <div class="flex gap-2">
            <button v-for="k in kinds" :key="k" :class="['chip', kind === k ? 'chip-active' : 'chip-inactive']" @click="kind = k">
              {{ k }}
            </button>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activo</p>
          <div class="flex gap-2">
            <button :class="['chip', active ? 'chip-active' : 'chip-inactive']" @click="active = true">Sí</button>
            <button :class="['chip', !active ? 'chip-active' : 'chip-inactive']" @click="active = false">No</button>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        :kind (steam | splatter | bubbles) · :active
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Particles from '~/primitives/Particles/Particles.vue'
import type { ParticlesKind } from '~/primitives/Particles/Particles.types'
import PanSticker from '~/sprites/PanSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'

const kinds: ParticlesKind[] = ['steam', 'splatter', 'bubbles']
const kind = ref<ParticlesKind>('steam')
const active = ref(true)
</script>

<style scoped>
.demo-particles {
  position: absolute;
  bottom: 92px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
</style>
