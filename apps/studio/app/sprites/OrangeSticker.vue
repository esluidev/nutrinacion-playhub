<template>
  <!-- Naranja — entera o partida (`half`: gajos a la vista). Sticker del DS. -->
  <svg class="orange" viewBox="0 0 256 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.280000)">
    <defs>
      <clipPath :id="`${uid}-c`"><circle cx="100" cy="110" r="70" /></clipPath>
    </defs>

    <ellipse cx="100" cy="190" rx="62" ry="7" fill="#3d4256" opacity="0.10" />
    <!-- Ramita tinta + hoja con contorno y nervadura -->
    <path d="M100,46 C100,34 104,24 112,17" fill="none" stroke="#3d4256" stroke-width="9" stroke-linecap="round" />
    <path d="M112,17 C123,4 146,1 159,9 C157,25 140,35 123,31 C115,29 111,23 112,17 Z" fill="#6bbf8a" stroke="#3d4256" stroke-width="5" stroke-linejoin="round" />
    <path d="M120,25 C131,19 142,14 151,11" fill="none" stroke="#3d4256" stroke-width="3.5" stroke-linecap="round" />

    <circle cx="100" cy="110" r="70" fill="#f2921d" />
    <g :clip-path="`url(#${uid}-c)`">
      <rect x="-40" y="-40" width="280" height="280" fill="#d97b12" />
      <circle cx="91" cy="100" r="70" fill="#f2921d" />
    </g>
    <circle cx="100" cy="110" r="70" fill="none" stroke="#3d4256" stroke-width="6" />

    <template v-if="half">
      <circle cx="100" cy="110" r="56" fill="#fbd9a5" />
      <path
        v-for="a in 6"
        :key="a"
        :d="wedge(a - 1)"
        fill="#f7ae4b"
      />
    </template>
    <template v-else>
      <circle cx="72" cy="88" r="4" fill="#d97b12" opacity="0.5" />
      <circle cx="120" cy="140" r="4" fill="#d97b12" opacity="0.5" />
      <circle cx="130" cy="80" r="3.5" fill="#d97b12" opacity="0.5" />
      <path d="M56,92 C60,74 72,62 86,56" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="10" stroke-linecap="round" />
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  /** Partida: muestra los gajos */
  half?: boolean
}>(), {
  half: false,
})

const uid = useId()

/** Gajo a: sector de 48° con separación, radio 48 */
function wedge(a: number): string {
  const r = 48
  const a0 = ((a * 60 + 6) * Math.PI) / 180
  const a1 = ((a * 60 + 54) * Math.PI) / 180
  const x0 = 100 + r * Math.cos(a0)
  const y0 = 110 + r * Math.sin(a0)
  const x1 = 100 + r * Math.cos(a1)
  const y1 = 110 + r * Math.sin(a1)
  return `M100,110 L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`
}
</script>

<style scoped>
.orange {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
