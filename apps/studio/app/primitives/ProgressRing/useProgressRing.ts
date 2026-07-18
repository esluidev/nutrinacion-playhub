import { ref } from 'vue'
import type { ProgressRingOptions } from './ProgressRing.types'

// Logic ported from the ProgressRing class of the StoryPlay reference DS.
// Same API as useProgressBar: setProgress(0..1) + animate(from, to, duration).
export function useProgressRing(opts: ProgressRingOptions = {}) {
  const current = ref(clamp(opts.initial ?? 0))
  let rafId: number | null = null

  function clamp(value: number): number {
    return Math.max(0, Math.min(1, value))
  }

  function setProgress(value: number) {
    current.value = clamp(value)
  }

  function animate(from: number, to: number, duration = 1000) {
    if (rafId !== null) cancelAnimationFrame(rafId)
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(from + (to - from) * eased)
      rafId = t < 1 ? requestAnimationFrame(step) : null
    }
    rafId = requestAnimationFrame(step)
  }

  function destroy() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  return { current, setProgress, animate, destroy }
}
