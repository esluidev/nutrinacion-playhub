<template>
  <!-- Paso «Grupo»: a quién va el taller y cómo. El título (sale del storyboard), el grupo que asiste
       y cuántos, el idioma del contenido (si el storyboard tiene más de uno), la modalidad y notas
       para el educador. -->
  <div class="ui-panel">
    <div class="ui-panel-body grid grid-cols-1 gap-5 sm:grid-cols-2">
      <UiInput
        id="wizard-title"
        v-model="state.title"
        :label="t('wizard.fTitle')"
        :placeholder="t('wizard.fTitlePh')"
        required
        class="sm:col-span-2"
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
const { state, selectedStoryboard } = useWorkshopWizard()

// El título sale del storyboard si aún no tiene (también cuando el storyboard llegó ya elegido).
onMounted(() => {
  if (!state.value.title.trim() && selectedStoryboard.value) state.value.title = selectedStoryboard.value.title
})

// El idioma del contenido sale de los que declara el storyboard; con uno solo, no se pregunta.
const idiomas = computed(() => (selectedStoryboard.value?.languages ?? [])
  .map(l => ({ value: l, label: t(`lang.${l}`) === `lang.${l}` ? l.toUpperCase() : t(`lang.${l}`) })))
</script>
