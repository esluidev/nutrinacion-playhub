<template>
  <!-- Paso actual en noche (estructura), completados en lima (hecho) y pendientes hundidos -->
  <div class="ui-panel mb-6 px-6 py-4">
    <div class="flex items-center">
      <div
        v-for="(step, idx) in steps"
        :key="step.id"
        class="flex items-center"
        :class="idx < steps.length - 1 ? 'flex-1' : ''"
      >
        <button
          type="button"
          class="group flex items-center gap-2.5"
          :class="step.id < currentStep ? 'cursor-pointer' : 'cursor-default'"
          :aria-current="currentStep === step.id ? 'step' : undefined"
          @click="onStepClick(step.id)"
        >
          <!-- Marca del paso -->
          <span
            :data-tone="step.id < currentStep ? 'lime' : currentStep === step.id ? 'night' : undefined"
            :class="[
              'ui-dot size-8 text-caption transition-colors',
              step.id > currentStep && 'bg-sunken text-subtle',
            ]"
          >
            <UiIcon v-if="step.id < currentStep" name="check" class="size-4" />
            <span v-else>{{ step.id }}</span>
          </span>

          <!-- Label -->
          <span
            :class="[
              'hidden whitespace-nowrap text-caption font-extrabold transition-colors md:block',
              currentStep === step.id ? 'text-ink'
              : step.id < currentStep ? 'text-muted group-hover:text-ink'
              : 'text-subtle',
            ]"
          >
            {{ step.label }}
          </span>
        </button>

        <!-- Conector: lima cuando el tramo ya está hecho -->
        <div
          v-if="idx < steps.length - 1"
          :data-tone="step.id < currentStep ? 'lime' : undefined"
          :class="[
            'mx-3.5 h-0.5 flex-1 rounded-full transition-colors duration-300',
            step.id < currentStep ? 'bg-(--tone-fill)' : 'bg-line',
          ]"
        />
      </div>
    </div>

    <!-- Mobile caption -->
    <p class="ui-caption mt-3 text-center md:hidden">
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
