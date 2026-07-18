import { ref } from 'vue'
import { Sounds } from '../sounds'
import type { RulerUnit } from './Ruler.types'

// Logic ported from the Ruler class of the StoryPlay reference DS:
// the dropped object grows from the floor to its real height while the
// marker pill tweens its numeric value (900ms ease-out cubic).
export function useRuler(initialUnit: RulerUnit = 'cm') {
  const unit = ref<RulerUnit>(initialUnit)
  const currentCm = ref(0)
  /** Value shown in the marker while tweening (in cm) */
  const markerCm = ref(0)
  let rafId: number | null = null

  function convertFromCm(cm: number, u: RulerUnit): number {
    if (u === 'm') return cm / 100
    if (u === 'ft') return cm / 30.48
    return cm
  }

  function decimalsFor(u: RulerUnit): number {
    return u === 'cm' ? 0 : 2
  }

  function markerText(): string {
    return convertFromCm(markerCm.value, unit.value).toFixed(decimalsFor(unit.value))
  }

  function animateTo(targetCm: number) {
    currentCm.value = targetCm
    markerCm.value = 0
    const duration = 900
    const start = performance.now()
    if (rafId !== null) cancelAnimationFrame(rafId)
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      markerCm.value = targetCm * eased
      if (t < 1) {
        rafId = requestAnimationFrame(step)
      }
      else {
        rafId = null
        markerCm.value = targetCm
        Sounds.play('tick')
      }
    }
    rafId = requestAnimationFrame(step)
  }

  function setUnit(u: RulerUnit) {
    if (!['cm', 'm', 'ft'].includes(u)) return
    unit.value = u
  }

  function reset() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    currentCm.value = 0
    markerCm.value = 0
  }

  function getHeight(u?: RulerUnit): number {
    return convertFromCm(currentCm.value, u ?? unit.value)
  }

  function destroy() {
    if (rafId !== null) cancelAnimationFrame(rafId)
  }

  return { unit, currentCm, markerText, animateTo, setUnit, reset, getHeight, destroy }
}
