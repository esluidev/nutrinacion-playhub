<template>
  <!-- Galleta con chispas (alimento ocasional) — lenguaje sticker del DS: contorno ink, cel-shading de media
       luna, brillos y sombra de contacto. Pure art, no mechanic. -->
  <svg class="cookie" viewBox="0 0 256 249.26" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.347368)">
    <ellipse cx="95" cy="180" rx="66" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="95" cy="100" r="70" fill="#d9a05b"/>
    <clipPath :id="`${uid}-c`">
    <path d="M165,100 A70,70 0 1 1 25,100 A70,70 0 1 1 165,100 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-c)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#c08a47"/>
    <path d="M165,100 A70,70 0 1 1 25,100 A70,70 0 1 1 165,100 Z" transform="translate(-9,-9)" fill="#d9a05b"/>
    </g>
    <circle cx="95" cy="100" r="70" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="70" cy="76" r="9" fill="#6b4226" stroke="#3d4256" stroke-width="3"/>
    <circle cx="120" cy="70" r="8" fill="#6b4226" stroke="#3d4256" stroke-width="3"/>
    <circle cx="140" cy="110" r="8" fill="#6b4226" stroke="#3d4256" stroke-width="3"/>
    <circle cx="94" cy="120" r="9" fill="#6b4226" stroke="#3d4256" stroke-width="3"/>
    <circle cx="58" cy="120" r="7" fill="#6b4226" stroke="#3d4256" stroke-width="3"/>
    <circle cx="112" cy="146" r="7" fill="#6b4226" stroke="#3d4256" stroke-width="3"/>
    <path d="M52,84 C56,68 68,56 82,50" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="9" stroke-linecap="round"/>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.cookie {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
