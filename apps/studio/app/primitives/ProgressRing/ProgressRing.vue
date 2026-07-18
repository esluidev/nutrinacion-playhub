<template>
  <div :class="['progress-ring', `progress-ring-${color}`]" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg class="progress-ring-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Track: tan channel, thinner than the fill -->
      <circle class="progress-ring-track" cx="80" cy="80" r="62" />
      <!-- Fill: the colored progress arc -->
      <circle
        class="progress-ring-fill"
        cx="80"
        cy="80"
        r="62"
        :style="{
          strokeDasharray: `${fillLength} ${circumference - fillLength}`,
          strokeOpacity: fillLength > 0 ? 1 : 0,
        }"
      />
    </svg>
    <div v-if="showLabel" class="progress-ring-label">{{ Math.round(current * 100) }}%</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useProgressRing } from './useProgressRing'
import type { ProgressRingColor } from './ProgressRing.types'

interface Props {
  color?: ProgressRingColor
  size?: number
  initial?: number
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'green',
  size: 160,
  initial: 0,
  showLabel: true,
})

const { current, setProgress, animate, destroy } = useProgressRing({ initial: props.initial })

const circumference = 2 * Math.PI * 62

const fillLength = computed(() => current.value * circumference)

onBeforeUnmount(destroy)

defineExpose({
  setProgress,
  animate,
  current: () => current.value,
})
</script>

<style scoped>
/* Visual ported from the StoryPlay DS (.progress-ring block): a single ring —
   tan channel + colored arc with round caps, percentage label in the center. */
.progress-ring {
  position: relative;
  --ring-color: var(--accent-green);
}

.progress-ring.progress-ring-red { --ring-color: var(--accent-red); }
.progress-ring.progress-ring-blue { --ring-color: var(--accent-blue); }
.progress-ring.progress-ring-green { --ring-color: var(--accent-green); }
.progress-ring.progress-ring-yellow { --ring-color: var(--accent-yellow); }

.progress-ring-svg {
  width: 100%;
  height: 100%;
  display: block;
  transform: rotate(-90deg); /* 0% starts at the top */
}

.progress-ring-track {
  fill: none;
  stroke: var(--paper-deep);
  stroke-width: 22;
}

.progress-ring-fill {
  fill: none;
  stroke: var(--ring-color);
  stroke-width: 26;
  stroke-linecap: round;
  transition: stroke-dasharray 500ms cubic-bezier(0.25, 0.8, 0.4, 1);
}

.progress-ring-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 26px;
  color: var(--ink);
  line-height: 1;
}
</style>
