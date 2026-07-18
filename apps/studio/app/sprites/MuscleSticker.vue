<template>
  <!-- Brazo flexionado (fuerza) — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="muscle" viewBox="0 0 256 236.8" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.280000)">
    <ellipse cx="100" cy="178" rx="74" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M52,124 L134,128" stroke="#3d4256" stroke-width="46" stroke-linecap="round"/>
    <path d="M52,124 L134,128" stroke="#f5c09a" stroke-width="36" stroke-linecap="round"/>
    <path d="M136,126 L146,58" stroke="#3d4256" stroke-width="40" stroke-linecap="round"/>
    <path d="M136,126 L146,58" stroke="#f5c09a" stroke-width="30" stroke-linecap="round"/>
    <circle cx="148" cy="44" r="25" fill="#f5c09a" stroke="#3d4256" stroke-width="6"/>
    <path d="M136,34 C144,30 154,32 159,40" fill="none" stroke="#e0a877" stroke-width="5" stroke-linecap="round"/>
    <path d="M58,110 C56,78 82,58 108,66 C128,72 134,92 126,106 C118,118 96,122 80,118 C68,116 60,116 58,110 Z" fill="#f5c09a"/>
    <clipPath :id="`${uid}-a`">
    <path d="M58,110 C56,78 82,58 108,66 C128,72 134,92 126,106 C118,118 96,122 80,118 C68,116 60,116 58,110 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#e0a877"/>
    <path d="M58,110 C56,78 82,58 108,66 C128,72 134,92 126,106 C118,118 96,122 80,118 C68,116 60,116 58,110 Z" transform="translate(-6,-7)" fill="#f5c09a"/>
    </g>
    <path d="M58,110 C56,78 82,58 108,66 C128,72 134,92 126,106 C118,118 96,122 80,118 C68,116 60,116 58,110 Z" fill="none" stroke="#3d4256" stroke-width="6"/>
    <rect x="14" y="94" width="44" height="60" rx="15" fill="#e63946" stroke="#3d4256" stroke-width="6"/>
    <rect x="20" y="100" width="8" height="26" rx="4" fill="rgba(255,255,255,0.4)"/>
    <path d="M70,96 C76,82 88,74 100,72" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="8" stroke-linecap="round"/>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.muscle {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
