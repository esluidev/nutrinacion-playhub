<template>
  <div
    v-if="variant === 'ring'"
    class="progress-ring"
    :data-tone="tone"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
  >
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="ring-track" cx="60" cy="60" r="50" />
      <circle class="ring-fill" cx="60" cy="60" r="50" :stroke-dasharray="CIRC" :stroke-dashoffset="CIRC * (1 - ratio)" />
    </svg>
    <slot><span class="font-black tabular-nums">{{ Math.round(ratio * 100) }}%</span></slot>
  </div>
  <div
    v-else-if="variant === 'segments'"
    class="progress-segments"
    :style="{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }"
    :data-tone="tone"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
  >
    <span v-for="n in max" :key="n" :class="n <= value && 'is-filled'" />
  </div>
  <div
    v-else
    :class="['progress-track', size === 'lg' && 'progress-track-lg']"
    :data-tone="tone"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
  >
    <div class="progress-fill" :style="{ width: `${ratio * 100}%` }" />
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '../../utils/ui-tones'

// Progreso: barra continua, segmentos (pasos contados) o aro. Lima por defecto.
const props = withDefaults(defineProps<{
  value: number
  max?: number
  variant?: 'bar' | 'segments' | 'ring'
  size?: 'md' | 'lg'
  tone?: UiTone
  label?: string
}>(), {
  max: 100,
  variant: 'bar',
  size: 'md',
})

const CIRC = 2 * Math.PI * 50
const ratio = computed(() => Math.min(1, Math.max(0, props.max ? props.value / props.max : 0)))
</script>
