<template>
  <!-- DS Stove burner: the kid puts the kitchen to WORK — turn the knob,
       the flames light up, the cooking runs for `duration` and `done` fires.
       The knob is a game element: it disables until the station is ready
       (states are static — regla 13). -->
  <div class="stove">
    <!-- Burner plate with grill bars; flames flicker underneath while cooking -->
    <div class="stove-top">
      <div v-if="cooking" class="stove-flames">
        <svg
          v-for="n in 5"
          :key="n"
          class="stove-flame"
          :style="{
            width: `${FLAME_W[n - 1]}px`,
            height: `${FLAME_H[n - 1]}px`,
            animationDelay: `${(n - 1) * 110}ms`,
          }"
          viewBox="0 0 20 28"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Llama v2: gota de tres tonos (naranja → ámbar → núcleo claro) -->
          <path d="M10,1.5 C11.2,7 16.5,11 16.5,17.5 C16.5,23 13.6,26.5 10,26.5 C6.4,26.5 3.5,23 3.5,17.5 C3.5,11 8.8,7 10,1.5 Z" fill="#f59e0b" stroke="#c2410c" stroke-width="2" stroke-linejoin="round" />
          <path d="M10,9 C10.8,13 13.5,15 13.5,19 C13.5,22.6 12,24.5 10,24.5 C8,24.5 6.5,22.6 6.5,19 C6.5,15 9.2,13 10,9 Z" fill="#fbbf24" />
          <path d="M10,15 C10.5,17.5 11.8,18.6 11.8,20.8 C11.8,23 11,24 10,24 C9,24 8.2,23 8.2,20.8 C8.2,18.6 9.5,17.5 10,15 Z" fill="#fde68a" />
        </svg>
      </div>
      <div class="stove-plate">
        <span v-for="n in 3" :key="n" class="stove-bar" />
      </div>

      <!-- Cookware slot: el utensilio (sprite) se APOYA en la hornilla y queda
           alineado solo — la escena compone <Stove><PotSticker/></Stove> -->
      <div v-if="$slots.default" class="stove-cookware">
        <slot />
      </div>
    </div>

    <!-- Body with the knob -->
    <div class="stove-body">
      <span class="stove-body-strip" />
      <button
        :class="['stove-knob', { 'is-on': cooking, 'is-done': isDone }]"
        :disabled="!ready || cooking || isDone"
        aria-label="Encender la hornilla"
        @click="ignite"
      >
        <span class="stove-knob-mark" />
      </button>
      <span class="stove-screw stove-screw-l" />
      <span class="stove-screw stove-screw-r" />
    </div>

    <!-- Sombra de contacto (mismo acabado que los sprites v2) -->
    <div class="stove-shadow" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Sounds } from '../sounds'
import type { StoveProps } from './Stove.types'

const props = withDefaults(defineProps<StoveProps>(), {
  duration: 2800,
  ready: false,
  silent: false,
})

const emit = defineEmits<{
  /** Knob turned, flames on */
  ignite: []
  /** Cook time elapsed, flames off */
  done: []
}>()

// Cama de fuego: 5 llamas escalonadas (chica-media-alta-media-chica)
const FLAME_W = [16, 20, 24, 20, 16]
const FLAME_H = [22, 29, 35, 29, 22]

const cooking = ref(false)
const isDone = ref(false)
let cookTimer: ReturnType<typeof setTimeout> | null = null

// `ready` gates the KNOB (UI); programmatic ignite() from the scene works
// regardless — automated kitchens turn their own knob
function ignite() {
  if (cooking.value || isDone.value) return
  cooking.value = true
  if (!props.silent) Sounds.play('whoosh')
  emit('ignite')
  cookTimer = setTimeout(() => {
    cooking.value = false
    isDone.value = true
    if (!props.silent) Sounds.play('pop')
    emit('done')
  }, props.duration)
}

function reset() {
  if (cookTimer) clearTimeout(cookTimer)
  cooking.value = false
  isDone.value = false
}

onBeforeUnmount(() => {
  if (cookTimer) clearTimeout(cookTimer)
})

defineExpose({ reset, ignite, cooking, isDone })
</script>

<style scoped>
.stove {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 168px;
}

.stove-top {
  position: relative;
  width: 100%;
  height: 26px;
}

/* Burner plate: dark bar with grill nubs */
.stove-plate {
  position: absolute;
  inset: 0;
  background: #3f4458;
  border: 3px solid var(--ink);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.stove-bar {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: #5d6378;
}

/* Cama de fuego sobre la plancha: llamas juntas y escalonadas, DETRÁS del
   utensilio (el fuego vive bajo la olla; las de las orillas asoman a los
   lados). Los tamaños los pone el componente (FLAME_W/H). */
.stove-flames {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 9px;
  z-index: 0;
}

.stove-flame {
  transform-origin: bottom center;
  animation: stove-flicker 420ms ease-in-out infinite;
}

@keyframes stove-flicker {
  0%, 100% { transform: scaleY(1) rotate(0); }
  35% { transform: scaleY(1.28) scaleX(0.9) rotate(-3deg); }
  70% { transform: scaleY(1.12) scaleX(0.95) rotate(3deg); }
}

/* Cookware slot: apoyado sobre la plancha, delante de la cama de fuego */
.stove-cookware {
  position: absolute;
  bottom: 78%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Body: panel con banda de luz superior y tornillos (acabado sprites v2) */
.stove-body {
  position: relative;
  width: 78%;
  height: 44px;
  background: #565c72;
  border: 3px solid var(--ink);
  border-top: none;
  border-radius: 0 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.stove-body-strip {
  position: absolute;
  top: 0;
  left: 6px;
  right: 6px;
  height: 7px;
  border-radius: 0 0 6px 6px;
  background: #6b7188;
  pointer-events: none;
}

.stove-screw {
  position: absolute;
  bottom: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3a3f52;
  pointer-events: none;
}

.stove-screw-l { left: 12px; }
.stove-screw-r { right: 12px; }

/* Sombra de contacto */
.stove-shadow {
  width: 70%;
  height: 8px;
  margin-top: 3px;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.1;
}

/* Knob: disabled (nothing to cook) → neutral · ready → white, usable ·
   on → rotated with green mark · done → stays off, dimmed */
.stove-knob {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease;
}

.stove-knob:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.stove-knob.is-on {
  transform: rotate(90deg);
}

.stove-knob.is-on:disabled,
.stove-knob.is-done:disabled {
  opacity: 1;
}

.stove-knob.is-done {
  opacity: 0.75;
}

.stove-knob-mark {
  width: 4px;
  height: 12px;
  border-radius: 2px;
  background: var(--ink);
  transform: translateY(-6px);
}

.stove-knob.is-on .stove-knob-mark {
  background: var(--accent-green-dark);
}
</style>
