<template>
  <!-- Mixing bowl v2: cerámica con pie, cel-shading, franja decorativa,
       oclusión en la boca y sombra de contacto. `filled` shows the beaten
       egg mix (after the egg is cracked into it) -->
  <svg class="bowl" viewBox="0 0 256 174.55" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-b`"><path :d="BODY" /></clipPath>
    </defs>

    <ellipse cx="110" cy="142" rx="66" ry="7" fill="#3d4256" opacity="0.10" />

    <!-- Pie -->
    <rect x="86" y="128" width="48" height="12" rx="6" fill="#2680ae" stroke="#3d4256" stroke-width="5" />

    <!-- Cuerpo: base + media luna + franja decorativa -->
    <path :d="BODY" fill="#3aa8e0" />
    <g :clip-path="`url(#${uid}-b)`">
      <rect x="0" y="0" width="240" height="160" fill="#2b86ba" />
      <path :d="BODY" transform="translate(-12,-8)" fill="#3aa8e0" />
      <rect x="20" y="92" width="180" height="13" fill="#2680ae" opacity="0.5" />
    </g>
    <path :d="BODY" fill="none" stroke="#3d4256" stroke-width="6" />

    <!-- Borde -->
    <ellipse cx="110" cy="52" rx="80" ry="18" fill="#2680ae" stroke="#3d4256" stroke-width="6" />

    <!-- Boca: mezcla u oscuridad interior, con oclusión superior -->
    <template v-if="filled">
      <ellipse cx="110" cy="52" rx="62" ry="11" fill="#f8d56a" />
      <path d="M52,50 A62,11 0 0 1 168,50 L168,52 A62,11 0 0 1 52,52 Z" fill="#d9a940" opacity="0.5" />
      <path d="M76,52 C88,46 100,58 112,52 C124,46 136,58 146,52" fill="none" stroke="#c49b2a" stroke-width="5" stroke-linecap="round" />
      <circle cx="88" cy="49" r="2.6" fill="#fbe9b0" />
      <circle cx="134" cy="54" r="2" fill="#fbe9b0" />
    </template>
    <template v-else>
      <ellipse cx="110" cy="52" rx="62" ry="11" fill="#1f6a93" />
      <path d="M48,52 A62,11 0 0 1 172,52" fill="none" stroke="#17516f" stroke-width="5" />
    </template>

    <!-- Brillo -->
    <path d="M50,88 A54,46 0 0 0 74,120" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="8" stroke-linecap="round" />
    <circle cx="86" cy="126" r="4" fill="rgba(255,255,255,0.45)" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  filled?: boolean
}>()

const uid = useId()

const BODY = 'M30,52 L190,52 A80,72 0 0 1 110,138 A80,72 0 0 1 30,52 Z'
</script>

<style scoped>
.bowl {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
