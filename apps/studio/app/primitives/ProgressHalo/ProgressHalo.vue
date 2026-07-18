<template>
  <!-- DS ProgressHalo: anillo de progreso que ENVUELVE otro componente o
       sprite — el contenido viaja en el slot y el halo lo rodea. Mismo
       lenguaje visual que ProgressRing (canal paper-deep + arco de color con
       puntas redondas), pero a diferencia de él no es un medidor
       autocontenido con label: es un MARCO de progreso para arte, y su
       progreso es declarativo (prop 0..1, sin API imperativa). El contenido
       debería ser ~cuadrado para que el círculo lo abrace parejo. Lo usa
       HoldAction como su anillo. -->
  <div :class="['progress-halo', `progress-halo-${color}`]">
    <svg class="progress-halo-svg" viewBox="0 0 160 160" aria-hidden="true">
      <circle class="progress-halo-track" cx="80" cy="80" r="70" />
      <circle
        class="progress-halo-fill"
        cx="80"
        cy="80"
        r="70"
        :stroke-dashoffset="CIRC * (1 - clamped)"
        :style="{ strokeOpacity: clamped > 0 ? 1 : 0 }"
      />
    </svg>
    <span class="progress-halo-content">
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressHaloProps } from './ProgressHalo.types'

const props = withDefaults(defineProps<ProgressHaloProps>(), {
  color: 'green',
})

const CIRC = 2 * Math.PI * 70

const clamped = computed(() => Math.min(1, Math.max(0, props.progress)))
</script>

<style scoped>
.progress-halo {
  position: relative;
  display: inline-grid;
  place-items: center;
  /* Aire entre el contenido y el anillo: con este padding, el interior del
     arco queda justo fuera de un contenido cuadrado */
  padding: 26px;
  --halo-color: var(--accent-green);
}

.progress-halo-red { --halo-color: var(--accent-red); }
.progress-halo-blue { --halo-color: var(--accent-blue); }
.progress-halo-green { --halo-color: var(--accent-green); }
.progress-halo-yellow { --halo-color: var(--accent-yellow); }

.progress-halo-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* 0% arranca arriba */
  pointer-events: none;
}

/* Mismo canal + arco del DS (ProgressRing), a proporción envolvente */
.progress-halo-track {
  fill: none;
  stroke: var(--paper-deep);
  stroke-width: 14;
}

.progress-halo-fill {
  fill: none;
  stroke: var(--halo-color);
  stroke-width: 18;
  stroke-linecap: round;
  stroke-dasharray: 439.82; /* 2π·70 */
  /* Corta y lineal: acompaña actualizaciones en vivo (p. ej. un hold que
     avanza cada tick) sin arrastrarse */
  transition: stroke-dashoffset 120ms linear, stroke 300ms ease;
}

.progress-halo-content {
  display: block;
  position: relative;
}
</style>
