<template>
  <!-- DS Glass: sticker-style vessel with rising liquid (extracted from the
       pausa-hidratacion scene so any hydration/liquid mechanic reuses it).
       The liquid tops out at `maxFill` — a small air gap stays at the rim
       even when the level is complete. Liquid colors are themeable via
       --glass-water / --glass-water-surface on the host. -->
  <div :class="['glass', { 'is-full': level >= 1 }]">
    <div class="glass-water" :style="{ height: `${clampedLevel * maxFill * 100}%` }">
      <div class="glass-water-shine" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GlassProps } from './Glass.types'

const props = withDefaults(defineProps<GlassProps>(), {
  maxFill: 0.9,
})

const clampedLevel = computed(() => Math.min(Math.max(props.level, 0), 1))
</script>

<style scoped>
/* Sticker-style glass with rising water (visual from the pausa scene) */
.glass {
  position: relative;
  width: 190px;
  height: 280px;
  background: #ffffff;
  border: 4px solid var(--ink);
  border-top-width: 3px;
  border-radius: 14px 14px 34px 34px;
  box-shadow: 0 5px 0 var(--ink);
  overflow: hidden;
  transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --glass-water: var(--accent-blue);
  --glass-water-surface: #7ac5eb;
}

.glass.is-full {
  transform: scale(1.04);
}

.glass-water {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--glass-water);
  transition: height 600ms cubic-bezier(0.25, 0.8, 0.4, 1);
}

.glass-water::before {
  content: '';
  position: absolute;
  top: -7px;
  left: -6px;
  right: -6px;
  height: 14px;
  background: var(--glass-water-surface);
  border-radius: 50%;
}

.glass-water-shine {
  position: absolute;
  top: 16px;
  bottom: 12px;
  left: 18px;
  width: 10px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 999px;
}
</style>
