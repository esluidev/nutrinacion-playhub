<template>
  <div :class="['thermometer-stage', variant === 'paper' ? 'thermometer-paper' : '']">
    <!-- Thermometer device (vertical wand) -->
    <div :class="['thermometer', { 'is-active': isActive }]" :style="zoneStyle">
      <div class="thermometer-bulb" />
      <div class="thermometer-column">
        <div class="thermometer-column-fill" :style="{ height: `${fillPct}%` }" />
      </div>
      <div :class="['thermometer-display', zoneKey ? `zone-${zoneKey}` : '', { 'is-measuring': isMeasuring }]">
        <div class="thermometer-display-value">
          <span class="thermometer-display-number">{{ displayNumber }}</span>
          <span class="thermometer-display-unit">°C</span>
        </div>
        <div class="thermometer-display-zone">{{ displayZone }}</div>
      </div>
    </div>

    <!-- Patient base (drop zone + measure action) -->
    <div class="thermometer-patient">
      <div
        ref="plateEl"
        :class="['thermometer-patient-plate', {
          'is-hover-valid': hoverState === 'valid',
          'is-hover-invalid': hoverState === 'invalid',
        }]"
      >
        <div v-if="!patient" class="thermometer-patient-empty">
          <svg class="thermometer-patient-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <div class="thermometer-patient-empty-text">Arrastra un paciente</div>
        </div>

        <div v-else class="thermometer-patient-chip">
          <span v-if="patient.emoji" class="thermometer-patient-chip-emoji">{{ patient.emoji }}</span>
          <span v-if="patient.label">{{ patient.label }}</span>
        </div>
      </div>

      <button class="thermometer-measure" type="button" :disabled="!patient || isMeasuring" @click="onMeasure">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Medir
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { registerZone, unregisterZone, type DragPayload, type ZoneHandle } from '../dragdrop/registry'
import { useThermometer } from './useThermometer'
import type { ThermometerPatient, ThermometerVariant, ThermometerZone, ThermometerZoneKey } from './Thermometer.types'

interface Props {
  variant?: ThermometerVariant
  minTemp?: number
  maxTemp?: number
  zones?: ThermometerZone[]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  minTemp: 33,
  maxTemp: 43,
  zones: undefined,
})

const emit = defineEmits<{
  measure: [tempC: number, zoneKey: ThermometerZoneKey]
}>()

const { isMeasuring, isActive, displayNumber, displayZone, zoneKey, fillPct, measure, setIdle, destroy }
  = useThermometer({
    minTemp: props.minTemp,
    maxTemp: props.maxTemp,
    zones: props.zones,
    onMeasure: (t, z) => emit('measure', t, z),
  })

const plateEl = ref<HTMLElement | null>(null)
const hoverState = ref<'valid' | 'invalid' | null>(null)
const patient = ref<ThermometerPatient | null>(null)

// Fill/bulb take the color of the measured zone
const zoneStyle = computed(() => {
  if (!zoneKey.value) return undefined
  return {
    '--therm-fill-color': `var(--therm-zone-${zoneKey.value})`,
    '--therm-active-color': `var(--therm-zone-${zoneKey.value})`,
  }
})

function onDrop(payload: DragPayload) {
  const tempC = payload.meta?.temp
  if (tempC === undefined) return
  // New patient replaces the previous; device goes idle (DS behavior)
  patient.value = { label: payload.label, emoji: payload.emoji, tempC }
  setIdle()
}

function onMeasure() {
  if (!patient.value) return
  measure(patient.value.tempC)
}

const handle: ZoneHandle = {
  get el() {
    return plateEl.value!
  },
  canAccept: () => true,
  accept: onDrop,
  reject: () => {},
  setHover: (state) => {
    hoverState.value = state
  },
}

onMounted(() => registerZone(handle))
onBeforeUnmount(() => {
  unregisterZone(handle)
  destroy()
})

function reset() {
  patient.value = null
  setIdle()
}

defineExpose({ measure: onMeasure, reset })
</script>

<style scoped>
/* Visual ported from the StoryPlay DS (.thermometer-stage block):
   vertical wand (bulb + column + display) + patient base, two themes. */
.thermometer-stage {
  display: flex;
  align-items: stretch;
  gap: 16px;
  /* Default theme */
  --therm-body-bg: #4a4f66;
  --therm-body-shadow: #2d3142;
  --therm-column-bg: #2d3142;
  --therm-column-border: rgba(254, 247, 232, 0.15);
  --therm-display-bg: #0f1218;
  --therm-display-text: var(--paper);
  --therm-plate-bg: #5c6178;
  --therm-plate-hover: #6b7089;
  --therm-plate-border: rgba(254, 247, 232, 0.28);
  --therm-plate-border-hover: rgba(254, 247, 232, 0.55);
  --therm-empty-color: rgba(254, 247, 232, 0.6);
  --therm-btn-bg: var(--paper);
  --therm-btn-text: var(--ink);
  --therm-btn-shadow: var(--paper-dark);
  /* Zone colors */
  --therm-zone-cold: #3aa8e0;
  --therm-zone-normal: #6bbf8a;
  --therm-zone-warm: #f4c542;
  --therm-zone-hot: #f08a3c;
  --therm-zone-critical: #e63946;
}

.thermometer-stage.thermometer-paper {
  --therm-body-bg: #e8eaf1;
  --therm-body-shadow: #b6bccd;
  --therm-column-bg: #d8dce8;
  --therm-column-border: transparent;
  --therm-display-bg: var(--ink);
  --therm-display-text: var(--paper);
  --therm-plate-bg: #f4f5f9;
  --therm-plate-hover: #e6e9f1;
  --therm-plate-border: rgba(61, 66, 86, 0.25);
  --therm-plate-border-hover: var(--ink-soft);
  --therm-empty-color: var(--ink-soft);
  --therm-btn-bg: var(--ink);
  --therm-btn-text: var(--paper);
  --therm-btn-shadow: var(--ink-dark);
  /* Darker, more saturated zone colors for contrast on cream */
  --therm-zone-cold: #1e78a8;
  --therm-zone-normal: #15803d;
  --therm-zone-warm: #c49b2a;
  --therm-zone-hot: #b25d1f;
  --therm-zone-critical: #a62532;
}

/* ---- Device ---- */
.thermometer {
  width: 120px;
  padding: 12px;
  background: var(--therm-body-bg);
  border-radius: 24px;
  box-shadow: 0 6px 0 var(--therm-body-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.thermometer-bulb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--therm-column-bg);
  border: 2px solid var(--therm-column-border);
  margin-top: 4px;
  transition: background 300ms, border-color 300ms, box-shadow 300ms;
}

.thermometer.is-active .thermometer-bulb {
  background: var(--therm-active-color, var(--therm-zone-normal));
  border-color: var(--therm-active-color, var(--therm-zone-normal));
  box-shadow: 0 0 12px var(--therm-active-color, var(--therm-zone-normal));
}

.thermometer-column {
  position: relative;
  width: 26px;
  height: 260px;
  background: var(--therm-column-bg);
  border: 1px solid var(--therm-column-border);
  border-radius: 13px;
  overflow: hidden;
}

.thermometer-stage.thermometer-paper .thermometer-column {
  border: none;
}

.thermometer-column-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0;
  background: var(--therm-fill-color, var(--therm-zone-normal));
  border-radius: 13px 13px 0 0;
  transition:
    height 1200ms cubic-bezier(0.25, 0.8, 0.4, 1),
    background 400ms ease-out;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15) inset;
}

.thermometer-column-fill::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 8px;
  bottom: 8px;
  width: 4px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
}

/* Display */
.thermometer-display {
  width: 100%;
  padding: 8px;
  background: var(--therm-display-bg);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 62px;
  justify-content: center;
}

.thermometer-display-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: var(--therm-display-text);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.thermometer-display.zone-cold .thermometer-display-value { color: var(--therm-zone-cold); }
.thermometer-display.zone-normal .thermometer-display-value { color: var(--therm-zone-normal); }
.thermometer-display.zone-warm .thermometer-display-value { color: var(--therm-zone-warm); }
.thermometer-display.zone-hot .thermometer-display-value { color: var(--therm-zone-hot); }
.thermometer-display.zone-critical .thermometer-display-value { color: var(--therm-zone-critical); }

.thermometer-display-number { font-size: 22px; }
.thermometer-display-unit { font-size: 11px; opacity: 0.7; }

.thermometer-display-zone {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--therm-display-text);
  opacity: 0.5;
  text-align: center;
  line-height: 1;
}

.thermometer-display.zone-cold .thermometer-display-zone { color: var(--therm-zone-cold); opacity: 1; }
.thermometer-display.zone-normal .thermometer-display-zone { color: var(--therm-zone-normal); opacity: 1; }
.thermometer-display.zone-warm .thermometer-display-zone { color: var(--therm-zone-warm); opacity: 1; }
.thermometer-display.zone-hot .thermometer-display-zone { color: var(--therm-zone-hot); opacity: 1; }
.thermometer-display.zone-critical .thermometer-display-zone { color: var(--therm-zone-critical); opacity: 1; }

.thermometer-display.is-measuring .thermometer-display-value {
  animation: therm-measuring-blink 0.6s infinite alternate;
}

@keyframes therm-measuring-blink {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

/* ---- Patient base ---- */
.thermometer-patient {
  flex: 1;
  min-width: 200px;
  padding: 16px;
  background: var(--therm-body-bg);
  border-radius: 28px;
  box-shadow: 0 6px 0 var(--therm-body-shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  justify-content: space-between;
}

.thermometer-patient-plate {
  flex: 1;
  min-height: 140px;
  padding: 12px;
  background: var(--therm-plate-bg);
  border: 2px dashed var(--therm-plate-border);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  transition: background 200ms, border-color 200ms;
}

.thermometer-patient-plate.is-hover-valid {
  background: var(--therm-plate-hover);
  border-color: var(--therm-plate-border-hover);
}

.thermometer-patient-plate.is-hover-invalid {
  background: rgba(230, 57, 70, 0.18);
  border-color: rgba(230, 57, 70, 0.5);
}

.thermometer-patient-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--paper);
  color: var(--ink);
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 3px 0 var(--paper-dark);
  animation: therm-chip-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.thermometer-patient-chip-emoji {
  font-size: 20px;
  line-height: 1;
}

@keyframes therm-chip-in {
  0% { opacity: 0; transform: translateY(-20px) scale(0.6) rotate(-8deg); }
  60% { opacity: 1; transform: translateY(4px) scale(1.08) rotate(2deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
}

.thermometer-patient-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.thermometer-patient-empty-icon {
  width: 28px;
  height: 28px;
  color: var(--therm-empty-color);
  animation: therm-arrow-bob 1.8s ease-in-out infinite;
}

@keyframes therm-arrow-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.thermometer-patient-empty-text {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 11px;
  color: var(--therm-empty-color);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-align: center;
}

/* Measure button */
.thermometer-measure {
  padding: 12px 16px;
  background: var(--therm-btn-bg);
  color: var(--therm-btn-text);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--therm-btn-shadow);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 150ms, box-shadow 150ms, opacity 200ms;
}

.thermometer-measure:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--therm-btn-shadow);
}

.thermometer-measure:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--therm-btn-shadow);
}

.thermometer-measure:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.thermometer-measure svg {
  width: 16px;
  height: 16px;
}

/* ── Acabado v2: contorno ink en cuerpo y display + brillo del bulbo +
   sombra de contacto bajo el plato del paciente ── */
.thermometer {
  filter: drop-shadow(0 3px 0 rgba(61, 66, 86, 0.18));
}

.thermometer-bulb {
  position: relative;
}

.thermometer-bulb::after {
  content: '';
  position: absolute;
  top: 18%;
  left: 20%;
  width: 26%;
  height: 26%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
}


.thermometer-patient::after {
  content: '';
  display: block;
  width: 62%;
  height: 8px;
  margin: 8px auto 0;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.1;
}

</style>
