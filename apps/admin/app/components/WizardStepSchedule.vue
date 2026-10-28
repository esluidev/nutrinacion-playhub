<template>
  <div class="ui-panel p-6">
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
        id="wizard-group"
        v-model="state.group"
        label="Grupo"
        placeholder="Ej: 2.º B"
        hint="El grupo que asiste. No se registra a los participantes."
      />
      <UiInput
        id="wizard-capacity"
        v-model="state.capacity"
        label="Asistentes estimados"
        type="number"
        placeholder="25"
      />
      <UiSelect
        v-if="idiomas.length > 1"
        v-model="state.language"
        :options="idiomas"
        label="Idioma del contenido"
      />
      <UiSelect
        v-if="jornadas.length"
        v-model="state.jornadaId"
        :options="jornadaOpciones"
        label="Jornada (opcional)"
      />

      <UiTextarea
        id="wizard-notes"
        v-model="state.notes"
        label="Notas"
        optional
        :rows="3"
        placeholder="Materiales, recordatorios o indicaciones para el educador"
        class="sm:col-span-2"
      />
    </div>

    <!-- Modalidad: opción seleccionable, en cielo -->
    <div class="mt-6">
      <p class="field-label">Modalidad</p>
      <div class="grid grid-cols-3 gap-3 sm:max-w-lg">
        <button
          v-for="mod in modalidades"
          :key="mod.value"
          type="button"
          data-tone="sky"
          class="select-card items-start justify-start px-4 py-3 pr-10 text-left text-body font-extrabold text-ink"
          :aria-pressed="state.modalidad === mod.value"
          @click="state.modalidad = mod.value"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          {{ mod.label }}
        </button>
      </div>
      <p class="ui-caption mt-2">{{ modalidadDesc }}</p>
    </div>

    <!-- Estado del taller: la selección en cielo; la etiqueta, con el tono de ese estado -->
    <div class="mt-6">
      <p class="field-label">Estado del taller</p>
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
            <span class="text-body font-extrabold text-ink">{{ es.label }}</span>
            <UiBadge :tone="es.tone" class="font-mono">{{ es.value }}</UiBadge>
          </span>
          <span class="ui-caption">{{ es.desc }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import { MODALIDADES } from '~/composables/useWorkshops'
import type { WizardEstado, WizardModalidad } from '~/composables/useWorkshopWizard'
import type { JornadaFila } from '~/composables/useJornadas'

const { state, selectedStoryboard, hasPreselectedDate, onTimeStartChange } = useWorkshopWizard()

// Las jornadas de la organización de la comunidad; si no hay, no se pregunta.
const { comunidadActiva } = useContexto()
const jornadas = useState<JornadaFila[]>('wizard-jornadas', () => [])
const jornadaOpciones = computed(() => [
  { value: '', label: 'Sin jornada' },
  ...jornadas.value.map(j => ({ value: String(j.id), label: j.nombre })),
])
watch(() => comunidadActiva.value?.organizacionId, async (orgId) => {
  jornadas.value = orgId ? await useJornadas().listar(orgId) : []
}, { immediate: true })

const duracionHint = computed(() =>
  selectedStoryboard.value
    ? `La hora de fin se calcula con la duración del storyboard (${selectedStoryboard.value.duration}).`
    : undefined,
)

const modalidades = (Object.keys(MODALIDADES) as WizardModalidad[]).map(value => ({ value, label: MODALIDADES[value].label }))
const modalidadDesc = computed(() => MODALIDADES[state.value.modalidad].desc)

// El idioma del contenido sale de los que declara el storyboard; con uno solo, no se pregunta.
const nombresIdioma: Record<string, string> = { es: 'Español', en: 'Inglés' }
const idiomas = computed(() => (selectedStoryboard.value?.languages ?? [])
  .map(l => ({ value: l, label: nombresIdioma[l] ?? l.toUpperCase() })))

// Tono del estado, el mismo de las sesiones: lo que nadie ve aún, neutro; publicado, en cielo (próximo).
const estados: { value: WizardEstado, label: string, desc: string, tone: UiTone }[] = [
  { value: 'BORRADOR', label: 'Borrador', desc: 'Se guarda sin publicarse: los educadores aún no lo ven y puedes completarlo después.', tone: 'neutral' },
  { value: 'EN_REVISION', label: 'En revisión', desc: 'Listo para que otra persona lo confirme y lo publique. Los educadores aún no lo ven.', tone: 'neutral' },
  { value: 'PUBLICADO', label: 'Publicado', desc: 'Queda agendado: los educadores asignados lo verán en Educators. Necesita fecha, hora y educador.', tone: 'sky' },
]
</script>
