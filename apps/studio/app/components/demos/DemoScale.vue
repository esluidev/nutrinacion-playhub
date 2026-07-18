<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Pesar alimentos</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-8">
        <Scale ref="scaleRef" :variant="variant" @measure="onMeasure" />

        <div class="flex flex-wrap gap-4 justify-center">
          <Draggable
            v-for="item in items"
            :key="item.data"
            ref="draggableRefs"
            :data="item.data"
            :label="item.label"
            :emoji="item.emoji"
            :color="item.color"
            :meta="{ weight: item.weight }"
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
      <p class="text-sm text-gray-500 min-h-[20px]">{{ lastEvent || 'Arrastra alimentos al plato; el display anima al nuevo total. Cambia la unidad en vivo (kg / g / lb).' }}</p>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        setUnit(u) · reset() · getWeight(u?) · @measure(totalKg, unit) — meta: { weight } en kg
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Scale from '~/primitives/Scale/Scale.vue'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import type { ScaleUnit, ScaleVariant } from '~/primitives/Scale/Scale.types'
import type { DraggableColor } from '~/primitives/Draggable/Draggable.types'

const items: { data: string; label: string; emoji: string; color: DraggableColor; weight: number }[] = [
  { data: 'manzana', label: 'Manzana', emoji: '🍎', color: 'red', weight: 0.18 },
  { data: 'banano', label: 'Banano', emoji: '🍌', color: 'yellow', weight: 0.12 },
  { data: 'botella', label: 'Botella', emoji: '🍼', color: 'blue', weight: 1.5 },
  { data: 'huevo', label: 'Huevo', emoji: '🥚', color: 'yellow', weight: 0.06 },
  { data: 'mochila', label: 'Mochila', emoji: '🎒', color: 'green', weight: 4.2 },
]

const scaleRef = ref<InstanceType<typeof Scale> | null>(null)
const draggableRefs = ref<InstanceType<typeof Draggable>[]>([])
const variants: ScaleVariant[] = ['default', 'paper']
const variant = ref<ScaleVariant>('default')
const lastEvent = ref('')

function onMeasure(totalKg: number, unit: ScaleUnit) {
  lastEvent.value = `Peso total: ${totalKg.toFixed(2)} kg (mostrado en ${unit})`
}

function resetAll() {
  scaleRef.value?.reset()
  draggableRefs.value.forEach(d => d?.reset())
  lastEvent.value = ''
}
</script>
