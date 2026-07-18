<template>
  <!-- Estrella de premio — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="star" viewBox="0 0 256 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.347368)">
    <ellipse cx="95" cy="182" rx="58" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M95.0,24.0 L115.0,68.5 L163.5,73.8 L127.3,106.5 L137.3,154.2 L95.0,130.0 L52.7,154.2 L62.7,106.5 L26.5,73.8 L75.0,68.5 Z" :fill="body" stroke="#3d4256" stroke-width="6" stroke-linejoin="round"/>
    <clipPath :id="`${uid}-a`">
    <path d="M95.0,24.0 L115.0,68.5 L163.5,73.8 L127.3,106.5 L137.3,154.2 L95.0,130.0 L52.7,154.2 L62.7,106.5 L26.5,73.8 L75.0,68.5 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M95.0,24.0 L115.0,68.5 L163.5,73.8 L127.3,106.5 L137.3,154.2 L95.0,130.0 L52.7,154.2 L62.7,106.5 L26.5,73.8 L75.0,68.5 Z" transform="translate(-7,-8)" :fill="body"/>
    </g>
    <path d="M95.0,24.0 L115.0,68.5 L163.5,73.8 L127.3,106.5 L137.3,154.2 L95.0,130.0 L52.7,154.2 L62.7,106.5 L26.5,73.8 L75.0,68.5 Z" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="72" cy="76" r="6" fill="rgba(255,255,255,0.85)"/>
    <path d="M60,96 C62,86 68,78 74,74" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="8" stroke-linecap="round"/>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  body?: string
  shade?: string
}>(), {
  body: '#f4c542',
  shade: '#dfa92e',
})

const uid = useId()
</script>

<style scoped>
.star {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
