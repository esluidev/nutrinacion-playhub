<template>
  <!-- Cuerda de saltar — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="rope" viewBox="0 0 256 221.87" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.219048)">
    <ellipse cx="105" cy="172" rx="84" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M42,58 C30,120 70,156 105,156 C140,156 180,120 168,58" fill="none" stroke="#3d4256" stroke-width="14" stroke-linecap="round"/>
    <path d="M42,58 C30,120 70,156 105,156 C140,156 180,120 168,58" fill="none" stroke="#e63946" stroke-width="7" stroke-linecap="round"/>
    <g transform="rotate(-12 42 44)">
    <rect x="30" y="14" width="24" height="52" rx="10" fill="#3aa8e0" stroke="#3d4256" stroke-width="5"/>
    <rect x="35" y="20" width="6" height="18" rx="3" fill="rgba(255,255,255,0.5)"/>
    </g>
    <g transform="rotate(12 168 44)">
    <rect x="156" y="14" width="24" height="52" rx="10" fill="#3aa8e0" stroke="#3d4256" stroke-width="5"/>
    <rect x="161" y="20" width="6" height="18" rx="3" fill="rgba(255,255,255,0.5)"/>
    </g>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.rope {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
