<template>
  <!-- Cono de entrenamiento — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="cone" viewBox="0 0 256 248.47" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.505882)">
    <ellipse cx="85" cy="168" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M85,24 C99,24 104,32 108,62 L114,96 Q118,120 122,138 L48,138 Q52,120 56,96 L62,62 C66,32 71,24 85,24 Z" :fill="body"/>
    <clipPath :id="`${uid}-a`">
    <path d="M85,24 C99,24 104,32 108,62 L114,96 Q118,120 122,138 L48,138 Q52,120 56,96 L62,62 C66,32 71,24 85,24 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M85,24 C99,24 104,32 108,62 L114,96 Q118,120 122,138 L48,138 Q52,120 56,96 L62,62 C66,32 71,24 85,24 Z" transform="translate(-6,-7)" :fill="body"/>
    </g>
    <path d="M59,80 L111,80 L115,102 L55,102 Z" fill="#ffffff" stroke="#3d4256" stroke-width="4"/>
    <path d="M85,24 C99,24 104,32 108,62 L114,96 Q118,120 122,138 L48,138 Q52,120 56,96 L62,62 C66,32 71,24 85,24 Z" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round"/>
    <rect x="24" y="134" width="122" height="20" rx="9" :fill="shade" stroke="#3d4256" stroke-width="6"/>
    <path d="M72,44 C74,36 78,32 82,30" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="7" stroke-linecap="round"/>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  body?: string
  shade?: string
}>(), {
  body: '#f08c1e',
  shade: '#d97612',
})

const uid = useId()
</script>

<style scoped>
.cone {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
