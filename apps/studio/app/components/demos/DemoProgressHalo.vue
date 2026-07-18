<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage">
        <!-- El halo ENVUELVE un sprite: el arte viaja en el slot -->
        <ProgressHalo :progress="progress" :color="color">
          <span class="demo-halo-art"><WaterDropSticker /></span>
        </ProgressHalo>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton v-for="v in [0, 0.25, 0.5, 0.75, 1]" :key="v" variant="outline" size="sm" @click="progress = v">
          {{ Math.round(v * 100) }}%
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
        :progress="0..1" (declarativo) · slot default = el arte envuelto · contenido ~cuadrado para un círculo parejo
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import ProgressHalo from '~/primitives/ProgressHalo/ProgressHalo.vue'
import type { ProgressHaloColor } from '~/primitives/ProgressHalo/ProgressHalo.types'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'

const progress = ref(0.5)
const colors: ProgressHaloColor[] = ['green', 'red', 'blue', 'yellow']
const color = ref<ProgressHaloColor>('blue')
</script>

<style scoped>
.demo-halo-art {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
}

.demo-halo-art :deep(svg) {
  width: 68px;
  height: 80px;
}
</style>
