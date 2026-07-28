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

    <!-- Navegación -->
    <div
      v-if="!isSuccess"
      :class="[
        'flex items-center justify-between mt-[22px]',
        currentStep === 4 ? 'max-w-[760px] mx-auto' : '',
      ]"
    >
      <UiButton variant="outline" @click="currentStep > 1 ? prevStep() : $router.back()">
        {{ currentStep > 1 ? 'Anterior' : 'Cancelar' }}
      </UiButton>

      <button
        :class="[
          'inline-flex items-center gap-[7px] font-bold rounded-btn text-[13.5px] px-[22px] h-[42px] transition-all duration-150',
          canProceed
            ? 'bg-brand-primary text-white shadow-btn hover:bg-brand-primary-700 cursor-pointer'
            : 'bg-[#e9ebee] text-gray-400 cursor-not-allowed',
        ]"
        :disabled="!canProceed || isSubmitting"
        @click="onNext"
      >
        <svg v-if="isSubmitting" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ currentStep < 4 ? 'Siguiente' : 'Guardar Taller' }}
      </button>
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
