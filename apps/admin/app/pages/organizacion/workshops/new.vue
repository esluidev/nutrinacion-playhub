<template>
  <div>
    <UiPageHeader :title="t('workshops.newTitle')" :description="t('workshops.newDesc')" />

    <!-- Stepper -->
    <WizardStepper
      :steps="steps"
      :current-step="currentStep"
      @step-click="goToStep"
    />

    <!-- Contenido del paso -->
    <Transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
      <WizardStepStoryboard v-if="currentStep === 1" key="step-1" />
      <WizardStepEducator v-else-if="currentStep === 2" key="step-2" />
      <WizardStepSchedule v-else-if="currentStep === 3" key="step-3" />
      <WizardStepGroup v-else-if="currentStep === 4" key="step-4" />
      <WizardStepReview v-else-if="currentStep === 5" key="step-5" />
    </Transition>

    <!-- Navegación: «Siguiente» es la acción principal de cada paso. En el resumen se elige cómo se
         guarda: «Publicar» (la principal), o como borrador o en revisión. -->
    <div
      v-if="!isSuccess"
      :class="[
        'mt-6 flex flex-wrap items-center justify-between gap-3',
        currentStep === 5 ? 'max-w-[760px] mx-auto' : '',
      ]"
    >
      <UiButton variant="outline" @click="currentStep > 1 ? prevStep() : $router.back()">
        {{ currentStep > 1 ? t('wizard.prev') : t('common.cancel') }}
      </UiButton>

      <div v-if="currentStep === 5" class="flex flex-wrap items-center justify-end gap-3">
        <UiButton variant="outline" :disabled="isSubmitting" :loading="guardando === 'BORRADOR'" @click="guardar('BORRADOR')">{{ t('wizard.saveDraft') }}</UiButton>
        <UiButton variant="outline" :disabled="isSubmitting" :loading="guardando === 'EN_REVISION'" @click="guardar('EN_REVISION')">{{ t('wizard.sendReview') }}</UiButton>
        <UiButton icon="check" :disabled="isSubmitting" :loading="guardando === 'PUBLICADO'" @click="guardar('PUBLICADO')">{{ t('wizard.publish') }}</UiButton>
      </div>
      <UiButton v-else :disabled="!canProceed" @click="nextStep">{{ t('wizard.next') }}</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WizardEstado } from '~/composables/useWorkshopWizard'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const {
  currentStep,
  direction,
  steps,
  canProceed,
  isSubmitting,
  isSuccess,
  state,
  goToStep,
  nextStep,
  prevStep,
  submit,
  resetWizard,
  vigilarJornada,
} = useWorkshopWizard()

// Los vigilantes de la jornada del asistente viven con la página.
vigilarJornada()

// Cómo se guarda, desde el resumen: publicado, en revisión o borrador. Termina en el aviso de
// éxito, que ofrece agregar otro taller a la misma jornada.
const guardando = ref<WizardEstado | null>(null)
async function guardar(estado: WizardEstado) {
  state.value.estado = estado
  guardando.value = estado
  const r = await submit()
  guardando.value = null
  if (r) isSuccess.value = true
}

onMounted(() => {
  resetWizard()
})
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
