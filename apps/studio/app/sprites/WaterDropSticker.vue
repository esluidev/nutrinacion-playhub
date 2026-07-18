<template>
  <!-- Gota de agua en el lenguaje sticker del DS: lágrima con cel-shading,
       doble brillo y burbujita. Es EL arte de "agua" en tarjetas, pasos y
       Tarjetas de Saber (reemplaza al emoji 💧). Pure art, no mechanic. -->
  <svg class="drop" viewBox="0 0 199.11 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.422222)">
    <defs>
      <clipPath :id="`${uid}-b`"><path :d="DROP" /></clipPath>
    </defs>

    <ellipse cx="70" cy="172" rx="42" ry="6" fill="#3d4256" opacity="0.10" />

    <path :d="DROP" fill="#3aa8e0" />
    <g :clip-path="`url(#${uid}-b)`">
      <rect x="60" y="0" width="90" height="180" fill="#2680ae" />
      <path :d="DROP" transform="translate(-8,-9)" fill="#3aa8e0" />
    </g>
    <path :d="DROP" fill="none" stroke="#3d4256" stroke-width="5" stroke-linejoin="round" />

    <!-- Brillos + burbujita -->
    <path d="M40,96 C40,76 48,60 60,48" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="10" stroke-linecap="round" />
    <circle cx="42" cy="116" r="5.5" fill="rgba(255,255,255,0.85)" />
    <circle cx="92" cy="124" r="7" fill="#7ac5eb" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()

const DROP = 'M70,10 C82,42 122,74 122,116 C122,148 99,168 70,168 C41,168 18,148 18,116 C18,74 58,42 70,10 Z'
</script>

<style scoped>
.drop {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
