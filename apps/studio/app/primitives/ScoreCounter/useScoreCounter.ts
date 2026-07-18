import { ref } from 'vue'
import type { FloatingDelta, ScoreCounterOptions } from './ScoreCounter.types'

// Logic ported from the ScoreCounter class of the StoryPlay reference DS:
// tweened value, bump feedback and floating "+N"/"-N" deltas.
export function useScoreCounter(opts: ScoreCounterOptions = {}) {
  const initial = Math.max(0, Math.round(opts.initial ?? 0))
  const duration = opts.duration ?? 600

  /** Logical value (target of the tween) */
  const value = ref(initial)
  /** Value currently shown while tweening */
  const displayValue = ref(initial)
  const isBumping = ref(false)
  const deltas = ref<FloatingDelta[]>([])

  let rafId: number | null = null
  let bumpTimer: ReturnType<typeof setTimeout> | null = null
  let nextDeltaId = 0

  function set(target: number, animate = true) {
    target = Math.max(0, Math.round(target))
    const delta = target - value.value
    value.value = target

    if (!animate) {
      if (rafId !== null) cancelAnimationFrame(rafId)
      displayValue.value = target
      return
    }

    const from = displayValue.value
    const start = performance.now()
    if (rafId !== null) cancelAnimationFrame(rafId)
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      displayValue.value = Math.round(from + (target - from) * eased)
      rafId = t < 1 ? requestAnimationFrame(step) : null
    }
    rafId = requestAnimationFrame(step)

    // Bump: drop the class for a frame so the animation restarts cleanly
    isBumping.value = false
    requestAnimationFrame(() => {
      isBumping.value = true
    })
    if (bumpTimer) clearTimeout(bumpTimer)
    bumpTimer = setTimeout(() => {
      isBumping.value = false
    }, 320)

    if (delta !== 0) showDelta(delta)
  }

  function showDelta(amount: number) {
    const id = nextDeltaId++
    deltas.value.push({ id, amount })
    setTimeout(() => {
      deltas.value = deltas.value.filter(d => d.id !== id)
    }, 950)
  }

  function add(n: number) {
    set(value.value + n)
  }

  function subtract(n: number) {
    set(value.value - n)
  }

  function reset() {
    set(initial)
  }

  function destroy() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (bumpTimer) clearTimeout(bumpTimer)
  }

  return { value, displayValue, isBumping, deltas, set, add, subtract, reset, destroy }
}
