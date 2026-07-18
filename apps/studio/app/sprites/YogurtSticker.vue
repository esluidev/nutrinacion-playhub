<template>
  <!-- Yogurt bebible con banda de fresa — lenguaje sticker del DS: botella con
       hombros y tapa, cel-shading, banda con fresita, brillo y sombra. -->
  <svg class="yogurt" viewBox="0 0 176.76 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.219048)">
    <ellipse cx="72" cy="200" rx="46" ry="6" fill="#3d4256" opacity="0.10" />

    <defs>
      <clipPath :id="`${uid}-c`"><path :d="BODY" /></clipPath>
    </defs>

    <!-- Cuerpo + cel-shading + banda de fresa -->
    <path :d="BODY" fill="#fdf2f4" />
    <g :clip-path="`url(#${uid}-c)`">
      <rect x="-400" y="-400" width="1200" height="1200" fill="#ecd5da" />
      <path :d="BODY" transform="translate(-7,-7)" fill="#fdf2f4" />
      <!-- Banda de fresa -->
      <rect x="20" y="108" width="110" height="32" fill="#f2a3b3" />
      <!-- Fresita -->
      <g transform="translate(72,124)">
        <path d="M-9,-2 C-9,-9 -4,-13 0,-11 C4,-13 9,-9 9,-2 C9,6 0,12 0,12 C0,12 -9,6 -9,-2 Z" fill="#e2455f" />
        <path d="M-5,-9 Q0,-14 5,-9 Q0,-11 -5,-9 Z" fill="#6fae3f" />
        <circle cx="-3.5" cy="-1" r="1.1" fill="#fff4c4" />
        <circle cx="3.5" cy="-2" r="1.1" fill="#fff4c4" />
        <circle cx="0" cy="3.5" r="1.1" fill="#fff4c4" />
      </g>
    </g>

    <!-- Contorno -->
    <path :d="BODY" fill="none" stroke="#3d4256" stroke-width="6" />

    <!-- Tapa -->
    <rect x="49" y="38" width="46" height="20" rx="5" fill="#e2647e" stroke="#3d4256" stroke-width="5" />
    <rect x="54" y="30" width="36" height="11" rx="5" fill="#f2a3b3" stroke="#3d4256" stroke-width="5" />

    <!-- Brillo -->
    <path d="M46,100 C47,88 51,80 56,74" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="7" stroke-linecap="round" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()

const BODY = 'M52,54 Q46,54 46,60 Q46,70 40,82 Q32,100 33,140 C34,177 47,192 72,192 C97,192 110,177 111,140 Q112,100 104,82 Q98,70 98,60 Q98,54 92,54 Z'
</script>

<style scoped>
.yogurt {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
