import { ref } from 'vue'
import type { WheelOptions } from './Wheel.types'

// Spin logic ported from the Wheel class of the StoryPlay reference DS.
// The winning sector is picked UPFRONT and the rotation lands exactly at its
// center — the pointer never stops on a border. Boundary crossings drive the
// pointer tick (throttled to avoid jitter at high speed).
export function useWheel(opts: WheelOptions = {}) {
  const sectors = opts.sectors ?? 4
  const rotation = ref(0)
  const isSpinning = ref(false)
  const isTicking = ref(false)
  let rafId: number | null = null
  let tickResetTimer: ReturnType<typeof setTimeout> | null = null

  const DURATION = 4000 // must match the CSS transition on .wheel-disc
  const MIN_TICK_INTERVAL = 45 // ms

  // Mirror of the CSS easing cubic-bezier(0.15, 0.85, 0.25, 1)
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3.5)

  function triggerPointerTick() {
    isTicking.value = false
    requestAnimationFrame(() => {
      isTicking.value = true
    })
    if (tickResetTimer) clearTimeout(tickResetTimer)
    tickResetTimer = setTimeout(() => {
      isTicking.value = false
    }, 150)
  }

  /** Gira la rueda. `target` (opcional) fija el sector donde cae — para
   *  juegos con resultado curado (p. ej. solo sectores pendientes); sin
   *  argumento, sector aleatorio (comportamiento original). */
  function spin(target?: number) {
    if (isSpinning.value) return
    isSpinning.value = true

    const step = 360 / sectors
    const targetSector = target ?? Math.floor(Math.random() * sectors)

    // Pointer points straight up; sector 0 is centered at 12 o'clock
    const currentAngle = ((rotation.value % 360) + 360) % 360
    const targetAngleMod = (360 - targetSector * step) % 360
    let angleToAdd = targetAngleMod - currentAngle
    if (angleToAdd <= 0) angleToAdd += 360

    const extraTurns = 5 + Math.floor(Math.random() * 3)
    const totalDelta = extraTurns * 360 + angleToAdd
    rotation.value += totalDelta

    const start = performance.now()
    let lastCrossed = 0
    let lastTickTime = 0
    // Stop ticking near the end — avoids a ghost tick after the visual stop
    const tickCutoffAngle = totalDelta - step * 0.4

    const frame = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1)
      const currentDelta = totalDelta * easeOut(t)

      if (currentDelta < tickCutoffAngle) {
        const crossingsNow = Math.floor(currentDelta / step)
        while (lastCrossed < crossingsNow) {
          lastCrossed++
          if (now - lastTickTime >= MIN_TICK_INTERVAL) {
            triggerPointerTick()
            opts.onTick?.(lastCrossed)
            lastTickTime = now
          }
        }
      }

      if (t < 1) {
        rafId = requestAnimationFrame(frame)
      }
      else {
        isSpinning.value = false
        rafId = null
        opts.onLand?.(targetSector)
      }
    }
    rafId = requestAnimationFrame(frame)
  }

  /** Reset rotation without animation. The component must disable the CSS
      transition for one frame while this applies (see Wheel.vue). */
  function reset() {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    isSpinning.value = false
    rotation.value = 0
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId)
    if (tickResetTimer) clearTimeout(tickResetTimer)
  }

  return { rotation, isSpinning, isTicking, spin, reset, destroy }
}
