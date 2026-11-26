<template>
  <!-- «Cuándo y dónde» de «Nuevo Taller» (tarea 023): primero a qué pertenece el taller, una sola pregunta («Pertenece
       a»: suelto, un programa o una jornada, en grupos y con sus fechas), y después su día, su hora, su lugar y su
       espacio. Dentro de una jornada, el día se elige entre los suyos y el lugar es el de ella; dentro de un programa, la
       fecha cae en las suyas. Las jornadas y los programas se crean en su sección; el lugar, si no está, ahí mismo,
       debajo de su campo. Después de pulsar «Publicar», el día, la hora o el lugar que falten se marcan. -->
  <div>
    <div>
      <UiSelect
        :model-value="valorPertenencia"
        :options="opcionesPertenencia"
        :label="t('wizard.belongs')"
        @update:model-value="elegirPertenencia"
      />
      <p class="field-help">{{ ayudaPertenencia }}</p>

      <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <!-- Dentro de una jornada, el día es uno de los suyos; otro día ofrece ampliarla. -->
        <div v-if="dias" class="sm:col-span-2">
          <p class="field-label">{{ t('wizard.fDay') }} <span class="text-danger" aria-hidden="true">*</span></p>
          <UiChips v-model="state.date" :items="dias" />
          <p v-if="marcar && !state.date" class="field-error">{{ t('wizard.errDay') }}</p>
          <p class="ui-caption mt-2">
            <button type="button" class="ui-link" data-tone="sky" @click="otroDia = !otroDia">{{ t('wizard.otherDay') }}</button>
          </p>
        </div>

        <!-- Fuera de una jornada, su fecha (dentro de un programa, entre las suyas). Dentro de una jornada larga (sus
             días no caben en botones) o para otro día, un campo de fecha. -->
        <UiInput
          v-if="!dias || otroDia"
          id="wizard-date"
          v-model="state.date"
          :label="dias ? t('wizard.fOtherDay') : t('wizard.fDate')"
          type="date"
          :min="dateMin"
          :max="dateMax"
          :hint="dateHint"
          :error="dateFueraDePrograma ? t('wizard.fDateOutsideProgram', { nombre: programaEfectivo?.nombre ?? '' }) : marcar && !state.date ? t('wizard.errDay') : undefined"
          required
          @focusout="alSalirDeFecha"
        />
        <UiInput
          id="wizard-time-start"
          :model-value="state.timeStart"
          :label="t('wizard.fStart')"
          type="time"
          :hint="duracionHint"
          :error="marcar && !state.timeStart ? t('wizard.errTime') : undefined"
          required
          @update:model-value="onTimeStartChange($event)"
        />
        <!-- Con los días en botones, la hora va sola: el lugar y el espacio empiezan su propia fila. -->
        <div v-if="dias && !otroDia" class="hidden sm:block" />

        <!-- Dónde, en una fila: el lugar (de la lista, o uno nuevo ahí mismo; dentro de una jornada, el suyo) y el
             espacio dentro de él («Aula 3A»), opcional. -->
        <UiInput
          v-if="jornadaEfectiva"
          id="wizard-lugar-jornada"
          :model-value="jornadaEfectiva.ubicacion"
          :label="t('places.field')"
          :hint="t('wizard.placeFromJornada')"
          disabled
        />
        <LugarSelector v-else v-model="state.lugarId" :error="marcar && !state.lugarId ? t('wizard.errPlace') : undefined" />
        <UiInput
          id="wizard-espacio"
          v-model="state.espacio"
          :label="t('wizard.fSpace')"
          :placeholder="t('wizard.fSpacePh')"
          optional
        />
      </div>
    </div>

    <!-- Una fecha fuera de la jornada en curso elegida: ¿se amplía? Sí, se amplía al guardar el
         taller; no, se vuelve a la fecha anterior. -->
    <UiConfirmDialog
      :open="!!ampliarPendiente"
      :title="t('wizard.extendTitle')"
      tone="lime"
      symbol="calendar"
      :confirm-label="t('wizard.extendConfirm')"
      :cancel-label="t('wizard.extendKeep')"
      @update:open="(v) => { if (!v && ampliarPendiente) rechazarAmpliar() }"
      @confirm="confirmarAmpliar"
    >
      <p v-if="selectedJornada && ampliarPendiente">
        {{ t(ampliarAntes ? 'wizard.extendTextFrom' : 'wizard.extendText', {
          nombre: selectedJornada.nombre,
          dia: fechaCorta(ampliarPendiente.fecha, locale),
          dias: rangoJornada(selectedJornada, locale),
          nuevos: rangoJornada(ampliarPendiente, locale),
        }) }}
      </p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { diasParaElegir, rangoJornada } from '~/utils/jornadas'
import { opcionesDePertenencia } from '~/utils/pertenencia'

const { t, locale } = useT()
const {
  state, intentado: marcar, selectedStoryboard, hasPreselectedDate, onTimeStartChange,
  jornadas, pertenencia, valorPertenencia, elegirPertenencia,
  selectedJornada, jornadaEfectiva, programaEfectivo, dateMin, dateMax, dateFueraDePrograma,
  ampliarPendiente, comprobarFecha, confirmarAmpliar, rechazarAmpliar,
} = useWorkshopWizard()
const { programas } = useProgramas()

// «Pertenece a»: suelto, o en grupos los programas y las jornadas que no han terminado, con sus fechas y su lugar.
const opcionesPertenencia = computed(() => opcionesDePertenencia(
  programas.value,
  jornadas.value,
  hoyLocal(),
  pertenencia.value,
  { suelto: t('wizard.belongsSuelto'), programas: t('wizard.belongsPrograms'), jornadas: t('wizard.belongsJornadas') },
  locale.value,
))
// Qué significa lo elegido: suelto, las fechas del programa o el lugar y los días de la jornada (y su programa).
const ayudaPertenencia = computed(() => {
  const j = jornadaEfectiva.value
  if (j) {
    const base = t('wizard.belongsHintJornada', { lugar: j.ubicacion, dias: rangoJornada(j, locale.value) })
    return programaEfectivo.value ? `${base} ${t('wizard.belongsHintJornadaProgram', { nombre: programaEfectivo.value.nombre })}` : base
  }
  const p = programaEfectivo.value
  if (p) return t('programs.fieldDates', { desde: fechaCorta(p.fecha_inicio, locale.value), hasta: fechaCorta(p.fecha_fin, locale.value) })
  return t('wizard.belongsHintSuelto')
})

// Qué dice la fecha: entre qué días cae por su jornada (se puede ampliar), o que viene del planificador.
const dateHint = computed(() => {
  const j = jornadaEfectiva.value
  if (j) {
    return t('wizard.fDateInJornadaExtend', { nombre: j.nombre, desde: fechaCorta(j.fecha_inicio, locale.value), hasta: fechaCorta(j.fecha_fin, locale.value) })
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

// El título, el verbo; la pregunta, en el texto (Luis, 2026-11-26): «¿Ampliar «…» hasta el 16 nov 2026?» (o «desde
// el …» si la fecha va antes de su inicio).
const ampliarAntes = computed(() => {
  const p = ampliarPendiente.value
  const j = selectedJornada.value
  return Boolean(p && j && p.fecha < j.fecha_inicio)
})

const duracionHint = computed(() =>
  selectedStoryboard.value
    ? t('wizard.fStartHint', { duracion: selectedStoryboard.value.duration })
    : undefined,
)

// Los días de la jornada para elegir uno (null: sin jornada o demasiados días).
const dias = computed(() => {
  const j = jornadaEfectiva.value
  if (!j) return null
  const lista = diasParaElegir(j, hoyLocal())
  return lista?.map(d => ({ value: d, label: diaCorto(d) })) ?? null
})
// «mar 4 nov», en el idioma de la UI.
function diaCorto(iso: string) {
  return aFecha(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
}
// «¿Otro día?» en una jornada: un campo de fecha que, fuera de sus días, ofrece ampliarla.
const otroDia = ref(false)
watch(() => state.value.jornadaId, () => { otroDia.value = false })
</script>
