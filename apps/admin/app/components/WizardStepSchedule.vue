<template>
  <div class="card p-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
      <div class="sm:col-span-2">
        <UiInput
          id="wizard-title"
          v-model="state.title"
          label="Título del taller"
          placeholder="Ej: Los Frijoles"
          required
        />
      </div>

      <UiInput
        id="wizard-date"
        v-model="state.date"
        label="Fecha"
        type="date"
        :hint="hasPreselectedDate ? 'Fecha pre-seleccionada desde el planificador.' : undefined"
        required
      />
      <UiInput
        id="wizard-time-start"
        :model-value="state.timeStart"
        label="Hora de inicio"
        type="time"
        :hint="duracionHint"
        required
        @update:model-value="onTimeStartChange($event)"
      />

      <UiInput
        id="wizard-location"
        v-model="state.location"
        label="Ubicación"
        placeholder="Aula, salón o centro comunitario"
      />
      <UiInput
        id="wizard-capacity"
        v-model="state.capacity"
        label="Capacidad"
        type="number"
        placeholder="25"
      />

      <div class="sm:col-span-2 space-y-[7px]">
        <label class="block text-[13px] font-bold text-gray-700">Notas <span class="text-gray-400 font-semibold">(opcional)</span></label>
        <textarea
          v-model="state.notes"
          placeholder="Materiales, recordatorios o indicaciones para el educador"
          class="input !h-auto min-h-[76px] py-3 resize-y"
        />
      </div>
    </div>

    <!-- Modalidad -->
    <div class="mt-[22px]">
      <p class="text-[13px] font-bold text-gray-700 mb-2">Modalidad</p>
      <div class="flex gap-2">
        <button
          v-for="mod in modalidades"
          :key="mod.value"
          :class="[
            'h-[38px] px-[18px] rounded-[10px] text-[13px] font-bold border-[1.5px] transition-all duration-150',
            state.modalidad === mod.value
              ? 'bg-brand-primary-50 text-brand-primary-800 border-brand-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary-200',
          ]"
          @click="state.modalidad = mod.value"
        >
          {{ mod.label }}
        </button>
      </div>
      <p class="text-[11.5px] text-gray-400 font-semibold mt-[7px]">{{ modalidadDesc }}</p>
    </div>

    <!-- Estado del taller -->
    <div class="mt-[22px]">
      <p class="text-[13px] font-bold text-gray-700 mb-2">Estado del taller</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          v-for="es in estados"
          :key="es.value"
          :class="[
            'rounded-[14px] px-4 py-[15px] border-[1.5px] text-left transition-all duration-150',
            state.estado === es.value
              ? 'bg-brand-primary-50 border-brand-primary'
              : 'bg-white border-gray-200 hover:border-brand-primary-200',
          ]"
          @click="state.estado = es.value"
        >
          <div class="flex items-center gap-[9px] mb-[5px]">
            <div
              :class="[
                'w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors',
                state.estado === es.value ? 'border-brand-primary' : 'border-[#dfe3e0]',
              ]"
            >
              <div :class="['w-2.5 h-2.5 rounded-full', state.estado === es.value ? 'bg-brand-primary' : 'bg-transparent']" />
            </div>
            <p class="text-sm font-extrabold text-gray-800">{{ es.label }}</p>
            <span class="font-mono text-[10px] font-semibold text-gray-600 bg-gray-100 rounded-[5px] px-[7px] py-0.5">{{ es.value }}</span>
          </div>
          <p class="text-[12.5px] text-gray-500 font-semibold leading-normal ml-[29px]">{{ es.desc }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WizardEstado, WizardModalidad } from '~/composables/useWorkshopWizard'

const { state, selectedStoryboard, hasPreselectedDate, onTimeStartChange } = useWorkshopWizard()

const duracionHint = computed(() =>
  selectedStoryboard.value
    ? `La hora de fin se calcula con la duración del storyboard (${selectedStoryboard.value.duration}).`
    : undefined,
)

const modalidades: { value: WizardModalidad, label: string }[] = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ASIGNADO', label: 'Asignado' },
]

const modalidadDesc = computed(() =>
  state.value.modalidad === 'PRESENCIAL'
    ? 'El educador imparte el taller en vivo frente a su audiencia.'
    : 'El taller se asigna para que el educador lo ejecute por su cuenta.',
)

const estados: { value: WizardEstado, label: string, desc: string }[] = [
  { value: 'BORRADOR', label: 'Borrador', desc: 'Se guarda sin publicarse: los educadores aún no lo ven y puedes completarlo después.' },
  { value: 'PROGRAMADO', label: 'Programado', desc: 'Queda agendado: los educadores asignados lo verán en su app de StoryPlay.' },
]
</script>
