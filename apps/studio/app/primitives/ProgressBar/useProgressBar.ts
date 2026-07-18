import { ref } from 'vue'
import type { ProgressBarOptions } from './ProgressBar.types'

// Logic ported from the ProgressBar class of the StoryPlay reference DS.
// Pure state — no DOM access — so it stays testable without a browser.
export function useProgressBar(opts: ProgressBarOptions = {}) {
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
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic, same as the DS
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
