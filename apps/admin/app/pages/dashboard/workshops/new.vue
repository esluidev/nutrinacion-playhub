<template>
  <div class="max-w-5xl mx-auto">
    <!-- Stepper -->
    <WizardStepper
      :steps="steps"
      :current-step="currentStep"
      @step-click="goToStep"
    />

    <!-- Step Content with Slide Transition -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <Transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
        <WizardStepStoryboard v-if="currentStep === 1" key="step-1" />
        <WizardStepEducator v-else-if="currentStep === 2" key="step-2" />
        <WizardStepSchedule v-else-if="currentStep === 3" key="step-3" />
        <WizardStepReview v-else-if="currentStep === 4" key="step-4" />
      </Transition>
    </div>

    <!-- Navigation Buttons (hidden on step 4) -->
    <div v-if="currentStep < 4" class="flex items-center justify-between mt-6">
      <UiButton
        v-if="currentStep > 1"
        variant="outline"
        @click="prevStep"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Anterior
      </UiButton>
      <UiButton
        v-else
        variant="outline"
        @click="$router.back()"
      >
        Cancelar
      </UiButton>

      <UiButton
        variant="primary"
        :disabled="!canProceed"
        @click="nextStep"
      >
        Siguiente
        <svg class="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
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
  goToStep,
  nextStep,
  prevStep,
  resetWizard,
} = useWorkshopWizard()

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
