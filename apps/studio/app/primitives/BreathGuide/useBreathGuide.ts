import { computed, onBeforeUnmount, ref } from 'vue'
import type { BreathGuideOptions, BreathPhase } from './BreathGuide.types'

// Guided breathing: N inhale/exhale cycles with timed phases. The bubble
// visual lives in BreathGuide.vue; this drives the phase machine.
export function useBreathGuide(opts: BreathGuideOptions = {}, hooks?: {
  onPhase?: (phase: BreathPhase) => void
  onCycle?: (done: number) => void
  onDone?: () => void
}) {
  const cycles = opts.cycles ?? 3
  const inhaleMs = opts.inhaleMs ?? 3200
  const exhaleMs = opts.exhaleMs ?? 3600

  const phase = ref<BreathPhase>('out')
  const cyclesDone = ref(0)
  const running = ref(false)

  let timer: ReturnType<typeof setTimeout> | null = null

  const done = computed(() => cyclesDone.value >= cycles)

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function inhale() {
    phase.value = 'in'
    hooks?.onPhase?.('in')
    timer = setTimeout(exhale, inhaleMs)
  }

  function exhale() {
    phase.value = 'out'
    hooks?.onPhase?.('out')
    timer = setTimeout(() => {
      cyclesDone.value++
      hooks?.onCycle?.(cyclesDone.value)
      if (cyclesDone.value >= cycles) {
        running.value = false
        hooks?.onDone?.()
      }
      else {
        inhale()
      }
    }, exhaleMs)
  }

  function start() {
    if (running.value || done.value) return
    running.value = true
    inhale()
  }

  function reset() {
    clearTimer()
    running.value = false
    phase.value = 'out'
    cyclesDone.value = 0
  }

  onBeforeUnmount(clearTimer)

  return { phase, cyclesDone, running, done, start, reset, cycles, inhaleMs, exhaleMs }
}
