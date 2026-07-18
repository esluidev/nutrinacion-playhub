<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Mezclar en el tazón</h3>
        <span class="text-xs text-gray-400">Stir sobre BowlSticker (sprite)</span>
      </div>
      <div class="demo-stage flex-col gap-4" style="min-height: 260px; padding-top: 60px">
        <div class="relative">
          <Stir :active="active" class="demo-stir" />
          <div style="width: 170px; height: 116px">
            <BowlSticker filled />
          </div>
        </div>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex gap-2">
        <button :class="['chip', active ? 'chip-active' : 'chip-inactive']" @click="active = true">Mezclando</button>
        <button :class="['chip', !active ? 'chip-active' : 'chip-inactive']" @click="active = false">Quieta</button>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        :active — se superpone a cualquier utensilio mientras algo se revuelve
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Stir from '~/primitives/Stir/Stir.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'

const active = ref(true)
</script>

<style scoped>
.demo-stir {
  position: absolute;
  bottom: 58px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
</style>
