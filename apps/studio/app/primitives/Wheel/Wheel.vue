<template>
  <div class="wheel-stage" :style="{ width: `${size}px`, height: `${size}px` }">
    <!-- Flat offset shadow disc (no blur) -->
    <div class="wheel-shadow" />

    <!-- Pointer: ink teardrop from ruleta-frijoles v2, ticks on boundary crossings -->
    <div :class="['wheel-pointer', { 'is-ticking': isTicking }]">
      <svg viewBox="0 0 56 72" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 68 Q14 50 8 30 Q4 4 28 4 Q52 4 48 30 Q42 50 28 68 Z" fill="var(--ink)" />
        <circle cx="28" cy="22" r="8" fill="var(--paper)" />
        <circle cx="28" cy="22" r="3.5" fill="var(--accent-red)" />
      </svg>
    </div>

    <!-- Disc: cream rim + decorative ring + sectors + hub (DS geometry) -->
    <svg
      class="wheel-disc"
      :class="{ 'no-transition': noTransition }"
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      :style="{ transform: `rotate(${rotation}deg)` }"
    >
      <circle cx="200" cy="200" r="199.5" fill="var(--paper)" stroke="#e8e4d8" stroke-width="1" />
      <circle cx="200" cy="200" r="180" fill="var(--paper-dark)" />
      <circle cx="200" cy="200" r="174" fill="var(--paper)" />

      <g>
        <path
          v-for="(d, i) in sectorPaths"
          :key="i"
          :d="d"
          :fill="sectorColors[i % sectorColors.length]"
        />
      </g>

      <g stroke="var(--paper)" stroke-width="3" stroke-linecap="round">
        <line
          v-for="(line, i) in separatorLines"
          :key="i"
          x1="200"
          y1="200"
          :x2="line.x"
          :y2="line.y"
        />
      </g>

      <circle cx="200" cy="200" r="30" fill="var(--paper)" />
      <circle cx="200" cy="200" r="22" fill="var(--ink)" />
      <circle cx="200" cy="200" r="8" fill="var(--paper)" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useWheel } from './useWheel'

interface Props {
  sectors?: number
  colors?: string[]
  /** Stage size in logical px */
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  sectors: 4,
  colors: () => [
    'var(--accent-red)',
    'var(--accent-blue)',
    'var(--accent-green)',
    'var(--accent-yellow)',
  ],
  size: 320,
})

const emit = defineEmits<{
  land: [sectorIndex: number]
  tick: [count: number]
}>()

const { rotation, isSpinning, isTicking, spin, reset: resetLogic, destroy } = useWheel({
  sectors: props.sectors,
  onLand: i => emit('land', i),
  onTick: n => emit('tick', n),
})

const sectorColors = computed(() => props.colors)

const R_SECTOR = 170

// Sector 0 starts centered under the pointer (12 o'clock)
const sectorPaths = computed(() => {
  const step = 360 / props.sectors
  const paths: string[] = []
  for (let i = 0; i < props.sectors; i++) {
    const startDeg = i * step - 90 - step / 2
    const endDeg = startDeg + step
    const startRad = (startDeg * Math.PI) / 180
    const endRad = (endDeg * Math.PI) / 180
    const x1 = 200 + R_SECTOR * Math.cos(startRad)
    const y1 = 200 + R_SECTOR * Math.sin(startRad)
    const x2 = 200 + R_SECTOR * Math.cos(endRad)
    const y2 = 200 + R_SECTOR * Math.sin(endRad)
    const largeArc = step > 180 ? 1 : 0
    paths.push(`M 200 200 L ${x1} ${y1} A ${R_SECTOR} ${R_SECTOR} 0 ${largeArc} 1 ${x2} ${y2} Z`)
  }
  return paths
})

const separatorLines = computed(() => {
  const step = 360 / props.sectors
  const lines: { x: number; y: number }[] = []
  for (let i = 0; i < props.sectors; i++) {
    const rad = ((i * step - 90 - step / 2) * Math.PI) / 180
    lines.push({ x: 200 + R_SECTOR * Math.cos(rad), y: 200 + R_SECTOR * Math.sin(rad) })
  }
  return lines
})

// reset() snaps to 0deg without playing the 4s transition backwards
const noTransition = ref(false)

async function reset() {
  noTransition.value = true
  resetLogic()
  await nextTick()
  requestAnimationFrame(() => {
    noTransition.value = false
  })
}

onBeforeUnmount(destroy)

defineExpose({
  spin,
  reset,
  isSpinning: () => isSpinning.value,
})
</script>

<style scoped>
.wheel-stage {
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.wheel-shadow {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 6px;
  left: 0;
  border-radius: 50%;
  background: #e8e4d8;
  z-index: 0;
}

.wheel-disc {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
  transition: transform 4s cubic-bezier(0.15, 0.85, 0.25, 1);
  transform-origin: 50% 50%;
  display: block;
}

.wheel-disc.no-transition {
  transition: none;
}

.wheel-pointer {
  position: absolute;
  top: 2%;
  left: 50%;
  width: 14%;
  aspect-ratio: 56 / 72;
  margin-left: -7%;
  z-index: 3;
  transform-origin: 50% 14%;
  transition: transform 0.09s cubic-bezier(0.25, 0.8, 0.4, 1);
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.15));
}

.wheel-pointer svg {
  width: 100%;
  height: 100%;
  display: block;
}

.wheel-pointer.is-ticking {
  transform: rotate(-16deg);
  transition: transform 0.02s ease-out;
}
</style>
