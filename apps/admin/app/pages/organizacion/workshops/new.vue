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
        {{ currentStep > 1 ? t('wizard.prev') : t('common.cancel') }}
      </UiButton>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <!-- Secundaria, solo si el taller va en una jornada: guarda y vuelve a empezar con ella -->
        <UiButton
          v-if="currentStep === 4 && jornadaEfectiva"
          variant="outline"
          icon="plus"
          :disabled="isSubmitting"
          :loading="isSubmitting && guardando === 'otro'"
          @click="guardar('otro')"
        >
          {{ t('wizard.saveAndAnother') }}
        </UiButton>
        <UiButton :disabled="!canProceed || (isSubmitting && guardando === 'otro')" :loading="isSubmitting && guardando !== 'otro'" @click="onNext">
          {{ currentStep < 4 ? t('wizard.next') : t('wizard.save') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const {
  currentStep,
  direction,
  steps,
  canProceed,
  isSubmitting,
  isSuccess,
  jornadaEfectiva,
  goToStep,
  nextStep,
  prevStep,
  submit,
  resetWizard,
  vigilarJornada,
} = useWorkshopWizard()

// Los vigilantes de la jornada del asistente viven con la página.
vigilarJornada()

const guardando = ref<'uno' | 'otro' | null>(null)

function onNext() {
  if (currentStep.value < 4) nextStep()
  else guardar('uno')
}

// «Guardar» termina en el aviso de éxito. «Crear y agregar otro a esta jornada» vuelve a empezar el
// asistente con la jornada y la fecha del taller recién creado.
async function guardar(modo: 'uno' | 'otro') {
  guardando.value = modo
  const nombre = jornadaEfectiva.value?.nombre ?? ''
  const r = await submit()
  guardando.value = null
  if (!r) return
  if (modo === 'otro' && r.jornadaId) {
    await navigateTo({ path: '/organizacion/workshops/new', query: { jornada: String(r.jornadaId), fecha: r.fecha } })
    resetWizard()
    useToast().toast.success(t('wizard.createdNext', { nombre }))
    return
  }
  isSuccess.value = true
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
