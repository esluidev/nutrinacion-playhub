<template>
  <!-- UN DÍA CON LA INSULINA — mecánica propia: el sol recorre el arco del
       día y en cada momento el niño HACE el hábito que toca (nada de elegir
       a ciegas): mañana = insulina con un adulto (tap juntos), mediodía =
       plato equilibrado (tap), tarde = agua natural (tap), noche = guardar
       la insulina en el refri (ARRASTRAR la pluma al refri). Horarios,
       acompañamiento y refrigeración se aprenden haciéndolos, en orden. -->
  <div class="scene">
    <!-- El arco del día: 4 paradas y el sol (o luna) viajando entre ellas -->
    <div class="day-arc">
      <svg class="arc-path" viewBox="0 0 640 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20,120 Q320,-60 620,120" fill="none" stroke="var(--slot-mark, #c4a87a)" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16" />
      </svg>
      <div
        v-for="(m, i) in MOMENTS"
        :key="m.id"
        class="arc-stop"
        :style="arcPos(i)"
      >
        <div :class="['arc-dot', { 'is-done': i < moment, 'is-current': i === moment && !allDone }]">
          <svg v-if="i < moment" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
        </div>
        <div class="arc-label">{{ m.time }}</div>
      </div>
      <!-- El viajero del día: sol de día, luna de noche -->
      <div class="arc-traveler" :style="arcPos(Math.min(moment, MOMENTS.length - 1))">
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <template v-if="!isNight">
            <circle cx="24" cy="24" r="13" fill="#f4c542" stroke="#3d4256" stroke-width="4" />
            <g stroke="#f4c542" stroke-width="4" stroke-linecap="round">
              <line x1="24" y1="2" x2="24" y2="8" /><line x1="24" y1="40" x2="24" y2="46" />
              <line x1="2" y1="24" x2="8" y2="24" /><line x1="40" y1="24" x2="46" y2="24" />
              <line x1="8.8" y1="8.8" x2="13" y2="13" /><line x1="35" y1="35" x2="39.2" y2="39.2" />
              <line x1="39.2" y1="8.8" x2="35" y2="13" /><line x1="13" y1="35" x2="8.8" y2="39.2" />
            </g>
          </template>
          <template v-else>
            <path d="M30,6 A19 19 0 1 0 42,32 A15 15 0 0 1 30,6 Z" fill="#e6edf4" stroke="#3d4256" stroke-width="4" stroke-linejoin="round" />
          </template>
        </svg>
      </div>
    </div>

    <!-- El momento actual: su hábito, para HACERLO -->
    <div class="stage-row">
      <div :class="['sp-card', 'mo-frame', `sp-card--${currentMoment.tint}`]">
        <!-- Mañana: el adulto (teen) acompaña al niño con la pluma -->
        <div v-if="currentMoment.id === 'manana'" class="mo-art mo-duo">
          <div class="mo-adult"><KidPoseSticker pose="stand" variant="girl" age="teen" shirt="#c49b2a" /></div>
          <div class="mo-kid"><KidPoseSticker pose="stand" variant="boy" shirt="#c49b2a" /></div>
          <div class="mo-pen"><InsulinPenSticker :shadow="false" /></div>
        </div>
        <!-- Mediodía: plato equilibrado -->
        <div v-else-if="currentMoment.id === 'mediodia'" class="mo-art">
          <PlateSticker />
        </div>
        <!-- Tarde: botella de agua (baja al beber) -->
        <div v-else-if="currentMoment.id === 'tarde'" class="mo-art mo-bottle">
          <BottleSticker :level="bottleLevel" />
        </div>
        <!-- Noche: la pluma viaja al refri (drag) -->
        <div v-else class="mo-art mo-night">
          <Draggable v-if="!nightDone" data="pluma" :label="t('penLabel')" color="red" @dragstart="emit('knowledge', null)">
            <span class="mo-drag-pen"><InsulinPenSticker :shadow="false" /></span>
          </Draggable>
          <span v-else class="mo-pen-stored"><InsulinPenSticker :shadow="false" /></span>
          <DropZone :title="t('fridgeLabel')" color="blue" @drop="onFridgeDrop">
            <template #icon>
              <span class="mo-fridge"><FridgeSticker :shadow="false" /></span>
            </template>
          </DropZone>
        </div>

        <div class="mo-name">{{ currentMoment.name }}</div>
      </div>

      <!-- Acción del momento (la noche se hace arrastrando, sin botón) -->
      <div class="action-col">
        <button
          v-if="currentMoment.id !== 'noche'"
          class="sp-btn sp-btn-green sp-btn-big"
          :disabled="acting || allDone"
          @click="doMoment"
        >
          {{ currentMoment.actionLabel }}
        </button>
        <div v-else class="mo-hint">{{ currentMoment.actionLabel }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import { useT } from '~/composables/useT'
import type { Component } from 'vue'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import DropZone from '~/primitives/DropZone/DropZone.vue'
import { Sounds } from '~/primitives/sounds'
import BottleSticker from '~/sprites/BottleSticker.vue'
import FridgeSticker from '~/sprites/FridgeSticker.vue'
import InsulinPenSticker from '~/sprites/InsulinPenSticker.vue'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import PlateSticker from '~/sprites/PlateSticker.vue'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
import { dayMomentsFor } from '../../data'
import sceneConfig from './scene.config'
import type { KnowledgePayload } from '~/types/scene'

const props = defineProps<{
  locale?: string
  config?: Record<string, unknown>
}>()

const emit = defineEmits<{
  complete: []
  score: [points: number]
  knowledge: [payload: KnowledgePayload | null]
}>()

const t = useT(sceneConfig.strings, () => props.locale)

const MOMENTS = dayMomentsFor(props.locale ?? 'es')
const POINTS_PER_MOMENT = Number(props.config?.pointsPerMoment ?? 10)

const moment = ref(0)
const acting = ref(false)
const bottleLevel = ref(1)
const nightDone = ref(false)
let completed = false

const allDone = computed(() => moment.value >= MOMENTS.length)
const currentMoment = computed(() => MOMENTS[Math.min(moment.value, MOMENTS.length - 1)]!)
const isNight = computed(() => currentMoment.value.id === 'noche')

// Posición de cada parada sobre el arco (coincide con la curva del SVG)
function arcPos(i: number) {
  const ts = [0.06, 0.37, 0.66, 0.95]
  const p = ts[Math.min(i, ts.length - 1)]!
  // Bézier cuadrática M20,120 Q320,-60 620,120 evaluada en p
  const x = (1 - p) ** 2 * 20 + 2 * (1 - p) * p * 320 + p ** 2 * 620
  const y = (1 - p) ** 2 * 120 + 2 * (1 - p) * p * -60 + p ** 2 * 120
  return { left: `${(x / 640) * 100}%`, top: `${(y / 130) * 100}%` }
}

const timers: ReturnType<typeof setTimeout>[] = []
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}
onBeforeUnmount(() => timers.forEach(clearTimeout))

const MOMENT_VISUAL: Record<string, Component> = {
  manana: InsulinPenSticker,
  mediodia: PlateSticker,
  tarde: WaterDropSticker,
  noche: FridgeSticker,
}

/* ── Hacer el hábito del momento ──────────────────────────────────────────── */

function doMoment() {
  if (acting.value || allDone.value || isNight.value) return
  emit('knowledge', null)
  acting.value = true
  Sounds.play('pop')
  if (currentMoment.value.id === 'tarde') bottleLevel.value = 0.55 // el sorbo se ve

  later(() => onMomentDone(), 900)
}

function onFridgeDrop(payload?: unknown) {
  if (nightDone.value || allDone.value) return
  const data = typeof payload === 'string' ? payload : (payload as { data?: string } | undefined)?.data
  if (data !== 'pluma') return
  nightDone.value = true
  onMomentDone()
}

function onMomentDone() {
  const m = currentMoment.value
  acting.value = false
  Sounds.play('success')
  emit('score', POINTS_PER_MOMENT)
  emit('knowledge', {
    title: m.name,
    html: m.factHtml,
    voice: m.factVoice,
    visual: { component: markRaw(MOMENT_VISUAL[m.id]!) },
  })
  moment.value++

  if (moment.value >= MOMENTS.length && !completed) {
    completed = true
    emit('complete')
  }
}
</script>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  padding: 104px 80px 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  font-family: var(--font-body);
  color: var(--ink);
}

/* ── Arco del día ─────────────────────────────────────────────────────────── */

.day-arc {
  position: relative;
  width: 640px;
  height: 150px;
}

.arc-path {
  position: absolute;
  inset: 0 0 20px 0;
  width: 100%;
  height: 130px;
}

.arc-stop {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.arc-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ffffff;
  border: 3.5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background 250ms ease, transform 250ms ease;
}

.arc-dot.is-current {
  background: var(--accent-orange);
  transform: scale(1.15);
}

.arc-dot.is-done {
  background: var(--accent-green);
}

.arc-dot svg {
  width: 17px;
  height: 17px;
}

.arc-label {
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: var(--paper, #f5f0e8);
  padding: 0 4px;
}

/* El sol/luna viaja al momento actual */
.arc-traveler {
  position: absolute;
  width: 52px;
  height: 52px;
  transform: translate(-50%, -140%);
  transition: left 900ms ease-in-out, top 900ms ease-in-out;
  pointer-events: none;
}

/* ── El momento y su hábito ───────────────────────────────────────────────── */

.stage-row {
  display: flex;
  align-items: center;
  gap: 64px;
}

.mo-frame {
  width: 470px;
  height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  padding: 22px 20px;
  transition: background-color 220ms ease-out;
}

.mo-art {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* Mañana: adulto + niño + pluma (el acompañamiento SE VE) */
.mo-duo {
  gap: 6px;
}

.mo-adult {
  width: 118px;
  height: 172px;
}

.mo-kid {
  width: 104px;
  height: 146px;
}

.mo-pen {
  width: 66px;
  height: 108px;
}

.mo-art :deep(.plate) {
  width: 250px;
  height: 175px;
}

.mo-bottle :deep(.bottle) {
  width: 120px;
  height: 210px;
}

/* Noche: pluma arrastrable + refri receptor */
.mo-night {
  gap: 34px;
}

.mo-drag-pen,
.mo-pen-stored {
  display: block;
  width: 62px;
  height: 100px;
}

.mo-pen-stored {
  opacity: 0.35; /* ya guardada: su lugar queda marcado */
}

.mo-fridge {
  display: block;
  width: 84px;
  height: 110px;
}

.mo-name {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  min-width: 240px;
}

.mo-hint {
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--ink);
  opacity: 0.75;
  text-align: center;
}
</style>
