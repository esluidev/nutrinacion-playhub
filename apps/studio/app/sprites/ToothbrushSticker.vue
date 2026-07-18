<template>
  <!-- Cepillo de dientes; `paste` le pone pasta — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="brush" viewBox="0 0 256 133.57" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.113043)">
    <template v-if="paste">
    <ellipse cx="115" cy="110" rx="90" ry="6" fill="#3d4256" opacity="0.10"/>
    <g transform="rotate(-6 115 70)">
    <path d="M22,78 L138,70" stroke="#3d4256" stroke-width="26" stroke-linecap="round"/>
    <path d="M22,78 L138,70" stroke="#e63946" stroke-width="17" stroke-linecap="round"/>
    <rect x="136" y="44" width="66" height="26" rx="9" fill="#ffffff" stroke="#3d4256" stroke-width="6"/>
    <path d="M146,50 L146,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    <path d="M161,50 L161,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    <path d="M176,50 L176,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    <path d="M191,50 L191,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    <path d="M140,40 C150,32 160,40 168,34 C176,28 186,32 196,38 Q200,40 198,44 L142,46 Q138,42 140,40 Z" fill="#6bbf8a" stroke="#3d4256" stroke-width="4" stroke-linejoin="round"/>
    </g>
    </template>
    <template v-else>
    <ellipse cx="115" cy="110" rx="90" ry="6" fill="#3d4256" opacity="0.10"/>
    <g transform="rotate(-6 115 70)">
    <path d="M22,78 L138,70" stroke="#3d4256" stroke-width="26" stroke-linecap="round"/>
    <path d="M22,78 L138,70" stroke="#e63946" stroke-width="17" stroke-linecap="round"/>
    <rect x="136" y="44" width="66" height="26" rx="9" fill="#ffffff" stroke="#3d4256" stroke-width="6"/>
    <path d="M146,50 L146,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    <path d="M161,50 L161,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    <path d="M176,50 L176,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    <path d="M191,50 L191,64" stroke="#c8cdd6" stroke-width="5" stroke-linecap="round"/>
    </g>
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  /** Con pasta en las cerdas */
  paste?: boolean
}>(), {
  paste: true,
})

const uid = useId()
</script>

<style scoped>
.brush {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
