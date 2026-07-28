<template>
  <div class="card px-6 py-[18px] mb-[22px]">
    <div class="flex items-center">
      <div
        v-for="(step, idx) in steps"
        :key="step.id"
        class="flex items-center"
        :class="idx < steps.length - 1 ? 'flex-1' : ''"
      >
        <button
          class="flex items-center gap-2.5"
          :class="step.id < currentStep ? 'cursor-pointer' : 'cursor-default'"
          @click="onStepClick(step.id)"
        >
          <!-- Círculo del paso -->
          <div
            :class="[
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
              currentStep === step.id
                ? 'bg-brand-primary text-white ring-4 ring-brand-primary-100'
                : step.id < currentStep
                  ? 'bg-brand-primary-100 text-brand-primary-800 hover:bg-brand-primary-200'
                  : 'bg-gray-100 text-gray-400',
            ]"
          >
            <svg v-if="step.id < currentStep" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span v-else class="font-display font-semibold text-sm">{{ step.id }}</span>
          </div>

          <!-- Label -->
          <span
            :class="[
              'text-[12.5px] font-extrabold whitespace-nowrap hidden md:block transition-colors',
              currentStep === step.id ? 'text-brand-dark'
              : step.id < currentStep ? 'text-brand-primary-800'
              : 'text-gray-400',
            ]"
          >
            {{ step.label }}
          </span>
        </button>

        <!-- Conector -->
        <div
          v-if="idx < steps.length - 1"
          :class="[
            'flex-1 h-0.5 mx-3.5 rounded-full transition-colors duration-300',
            step.id < currentStep ? 'bg-brand-primary-200' : 'bg-gray-200',
          ]"
        />
      </div>
    </div>

    <!-- Mobile caption -->
    <p class="md:hidden text-xs text-gray-400 text-center mt-3 font-semibold">
      Paso {{ currentStep }}: {{ steps.find(s => s.id === currentStep)?.label }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Step {
  id: number
  label: string
}

const props = defineProps<{
  steps: Step[]
  currentStep: number
}>()

const emit = defineEmits<{
  'step-click': [step: number]
}>()

function onStepClick(stepId: number) {
  if (stepId < props.currentStep) {
    emit('step-click', stepId)
  }
}
</script>
