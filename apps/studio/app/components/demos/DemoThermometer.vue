<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Medir temperatura</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage flex-col gap-8">
        <Thermometer ref="thermRef" :variant="variant" @measure="onMeasure" />

        <div class="flex flex-wrap gap-4 justify-center">
          <Draggable
            v-for="item in items"
            :key="item.data"
            ref="draggableRefs"
            :data="item.data"
            :label="item.label"
            :emoji="item.emoji"
            :color="item.color"
            :meta="{ temp: item.temp }"
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
      <p class="text-sm text-gray-500 min-h-[20px]">{{ lastEvent || 'Arrastra un paciente y presiona Medir: 2s de conteo y la columna se llena con el color de la zona (hipotermia → muy alta).' }}</p>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        measure() · reset() · @measure(tempC, zoneKey) — meta: { temp } en °C · zonas configurables via props
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Thermometer from '~/primitives/Thermometer/Thermometer.vue'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import type { ThermometerVariant, ThermometerZoneKey } from '~/primitives/Thermometer/Thermometer.types'
import type { DraggableColor } from '~/primitives/Draggable/Draggable.types'

const items: { data: string; label: string; emoji: string; color: DraggableColor; temp: number }[] = [
  { data: 'sano', label: 'Sano', emoji: '😊', color: 'green', temp: 36.8 },
  { data: 'febricula', label: 'Febricula', emoji: '😐', color: 'yellow', temp: 37.8 },
  { data: 'fiebre', label: 'Con fiebre', emoji: '🤒', color: 'red', temp: 39.2 },
  { data: 'fiebre-alta', label: 'Muy alta', emoji: '🥵', color: 'red', temp: 40.5 },
  { data: 'frio', label: 'Hipotermia', emoji: '🥶', color: 'blue', temp: 34.5 },
]

const thermRef = ref<InstanceType<typeof Thermometer> | null>(null)
const draggableRefs = ref<InstanceType<typeof Draggable>[]>([])
const variants: ThermometerVariant[] = ['default', 'paper']
const variant = ref<ThermometerVariant>('default')
const lastEvent = ref('')

const ZONE_LABELS: Record<ThermometerZoneKey, string> = {
  cold: 'Hipotermia',
  normal: 'Normal',
  warm: 'Febricula',
  hot: 'Fiebre alta',
  critical: 'Muy alta',
}

function onMeasure(tempC: number, zoneKey: ThermometerZoneKey) {
  lastEvent.value = `Temperatura: ${tempC.toFixed(1)} °C — ${ZONE_LABELS[zoneKey]}`
}

function resetAll() {
  thermRef.value?.reset()
  draggableRefs.value.forEach(d => d?.reset())
  lastEvent.value = ''
}
</script>
