<template>
  <!-- Guided breathing bubble v2: burbuja con volumen (brillo + media luna),
       micro-burbujas que flotan SOLO mientras respira (regla 13) y etiqueta
       con transición suave entre Inhala/Exhala. Grows while inhaling, shrinks
       while exhaling; the in/out labels are part of the playable element. -->
  <div class="breath-guide">
    <div class="breath-stage" :style="{ width: `${size * 1.6}px`, height: `${size * 1.6}px` }">
      <!-- Micro-burbujas ambientales (solo durante la respiración) -->
      <template v-if="running">
        <span class="breath-mini breath-mini-a" />
        <span class="breath-mini breath-mini-b" />
        <span class="breath-mini breath-mini-c" />
      </template>

      <div
        class="breath-bubble"
        :class="{ 'is-in': running && phase === 'in', 'is-out': running && phase === 'out' }"
        :style="{
          transitionDuration: `${phase === 'in' ? inhaleMs : exhaleMs}ms`,
          width: `${size}px`,
          height: `${size}px`,
        }"
      >
        <!-- Volumen: media luna inferior + brillo superior-izquierdo -->
        <span class="breath-shade" />
        <span class="breath-shine" />
        <span class="breath-shine-dot" />

        <Transition name="breath-word" mode="out-in">
          <span :key="running ? phase : 'idle'" class="breath-label">{{ running ? (phase === 'in' ? labelIn : labelOut) : labelIn }}</span>
        </Transition>
      </div>
    </div>

    <div class="sp-dots breath-dots">
      <div
        v-for="i in cycles"
        :key="i"
        :class="['sp-dot', { 'is-done': i <= cyclesDone, 'is-current': running && i === cyclesDone + 1 }]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBreathGuide } from './useBreathGuide'
import type { BreathPhase } from './BreathGuide.types'

interface Props {
  cycles?: number
  inhaleMs?: number
  exhaleMs?: number
  /** Base bubble size in px (grows ~1.45x on inhale) */
  size?: number
  /** Visible phase words — localized by the scene (playable element labels) */
  labelIn: string
  labelOut: string
}

const props = withDefaults(defineProps<Props>(), {
  cycles: 3,
  inhaleMs: 3200,
  exhaleMs: 3600,
  size: 180,
})

const emit = defineEmits<{
  phase: [phase: BreathPhase]
  cycle: [done: number]
  done: []
}>()

const { phase, cyclesDone, running, start, reset, cycles, inhaleMs, exhaleMs } = useBreathGuide(
  { cycles: props.cycles, inhaleMs: props.inhaleMs, exhaleMs: props.exhaleMs },
  {
    onPhase: p => emit('phase', p),
    onCycle: n => emit('cycle', n),
    onDone: () => emit('done'),
  },
)

defineExpose({ start, reset, running: () => running.value })
</script>

<style scoped>
.breath-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Escenario fijo: reserva el crecimiento de la burbuja para que nada salte */
.breath-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* The bubble: cel-shaded sticker circle. Scale transitions are driven by the
   phase length so the growth IS the breathing pace. */
.breath-bubble {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--blue-tint);
  border: var(--card-border-width) solid var(--card-border-color);
  overflow: hidden;
  transform: scale(1);
  transition-property: transform;
  transition-timing-function: ease-in-out;
}

.breath-bubble.is-in {
  transform: scale(1.45);
}

.breath-bubble.is-out {
  transform: scale(1);
}

/* Volumen: media luna inferior (agua más honda) + brillo superior */
.breath-shade {
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: -34%;
  height: 62%;
  border-radius: 50%;
  background: #b9d9ec;
  pointer-events: none;
}

.breath-shine {
  position: absolute;
  top: 12%;
  left: 16%;
  width: 26%;
  height: 15%;
  border-radius: 999px;
  background: #fff;
  opacity: 0.75;
  transform: rotate(-28deg);
  pointer-events: none;
}

.breath-shine-dot {
  position: absolute;
  top: 30%;
  left: 12%;
  width: 7%;
  height: 7%;
  border-radius: 50%;
  background: #fff;
  opacity: 0.7;
  pointer-events: none;
}

.breath-label {
  position: relative;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 26px;
  color: var(--accent-blue-dark);
  letter-spacing: 1px;
}

/* Transición de la palabra Inhala/Exhala */
.breath-word-enter-active,
.breath-word-leave-active {
  transition: opacity 260ms ease, transform 260ms ease;
}

.breath-word-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.9);
}

.breath-word-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.9);
}

/* Micro-burbujas: suben y se disipan mientras dura la respiración */
.breath-mini {
  position: absolute;
  bottom: 18%;
  border-radius: 50%;
  background: var(--blue-tint);
  border: 3px solid var(--ink);
  opacity: 0;
  pointer-events: none;
  animation: breath-rise 3.4s ease-in infinite;
}

.breath-mini-a { left: 12%; width: 14px; height: 14px; animation-delay: 0.2s; }
.breath-mini-b { right: 10%; width: 18px; height: 18px; animation-delay: 1.4s; }
.breath-mini-c { right: 22%; width: 10px; height: 10px; animation-delay: 2.5s; }

@keyframes breath-rise {
  0% { transform: translateY(0) scale(0.7); opacity: 0; }
  15% { opacity: 0.8; }
  70% { opacity: 0.6; }
  100% { transform: translateY(-120px) scale(1.05); opacity: 0; }
}

.breath-dots {
  margin-top: 18px;
}
</style>
