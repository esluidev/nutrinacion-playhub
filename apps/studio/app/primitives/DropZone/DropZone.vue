<template>
  <div
    ref="root"
    :class="[
      'drop-zone',
      color !== 'default' ? `drop-zone-${color}` : '',
      {
        'is-hover-valid': hoverState === 'valid',
        'is-hover-invalid': hoverState === 'invalid',
        'is-celebrating': isCelebrating,
        'is-full': isFull,
      },
    ]"
  >
    <!-- Header: emoji badge + title -->
    <div v-if="title" class="drop-zone-header">
      <span v-if="emoji || $slots.icon" class="drop-zone-badge"><slot name="icon">{{ emoji }}</slot></span>
      <span class="drop-zone-title">{{ title }}</span>
    </div>

    <!-- Contents. The `chip` slot lets the game render what landed (e.g. the
         element's sticker) instead of the default name chip -->
    <div class="drop-zone-slots">
      <div v-for="chip in chips" :key="chip.key" class="drop-zone-item">
        <slot name="chip" :chip="chip">
          <div :class="['drop-zone-chip', chip.color ? `chip-${chip.color}` : '']">
            <span v-if="chip.emoji" class="drop-zone-chip-emoji">{{ chip.emoji }}</span>
            <span v-if="chip.label" class="drop-zone-chip-label">{{ chip.label }}</span>
          </div>
        </slot>
      </div>

      <!-- Empty-state hint (slot mark, like the "?" of the ruleta) -->
      <div v-if="!chips.length" class="drop-zone-empty">
        <svg class="drop-zone-empty-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4v14M6 12l6 6 6-6" />
        </svg>
        <span class="drop-zone-empty-text">{{ hint }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { registerZone, unregisterZone, type DragPayload, type ZoneHandle } from '../dragdrop/registry'
import { Sounds } from '../sounds'
import type { DropZoneColor, DroppedChip } from './DropZone.types'

interface Props {
  accepts?: string[] | null
  max?: number
  title?: string
  emoji?: string
  color?: DropZoneColor
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  accepts: null,
  max: Number.POSITIVE_INFINITY,
  title: undefined,
  emoji: undefined,
  color: 'default',
  hint: 'Arrastra aqui',
})

const emit = defineEmits<{
  drop: [payload: DragPayload]
  reject: []
  full: []
}>()

const root = ref<HTMLElement | null>(null)
const chips = ref<DroppedChip[]>([])
const hoverState = ref<'valid' | 'invalid' | null>(null)
const isCelebrating = ref(false)
let chipKey = 0
let celebrateTimer: ReturnType<typeof setTimeout> | null = null

const isFull = computed(() => chips.value.length >= props.max)

function canAccept(data: string): boolean {
  if (isFull.value) return false
  if (props.accepts === null || props.accepts === undefined) return true
  return props.accepts.includes(data) || props.accepts.includes('*')
}

function accept(payload: DragPayload) {
  chips.value.push({ ...payload, key: chipKey++ })
  Sounds.play('pop')
  emit('drop', payload)
  if (isFull.value) emit('full')

  isCelebrating.value = false
  requestAnimationFrame(() => {
    isCelebrating.value = true
  })
  if (celebrateTimer) clearTimeout(celebrateTimer)
  celebrateTimer = setTimeout(() => {
    isCelebrating.value = false
  }, 620)
}

const handle: ZoneHandle = {
  get el() {
    return root.value!
  },
  canAccept,
  accept,
  reject: () => emit('reject'),
  setHover: (state) => {
    hoverState.value = state
  },
}

onMounted(() => registerZone(handle))
onBeforeUnmount(() => {
  unregisterZone(handle)
  if (celebrateTimer) clearTimeout(celebrateTimer)
})

function reset() {
  chips.value = []
}

defineExpose({ reset, chips })
</script>

<style scoped>
/* Slot pattern from ruleta-frijoles v2: tan background, NO border.
   The zone only grows a solid ink border while a valid draggable hovers. */
.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  min-height: 170px;
  padding: 16px;
  background: var(--slot-bg);
  border: var(--card-border-width) solid transparent;
  border-radius: var(--card-radius);
  transition:
    background 180ms ease-out,
    border-color 180ms ease-out,
    box-shadow 180ms ease-out,
    transform 180ms ease-out;
  --zone-pill: rgba(255, 255, 255, 0.6);
}

/* Color variants: accent tints instead of tan, for zone-per-category games */
/* Los colores NO pintan el cuerpo (perdería la semántica de hueco vacío):
   tiñen el chip de identidad del header */
.drop-zone.drop-zone-red { --zone-pill: var(--red-tint); }
.drop-zone.drop-zone-blue { --zone-pill: var(--blue-tint); }
.drop-zone.drop-zone-green { --zone-pill: var(--green-tint); }
.drop-zone.drop-zone-yellow { --zone-pill: var(--yellow-tint); }

.drop-zone.is-hover-valid {
  border-color: var(--card-border-color);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-3px);
}

.drop-zone.is-hover-invalid {
  border-color: var(--accent-red);
  animation: drop-zone-shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.drop-zone.is-hover-invalid::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(230, 57, 70, 0.15);
  border-radius: inherit;
  pointer-events: none;
  animation: drop-zone-flash-red 400ms ease-out;
}

@keyframes drop-zone-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
}

@keyframes drop-zone-flash-red {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}

.drop-zone.is-celebrating {
  animation: drop-zone-celebrate 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.drop-zone.is-celebrating::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 4px solid var(--ink);
  border-radius: inherit;
  pointer-events: none;
  animation: drop-zone-ring-out 600ms cubic-bezier(0.25, 0.8, 0.4, 1);
}

@keyframes drop-zone-celebrate {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

@keyframes drop-zone-ring-out {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.08); }
}

/* A full zone stays borderless: the landed item is the signal — stacking a
   border on top just adds line noise */

/* Header */
.drop-zone-header {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 5px 14px 5px 6px;
  background: var(--zone-pill);
  border-radius: 999px;
}

/* Borderless, near-white wash: lighter than any zone background so the
   emoji stays crisp without reading as a separate framed element */
.drop-zone-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.62);
  border-radius: 50%;
  font-size: 17px;
  line-height: 1;
  flex-shrink: 0;
}

.drop-zone-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1;
}

/* Contents */
.drop-zone-slots {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  align-items: flex-start;
  justify-content: center;
  align-content: flex-start;
  min-height: 60px;
}

.drop-zone-empty {
  position: absolute;
  inset: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  /* Afordancia universal de "suelta aquí": punteado interior en el tono del
     slot-mark (sigue siendo el patrón slot: tan + marca, sin borde sólido) */
  border: 2.5px dashed var(--slot-mark);
  border-radius: 18px;
  opacity: 0.9;
}

.drop-zone-empty-arrow {
  width: 22px;
  height: 22px;
  color: var(--slot-mark);
  animation: drop-zone-arrow-bob 1.8s ease-in-out infinite;
}

@keyframes drop-zone-arrow-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.drop-zone-empty-text {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 12px;
  color: var(--slot-mark);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

/* Every landed item (default chip OR slotted content) bounces in */
.drop-zone-item {
  animation: drop-zone-chip-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Placed chips: white mini-cards with ink border. NO bottom shadow — once an
   item rests inside a zone, the border alone carries it (lighter UI). */
.drop-zone-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--card-surface);
  color: var(--ink);
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: 16px;
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Chips inherit the accent tint of the item they came from */
.drop-zone-chip.chip-red { background: var(--red-tint); }
.drop-zone-chip.chip-blue { background: var(--blue-tint); }
.drop-zone-chip.chip-green { background: var(--green-tint); }
.drop-zone-chip.chip-yellow { background: var(--yellow-tint); }

.drop-zone-chip-emoji {
  font-size: 20px;
  line-height: 1;
}

@keyframes drop-zone-chip-in {
  0% { opacity: 0; transform: translateY(-20px) scale(0.6) rotate(-8deg); }
  60% { opacity: 1; transform: translateY(4px) scale(1.08) rotate(2deg); }
  80% { transform: translateY(-2px) scale(0.98) rotate(-1deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
}
</style>
