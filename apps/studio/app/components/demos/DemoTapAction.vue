<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Cascar el huevo</h3>
        <span class="text-xs text-gray-400">TapAction (primitiva) + EggSticker (sprite con grietas)</span>
      </div>
      <div class="demo-stage flex-col gap-4">
        <TapAction ref="tapRef" :key="resetKey" :taps="3" @tap="cracks = $event" @complete="done = true">
          <div style="width: 96px; height: 124px">
            <EggSticker body="#f0c08e" outline="#80522a" :cracks="cracks" />
          </div>
        </TapAction>
        <p class="text-sm font-bold" :style="{ color: done ? 'var(--accent-green-dark)' : 'var(--ink-soft)' }">
          {{ done ? '¡Cascado!' : `Toca el huevo (${cracks}/3)` }}
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="outline" size="sm" @click="resetKey++; cracks = 0; done = false">Reiniciar</UiButton>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        :taps · slot con {count, remaining} · reset() · @tap(count) · @complete
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import TapAction from '~/primitives/TapAction/TapAction.vue'
import EggSticker from '~/sprites/EggSticker.vue'

const tapRef = ref<InstanceType<typeof TapAction> | null>(null)
const resetKey = ref(0)
const cracks = ref(0)
const done = ref(false)
</script>
