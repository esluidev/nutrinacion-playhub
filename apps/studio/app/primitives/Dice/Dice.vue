<template>
  <div
    :class="['dice', color !== 'ink' ? `dice-${color}` : '', { 'is-rolling': isRolling }]"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg class="dice-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <!-- Base: full cube silhouette (fills gaps between faces) -->
      <path d="m7.1 52.05 20.72 10c1.32.63 2.73.95 4.18.95s2.86-.32 4.18-.95l20.72-10c3.31-1.59 5.45-5 5.45-8.67v-22.74c0-1.88-.55-3.71-1.58-5.29-.97-1.47-2.3-2.64-3.87-3.39l-20.71-10c-2.66-1.28-5.72-1.28-8.38 0l-20.71 10c-1.57.75-2.9 1.92-3.87 3.39-1.03 1.58-1.58 3.41-1.58 5.29v22.74c0 3.67 2.14 7.08 5.45 8.67z" fill="var(--dice-front)" />
      <!-- Right face -->
      <path d="m61.36 20.64v22.74c0 3.3-1.92 6.35-4.89 7.78l-20.72 10c-1.03.5-2.13.78-3.26.84v-32.39l17.49-8.43 10.2-4.92c.77 1.33 1.18 2.84 1.18 4.38z" fill="var(--dice-right)" />
      <!-- Top face -->
      <path d="m7.53 12.84 20.71-9.99c2.39-1.15 5.13-1.15 7.52 0l20.71 9.99c1.24.6 2.32 1.49 3.16 2.6l-27.63 13.31-20.39-9.83-7.23-3.48c.83-1.11 1.91-2 3.15-2.6z" fill="var(--dice-top)" />

      <!-- Dots per face (computed from the orientation). They stay visible
           during the roll and rotate with the cube, exactly like the DS;
           the faces swap once at the peak of the jump (240ms). -->
      <g class="dice-dots-top">
        <ellipse v-for="(d, i) in dotsTop" :key="`t${i}`" :cx="d.cx" :cy="d.cy" :rx="d.rx" :ry="d.ry" fill="var(--dice-dot)" />
      </g>
      <g class="dice-dots-front">
        <ellipse v-for="(d, i) in dotsFront" :key="`f${i}`" :cx="d.cx" :cy="d.cy" :rx="d.rx" :ry="d.ry" fill="var(--dice-dot)" />
      </g>
      <g class="dice-dots-right">
        <ellipse v-for="(d, i) in dotsRight" :key="`r${i}`" :cx="d.cx" :cy="d.cy" :rx="d.rx" :ry="d.ry" fill="var(--dice-dot)" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useDice } from './useDice'
import type { DiceColor } from './Dice.types'

interface Props {
  color?: DiceColor
  size?: number
  initial?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'ink',
  size: 160,
  initial: 1,
})

const emit = defineEmits<{
  result: [value: number]
}>()

const { value, isRolling, dotsTop, dotsFront, dotsRight, roll, setValue, destroy } = useDice({
  initial: props.initial,
  onResult: v => emit('result', v),
})

onBeforeUnmount(destroy)

defineExpose({
  roll,
  setValue,
  value: () => value.value,
})
</script>

<style scoped>
/* Isometric cube from the DS with rounded corners and per-face shading */
.dice {
  position: relative;
  display: block;
  user-select: none;
  -webkit-user-select: none;
  --dice-front: #2d3142;
  --dice-top: #3d4258;
  --dice-right: #15182a;
  --dice-dot: var(--paper);
}

.dice.dice-red {
  --dice-front: #c72d3f;
  --dice-top: #d63a4c;
  --dice-right: #8e1e2d;
}

.dice.dice-blue {
  --dice-front: #1e78a8;
  --dice-top: #2680ae;
  --dice-right: #165a7a;
}

.dice-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.dice.is-rolling {
  animation: dice-roll 800ms ease-out;
}

@keyframes dice-roll {
  0% { transform: translateY(0) rotate(0) scale(1); }
  15% { transform: translateY(2px) rotate(-30deg) scale(0.95); }
  30% { transform: translateY(-24px) rotate(-130deg) scale(1); }
  55% { transform: translateY(6px) rotate(-270deg) scale(1); }
  65% { transform: translateY(6px) rotate(-295deg) scaleY(0.92) scaleX(1.05); }
  78% { transform: translateY(-8px) rotate(-335deg) scale(1); }
  90% { transform: translateY(2px) rotate(-355deg) scale(1); }
  100% { transform: translateY(0) rotate(-360deg) scale(1); }
}
</style>
