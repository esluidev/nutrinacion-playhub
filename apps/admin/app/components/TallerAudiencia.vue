<template>
  <!-- «Audiencia» de «Nuevo Taller» (tarea 023): a quién va el taller y cómo. La audiencia (de la lista, o una nueva
       ahí mismo) y cuántos se esperan, el idioma del contenido (si el storyboard tiene más de uno), la modalidad y notas
       para el educador. El nombre del taller va en su propia sección, la primera. -->
  <div>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <AudienciaSelector v-model="state.audienciaId" :error="marcar && !state.audienciaId ? t('wizard.errAudience') : undefined" />
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

      <!-- Modalidad: opción seleccionable, en cielo -->
      <div class="sm:col-span-2">
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
  </div>
</template>

<script setup lang="ts">
import { MODALIDADES } from '~/composables/useWorkshops'

const { t } = useT()
const { state, intentado: marcar, selectedStoryboard } = useWorkshopWizard()

// El idioma del contenido sale de los que declara el storyboard; con uno solo, no se pregunta.
const idiomas = computed(() => (selectedStoryboard.value?.languages ?? [])
  .map(l => ({ value: l, label: t(`lang.${l}`) === `lang.${l}` ? l.toUpperCase() : t(`lang.${l}`) })))
</script>
