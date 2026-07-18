<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Preparar una tortilla (validate)</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-5">
        <ReorderList
          ref="listRef"
          :items="steps"
          :correct-order="correctOrder"
          mode="validate"
          color="yellow"
          shuffled
          @complete="completed = true"
          @reorder="completed = false"
        />
        <p v-if="completed" class="text-sm font-bold" :style="{ color: 'var(--accent-green-dark)' }">
          ¡Orden correcto!
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <UiButton variant="primary" size="sm" @click="listRef?.shuffle(); completed = false">Mezclar</UiButton>
        <UiButton variant="outline" size="sm" @click="listRef?.reset()">Orden correcto</UiButton>
      </div>
      <p class="text-sm text-gray-500">Arrastra las filas para ordenarlas. El numero de cada fila refleja su posicion actual; al lograr el orden correcto todas las filas celebran.</p>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        shuffle() · reset() · getOrder() · @reorder(order) · @complete — modos: readonly | freeform | validate
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import BeanSticker from '~/sprites/BeanSticker.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
import ReorderList from '~/primitives/ReorderList/ReorderList.vue'
import type { ReorderItem } from '~/primitives/ReorderList/ReorderList.types'

const steps: ReorderItem[] = [
  { id: 'escoger', label: 'Escoger los frijoles', sprite: markRaw(BeanSticker), spriteProps: { body: '#e63946', outline: '#b82838' } },
  { id: 'lavar', label: 'Lavarlos con agua', sprite: markRaw(WaterDropSticker) },
  { id: 'remojar', label: 'Remojarlos en el tazon', sprite: markRaw(BowlSticker) },
  { id: 'cocinar', label: 'Cocinarlos en la olla', sprite: markRaw(PotSticker), spriteProps: { lid: true } },
  { id: 'servir', label: 'Servirlos calientes', emoji: '🍽️' },
]

const correctOrder = steps.map(s => s.id)

const listRef = ref<InstanceType<typeof ReorderList> | null>(null)
const completed = ref(false)
</script>
