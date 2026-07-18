<template>
  <div :class="['ruler', variant === 'paper' ? 'ruler-paper' : '']">
    <div class="ruler-body">
      <!-- Unit toggle -->
      <div class="ruler-units">
        <button
          v-for="u in UNITS"
          :key="u"
          :class="['ruler-unit-btn', { 'is-active': unit === u }]"
          type="button"
          @click="setUnit(u)"
        >
          {{ u }}
        </button>
      </div>

      <div class="ruler-stage">
        <!-- Vertical scale with marks -->
        <div class="ruler-scale">
          <div
            v-for="mark in marks"
            :key="`m${mark.cm}`"
            :class="['ruler-mark', mark.major ? 'is-major' : 'is-minor']"
            :style="{ bottom: `${mark.pct}%` }"
          />
          <div
            v-for="mark in marks.filter(m => m.major && m.cm > 0)"
            :key="`l${mark.cm}`"
            class="ruler-label"
            :style="{ bottom: `${mark.pct}%` }"
          >
            {{ mark.cm }}
          </div>
        </div>

        <!-- Measuring plate (drop zone) -->
        <div
          ref="plateEl"
          :class="['ruler-plate', {
            'is-hover-valid': hoverState === 'valid',
            'is-hover-invalid': hoverState === 'invalid',
          }]"
        >
          <div v-if="!object" class="ruler-plate-empty">
            <svg class="ruler-plate-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <div class="ruler-plate-empty-text">Arrastra para medir</div>
          </div>

          <!-- The measured object grows from the floor -->
          <div v-if="object" class="ruler-object" :style="{ height: `${objectPx}px` }">
            <span v-if="object.emoji" class="ruler-object-emoji">{{ object.emoji }}</span>
            <div v-if="object.label" class="ruler-object-label">{{ object.label }}</div>
          </div>

          <!-- Floating measurement pill -->
          <div
            v-if="object"
            :class="['ruler-marker', { 'is-visible': markerVisible }]"
            :style="{ bottom: `${objectPx}px` }"
          >
            <span class="ruler-marker-value">{{ markerText() }}</span>
            <span class="ruler-marker-unit">{{ unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { registerZone, unregisterZone, type DragPayload, type ZoneHandle } from '../dragdrop/registry'
import { useRuler } from './useRuler'
import type { RulerObject, RulerUnit, RulerVariant } from './Ruler.types'

interface Props {
  unit?: RulerUnit
  variant?: RulerVariant
  /** Scale max in cm */
  maxHeight?: number
  majorEvery?: number
  minorEvery?: number
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'cm',
  variant: 'default',
  maxHeight: 200,
  majorEvery: 50,
  minorEvery: 10,
})

const emit = defineEmits<{
  measure: [heightCm: number, unit: RulerUnit]
}>()

const UNITS: RulerUnit[] = ['cm', 'm', 'ft']

const { unit, markerText, animateTo, setUnit, reset: resetLogic, getHeight, destroy } = useRuler(props.unit)

const plateEl = ref<HTMLElement | null>(null)
const hoverState = ref<'valid' | 'invalid' | null>(null)
const object = ref<RulerObject | null>(null)
const objectPx = ref(0)
const markerVisible = ref(false)
let markerTimer: ReturnType<typeof setTimeout> | null = null

const marks = computed(() => {
  const out: { cm: number; pct: number; major: boolean }[] = []
  for (let cm = 0; cm <= props.maxHeight; cm += props.minorEvery) {
    out.push({ cm, pct: (cm / props.maxHeight) * 100, major: cm % props.majorEvery === 0 })
  }
  return out
})

function onDrop(payload: DragPayload) {
  const heightCm = payload.meta?.height ?? 0
  if (heightCm <= 0) return

  // Only one object measured at a time — the new one replaces the previous
  object.value = { label: payload.label, emoji: payload.emoji, heightCm }
  objectPx.value = 0
  markerVisible.value = false

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const stageH = plateEl.value?.clientHeight ?? 0
      objectPx.value = (heightCm / props.maxHeight) * stageH
      animateTo(heightCm)
    })
  })

  if (markerTimer) clearTimeout(markerTimer)
  markerTimer = setTimeout(() => {
    markerVisible.value = true
  }, 250)

  emit('measure', heightCm, unit.value)
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
  if (markerTimer) clearTimeout(markerTimer)
  destroy()
})

function reset() {
  object.value = null
  objectPx.value = 0
  markerVisible.value = false
  resetLogic()
}

defineExpose({ setUnit, reset, getHeight })
</script>

<style scoped>
/* Visual ported from the StoryPlay DS (.ruler block): vertical scale with
   marks + measuring plate where the object grows from the floor. */
.ruler {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  /* Default theme — ink-soft machine */
  --ruler-body-bg: #4a4f66;
  --ruler-body-shadow: #2d3142;
  --ruler-scale-bg: #5c6178;
  --ruler-mark-color: rgba(254, 247, 232, 0.85);
  --ruler-mark-minor: rgba(254, 247, 232, 0.4);
  --ruler-label-color: var(--paper);
  --ruler-plate-bg: #5c6178;
  --ruler-plate-hover: #6b7089;
  --ruler-plate-border: rgba(254, 247, 232, 0.28);
  --ruler-plate-border-hover: rgba(254, 247, 232, 0.55);
  --ruler-empty-color: rgba(254, 247, 232, 0.6);
  --ruler-marker: #ffd23f;
  --ruler-marker-shadow: #b88a00;
  --ruler-units-track: #2d3142;
  --ruler-units-text: var(--paper);
  --ruler-units-active-bg: var(--paper);
  --ruler-units-active-text: var(--ink);
  --ruler-object-bg: var(--paper);
  --ruler-object-text: var(--ink);
  --ruler-object-shadow: var(--paper-dark);
}

/* Variante clara: electrodoméstico gris claro (antes crema/papel) */
.ruler.ruler-paper {
  --ruler-body-bg: #e8eaf1;
  --ruler-body-shadow: #b6bccd;
  --ruler-scale-bg: #f4f5f9;
  --ruler-mark-color: var(--ink-soft);
  --ruler-mark-minor: rgba(74, 79, 102, 0.3);
  --ruler-label-color: var(--ink);
  --ruler-plate-bg: #f4f5f9;
  --ruler-plate-hover: #e6e9f1;
  --ruler-plate-border: rgba(61, 66, 86, 0.25);
  --ruler-plate-border-hover: var(--ink-soft);
  --ruler-empty-color: var(--ink-soft);
  --ruler-marker: #e09b1e;
  --ruler-marker-shadow: #9e6b12;
  --ruler-units-track: var(--paper-dark);
  --ruler-units-text: var(--ink-soft);
  --ruler-units-active-bg: var(--ink);
  --ruler-units-active-text: var(--paper);
  --ruler-object-shadow: var(--paper-deep);
}

.ruler-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--ruler-body-bg);
  border-radius: 28px;
  box-shadow: 0 6px 0 var(--ruler-body-shadow);
}

/* Unit toggle */
.ruler-units {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--ruler-units-track);
  border-radius: 999px;
  align-self: center;
}

.ruler-unit-btn {
  padding: 6px 16px;
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 12px;
  color: var(--ruler-units-text);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.55;
  transition: opacity 150ms, background 150ms, color 150ms;
}

.ruler-unit-btn:hover { opacity: 0.85; }

.ruler-unit-btn.is-active {
  background: var(--ruler-units-active-bg);
  color: var(--ruler-units-active-text);
  opacity: 1;
}

/* Stage: scale + plate side by side */
.ruler-stage {
  position: relative;
  display: flex;
  gap: 12px;
  height: 400px;
  min-width: 280px;
}

.ruler-scale {
  position: relative;
  width: 56px;
  background: var(--ruler-scale-bg);
  border-radius: 12px;
  flex-shrink: 0;
  overflow: hidden;
}

.ruler-mark {
  position: absolute;
  right: 0;
  height: 2px;
  pointer-events: none;
}

.ruler-mark.is-major {
  width: 22px;
  background: var(--ruler-mark-color);
}

.ruler-mark.is-minor {
  width: 10px;
  background: var(--ruler-mark-minor);
}

.ruler-label {
  position: absolute;
  left: 8px;
  transform: translateY(50%);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  color: var(--ruler-label-color);
  pointer-events: none;
}

/* Plate (drop zone) */
.ruler-plate {
  position: relative;
  flex: 1;
  min-width: 200px;
  background: var(--ruler-plate-bg);
  border: 2px dashed var(--ruler-plate-border);
  border-radius: 16px;
  transition: background 200ms, border-color 200ms;
}

.ruler-plate.is-hover-valid {
  background: var(--ruler-plate-hover);
  border-color: var(--ruler-plate-border-hover);
}

.ruler-plate.is-hover-invalid {
  background: rgba(230, 57, 70, 0.18);
  border-color: rgba(230, 57, 70, 0.5);
}

.ruler-plate-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.ruler-plate-empty-icon {
  width: 28px;
  height: 28px;
  color: var(--ruler-empty-color);
  animation: ruler-arrow-bob 1.8s ease-in-out infinite;
}

@keyframes ruler-arrow-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.ruler-plate-empty-text {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 11px;
  color: var(--ruler-empty-color);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-align: center;
  padding: 0 8px;
}

/* Measured object — grows from the bottom */
.ruler-object {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 88px;
  padding: 8px;
  background: var(--ruler-object-bg);
  color: var(--ruler-object-text);
  border-radius: 12px 12px 6px 6px;
  box-shadow: 0 3px 0 var(--ruler-object-shadow);
  overflow: hidden;
  transition: height 900ms cubic-bezier(0.25, 0.8, 0.4, 1);
}

.ruler-object-emoji {
  font-size: 40px;
  line-height: 1;
  margin-top: 8px;
}

.ruler-object-label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 12px;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* Floating measurement pill at the top of the object */
.ruler-marker {
  position: absolute;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--ruler-marker);
  color: var(--ink);
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 3px 0 var(--ruler-marker-shadow);
  transform: translate(-50%, 50%);
  opacity: 0;
  transition:
    opacity 300ms ease-out,
    bottom 900ms cubic-bezier(0.25, 0.8, 0.4, 1);
}

.ruler-marker.is-visible {
  opacity: 1;
}

.ruler-marker-value {
  font-variant-numeric: tabular-nums;
}

.ruler-marker-unit {
  font-size: 11px;
  opacity: 0.75;
  text-transform: uppercase;
}

/* ── Acabado v2: borde ink + sombra de contacto ── */
.ruler {
  position: relative;
}

.ruler::after {
  content: '';
  display: block;
  width: 64%;
  height: 8px;
  margin-top: 8px;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.1;
}

</style>
