import { ref } from 'vue'
import { Sounds } from '../sounds'
import type { ScaleUnit } from './Scale.types'

// Logic ported from the Scale class of the StoryPlay reference DS:
// weights accumulate in kg, the display tweens to the new total (900ms
// ease-out cubic) and converts live to the selected unit.
export function useScale(initialUnit: ScaleUnit = 'kg') {
  const unit = ref<ScaleUnit>(initialUnit)
  const totalKg = ref(0)
  /** Value currently shown while tweening (in kg) */
  const displayKg = ref(0)
  const isUpdated = ref(false)
  let rafId: number | null = null
  let pulseTimer: ReturnType<typeof setTimeout> | null = null

  function convertFromKg(kg: number, u: ScaleUnit): number {
    if (u === 'g') return kg * 1000
    if (u === 'lb') return kg * 2.20462
    return kg
  }

  function decimalsFor(u: ScaleUnit): number {
    return u === 'g' ? 0 : 2
  }

  function displayText(): string {
    return convertFromKg(displayKg.value, unit.value).toFixed(decimalsFor(unit.value))
  }

  function addWeight(kg: number) {
    const from = totalKg.value
    const to = from + kg
    totalKg.value = to

    const duration = 900
    const start = performance.now()
    if (rafId !== null) cancelAnimationFrame(rafId)
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      displayKg.value = from + (to - from) * eased
      if (t < 1) {
        rafId = requestAnimationFrame(step)
      }
      else {
        rafId = null
        displayKg.value = to
        // Pulse + tick at the end, like the DS
        isUpdated.value = false
        requestAnimationFrame(() => {
          isUpdated.value = true
        })
        if (pulseTimer) clearTimeout(pulseTimer)
        pulseTimer = setTimeout(() => {
          isUpdated.value = false
        }, 500)
        Sounds.play('tick')
      }
    }
    rafId = requestAnimationFrame(step)
  }

  function setUnit(u: ScaleUnit) {
    if (!['kg', 'g', 'lb'].includes(u)) return
    unit.value = u
  }

  function reset() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    totalKg.value = 0
    displayKg.value = 0
  }

  function getWeight(u?: ScaleUnit): number {
    return convertFromKg(totalKg.value, u ?? unit.value)
  }

  function destroy() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (pulseTimer) clearTimeout(pulseTimer)
  }

  return { unit, totalKg, displayKg, isUpdated, displayText, addWeight, setUnit, reset, getWeight, destroy }
}
