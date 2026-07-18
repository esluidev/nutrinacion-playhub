<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Clasificar alimentos</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-8">
        <!-- Tray of draggables — each card carries its accent tint -->
        <div class="flex flex-wrap gap-4 justify-center">
          <Draggable
            v-for="food in foods"
            :key="food.data"
            ref="draggableRefs"
            :data="food.data"
            :label="food.label"
            :color="food.color"
          >
            <span class="demo-drag-sprite"><component :is="food.sprite" v-bind="food.spriteProps" /></span>
          </Draggable>
        </div>

        <!-- Zones: Desayuno only accepts breakfast foods; Mi Plato accepts anything -->
        <div class="flex flex-wrap gap-5 justify-center w-full">
          <DropZone
            ref="zoneDesayuno"
            title="A la olla"
            color="blue"
            :accepts="['frijol', 'agua']"
            class="w-full max-w-[300px]"
            @drop="onDrop('A la olla', $event)"
            @reject="lastEvent = 'Rechazado: eso no va en la olla'"
          >
            <template #icon>
              <span class="demo-zone-icon"><PotSticker /></span>
            </template>
          </DropZone>
          <DropZone
            ref="zonePlato"
            title="Mi Plato"
            class="w-full max-w-[300px]"
            @drop="onDrop('Mi Plato', $event)"
          >
            <template #icon>
              <span class="demo-zone-icon"><FriedEggSticker /></span>
            </template>
          </DropZone>
        </div>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <UiButton variant="outline" size="sm" @click="resetAll">Reiniciar</UiButton>
      </div>
      <p class="text-sm text-gray-500 min-h-[20px]">{{ lastEvent || 'Arrastra un elemento a una zona. "A la olla" solo acepta frijol y agua.' }}</p>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        Draggable: data · @placed · @returned — DropZone: accepts · max · @drop · @reject · reset()
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { markRaw, type Component } from 'vue'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import DropZone from '~/primitives/DropZone/DropZone.vue'
import BeanSticker from '~/sprites/BeanSticker.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'
import EggSticker from '~/sprites/EggSticker.vue'
import FriedEggSticker from '~/sprites/FriedEggSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
import type { DraggableColor } from '~/primitives/Draggable/Draggable.types'
import type { DragPayload } from '~/primitives/dragdrop/registry'

const foods: { data: string, label: string, sprite: Component, spriteProps?: Record<string, unknown>, color: DraggableColor }[] = [
  { data: 'huevo', label: 'Huevo', sprite: markRaw(EggSticker), spriteProps: { body: '#f0c08e', outline: '#80522a' }, color: 'yellow' },
  { data: 'frijol', label: 'Frijol', sprite: markRaw(BeanSticker), spriteProps: { body: '#e63946', outline: '#b82838' }, color: 'red' },
  { data: 'agua', label: 'Agua', sprite: markRaw(WaterDropSticker), color: 'blue' },
  { data: 'mezcla', label: 'Mezcla', sprite: markRaw(BowlSticker), spriteProps: { filled: true }, color: 'green' },
]

const draggableRefs = ref<InstanceType<typeof Draggable>[]>([])
const zoneDesayuno = ref<InstanceType<typeof DropZone> | null>(null)
const zonePlato = ref<InstanceType<typeof DropZone> | null>(null)
const lastEvent = ref('')

function onDrop(zoneName: string, payload: DragPayload) {
  lastEvent.value = `"${payload.label}" colocado en ${zoneName}`
}

function resetAll() {
  zoneDesayuno.value?.reset()
  zonePlato.value?.reset()
  draggableRefs.value.forEach(d => d?.reset())
  lastEvent.value = ''
}
</script>

<style scoped>
.demo-drag-sprite {
  display: block;
  width: 52px;
  height: 52px;
}

.demo-zone-icon {
  display: block;
  width: 30px;
  height: 22px;
}
</style>
