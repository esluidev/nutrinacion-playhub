<template>
  <div ref="root" class="glucometer-stage">
    <!-- Patient list (top, horizontal) -->
    <div class="glucometer-patient-list">
      <div
        v-for="p in patients"
        :key="p.id"
        :class="['glucometer-patient-card', {
          'is-selected': selected?.id === p.id,
          'is-done': doneResults[p.id] !== undefined,
        }]"
        @click="selectPatient(p.id)"
      >
        <div class="glucometer-patient-avatar">{{ p.avatar ?? '👤' }}</div>
        <div class="glucometer-patient-info">
          <div class="glucometer-patient-name">{{ p.name }}</div>
          <div class="glucometer-patient-age">{{ p.age }} anios</div>
        </div>
        <div
          v-if="doneResults[p.id] !== undefined"
          :class="['glucometer-patient-result', `zone-${doneResults[p.id]!.zone}`]"
        >
          {{ doneResults[p.id]!.value }}
        </div>
      </div>
    </div>

    <!-- Bottom row: patient zone + device -->
    <div class="glucometer-row">
      <!-- Patient slot + actions -->
      <div class="glucometer-patient-zone">
        <div class="glucometer-patient-slot">
          <div v-if="!selected" class="glucometer-patient-empty-text">
            Selecciona<br>un paciente
          </div>
          <div v-else class="glucometer-patient-display">
            <div class="avatar-big">{{ selected.avatar ?? '👤' }}</div>
            <div class="name-big">{{ selected.name }}</div>
            <div :class="['glucometer-finger', { 'has-blood': hasBlood }]">
              <div class="glucometer-finger-shape">
                <div class="glucometer-finger-nail" />
              </div>
              <div ref="dropEl" class="glucometer-blood-drop" :style="{ opacity: dropHidden ? 0 : undefined }" />
            </div>
          </div>
        </div>
        <div class="glucometer-actions">
          <button class="glucometer-action-btn" type="button" :disabled="state !== 'patient-selected'" @click="measure">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Medir
          </button>
        </div>
      </div>

      <!-- Glucometer device -->
      <div :class="['glucometer', { 'is-measuring': isMeasuring, 'is-done': isDone }, doneZone ? `zone-${doneZone}` : '']">
        <div :class="['glucometer-display', displayZone ? `zone-${displayZone}` : '']">
          <div class="glucometer-display-value">{{ displayValue }}</div>
          <div class="glucometer-display-unit">mg/dL</div>
          <div class="glucometer-display-zone">{{ displayZoneLabel }}</div>
        </div>
        <div class="glucometer-progress">
          <div class="glucometer-progress-fill" />
        </div>
        <div class="glucometer-strip-slot">
          <div class="glucometer-strip-port" />
          <div ref="stripEl" :class="['glucometer-strip', { 'is-inserted': stripInserted, 'has-blood': stripHasBlood }]" />
        </div>
      </div>
    </div>

    <!-- Blood drop flying to the strip (local coordinates, scale-safe) -->
    <div
      v-if="fly"
      class="glucometer-blood-fly"
      :style="{
        left: `${fly.left}px`,
        top: `${fly.top}px`,
        transform: fly.flying ? `translate(${fly.dx}px, ${fly.dy}px) scale(0.85)` : undefined,
        opacity: fly.fading ? 0 : undefined,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { GlucometerPatient, GlucometerState, GlucoZoneKey } from './Glucometer.types'

interface Props {
  patients: GlucometerPatient[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  measure: [value: number, zoneKey: GlucoZoneKey, patient: GlucometerPatient]
  complete: []
}>()

interface FlyState {
  left: number
  top: number
  dx: number
  dy: number
  flying: boolean
  fading: boolean
}

const root = ref<HTMLElement | null>(null)
const dropEl = ref<HTMLElement | null>(null)
const stripEl = ref<HTMLElement | null>(null)

const state = ref<GlucometerState>('empty')
const selected = ref<GlucometerPatient | null>(null)
const doneResults = ref<Record<string, { value: number; zone: GlucoZoneKey }>>({})

const hasBlood = ref(false)
const dropHidden = ref(false)
const stripInserted = ref(false)
const stripHasBlood = ref(false)
const isMeasuring = ref(false)
const isDone = ref(false)
const doneZone = ref<GlucoZoneKey | null>(null)
const displayValue = ref('--')
const displayZone = ref<GlucoZoneKey | null>(null)
const displayZoneLabel = ref('')
const fly = ref<FlyState | null>(null)

const timers: ReturnType<typeof setTimeout>[] = []

// Glycemic ranges from the DS
function classifyGlucose(value: number): { key: GlucoZoneKey; label: string } {
  if (value < 70) return { key: 'low', label: 'Baja' }
  if (value <= 140) return { key: 'normal', label: 'Normal' }
  if (value <= 180) return { key: 'high', label: 'Alta' }
  return { key: 'critical', label: 'Muy alta' }
}

function resetDeviceVisuals() {
  stripInserted.value = false
  stripHasBlood.value = false
  isMeasuring.value = false
  isDone.value = false
  doneZone.value = null
  hasBlood.value = false
  dropHidden.value = false
  fly.value = null
}

function setDisplay(value: string, zone: GlucoZoneKey | null, label = '') {
  displayValue.value = value
  displayZone.value = zone
  displayZoneLabel.value = label
}

function selectPatient(id: string) {
  if (state.value === 'measuring') return
  if (doneResults.value[id] !== undefined) return
  const p = props.patients.find(x => x.id === id)
  if (!p) return
  if (state.value === 'done') resetDeviceVisuals()
  selected.value = p
  state.value = 'patient-selected'
  hasBlood.value = false
  dropHidden.value = false
  setDisplay('--', null, '')
}

/** Visual scale of the stage (1 outside the 1280×800 game stage) */
function visualScale(): number {
  const el = root.value
  if (!el || !el.offsetWidth) return 1
  return el.getBoundingClientRect().width / el.offsetWidth
}

/* Single-button flow, timings from the DS:
   0ms insert strip → 500ms blood appears → 1100ms drop flies (700ms flight)
   → strip has blood + measuring blink → +1500ms reveal result */
function measure() {
  if (state.value !== 'patient-selected' || !selected.value) return
  state.value = 'measuring'

  stripInserted.value = true

  timers.push(setTimeout(() => {
    hasBlood.value = true
  }, 500))

  timers.push(setTimeout(() => {
    flyBloodToStrip()

    timers.push(setTimeout(() => {
      stripHasBlood.value = true
      isMeasuring.value = true
      setDisplay('--', null, 'Midiendo...')

      timers.push(setTimeout(() => {
        isMeasuring.value = false
        const patient = selected.value!
        const zone = classifyGlucose(patient.glucose)
        setDisplay(String(patient.glucose), zone.key, zone.label)
        isDone.value = true
        doneZone.value = zone.key
        doneResults.value = { ...doneResults.value, [patient.id]: { value: patient.glucose, zone: zone.key } }
        state.value = 'done'
        emit('measure', patient.glucose, zone.key, patient)
        if (Object.keys(doneResults.value).length >= props.patients.length) emit('complete')
      }, 1500))
    }, 720)) // DS: the flight resolves at 720ms; the fade-out continues behind
  }, 1100))
}

function flyBloodToStrip() {
  const rootEl = root.value
  const drop = dropEl.value
  const strip = stripEl.value
  if (!rootEl || !drop || !strip) return

  const scale = visualScale()
  const rootRect = rootEl.getBoundingClientRect()
  const dropRect = drop.getBoundingClientRect()
  const stripRect = strip.getBoundingClientRect()

  // The reactive tip sits ~16px above the strip's bottom edge (DS)
  const tipCenterX = stripRect.left + stripRect.width / 2
  const tipCenterY = stripRect.bottom - 16 * scale

  fly.value = {
    left: (dropRect.left - rootRect.left) / scale,
    top: (dropRect.top - rootRect.top) / scale,
    dx: (tipCenterX - (dropRect.left + dropRect.width / 2)) / scale,
    dy: (tipCenterY - (dropRect.top + dropRect.height / 2)) / scale,
    flying: false,
    fading: false,
  }
  dropHidden.value = true

  requestAnimationFrame(() => {
    if (fly.value) fly.value = { ...fly.value, flying: true }
  })

  timers.push(setTimeout(() => {
    if (fly.value) fly.value = { ...fly.value, fading: true }
    timers.push(setTimeout(() => {
      fly.value = null
    }, 220))
  }, 720))
}

/** Keep measured patients, clear the slot/device for the next one */
function next() {
  state.value = 'empty'
  selected.value = null
  resetDeviceVisuals()
  setDisplay('--', null, '')
}

/** Full reset: clears measured patients too */
function reset() {
  timers.forEach(clearTimeout)
  timers.length = 0
  doneResults.value = {}
  next()
}

onBeforeUnmount(() => timers.forEach(clearTimeout))

defineExpose({ selectPatient, measure, next, reset })
</script>

<style scoped>
/* Visual ported from the StoryPlay DS (.glucometer-stage block). */
.glucometer-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  width: 100%;
  max-width: 720px;
  padding-bottom: 100px; /* room for the strip hanging below the device */
  --gluco-body-bg: #4a4f66;
  --gluco-body-shadow: #2d3142;
  --gluco-display-bg: #0f1218;
  --gluco-display-text: var(--paper);
  --gluco-strip-body: #fff7e8;
  --gluco-strip-tip: #c9bc8d;
  --gluco-plate-bg: #5c6178;
  --gluco-plate-border: rgba(254, 247, 232, 0.28);
  --gluco-empty-color: rgba(254, 247, 232, 0.6);
  --gluco-btn-bg: var(--paper);
  --gluco-btn-text: var(--ink);
  --gluco-blood: #d62439;
  --gluco-blood-dark: #8e1e2d;
  --gluco-zone-low: #3aa8e0;
  --gluco-zone-normal: #6bbf8a;
  --gluco-zone-high: #f4c542;
  --gluco-zone-critical: #e63946;
}

.glucometer-row {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

/* ---- Patient list ---- */
.glucometer-patient-list {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.glucometer-patient-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  min-width: 88px;
  background: #ffffff;
  border: 3px solid var(--ink);
  border-radius: 16px;
  box-shadow: 0 4px 0 var(--ink);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 150ms ease-out,
    opacity 200ms;
}

.glucometer-patient-card:hover:not(.is-selected):not(.is-done) {
  transform: translateY(-1px);
  box-shadow: 0 5px 0 var(--ink);
}

.glucometer-patient-card:active:not(.is-selected):not(.is-done) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.glucometer-patient-card.is-selected {
  background: #fef4d4;
  cursor: default;
}

.glucometer-patient-card.is-done {
  opacity: 0.55;
  cursor: default;
}

.glucometer-patient-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--paper);
  border: 2px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.glucometer-patient-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 0;
}

.glucometer-patient-name {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 12px;
  color: var(--ink);
  line-height: 1.1;
}

.glucometer-patient-age {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 10px;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.glucometer-patient-result {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 36px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 2px solid var(--ink);
  background: #ffffff;
  color: var(--ink);
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  pointer-events: none;
}

.glucometer-patient-result.zone-low { background: var(--gluco-zone-low); color: #ffffff; }
.glucometer-patient-result.zone-normal { background: var(--gluco-zone-normal); color: #ffffff; }
.glucometer-patient-result.zone-high { background: var(--gluco-zone-high); color: var(--ink); }
.glucometer-patient-result.zone-critical { background: var(--gluco-zone-critical); color: #ffffff; }

/* ---- Patient zone ---- */
.glucometer-patient-zone {
  flex: 1;
  min-width: 220px;
  padding: 12px;
  background: var(--gluco-body-bg);
  border-radius: 22px;
  box-shadow: 0 6px 0 var(--gluco-body-shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.glucometer-patient-slot {
  height: 200px;
  padding: 12px 12px 8px;
  background: var(--gluco-plate-bg);
  border: 2px dashed var(--gluco-plate-border);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.glucometer-patient-empty-text {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--gluco-empty-color);
  text-align: center;
  line-height: 1.3;
}

.glucometer-patient-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  position: relative;
}

.glucometer-patient-display .avatar-big {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--paper);
  border: 3px solid var(--ink-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.glucometer-patient-display .name-big {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 13px;
  color: var(--paper);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

/* Finger + blood drop */
.glucometer-finger {
  position: relative;
  width: 50px;
  height: 70px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-top: 4px;
}

.glucometer-finger-shape {
  width: 32px;
  height: 56px;
  background: #f5cdb0;
  border: 3px solid var(--ink-dark);
  border-radius: 16px 16px 12px 12px;
  position: relative;
}

.glucometer-finger-nail {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 10px;
  background: #f7dfc8;
  border-radius: 50%;
  border: 1.5px solid #b88a6e;
}

.glucometer-blood-drop {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  width: 18px;
  height: 22px;
  background: var(--gluco-blood);
  border: 2px solid var(--gluco-blood-dark);
  border-radius: 50% 50% 50% 50% / 65% 65% 35% 35%;
  transform-origin: center bottom;
  transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glucometer-finger.has-blood .glucometer-blood-drop {
  transform: translateX(-50%) scale(1);
}

/* Flying blood drop */
.glucometer-blood-fly {
  position: absolute;
  width: 18px;
  height: 22px;
  background: var(--gluco-blood);
  border: 2px solid var(--gluco-blood-dark);
  border-radius: 50% 50% 50% 50% / 65% 65% 35% 35%;
  pointer-events: none;
  z-index: 50;
  transition:
    transform 700ms cubic-bezier(0.45, 0, 0.55, 1),
    opacity 200ms ease-out;
}

/* Action buttons */
.glucometer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.glucometer-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--gluco-btn-bg);
  color: var(--gluco-btn-text);
  border: 3px solid var(--ink-dark);
  border-radius: 14px;
  box-shadow: 0 3px 0 var(--ink-dark);
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform 100ms ease-out,
    box-shadow 100ms ease-out,
    opacity 200ms;
}

.glucometer-action-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 var(--ink-dark);
}

.glucometer-action-btn:not(:disabled):active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink-dark);
}

.glucometer-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.glucometer-action-btn svg {
  width: 16px;
  height: 16px;
}

/* ---- Device ---- */
.glucometer {
  flex: 1;
  min-width: 200px;
  max-width: 260px;
  padding: 12px;
  background: var(--gluco-body-bg);
  border-radius: 22px;
  box-shadow: 0 6px 0 var(--gluco-body-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.glucometer-display {
  width: 100%;
  background: var(--gluco-display-bg);
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 92px;
  justify-content: center;
}

.glucometer-display-value {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 30px;
  color: var(--gluco-display-text);
  line-height: 1;
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
}

.glucometer-display.zone-low .glucometer-display-value { color: var(--gluco-zone-low); }
.glucometer-display.zone-normal .glucometer-display-value { color: var(--gluco-zone-normal); }
.glucometer-display.zone-high .glucometer-display-value { color: var(--gluco-zone-high); }
.glucometer-display.zone-critical .glucometer-display-value { color: var(--gluco-zone-critical); }

.glucometer-display-unit {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 10px;
  color: var(--gluco-display-text);
  opacity: 0.7;
  letter-spacing: 1px;
}

.glucometer-display-zone {
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--gluco-display-text);
  opacity: 0.4;
  margin-top: 2px;
  min-height: 13px;
}

.glucometer-display.zone-low .glucometer-display-zone { color: var(--gluco-zone-low); opacity: 1; }
.glucometer-display.zone-normal .glucometer-display-zone { color: var(--gluco-zone-normal); opacity: 1; }
.glucometer-display.zone-high .glucometer-display-zone { color: var(--gluco-zone-high); opacity: 1; }
.glucometer-display.zone-critical .glucometer-display-zone { color: var(--gluco-zone-critical); opacity: 1; }

.glucometer.is-measuring .glucometer-display-value {
  animation: glucometer-measuring-blink 0.6s infinite alternate;
}

@keyframes glucometer-measuring-blink {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

/* Measuring progress bar */
.glucometer-progress {
  width: 80%;
  height: 8px;
  margin-top: 16px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 999px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.glucometer.is-measuring .glucometer-progress,
.glucometer.is-done .glucometer-progress {
  opacity: 1;
}

.glucometer-progress-fill {
  width: 0;
  height: 100%;
  background: var(--paper);
  border-radius: 999px;
}

.glucometer.is-measuring .glucometer-progress-fill {
  animation: glucometer-progress-fill 1.5s cubic-bezier(0.4, 0, 0.6, 1) forwards;
}

.glucometer.is-done .glucometer-progress-fill {
  width: 100%;
}

.glucometer.is-done.zone-low .glucometer-progress-fill { background: var(--gluco-zone-low); }
.glucometer.is-done.zone-normal .glucometer-progress-fill { background: var(--gluco-zone-normal); }
.glucometer.is-done.zone-high .glucometer-progress-fill { background: var(--gluco-zone-high); }
.glucometer.is-done.zone-critical .glucometer-progress-fill { background: var(--gluco-zone-critical); }

@keyframes glucometer-progress-fill {
  0% { width: 0%; }
  100% { width: 100%; }
}

/* ---- Strip ---- */
.glucometer-strip-slot {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 84px;
  pointer-events: none;
}

.glucometer-strip-port {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  height: 10px;
  background: #15182a;
  border-radius: 2px;
  box-shadow:
    inset 0 2px 3px rgba(0, 0, 0, 0.7),
    inset 0 -1px 0 rgba(255, 255, 255, 0.04);
  z-index: 2;
}

.glucometer-strip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 62px;
  height: 0;
  background: var(--gluco-strip-body);
  border: 2px solid var(--ink-dark);
  border-top: none;
  border-radius: 0 0 6px 6px;
  margin-top: -22px;
  transition:
    height 450ms cubic-bezier(0.34, 1.4, 0.64, 1),
    visibility 0s linear 450ms;
  overflow: hidden;
  z-index: 1;
  visibility: hidden;
}

.glucometer-strip.is-inserted {
  height: 95px;
  visibility: visible;
  transition:
    height 450ms cubic-bezier(0.34, 1.4, 0.64, 1),
    visibility 0s linear 0s;
}

/* Contact lines near the top */
.glucometer-strip::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: var(--gluco-strip-tip);
  box-shadow: 0 4px 0 var(--gluco-strip-tip);
  opacity: 0.55;
}

/* Reactive tip at the bottom */
.glucometer-strip::after {
  content: '';
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 42px;
  height: 18px;
  background: var(--gluco-strip-tip);
  border: 1.5px solid var(--ink-dark);
  border-radius: 3px;
  transition: background 300ms, border-color 300ms;
}

.glucometer-strip.has-blood::after {
  background: var(--gluco-blood);
  border-color: var(--gluco-blood-dark);
}

/* ── Acabado v2: tarjetas de paciente con borde ink suave + sombra de
   contacto del escenario ── */

.glucometer-stage::after {
  content: '';
  display: block;
  width: 56%;
  height: 8px;
  margin: 2px auto 0;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.08;
}

</style>
