<template>
  <!-- The three parts of the egg v2: cáscara (media cáscara con oclusión
       interior), clara (blob con sombreado interno), yema (bola glossy con
       media luna) — todas con cel-shading y sombra de contacto -->
  <svg class="part" viewBox="0 0 256 174.55" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-s`"><path :d="SHELL" /></clipPath>
      <clipPath :id="`${uid}-w`"><path :d="WHITE" /></clipPath>
      <clipPath :id="`${uid}-y`"><circle cx="110" cy="78" r="54" /></clipPath>
    </defs>

    <!-- Cáscara: media cáscara con borde en zigzag y cavidad -->
    <g v-if="part === 'cascara'">
      <ellipse cx="110" cy="142" rx="72" ry="7" fill="#3d4256" opacity="0.10" />
      <path :d="SHELL" fill="#f0c08e" />
      <g :clip-path="`url(#${uid}-s)`">
        <rect x="0" y="0" width="240" height="160" fill="#d9a670" />
        <path :d="SHELL" transform="translate(-9,-11)" fill="#f0c08e" />
      </g>
      <!-- Hueco interior: mismo borde en zigzag que el rim, para que el quiebre
           se lea también en el relleno (una sola forma, sin detalles extra) -->
      <path :d="CAVITY" fill="#f2a05b" />
      <path :d="SHELL" fill="none" stroke="#3d4256" stroke-width="5" />
      <path d="M62,96 C62,112 80,122 104,124" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="8" stroke-linecap="round" />
    </g>

    <!-- Clara: blob suave con sombreado interior -->
    <g v-else-if="part === 'clara'">
      <ellipse cx="112" cy="138" rx="80" ry="7" fill="#3d4256" opacity="0.10" />
      <path :d="WHITE" fill="#fdf8ee" />
      <g :clip-path="`url(#${uid}-w)`">
        <rect x="0" y="0" width="240" height="160" fill="#eadfc6" />
        <path :d="WHITE" transform="translate(-9,-9)" fill="#fdf8ee" />
      </g>
      <path :d="WHITE" fill="none" stroke="#3d4256" stroke-width="5" />
      <ellipse cx="86" cy="68" rx="14" ry="9" fill="rgba(255,255,255,0.9)" />
      <circle cx="150" cy="60" r="4" fill="#fff" opacity="0.7" />
    </g>

    <!-- Yema: bola glossy con media luna -->
    <g v-else>
      <ellipse cx="110" cy="140" rx="56" ry="7" fill="#3d4256" opacity="0.10" />
      <circle cx="110" cy="78" r="54" fill="#f4c542" />
      <g :clip-path="`url(#${uid}-y)`">
        <rect x="40" y="10" width="140" height="140" fill="#dfa92e" />
        <circle cx="99" cy="66" r="54" fill="#f4c542" />
      </g>
      <circle cx="110" cy="78" r="54" fill="none" stroke="#c49b2a" stroke-width="5" />
      <ellipse cx="92" cy="56" rx="16" ry="11" fill="rgba(255,255,255,0.8)" />
      <circle cx="76" cy="80" r="5" fill="rgba(255,255,255,0.7)" />
    </g>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  part: 'cascara' | 'clara' | 'yema'
}>()

const uid = useId()

const SHELL = 'M40,62 L56,76 L72,60 L88,76 L104,60 L120,76 L136,60 L152,76 L168,62 C176,74 180,86 180,96 C180,124 150,140 110,140 C70,140 40,124 40,96 C40,86 42,74 40,62 Z'
// Hueco interior: mismo tope en zigzag que SHELL, cerrado con base redondeada
const CAVITY = 'M40,62 L56,76 L72,60 L88,76 L104,60 L120,76 L136,60 L152,76 L168,62 C174,73 177,83 177,92 C177,116 150,130 110,130 C70,130 43,116 43,92 C43,83 40,73 40,62 Z'
const WHITE = 'M46,84 C36,62 56,40 84,40 C102,26 142,28 158,44 C184,48 196,72 184,92 C192,114 170,132 142,128 C120,140 84,138 68,124 C46,122 38,102 46,84 Z'
</script>

<style scoped>
.part {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
