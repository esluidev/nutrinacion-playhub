<template>
  <!-- Boiled eggs v2 — dibujo propio en el lenguaje del DS (reemplaza el asset
       de Flaticon): huevo entero pelado atrás + mitad al frente con la yema,
       cel-shading y sombra de contacto. -->
  <svg class="boiled" viewBox="0 0 256 186.18" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-w`"><path :d="WHOLE" /></clipPath>
      <clipPath :id="`${uid}-h`"><path :d="HALF" /></clipPath>
      <clipPath :id="`${uid}-y`"><circle cx="74" cy="96" r="31" /></clipPath>
    </defs>

    <ellipse cx="114" cy="148" rx="86" ry="8" fill="#3d4256" opacity="0.10" />

    <!-- Huevo entero (atrás) -->
    <path :d="WHOLE" fill="#f4f1ea" />
    <g :clip-path="`url(#${uid}-w)`">
      <rect x="80" y="0" width="140" height="170" fill="#ddd7c8" />
      <path :d="WHOLE" transform="translate(-9,-11)" fill="#f4f1ea" />
    </g>
    <path :d="WHOLE" fill="none" stroke="#3d4256" stroke-width="6" />
    <path d="M126,64 C130,53 137,44 145,39" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="9" stroke-linecap="round" />

    <!-- Mitad (al frente): cara de corte blanca + yema -->
    <path :d="HALF" fill="#ffffff" />
    <g :clip-path="`url(#${uid}-h)`">
      <rect x="20" y="0" width="120" height="170" fill="#e9e6da" />
      <path :d="HALF" transform="translate(-8,-10)" fill="#ffffff" />
    </g>
    <path :d="HALF" fill="none" stroke="#3d4256" stroke-width="6" />

    <circle cx="74" cy="96" r="31" fill="#f4c542" />
    <g :clip-path="`url(#${uid}-y)`">
      <rect x="30" y="52" width="96" height="96" fill="#dfa92e" />
      <circle cx="67" cy="88" r="31" fill="#f4c542" />
    </g>
    <circle cx="74" cy="96" r="31" fill="none" stroke="#c49b2a" stroke-width="5" />
    <ellipse cx="64" cy="85" rx="8.5" ry="6" fill="rgba(255,255,255,0.8)" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()

const WHOLE = 'M152,32 C176,32 194,59 194,94 C194,121 176,137 152,137 C128,137 110,121 110,94 C110,59 128,32 152,32 Z'
const HALF = 'M74,22 C103,22 124,55 124,94 C124,125 103,143 74,143 C45,143 24,125 24,94 C24,55 45,22 74,22 Z'
</script>

<style scoped>
.boiled {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
