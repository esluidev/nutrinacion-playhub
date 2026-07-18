<template>
  <!-- Lata de refresco (alimento ocasional) — lenguaje sticker del DS: contorno ink, cel-shading de media
       luna, brillos y sombra de contacto. Pure art, no mechanic. -->
  <svg class="soda" viewBox="0 0 169.06 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.207547)">
    <ellipse cx="70" cy="204" rx="46" ry="6" fill="#3d4256" opacity="0.10"/>
    <path d="M32,52 L108,52 Q112,120 108,188 Q108,196 100,196 L40,196 Q32,196 32,188 Q28,120 32,52 Z" fill="#e63946"/>
    <clipPath :id="`${uid}-c`">
    <path d="M32,52 L108,52 Q112,120 108,188 Q108,196 100,196 L40,196 Q32,196 32,188 Q28,120 32,52 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-c)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#c22f3c"/>
    <path d="M32,52 L108,52 Q112,120 108,188 Q108,196 100,196 L40,196 Q32,196 32,188 Q28,120 32,52 Z" transform="translate(-7,-7)" fill="#e63946"/>
    </g>
    <path d="M30,96 L110,96 L110,130 L30,130 Z" fill="#fef7e8"/>
    <path d="M52,104 C60,118 80,118 88,106" fill="none" stroke="#e63946" stroke-width="6" stroke-linecap="round"/>
    <path d="M32,52 L108,52 Q112,120 108,188 Q108,196 100,196 L40,196 Q32,196 32,188 Q28,120 32,52 Z" fill="none" stroke="#3d4256" stroke-width="6"/>
    <ellipse cx="70" cy="52" rx="38" ry="10" fill="#c8cdd6" stroke="#3d4256" stroke-width="5"/>
    <rect x="60" y="42" width="20" height="8" rx="4" fill="#9aa2b1" stroke="#3d4256" stroke-width="4"/>
    <path d="M42,150 C42,130 43,116 45,106" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="7" stroke-linecap="round"/>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.soda {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
