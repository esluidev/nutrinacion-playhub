<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Toca las frutas</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage">
        <TapField
          ref="fieldRef"
          title="Toca solo las frutas"
          :targets="targets"
          :columns="4"
          @hit="hits++"
          @miss="misses++"
          @complete="completed = true"
        />
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <UiButton variant="primary" size="sm" @click="fieldRef?.shuffle()">Mezclar</UiButton>
        <UiButton variant="outline" size="sm" @click="resetAll">Reiniciar</UiButton>
      </div>
      <p class="text-sm text-gray-500">
        Aciertos: <span class="font-bold text-brand-dark">{{ hits }}</span> ·
        Errores: <span class="font-bold text-brand-dark">{{ misses }}</span>
        <span v-if="completed" class="ml-2 font-bold text-brand-primary-600">¡Completado!</span>
      </p>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        shuffle() · reset() · @hit(target) · @miss(target) · @complete
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import BeanSticker from '~/sprites/BeanSticker.vue'
import BoiledEggSticker from '~/sprites/BoiledEggSticker.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'
import EggSticker from '~/sprites/EggSticker.vue'
import FriedEggSticker from '~/sprites/FriedEggSticker.vue'
import PanSticker from '~/sprites/PanSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'
import ScrambledSticker from '~/sprites/ScrambledSticker.vue'
import TapField from '~/primitives/TapField/TapField.vue'
import type { TapTarget } from '~/primitives/TapField/TapField.types'

const targets: TapTarget[] = [
  { id: 'huevo', label: 'Huevo', sprite: markRaw(EggSticker), spriteProps: { body: '#f0c08e', outline: '#80522a' }, correct: true, color: 'yellow' },
  { id: 'olla', label: 'Olla', sprite: markRaw(PotSticker), correct: false, color: 'blue' },
  { id: 'frijol', label: 'Frijol', sprite: markRaw(BeanSticker), spriteProps: { body: '#e63946', outline: '#b82838' }, correct: true, color: 'red' },
  { id: 'sarten', label: 'Sarten', sprite: markRaw(PanSticker), correct: false, color: 'red' },
  { id: 'cocido', label: 'Huevo cocido', sprite: markRaw(BoiledEggSticker), correct: true, color: 'green' },
  { id: 'tazon', label: 'Tazon', sprite: markRaw(BowlSticker), correct: false, color: 'green' },
  { id: 'revuelto', label: 'Revuelto', sprite: markRaw(ScrambledSticker), correct: true, color: 'yellow' },
  { id: 'frito', label: 'Sarten con huevo', sprite: markRaw(FriedEggSticker), correct: true, color: 'blue' },
]

const fieldRef = ref<InstanceType<typeof TapField> | null>(null)
const hits = ref(0)
const misses = ref(0)
const completed = ref(false)

function resetAll() {
  fieldRef.value?.reset()
  hits.value = 0
  misses.value = 0
  completed.value = false
}
</script>
