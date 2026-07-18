<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — La olla hirviendo (composición)</h3>
        <span class="text-xs text-gray-400">Stove (primitiva) + PotSticker (sprite) + Particles (efecto)</span>
      </div>
      <div class="demo-stage flex-col gap-4" style="min-height: 320px; padding-top: 90px">
        <div class="relative">
          <Particles v-if="cooking" kind="steam" class="demo-stove-steam" />
          <Stove
            ref="stoveRef"
            :ready="ready"
            :duration="6000"
            @ignite="cooking = true"
            @done="cooking = false; done = true"
          >
            <div style="width: 118px; height: 80px">
              <PotSticker lid :lid-bouncing="cooking" />
            </div>
          </Stove>
        </div>
        <p v-if="done" class="text-sm font-bold" :style="{ color: 'var(--accent-green-dark)' }">
          ¡Cocción terminada!
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="primary" size="sm" @click="stoveRef?.ignite()">Encender (ignite)</UiButton>
        <UiButton variant="outline" size="sm" @click="stoveRef?.reset(); cooking = false; done = false">Reiniciar</UiButton>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Perilla (ready)</p>
        <div class="flex gap-2">
          <button :class="['chip', ready ? 'chip-active' : 'chip-inactive']" @click="ready = true">Habilitada</button>
          <button :class="['chip', !ready ? 'chip-active' : 'chip-inactive']" @click="ready = false">Bloqueada</button>
        </div>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        slot (utensilio encima) · :ready · :duration · :silent · ignite() · reset() · @ignite · @done
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Particles from '~/primitives/Particles/Particles.vue'
import Stove from '~/primitives/Stove/Stove.vue'
import PotSticker from '~/sprites/PotSticker.vue'

const stoveRef = ref<InstanceType<typeof Stove> | null>(null)
const ready = ref(true)
const cooking = ref(false)
const done = ref(false)
</script>

<style scoped>
.demo-stove-steam {
  position: absolute;
  bottom: 118px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}
</style>
