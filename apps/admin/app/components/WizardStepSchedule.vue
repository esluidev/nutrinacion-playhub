<template>
  <!-- Paso «Cuándo y dónde»: primero si el taller va suelto o dentro de una jornada (JornadaSelector,
       con la jornada en su propio diálogo, nunca mezclada con el taller); después su día, su hora y
       su lugar. Dentro de una jornada, el día se elige entre los suyos y el lugar es el de la
       jornada más un detalle opcional. El título, el grupo y la modalidad van en el paso siguiente. -->
  <div class="ui-panel">
    <div class="ui-panel-body">
      <JornadaSelector id="wizard-jornada" v-model="state.jornada" :jornadas="jornadas" :fecha="state.date" />

      <div v-if="state.jornada.modo === 'suelto' || jornadaEfectiva" class="mt-6 grid grid-cols-1 gap-5 border-t border-line pt-6 sm:grid-cols-2">
        <!-- Dentro de una jornada, el día es uno de los suyos. Una en curso se puede ampliar con
             otro día; una nueva cambia sus días en su diálogo. -->
        <div v-if="dias" class="sm:col-span-2">
          <p class="field-label">{{ t('wizard.fDay') }} <span class="text-danger" aria-hidden="true">*</span></p>
          <UiChips v-model="state.date" :items="dias" />
          <p class="ui-caption mt-2">
            <template v-if="selectedJornada">
              <button type="button" class="ui-link" data-tone="sky" @click="otroDia = !otroDia">{{ t('wizard.otherDay') }}</button>
            </template>
            <template v-else>{{ t('wizard.otherDayNew') }}</template>
          </p>
        </div>

        <!-- Suelto, su fecha. Dentro de una jornada larga (sus días no caben en botones) o para
             otro día de una en curso, un campo de fecha. -->
        <UiInput
          v-if="!dias || otroDia"
          id="wizard-date"
          v-model="state.date"
          :label="dias ? t('wizard.fOtherDay') : t('wizard.fDate')"
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

        <!-- Suelto, el lugar. Dentro de una jornada, el lugar es el suyo y aquí va el detalle. -->
        <UiInput
          v-if="jornadaEfectiva"
          id="wizard-location"
          v-model="state.location"
          :label="t('wizard.fLocationDetail')"
          :placeholder="t('wizard.fLocationDetailPh')"
          :hint="t('wizard.fLocationEffective', { lugar: lugarEfectivo })"
          optional
          :class="dias && !otroDia ? '' : 'sm:col-span-2'"
        />
        <UiInput
          v-else
          id="wizard-location"
          v-model="state.location"
          :label="t('wizard.fLocation')"
          :placeholder="t('wizard.fLocationPh')"
          class="sm:col-span-2"
        />
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
import { diasParaElegir } from '~/utils/jornadas'

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

// Los días de la jornada para elegir uno (null: suelto, sin jornada aún o demasiados días).
const dias = computed(() => {
  const j = jornadaEfectiva.value
  if (!j?.fecha_inicio) return null
  const lista = diasParaElegir(j, hoyLocal())
  return lista?.map(d => ({ value: d, label: diaCorto(d) })) ?? null
})
// «mar 4 nov», en el idioma de la UI.
function diaCorto(iso: string) {
  return aFecha(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
}
// «¿Otro día?» en una jornada en curso: un campo de fecha que, fuera de sus días, ofrece ampliarla.
const otroDia = ref(false)
watch(() => state.value.jornada.modo, () => { otroDia.value = false })
</script>
