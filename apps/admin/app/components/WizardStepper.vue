<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
    <div class="flex items-center justify-between">
      <div
        v-for="(step, idx) in steps"
        :key="step.id"
        class="flex items-center"
        :class="idx < steps.length - 1 ? 'flex-1' : ''"
      >
        <button
          class="flex items-center gap-2.5 group"
          :disabled="step.id > currentStep && !(step.id <= currentStep)"
          @click="onStepClick(step.id)"
        >
          <!-- Step Circle -->
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
              currentStep === step.id
                ? 'bg-brand-primary text-white ring-4 ring-brand-primary-100 shadow-sm'
                : step.id < currentStep
                  ? 'bg-brand-primary-100 text-brand-primary-700 cursor-pointer hover:bg-brand-primary-200'
                  : 'bg-gray-100 text-gray-400',
            ]"
          >
            <!-- Completed checkmark -->
            <svg v-if="step.id < currentStep" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <!-- Step icon -->
            <component :is="stepIcons[step.id]" v-else class="w-5 h-5" />
          </div>

          <!-- Label (hidden on mobile) -->
          <span
            :class="[
              'text-xs font-semibold whitespace-nowrap hidden md:block transition-colors',
              currentStep === step.id ? 'text-brand-dark'
              : step.id < currentStep ? 'text-brand-primary-700'
              : 'text-gray-400',
            ]"
          >
            {{ step.label }}
          </span>
        </button>

        <!-- Connector Line -->
        <div
          v-if="idx < steps.length - 1"
          :class="[
            'flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300',
            step.id < currentStep ? 'bg-brand-primary-200' : 'bg-gray-200',
          ]"
        />
      </div>
    </div>

    <!-- Mobile caption -->
    <p class="md:hidden text-xs text-gray-400 text-center mt-3 font-medium">
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

// Icon components
const IconBook = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' }),
  ]),
})

const IconPerson = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' }),
  ]),
})

const IconCalendar = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5' }),
  ]),
})

const IconCheck = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' }),
  ]),
})

const stepIcons: Record<number, ReturnType<typeof defineComponent>> = {
  1: IconBook,
  2: IconPerson,
  3: IconCalendar,
  4: IconCheck,
}
</script>
