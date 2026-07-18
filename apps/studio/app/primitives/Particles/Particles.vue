<template>
  <!-- DS Particles: looping ambience particles for cooking/physics scenes.
       Pure visual effect — the scene positions this block over its art.
       steam = drifting puffs · splatter = arcing oil pops · bubbles = boil -->
  <div v-if="active" :class="['particles', `particles-${kind}`]" aria-hidden="true">
    <span
      v-for="(p, i) in PARTICLES[kind]"
      :key="i"
      class="particle"
      :style="{
        animationDelay: `${p.delay}ms`,
        left: `${p.left}%`,
        width: `${p.size}px`,
        height: `${p.size}px`,
        '--dx': `${p.dx}px`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import type { ParticlesKind, ParticlesProps } from './Particles.types'

withDefaults(defineProps<ParticlesProps>(), {
  active: true,
})

interface ParticleDef {
  left: number
  size: number
  delay: number
  /** Horizontal drift across the animation */
  dx: number
}

const PARTICLES: Record<ParticlesKind, ParticleDef[]> = {
  // Soft puffs of different sizes, rising while drifting sideways
  steam: [
    { left: 14, size: 18, delay: 0, dx: -10 },
    { left: 42, size: 26, delay: 520, dx: 8 },
    { left: 66, size: 16, delay: 980, dx: 14 },
    { left: 30, size: 22, delay: 1460, dx: -6 },
  ],
  // Oil droplets popping up and ARCING outward to both sides
  splatter: [
    { left: 12, size: 8, delay: 0, dx: -26 },
    { left: 30, size: 10, delay: 140, dx: -14 },
    { left: 48, size: 7, delay: 300, dx: 4 },
    { left: 60, size: 10, delay: 90, dx: 18 },
    { left: 76, size: 8, delay: 240, dx: 30 },
    { left: 40, size: 6, delay: 420, dx: -8 },
    { left: 68, size: 6, delay: 520, dx: 24 },
  ],
  bubbles: [
    { left: 16, size: 12, delay: 0, dx: 4 },
    { left: 40, size: 14, delay: 260, dx: -4 },
    { left: 62, size: 11, delay: 520, dx: 6 },
    { left: 82, size: 13, delay: 780, dx: -5 },
  ],
}
</script>

<style scoped>
.particles {
  position: relative;
  width: 120px;
  height: 64px;
  pointer-events: none;
}

.particle {
  position: absolute;
  bottom: 0;
}

/* ── Steam: soft puffs rising, growing and drifting ── */
.particles-steam .particle {
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
  border: 2.5px solid rgba(90, 96, 118, 0.28);
  animation: particle-steam 2.1s ease-out infinite;
}

@keyframes particle-steam {
  0% { opacity: 0; transform: translate(0, 0) scale(0.45); }
  25% { opacity: 0.95; }
  70% { opacity: 0.55; }
  100% { opacity: 0; transform: translate(var(--dx), -62px) scale(1.6); }
}

/* ── Splatter: oil droplets popping up and arcing outward ── */
.particles-splatter .particle {
  border-radius: 50%;
  background: var(--accent-yellow);
  border: 2px solid #d98324;
  animation: particle-splat 760ms cubic-bezier(0.25, 0.7, 0.5, 1) infinite;
}

@keyframes particle-splat {
  0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
  18% { opacity: 1; transform: translate(calc(var(--dx) * 0.45), -30px) scale(1.05); }
  55% { opacity: 1; transform: translate(calc(var(--dx) * 0.85), -16px) scale(0.9); }
  100% { opacity: 0; transform: translate(var(--dx), 8px) scale(0.6); }
}

/* ── Bubbles: boiling water rising ── */
.particles-bubbles .particle {
  border-radius: 50%;
  background: rgba(122, 197, 235, 0.65);
  border: 2px solid rgba(38, 128, 174, 0.6);
  animation: particle-bubble 1.1s ease-in infinite;
}

@keyframes particle-bubble {
  0% { opacity: 0; transform: translate(0, 0) scale(0.7); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--dx), -36px) scale(1.15); }
}
</style>
