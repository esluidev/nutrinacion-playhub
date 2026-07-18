<template>
  <!-- Refrigeradora amigable: congelador arriba (copo de nieve), dos manijas
       y patitas — el hogar frío de la insulina.
       Acabado v2: contorno ink, cel-shading, brillo, sombra de contacto. -->
  <svg class="fridge" viewBox="0 0 196.92 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(0.984615)">
    <defs>
      <clipPath :id="`${uid}-f`"><rect x="30" y="18" width="140" height="220" rx="18" /></clipPath>
    </defs>

    <ellipse v-if="shadow" cx="100" cy="248" rx="76" ry="7" fill="#3d4256" opacity="0.10" />

    <rect x="30" y="18" width="140" height="220" rx="18" fill="#e6edf4" />
    <g :clip-path="`url(#${uid}-f)`">
      <rect x="120" y="8" width="60" height="240" fill="#c3d2df" />
      <rect x="22" y="10" width="140" height="220" rx="18" fill="#e6edf4" />
    </g>
    <line x1="30" y1="88" x2="170" y2="88" stroke="#3d4256" stroke-width="6" />
    <rect x="140" y="40" width="12" height="34" rx="6" fill="#8fa6b8" stroke="#3d4256" stroke-width="5" />
    <rect x="140" y="104" width="12" height="58" rx="6" fill="#8fa6b8" stroke="#3d4256" stroke-width="5" />
    <rect x="30" y="18" width="140" height="220" rx="18" fill="none" stroke="#3d4256" stroke-width="6" />
    <rect x="44" y="236" width="18" height="10" rx="4" fill="#3d4256" />
    <rect x="138" y="236" width="18" height="10" rx="4" fill="#3d4256" />

    <!-- Copo del congelador -->
    <g stroke="#7fb6d9" stroke-width="5" stroke-linecap="round">
      <line x1="66" y1="42" x2="66" y2="66" />
      <line x1="54" y1="48" x2="78" y2="60" />
      <line x1="78" y1="48" x2="54" y2="60" />
    </g>

    <rect x="40" y="100" width="9" height="48" rx="4.5" fill="rgba(255,255,255,0.8)" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  shadow?: boolean
}>(), {
  shadow: true,
})

const uid = useId()
</script>

<style scoped>
.fridge {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
