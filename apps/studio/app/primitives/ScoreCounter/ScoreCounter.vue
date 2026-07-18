<template>
  <div class="score-counter-wrap">
    <div
      :class="[
        'score-counter',
        variant !== 'default' ? `score-counter-${variant}` : '',
        { 'is-bumping': isBumping },
      ]"
    >
      <div class="score-counter-badge">
        <svg class="score-counter-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
            stroke-linejoin="round"
          />
        </svg>
        <div class="score-counter-value">{{ displayValue }}</div>
      </div>
      <div class="score-counter-label">{{ label }}</div>
    </div>

    <!-- Floating "+N"/"-N" feedback popping from the badge -->
    <div
      v-for="d in deltas"
      :key="d.id"
      :class="['score-counter-delta', { 'is-negative': d.amount < 0 }]"
    >
      {{ d.amount > 0 ? '+' : '' }}{{ d.amount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useScoreCounter } from './useScoreCounter'
import type { ScoreCounterVariant } from './ScoreCounter.types'

interface Props {
  label?: string
  variant?: ScoreCounterVariant
  initial?: number
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: 'PUNTOS',
  variant: 'default',
  initial: 0,
  duration: 600,
})

const { value, displayValue, isBumping, deltas, set, add, subtract, reset, destroy }
  = useScoreCounter({ initial: props.initial, duration: props.duration })

onBeforeUnmount(destroy)

defineExpose({
  set,
  add,
  subtract,
  reset,
  value: () => value.value,
})
</script>

<style scoped>
/* Visual ported verbatim from the StoryPlay DS (.score-counter block).
   HUD badge: flat offset shadow, chunky number, amplified bump on change. */
.score-counter-wrap {
  position: relative;
  display: inline-block;
}

.score-counter {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  /* Default surface is WHITE with the full sticker treatment (3px ink border
     + flat ink shadow): the counter lives over the cream game canvas, and
     every white element of the system reads this way (cards, buttons). */
  --sc-surface: #ffffff;
  --sc-surface-dark: var(--ink);
  --sc-border: var(--ink);
  --sc-text: var(--ink);
  --sc-accent: var(--brand-primary);
  --sc-icon: var(--ink);
  --sc-label: var(--ink-soft);
}

.score-counter.score-counter-ink {
  --sc-surface: var(--ink);
  --sc-surface-dark: var(--ink-dark);
  --sc-border: transparent;
  --sc-text: var(--paper);
  --sc-accent: var(--brand-primary);
  --sc-icon: var(--paper);
}

.score-counter.score-counter-red {
  --sc-surface: #c72d3f;
  --sc-surface-dark: #8e1e2d;
  --sc-border: transparent;
  --sc-text: var(--paper);
  --sc-accent: var(--paper);
  --sc-icon: var(--paper);
}

.score-counter.score-counter-blue {
  --sc-surface: #1e78a8;
  --sc-surface-dark: #165a7a;
  --sc-border: transparent;
  --sc-text: var(--paper);
  --sc-accent: var(--paper);
  --sc-icon: var(--paper);
}

.score-counter-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--sc-surface);
  border: 3px solid var(--sc-border);
  box-shadow: 0 4px 0 var(--sc-surface-dark);
  border-radius: 999px;
  padding: 12px 32px;
  min-width: 140px;
  justify-content: center;
  transition:
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.score-counter.is-bumping .score-counter-badge {
  transform: translateY(-4px) scale(1.06);
  box-shadow: 0 9px 0 var(--sc-surface-dark);
}

.score-counter-icon {
  width: 32px;
  height: 32px;
  color: var(--sc-icon);
  flex-shrink: 0;
  transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.score-counter.is-bumping .score-counter-icon {
  transform: rotate(-15deg) scale(1.2);
}

.score-counter-value {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 44px;
  color: var(--sc-text);
  line-height: 1;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  transition: color 200ms;
}

.score-counter.is-bumping .score-counter-value {
  color: var(--sc-accent);
}

.score-counter-label {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 12px;
  color: var(--sc-label);
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
}

.score-counter-delta {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 24px;
  color: var(--brand-primary);
  pointer-events: none;
  animation: score-delta 900ms ease-out forwards;
  white-space: nowrap;
}

.score-counter-delta.is-negative {
  color: var(--accent-red);
}

@keyframes score-delta {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, -8px) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -60px) scale(1); }
}
</style>
