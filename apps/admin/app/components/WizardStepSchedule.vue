<template>
  <div class="ui-panel p-6">
    <!-- Primero, si es parte de una jornada: suelto, una en curso o una nueva (se crea al guardar) -->
    <JornadaSelector
      id="wizard-jornada"
      v-model="state.jornada"
      :jornadas="jornadas"
      :fecha="state.date"
      class="mb-6 border-b border-line pb-6"
    />

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <UiInput
          id="wizard-title"
          v-model="state.title"
          :label="t('wizard.fTitle')"
          :placeholder="t('wizard.fTitlePh')"
          required
        />
      </div>

      <!-- Con una jornada nueva, la fecha vive entre sus días (min/max). Con una en curso, otro día
           se comprueba al salir del campo (o al seguir) y ofrece ampliarla. -->
      <UiInput
        id="wizard-date"
        v-model="state.date"
        :label="t('wizard.fDate')"
        type="date"
        :min="dateMin"
        :max="dateMax"
        :hint="dateHint"
        :error="dateFueraDeJornada ? t('wizard.fDateOutside') : undefined"
        required
        @focusout="alSalirDeFecha"
      />
      <UiInput
        id="wizard-time-start"
        :model-value="state.timeStart"
        :label="t('wizard.fStart')"
        type="time"
        :hint="duracionHint"
        required
        @update:model-value="onTimeStartChange($event)"
      />

      <!-- Suelto, el lugar. Dentro de una jornada, el lugar es el suyo (encima) y aquí va el detalle -->
      <div v-if="jornadaEfectiva" class="sm:col-span-2">
        <p class="mb-2 flex items-center gap-2 text-body font-semibold text-muted">
          <UiIcon name="map-pin" class="size-4 shrink-0 text-subtle" />
          {{ t('wizard.jornadaPlace') }}:
          <span class="font-extrabold text-ink">{{ jornadaEfectiva.ubicacion || '—' }}</span>
        </p>
        <UiInput
          id="wizard-location"
          v-model="state.location"
          :label="t('wizard.fLocationDetail')"
          :placeholder="t('wizard.fLocationDetailPh')"
          :hint="lugarEfectivo ? t('wizard.fLocationEffective', { lugar: lugarEfectivo }) : undefined"
          optional
        />
      </div>
      <UiInput
        v-else
        id="wizard-location"
        v-model="state.location"
        :label="t('wizard.fLocation')"
        :placeholder="t('wizard.fLocationPh')"
      />
      <UiInput
        id="wizard-group"
        v-model="state.group"
        :label="t('wizard.fGroup')"
        :placeholder="t('wizard.fGroupPh')"
        :hint="t('wizard.fGroupHint')"
      />
      <UiInput
        id="wizard-capacity"
        v-model="state.capacity"
        :label="t('wizard.fCapacity')"
        type="number"
        placeholder="25"
      />
      <UiSelect
        v-if="idiomas.length > 1"
        v-model="state.language"
        :options="idiomas"
        :label="t('wizard.fLanguage')"
      />
      <UiTextarea
        id="wizard-notes"
        v-model="state.notes"
        :label="t('wizard.fNotes')"
        optional
        :rows="3"
        :placeholder="t('wizard.fNotesPh')"
        class="sm:col-span-2"
      />
    </div>

    <!-- Modalidad: opción seleccionable, en cielo -->
    <div class="mt-6">
      <p class="field-label">{{ t('wizard.modality') }}</p>
      <div class="grid grid-cols-3 gap-3 sm:max-w-lg">
        <button
          v-for="mod in MODALIDADES"
          :key="mod"
          type="button"
          data-tone="sky"
          class="select-card items-start justify-start px-4 py-3 pr-10 text-left text-body font-extrabold text-ink"
          :aria-pressed="state.modalidad === mod"
          @click="state.modalidad = mod"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          {{ t(`workshops.modality.${mod}`) }}
        </button>
      </div>
      <p class="ui-caption mt-2">{{ t(`workshops.modalityDesc.${state.modalidad}`) }}</p>
    </div>

    <!-- Estado del taller: la selección en cielo; la etiqueta, con el tono de ese estado -->
    <div class="mt-6">
      <p class="field-label">{{ t('wizard.state') }}</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          v-for="es in estados"
          :key="es.value"
          type="button"
          data-tone="sky"
          class="select-card items-start justify-start gap-1.5 px-4 py-4 pr-10 text-left"
          :aria-pressed="state.estado === es.value"
          @click="state.estado = es.value"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          <span class="flex items-center gap-2">
            <span class="text-body font-extrabold text-ink">{{ t(`wizard.states.${es.value}`) }}</span>
            <UiBadge :tone="es.tone" class="font-mono">{{ es.value }}</UiBadge>
          </span>
          <span class="ui-caption">{{ t(`wizard.statesDesc.${es.value}`) }}</span>
        </button>
      </div>
    </div>

    <!-- Una fecha fuera de la jornada en curso elegida: ¿se amplía? Sí, se amplía al guardar el
         taller; no, se vuelve a la fecha anterior. -->
    <UiConfirmDialog
      :open="!!ampliarPendiente"
      :title="ampliarTitulo"
      tone="lime"
      symbol="calendar"
      :confirm-label="t('wizard.extendConfirm')"
      :cancel-label="t('wizard.extendKeep')"
      @update:open="(v) => { if (!v && ampliarPendiente) rechazarAmpliar() }"
      @confirm="confirmarAmpliar"
    >
      <p v-if="selectedJornada && ampliarPendiente">
        {{ t('wizard.extendText', {
          nombre: selectedJornada.nombre,
          dias: rangoJornada(selectedJornada, locale),
          nuevos: rangoJornada(ampliarPendiente, locale),
        }) }}
      </p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import { MODALIDADES } from '~/composables/useWorkshops'
import type { WizardEstado } from '~/composables/useWorkshopWizard'

const { t, locale } = useT()
const {
  state, selectedStoryboard, hasPreselectedDate, onTimeStartChange,
  jornadas, selectedJornada, jornadaEfectiva, lugarEfectivo, dateMin, dateMax, dateFueraDeJornada,
  ampliarPendiente, comprobarFecha, confirmarAmpliar, rechazarAmpliar,
} = useWorkshopWizard()

// Qué dice la fecha: entre qué días cae por su jornada (una en curso se puede ampliar), o que viene
// del planificador.
const dateHint = computed(() => {
  const j = jornadaEfectiva.value
  if (j?.fecha_inicio) {
    const vars = { nombre: j.nombre || t('jornada.nueva'), desde: fechaCorta(j.fecha_inicio, locale.value), hasta: fechaCorta(j.fecha_fin, locale.value) }
    return j.nueva ? t('wizard.fDateInJornada', vars) : t('wizard.fDateInJornadaExtend', vars)
  }
  return hasPreselectedDate.value ? t('wizard.fDateFromPlanner') : undefined
})

// Al salir de la fecha se comprueba si cabe en la jornada en curso. Si se sale con el ratón, la
// pregunta espera a que termine el clic: abierta en el `pointerdown`, el clic caería en el velo del
// diálogo y lo cerraría como un «no».
let punteroAbajo = false
const alPulsar = () => { punteroAbajo = true }
const alSoltar = () => { punteroAbajo = false }
onMounted(() => {
  document.addEventListener('pointerdown', alPulsar, true)
  document.addEventListener('pointerup', alSoltar, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', alPulsar, true)
  document.removeEventListener('pointerup', alSoltar, true)
})
function alSalirDeFecha() {
  if (!punteroAbajo) {
    comprobarFecha()
    return
  }
  document.addEventListener('pointerup', () => setTimeout(comprobarFecha), { once: true, capture: true })
}

// «¿Ampliar la jornada hasta el 16 nov 2026?» (o «desde el …» si la fecha va antes de su inicio).
const ampliarTitulo = computed(() => {
  const p = ampliarPendiente.value
  const j = selectedJornada.value
  if (!p || !j) return ''
  const dia = fechaCorta(p.fecha, locale.value)
  return p.fecha < j.fecha_inicio ? t('wizard.extendTitleFrom', { dia }) : t('wizard.extendTitle', { dia })
})

const duracionHint = computed(() =>
  selectedStoryboard.value
    ? t('wizard.fStartHint', { duracion: selectedStoryboard.value.duration })
    : undefined,
)

// El idioma del contenido sale de los que declara el storyboard; con uno solo, no se pregunta.
const idiomas = computed(() => (selectedStoryboard.value?.languages ?? [])
  .map(l => ({ value: l, label: t(`lang.${l}`) === `lang.${l}` ? l.toUpperCase() : t(`lang.${l}`) })))

// Tono del estado, el mismo de las sesiones: lo que nadie ve aún, neutro; publicado, en cielo (próximo).
const estados: { value: WizardEstado, tone: UiTone }[] = [
  { value: 'BORRADOR', tone: 'neutral' },
  { value: 'EN_REVISION', tone: 'neutral' },
  { value: 'PUBLICADO', tone: 'sky' },
]
</script>
