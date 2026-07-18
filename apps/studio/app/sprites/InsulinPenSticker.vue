<template>
  <!-- Pluma de insulina amigable: barril celeste con ventana de dosis, dial
       naranja y punta SIEMPRE cubierta (tapita) — nada de agujas visibles.
       Acabado v2: contorno ink, cel-shading, brillo, sombra de contacto. -->
  <svg class="insulin-pen" viewBox="0 0 157.54 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(0.984615)">
    <defs>
      <clipPath :id="`${uid}-b`"><rect x="52" y="70" width="56" height="120" rx="14" /></clipPath>
    </defs>

    <ellipse v-if="shadow" cx="80" cy="246" rx="46" ry="7" fill="#3d4256" opacity="0.10" />

    <!-- Barril -->
    <rect x="52" y="70" width="56" height="120" rx="14" fill="#bfe0f2" />
    <g :clip-path="`url(#${uid}-b)`">
      <rect x="82" y="60" width="40" height="140" fill="#8fc4e4" />
      <rect x="44" y="62" width="56" height="120" rx="14" fill="#bfe0f2" />
    </g>
    <!-- Ventana de dosis -->
    <rect x="64" y="104" width="32" height="30" rx="7" fill="#ffffff" stroke="#3d4256" stroke-width="4.5" />
    <text x="80" y="126" font-family="var(--font-display, Arial)" font-weight="bold" font-size="17" fill="#3d4256" text-anchor="middle">{{ dose }}</text>
    <rect x="52" y="70" width="56" height="120" rx="14" fill="none" stroke="#3d4256" stroke-width="6" />

    <!-- Dial y botón superior -->
    <rect x="60" y="34" width="40" height="40" rx="10" fill="#ef8a3c" />
    <rect x="60" y="34" width="40" height="40" rx="10" fill="none" stroke="#3d4256" stroke-width="6" />
    <rect x="70" y="18" width="20" height="20" rx="6" fill="#f7c59f" stroke="#3d4256" stroke-width="5" />

    <!-- Cono inferior + tapita protectora -->
    <path d="M58,190 L102,190 L92,218 L68,218 Z" fill="#8fc4e4" stroke="#3d4256" stroke-width="6" stroke-linejoin="round" />
    <rect x="66" y="218" width="28" height="20" rx="7" fill="#ef8a3c" stroke="#3d4256" stroke-width="5.5" />

    <rect x="60" y="80" width="8" height="34" rx="4" fill="rgba(255,255,255,0.75)" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  /** Número en la ventana de dosis */
  dose?: string | number
  /** Sombra de contacto (apagar cuando vive dentro de otra composición) */
  shadow?: boolean
}>(), {
  dose: 4,
  shadow: true,
})

const uid = useId()
</script>

<style scoped>
.insulin-pen {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
