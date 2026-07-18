import { computed, ref } from 'vue'
import type { StepMeterOptions } from './StepMeter.types'

// StepMeter has no implementation in the reference DS (declared only).
// API designed to match the family: setStep/next/reset + completion signal.
export function useStepMeter(opts: StepMeterOptions = {}) {
  const steps = opts.steps ?? 5
  const current = ref(clampStep(opts.initial ?? 0))

  function clampStep(n: number): number {
    return Math.max(0, Math.min(steps, Math.round(n)))
  }

  const isComplete = computed(() => current.value >= steps)

  function setStep(n: number) {
    current.value = clampStep(n)
  }

  function next() {
    setStep(current.value + 1)
  }

  function reset() {
    current.value = 0
  }

  return { steps, current, isComplete, setStep, next, reset }
}
