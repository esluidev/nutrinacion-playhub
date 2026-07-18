<template>
  <!-- Exercise countdown ring v2: arco que se vacía + segundos grandes con POP
       por segundo, onda expansiva en cada beat (juicy pero con propósito: ES
       el ritmo), últimos 3 segundos en color de urgencia y check al terminar.
       Static while idle (regla 13); todo se anima solo con el ejercicio. -->
  <div :class="['exercise-timer', `exercise-timer-${color}`, { 'is-beating': beatFlash }]" :style="{ width: `${size}px`, height: `${size}px` }">
    <!-- Onda del beat (se recrea por beat via key) -->
    <div v-if="beatFlash" :key="rippleKey" class="exercise-timer-ripple" />

    <svg class="exercise-timer-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <circle class="exercise-timer-track" cx="80" cy="80" r="62" />
      <circle
        class="exercise-timer-fill"
        cx="80"
        cy="80"
        r="62"
        :style="{
          strokeDasharray: `${remainingLength} ${circumference - remainingLength}`,
          strokeOpacity: remainingLength > 0 ? 1 : 0,
        }"
      />
    </svg>

    <div :class="['exercise-timer-label', { 'is-final': isFinal }]">
      <!-- key por segundo: cada número entra con un pop -->
      <span v-if="secondsLeft > 0" :key="secondsLeft" class="exercise-timer-num">{{ secondsLeft }}</span>
      <svg v-else class="exercise-timer-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useExerciseTimer } from './useExerciseTimer'
import type { ExerciseTimerColor } from './ExerciseTimer.types'

interface Props {
  /** Exercise length in seconds */
  duration: number
  /** Beat period in ms — tick + evento marcando el ritmo (omit = silent) */
  beatMs?: number
  /** Pulso/onda visual del beat EN el anillo. Apagarlo cuando el ritmo se
      muestra en otro elemento (p. ej. la tarjeta de la demo vía @beat): el
      beat NO es el reloj, y pulsar el anillo fuera de segundo se lee como
      desincronización. El tick y el emit('beat') no se ven afectados. */
  beatVisual?: boolean
  color?: ExerciseTimerColor
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  beatVisual: true,
  color: 'green',
  size: 150,
})

const emit = defineEmits<{
  second: [left: number]
  beat: [n: number]
  done: []
}>()

const beatFlash = ref(false)
const rippleKey = ref(0)
let flashTimer: ReturnType<typeof setTimeout> | null = null

const { secondsLeft, running, start, stop, reset } = useExerciseTimer(
  { duration: props.duration, beatMs: props.beatMs },
  {
    onSecond: left => emit('second', left),
    onBeat: (n) => {
      if (props.beatVisual) {
        beatFlash.value = true
        rippleKey.value++
        if (flashTimer) clearTimeout(flashTimer)
        flashTimer = setTimeout(() => { beatFlash.value = false }, 460)
      }
      emit('beat', n)
    },
    onDone: () => emit('done'),
  },
)

const circumference = 2 * Math.PI * 62
const remainingLength = computed(() => (secondsLeft.value / Math.max(1, props.duration)) * circumference)
const isFinal = computed(() => running.value && secondsLeft.value <= 3 && secondsLeft.value > 0)

defineExpose({ start, stop, reset, running: () => running.value, secondsLeft: () => secondsLeft.value })
</script>

<style scoped>
/* Same ring language as ProgressRing (tan channel + accent arc), counting
   DOWN with the seconds big in the center — a kid-readable exercise clock. */
.exercise-timer {
  position: relative;
  --timer-color: var(--accent-green);
  transition: transform 160ms ease-out;
}

.exercise-timer.exercise-timer-red { --timer-color: var(--accent-red); }
.exercise-timer.exercise-timer-blue { --timer-color: var(--accent-blue); }
.exercise-timer.exercise-timer-green { --timer-color: var(--accent-green); }
.exercise-timer.exercise-timer-yellow { --timer-color: var(--accent-yellow); }

.exercise-timer.is-beating {
  transform: scale(1.05);
}

/* Onda expansiva del beat: un aro del color del timer que crece y se disipa */
.exercise-timer-ripple {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  border: 4px solid var(--timer-color);
  opacity: 0.7;
  pointer-events: none;
  animation: et-ripple 460ms ease-out forwards;
}

@keyframes et-ripple {
  0% { transform: scale(0.88); opacity: 0.7; }
  100% { transform: scale(1.22); opacity: 0; }
}

.exercise-timer-svg {
  width: 100%;
  height: 100%;
  display: block;
  transform: rotate(-90deg);
}

.exercise-timer-track {
  fill: none;
  stroke: var(--paper-deep);
  stroke-width: 22;
}

.exercise-timer-fill {
  fill: none;
  stroke: var(--timer-color);
  stroke-width: 22;
  stroke-linecap: round;
  transition: stroke-dasharray 950ms linear, stroke-opacity 250ms ease-out;
}

.exercise-timer-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 44px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* Cada segundo entra con un pop (el key del span lo re-monta) */
.exercise-timer-num {
  animation: et-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes et-pop {
  0% { transform: scale(1.28); }
  100% { transform: scale(1); }
}

/* Últimos 3 segundos: urgencia amable */
.exercise-timer-label.is-final {
  color: var(--accent-red-dark);
}

.exercise-timer-label.is-final .exercise-timer-num {
  animation: et-pop-final 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes et-pop-final {
  0% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

/* Al terminar: check en el color del timer */
.exercise-timer-check {
  width: 46px;
  height: 46px;
  color: var(--timer-color);
  animation: et-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
