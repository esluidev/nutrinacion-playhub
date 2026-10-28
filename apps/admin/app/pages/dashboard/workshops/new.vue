<template>
  <div>
    <UiPageHeader title="Nuevo Taller" description="Programa un taller a partir de un storyboard publicado" />

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
      <WizardStepReview v-else-if="currentStep === 4" key="step-4" />
    </Transition>

    <!-- Navegación: «Siguiente / Guardar» es la acción principal de la vista -->
    <div
      v-if="!isSuccess"
      :class="[
        'mt-6 flex items-center justify-between',
        currentStep === 4 ? 'max-w-[760px] mx-auto' : '',
      ]"
    >
      <UiButton variant="outline" @click="currentStep > 1 ? prevStep() : $router.back()">
        {{ currentStep > 1 ? 'Anterior' : 'Cancelar' }}
      </UiButton>

      <UiButton :disabled="!canProceed" :loading="isSubmitting" @click="onNext">
        {{ currentStep < 4 ? 'Siguiente' : 'Guardar Taller' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const {
  currentStep,
  direction,
  steps,
  canProceed,
  isSubmitting,
  isSuccess,
  goToStep,
  nextStep,
  prevStep,
  submit,
  resetWizard,
} = useWorkshopWizard()

function onNext() {
  if (currentStep.value < 4) nextStep()
  else submit()
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
