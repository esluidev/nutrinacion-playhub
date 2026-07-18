<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Flujo completo</h3>
        <span class="text-xs text-gray-400">Renderizada sobre el canvas StoryPlay</span>
      </div>
      <div class="demo-stage">
        <Glucometer
          ref="glucoRef"
          :patients="patients"
          @measure="onMeasure"
          @complete="lastEvent = '¡Todos los pacientes medidos!'"
        />
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <UiButton variant="primary" size="sm" @click="glucoRef?.next()">Siguiente paciente</UiButton>
        <UiButton variant="outline" size="sm" @click="glucoRef?.reset(); lastEvent = ''">Reiniciar todo</UiButton>
      </div>
      <p class="text-sm text-gray-500 min-h-[20px]">{{ lastEvent || 'Selecciona un paciente y presiona Medir: tira → gota de sangre → vuelo a la tira → medicion → resultado con color por rango.' }}</p>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        selectPatient(id) · measure() · next() · reset() · @measure(value, zoneKey, patient) · @complete
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import Glucometer from '~/primitives/Glucometer/Glucometer.vue'
import type { GlucometerPatient, GlucoZoneKey } from '~/primitives/Glucometer/Glucometer.types'

const patients: GlucometerPatient[] = [
  { id: 'ana', name: 'Ana', age: 7, avatar: '👧', glucose: 95 },
  { id: 'leo', name: 'Leo', age: 6, avatar: '👦', glucose: 62 },
  { id: 'sofia', name: 'Sofia', age: 8, avatar: '👧🏽', glucose: 158 },
  { id: 'mateo', name: 'Mateo', age: 7, avatar: '👦🏻', glucose: 210 },
]

const ZONE_LABELS: Record<GlucoZoneKey, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Muy alta',
}

const glucoRef = ref<InstanceType<typeof Glucometer> | null>(null)
const lastEvent = ref('')

function onMeasure(value: number, zoneKey: GlucoZoneKey, patient: GlucometerPatient) {
  lastEvent.value = `${patient.name}: ${value} mg/dL — ${ZONE_LABELS[zoneKey]}`
}
</script>
