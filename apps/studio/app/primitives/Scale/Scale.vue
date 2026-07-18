<template>
  <div :class="['scale', variant === 'paper' ? 'scale-paper' : '']">
    <div class="scale-body">
      <!-- LCD display -->
      <div :class="['scale-display', { 'is-updated': isUpdated }]">
        <div class="scale-display-value">{{ displayText() }}</div>
        <div class="scale-display-unit">{{ unit }}</div>
      </div>

      <!-- Unit toggle -->
      <div class="scale-units">
        <button
          v-for="u in UNITS"
          :key="u"
          :class="['scale-unit-btn', { 'is-active': unit === u }]"
          type="button"
          @click="setUnit(u)"
        >
          {{ u }}
        </button>
      </div>

      <!-- Weighing plate (drop zone) -->
      <div
        ref="plateEl"
        :class="['scale-plate', {
          'is-hover-valid': hoverState === 'valid',
          'is-hover-invalid': hoverState === 'invalid',
        }]"
      >
        <div v-if="!items.length" class="scale-plate-empty">
          <svg class="scale-plate-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <div class="scale-plate-empty-text">Arrastra aqui</div>
        </div>

        <div v-for="item in items" :key="item.key" class="scale-chip">
          <span v-if="item.emoji" class="scale-chip-emoji">{{ item.emoji }}</span>
          <span v-if="item.label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { registerZone, unregisterZone, type DragPayload, type ZoneHandle } from '../dragdrop/registry'
import { Sounds } from '../sounds'
import { useScale } from './useScale'
import type { ScaleItem, ScaleUnit, ScaleVariant } from './Scale.types'

interface Props {
  unit?: ScaleUnit
  variant?: ScaleVariant
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'kg',
  variant: 'default',
})

const emit = defineEmits<{
  measure: [totalKg: number, unit: ScaleUnit]
}>()

const UNITS: ScaleUnit[] = ['kg', 'g', 'lb']

const { unit, totalKg, isUpdated, displayText, addWeight, setUnit, reset: resetLogic, getWeight, destroy }
  = useScale(props.unit)

const plateEl = ref<HTMLElement | null>(null)
const hoverState = ref<'valid' | 'invalid' | null>(null)
const items = ref<ScaleItem[]>([])
let itemKey = 0

function onDrop(payload: DragPayload) {
  const weight = payload.meta?.weight ?? 0
  items.value.push({ key: itemKey++, label: payload.label, emoji: payload.emoji, weightKg: weight })
  Sounds.play('pop')
  addWeight(weight)
  emit('measure', totalKg.value, unit.value)
}

const handle: ZoneHandle = {
  get el() {
    return plateEl.value!
  },
  canAccept: () => true, // the plate weighs anything, like the DS
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
  items.value = []
  resetLogic()
}

defineExpose({ setUnit, reset, getWeight })
</script>

<style scoped>
/* Visual ported from the StoryPlay DS (.scale block): one unified body with
   LCD display, unit toggle and weighing plate. Two themes via CSS vars. */
.scale {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  /* Default theme: ink-soft machine */
  --scale-body-bg: #4a4f66;
  --scale-body-shadow: #2d3142;
  --scale-plate-bg: #5c6178;
  --scale-plate-hover: #6b7089;
  --scale-plate-border: rgba(254, 247, 232, 0.28);
  --scale-plate-border-hover: rgba(254, 247, 232, 0.55);
  --scale-empty-color: rgba(254, 247, 232, 0.6);
  --scale-units-track: #2d3142;
  --scale-units-text: var(--paper);
  --scale-units-active-bg: var(--paper);
  --scale-units-active-text: var(--ink);
  --scale-chip-bg: var(--paper);
  --scale-chip-text: var(--ink);
  --scale-chip-shadow: var(--paper-dark);
}

/* Paper variant — cream body, matches the other primitives */
/* Variante clara: electrodoméstico gris claro (no crema — el papel se
   confundía con el canvas y se veía sucio) */
.scale.scale-paper {
  --scale-body-bg: #e8eaf1;
  --scale-body-shadow: #b6bccd;
  --scale-plate-bg: #f4f5f9;
  --scale-plate-hover: #e6e9f1;
  --scale-plate-border: rgba(61, 66, 86, 0.25);
  --scale-plate-border-hover: rgba(61, 66, 86, 0.5);
  --scale-empty-color: var(--ink-soft);
  --scale-units-track: #cdd2e0;
  --scale-units-text: var(--ink-soft);
  --scale-units-active-bg: var(--ink);
  --scale-units-active-text: #fff;
  --scale-chip-shadow: #b6bccd;
}

.scale-body {
  width: 300px;
  padding: 24px 16px;
  background: var(--scale-body-bg);
  border-radius: 28px;
  box-shadow: 0 6px 0 var(--scale-body-shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* LCD-style display */
.scale-display {
  width: 100%;
  padding: 16px;
  background: #0f3d2b;
  border-radius: 14px;
  box-shadow: inset 0 2px 0 rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
}

.scale-display-value {
  font-size: 36px;
  font-weight: 700;
  color: #8dff6b;
  letter-spacing: 2px;
  text-shadow: 0 0 6px rgba(141, 255, 107, 0.35);
  font-variant-numeric: tabular-nums;
}

.scale-display-unit {
  font-size: 16px;
  font-weight: 700;
  color: #8dff6b;
  text-transform: uppercase;
}

.scale-display.is-updated {
  animation: scale-display-pulse 500ms ease-out;
}

@keyframes scale-display-pulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

/* Unit toggle */
.scale-units {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--scale-units-track);
  border-radius: 999px;
  align-self: center;
}

.scale-unit-btn {
  padding: 6px 16px;
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 12px;
  color: var(--scale-units-text);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.55;
  transition: opacity 150ms, background 150ms, color 150ms;
}

.scale-unit-btn:hover { opacity: 0.85; }

.scale-unit-btn.is-active {
  background: var(--scale-units-active-bg);
  color: var(--scale-units-active-text);
  opacity: 1;
}

/* Weighing plate */
.scale-plate {
  position: relative;
  min-height: 140px;
  padding: 16px;
  background: var(--scale-plate-bg);
  border: 2px dashed var(--scale-plate-border);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  transition: background 200ms ease-out, border-color 200ms ease-out;
}

.scale-plate.is-hover-valid {
  background: var(--scale-plate-hover);
  border-color: var(--scale-plate-border-hover);
}

.scale-plate.is-hover-invalid {
  background: rgba(230, 57, 70, 0.18);
  border-color: rgba(230, 57, 70, 0.5);
  animation: scale-plate-shake 300ms ease-out;
}

@keyframes scale-plate-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
}

/* Weighed items as paper chips */
.scale-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--scale-chip-bg);
  color: var(--scale-chip-text);
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 3px 0 var(--scale-chip-shadow);
  animation: drop-zone-chip-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-chip-emoji {
  font-size: 18px;
  line-height: 1;
}

@keyframes drop-zone-chip-in {
  0% { opacity: 0; transform: translateY(-20px) scale(0.6) rotate(-8deg); }
  60% { opacity: 1; transform: translateY(4px) scale(1.08) rotate(2deg); }
  80% { transform: translateY(-2px) scale(0.98) rotate(-1deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
}

/* Empty state */
.scale-plate-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.scale-plate-empty-icon {
  width: 26px;
  height: 26px;
  color: var(--scale-empty-color);
  animation: scale-arrow-bob 1.8s ease-in-out infinite;
}

@keyframes scale-arrow-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.scale-plate-empty-text {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 11px;
  color: var(--scale-empty-color);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

/* ── Acabado v2 (nivel sprites): borde ink + banda de luz + LCD glossy +
   sombra de contacto ── */
.scale {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.scale::after {
  content: '';
  display: block;
  width: 68%;
  height: 8px;
  margin-top: 9px;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.1;
}

.scale-body {
  position: relative;
  overflow: hidden;
}

.scale-body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10px;
  right: 10px;
  height: 8px;
  border-radius: 0 0 8px 8px;
  background: rgba(255, 255, 255, 0.14);
  pointer-events: none;
}

.scale-display {
  position: relative;
  overflow: hidden;
}

.scale-display::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 8px;
  right: 8px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  pointer-events: none;
}

</style>
