<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Medir alturas</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-8">
        <Ruler ref="rulerRef" :variant="variant" @measure="onMeasure" />

        <div class="flex flex-wrap gap-4 justify-center">
          <Draggable
            v-for="item in items"
            :key="item.data"
            ref="draggableRefs"
            :data="item.data"
            :label="item.label"
            :emoji="item.emoji"
            :color="item.color"
            :meta="{ height: item.height }"
          />
        </div>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UiButton variant="outline" size="sm" @click="resetAll">Reiniciar</UiButton>
      </div>
      <div class="flex flex-wrap gap-6 mb-3">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Variante</p>
          <div class="flex gap-2">
            <button v-for="v in variants" :key="v" :class="['chip', variant === v ? 'chip-active' : 'chip-inactive']" @click="variant = v">
              {{ v }}
            </button>
          </div>
        </div>
      </div>
      <p class="text-sm text-gray-500 min-h-[20px]">{{ lastEvent || 'Arrastra un personaje a la zona: crece desde el piso hasta su altura real y el marcador la senala en la regla. Uno a la vez.' }}</p>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        setUnit(u) · reset() · getHeight(u?) · @measure(heightCm, unit) — meta: { height } en cm
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Ruler from '~/primitives/Ruler/Ruler.vue'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import type { RulerUnit, RulerVariant } from '~/primitives/Ruler/Ruler.types'
import type { DraggableColor } from '~/primitives/Draggable/Draggable.types'

const items: { data: string; label: string; emoji: string; color: DraggableColor; height: number }[] = [
  { data: 'nino', label: 'Nino', emoji: '🧒', color: 'green', height: 120 },
  { data: 'adulto', label: 'Adulto', emoji: '🧑', color: 'blue', height: 175 },
  { data: 'bebe', label: 'Bebe', emoji: '👶', color: 'yellow', height: 60 },
  { data: 'perro', label: 'Perro', emoji: '🐕', color: 'red', height: 45 },
]

const rulerRef = ref<InstanceType<typeof Ruler> | null>(null)
const draggableRefs = ref<InstanceType<typeof Draggable>[]>([])
const variants: RulerVariant[] = ['default', 'paper']
const variant = ref<RulerVariant>('default')
const lastEvent = ref('')

function onMeasure(heightCm: number, unit: RulerUnit) {
  lastEvent.value = `Altura medida: ${heightCm} cm (mostrada en ${unit})`
}

function resetAll() {
  rulerRef.value?.reset()
  draggableRefs.value.forEach(d => d?.reset())
  lastEvent.value = ''
}
</script>
