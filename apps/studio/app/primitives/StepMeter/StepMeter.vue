<template>
  <div :class="['step-meter', `step-meter-${color}`, `step-meter-current-${currentColor}`]">
    <div
      v-for="i in steps"
      :key="i"
      :class="['step-meter-segment', {
        'is-filled': i <= current,
        'is-last-filled': i === current,
        'is-current': i === current + 1 && current < steps,
      }]"
    />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useStepMeter } from './useStepMeter'
import type { StepMeterColor } from './StepMeter.types'

interface Props {
  steps?: number
  color?: StepMeterColor
  /** Color del paso EN CURSO (mismo lenguaje visual que los completados) */
  currentColor?: StepMeterColor
  initial?: number
}

const props = withDefaults(defineProps<Props>(), {
  steps: 5,
  color: 'green',
  currentColor: 'orange',
  initial: 0,
})

const emit = defineEmits<{
  change: [step: number]
  complete: []
}>()

const { current, isComplete, setStep, next, reset } = useStepMeter({
  steps: props.steps,
  initial: props.initial,
})

watch(current, (step) => {
  emit('change', step)
  if (isComplete.value) emit('complete')
})

defineExpose({
  setStep,
  next,
  reset,
  current: () => current.value,
})
</script>

<style scoped>
/* Segmented meter on the game palette: tan channel (like ProgressBar track),
   filled segments in accent color with the glossy strip. */
.step-meter {
  display: flex;
  gap: 6px;
  width: 100%;
  max-width: 360px;
  --step-color: var(--accent-green);
}

.step-meter.step-meter-red { --step-color: var(--accent-red); }
.step-meter.step-meter-blue { --step-color: var(--accent-blue); }
.step-meter.step-meter-green { --step-color: var(--accent-green); }
.step-meter.step-meter-yellow { --step-color: var(--accent-yellow); }
.step-meter.step-meter-orange { --step-color: var(--accent-orange); }

.step-meter-segment {
  position: relative;
  flex: 1;
  height: 22px;
  background: var(--paper-deep);
  border-radius: 8px;
  overflow: hidden;
  transition: background 250ms ease-out;
}

.step-meter-segment.is-filled {
  background: var(--step-color);
}

/* Paso EN CURSO: lleno en su propio color (amarillo por defecto) — mismo
   lenguaje visual que los completados; al terminar pasa al color del meter. */
.step-meter.step-meter-current-red { --step-current-color: var(--accent-red); }
.step-meter.step-meter-current-blue { --step-current-color: var(--accent-blue); }
.step-meter.step-meter-current-green { --step-current-color: var(--accent-green); }
.step-meter.step-meter-current-yellow { --step-current-color: var(--accent-yellow); }
.step-meter.step-meter-current-orange { --step-current-color: var(--accent-orange); }

.step-meter-segment.is-current {
  background: var(--step-current-color, var(--accent-orange));
}

.step-meter-segment.is-current::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 8px;
  right: 8px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  pointer-events: none;
}

/* Glossy strip on filled segments (Duolingo style, like ProgressBar) */
.step-meter-segment.is-filled::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 8px;
  right: 8px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  pointer-events: none;
}

.step-meter-segment.is-last-filled {
  animation: step-pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes step-pop {
  0% { transform: scaleY(1); }
  40% { transform: scaleY(1.35); }
  100% { transform: scaleY(1); }
}
</style>
