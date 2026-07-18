import { ref } from 'vue'
import { Sounds } from '../sounds'
import { DEFAULT_ZONES, type ThermometerZone, type ThermometerZoneKey } from './Thermometer.types'

export interface UseThermometerOptions {
  minTemp?: number
  maxTemp?: number
  zones?: ThermometerZone[]
  onMeasure?: (tempC: number, zoneKey: ThermometerZoneKey) => void
}

// Logic ported from the Thermometer class of the StoryPlay reference DS:
// measure() blinks "Midiendo" for 1800ms, then fills the column to the
// clamped percentage and reveals value + zone label with its color.
export function useThermometer(opts: UseThermometerOptions = {}) {
  const minTemp = opts.minTemp ?? 33
  const maxTemp = opts.maxTemp ?? 43
  const zones = opts.zones ?? DEFAULT_ZONES

  const isMeasuring = ref(false)
  const isActive = ref(false)
  const displayNumber = ref('--.-')
  const displayZone = ref('Esperando')
  const zoneKey = ref<ThermometerZoneKey | null>(null)
  const fillPct = ref(0)
  let revealTimer: ReturnType<typeof setTimeout> | null = null

  function zoneFor(tempC: number): ThermometerZone {
    return zones.find(z => tempC < z.max) ?? zones[zones.length - 1]!
  }

  function setIdle() {
    if (revealTimer) clearTimeout(revealTimer)
    isMeasuring.value = false
    isActive.value = false
    displayNumber.value = '--.-'
    displayZone.value = 'Esperando'
    zoneKey.value = null
    fillPct.value = 0
  }

  function measure(tempC: number) {
    if (isMeasuring.value || Number.isNaN(tempC)) return
    isMeasuring.value = true
    isActive.value = true
    displayNumber.value = '--.-'
    displayZone.value = 'Midiendo'
    zoneKey.value = null

    revealTimer = setTimeout(() => {
      const zone = zoneFor(tempC)
      const clamped = Math.max(minTemp, Math.min(maxTemp, tempC))
      fillPct.value = ((clamped - minTemp) / (maxTemp - minTemp)) * 100
      displayNumber.value = tempC.toFixed(1)
      displayZone.value = zone.label
      zoneKey.value = zone.key
      isMeasuring.value = false
      Sounds.play('success')
      opts.onMeasure?.(tempC, zone.key)
    }, 1800)
  }

  function destroy() {
    if (revealTimer) clearTimeout(revealTimer)
  }

  return { isMeasuring, isActive, displayNumber, displayZone, zoneKey, fillPct, measure, setIdle, destroy }
}
