<template>
  <!-- DS HoldAction: a PHYSICAL action done by HOLDING the element pressed
       (breathe deeply, calm down, sustain…) — the sustained counterpart of
       TapAction. Wraps the scene's art in the default slot (exposes
       `progress`/`holding` so the art can inflate or change with the hold)
       and draws a progress ring that fills while pressed. Releasing PAUSES
       the progress (never punishes); it resumes on the next press. -->
  <div class="hold-action-wrap">
    <button
      :class="['hold-action', { 'is-holding': holding, 'is-complete': isComplete }]"
      :disabled="disabled || isComplete"
      @pointerdown.prevent="startHold"
      @pointerup="endHold"
      @pointercancel="endHold"
      @pointerleave="endHold"
    >
      <!-- El anillo es la primitiva ProgressHalo (envuelve SOLO el arte); un
           label debajo (slot opcional) queda fuera del círculo pero dentro
           del área presionable -->
      <ProgressHalo :progress="progress" :color="isComplete ? 'green' : 'blue'">
        <span class="hold-action-art">
          <slot :progress="progress" :holding="holding" />
        </span>
      </ProgressHalo>
      <span v-if="$slots.label" class="hold-action-label">
        <slot name="label" :progress="progress" :holding="holding" />
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import ProgressHalo from '../ProgressHalo/ProgressHalo.vue'
import { Sounds } from '../sounds'
import type { HoldActionProps } from './HoldAction.types'

const props = withDefaults(defineProps<HoldActionProps>(), {
  disabled: false,
})

const emit = defineEmits<{
  holdstart: []
  holdend: [progress: number]
  progress: [progress: number]
  complete: []
}>()

const progress = ref(0)
const holding = ref(false)
const isComplete = computed(() => progress.value >= 1)

// Motor por reloj (no por frames): el avance se calcula con performance.now(),
// así la presión sostenida progresa aunque el navegador acelere o frene los
// frames (tablets, pestañas con throttling).
let timer: ReturnType<typeof setInterval> | null = null
let lastTick = 0

function startHold() {
  if (props.disabled || isComplete.value || holding.value) return
  holding.value = true
  lastTick = performance.now()
  Sounds.play('tick')
  emit('holdstart')
  timer = setInterval(tick, 40)
}

function tick() {
  if (!holding.value) return
  const now = performance.now()
  progress.value = Math.min(1, progress.value + (now - lastTick) / props.duration)
  lastTick = now
  emit('progress', progress.value)

  if (progress.value >= 1) {
    stopTimer()
    holding.value = false
    emit('complete')
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function endHold() {
  if (!holding.value) return
  holding.value = false
  stopTimer()
  emit('holdend', progress.value)
}

function reset() {
  holding.value = false
  stopTimer()
  progress.value = 0
}

onBeforeUnmount(stopTimer)

defineExpose({ reset, progress })
</script>

<style scoped>
.hold-action-wrap {
  display: inline-flex;
}

/* Bare button: the slotted art IS the visual — the ring is the only chrome */
.hold-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

.hold-action:disabled {
  cursor: default;
}

.hold-action-art {
  display: block;
  transition: transform 200ms ease-out;
}

/* Sostener se SIENTE: el arte crece suave mientras dura la presión */
.hold-action.is-holding .hold-action-art {
  transform: scale(1.06);
}

.hold-action.is-complete .hold-action-art {
  animation: hold-action-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes hold-action-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
</style>
