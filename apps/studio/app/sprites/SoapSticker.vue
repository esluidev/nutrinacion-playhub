<template>
  <!-- Jabón de barra con burbujas — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="soap" viewBox="0 0 256 194.56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.280000)">
    <ellipse cx="100" cy="142" rx="74" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M30,58 Q30,44 46,44 L154,44 Q170,44 170,58 L170,112 Q170,126 154,126 L46,126 Q30,126 30,112 Z" fill="#7ac5eb"/>
    <clipPath :id="`${uid}-a`">
    <path d="M30,58 Q30,44 46,44 L154,44 Q170,44 170,58 L170,112 Q170,126 154,126 L46,126 Q30,126 30,112 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#5ba9d0"/>
    <path d="M30,58 Q30,44 46,44 L154,44 Q170,44 170,58 L170,112 Q170,126 154,126 L46,126 Q30,126 30,112 Z" transform="translate(-8,-8)" fill="#7ac5eb"/>
    </g>
    <path d="M30,58 Q30,44 46,44 L154,44 Q170,44 170,58 L170,112 Q170,126 154,126 L46,126 Q30,126 30,112 Z" fill="none" stroke="#3d4256" stroke-width="6"/>
    <ellipse cx="100" cy="85" rx="44" ry="22" fill="none" stroke="#5ba9d0" stroke-width="4"/>
    <circle cx="48" cy="34" r="11" fill="rgba(255,255,255,0.9)" stroke="#7ac5eb" stroke-width="4"/>
    <circle cx="74" cy="22" r="14" fill="rgba(255,255,255,0.9)" stroke="#7ac5eb" stroke-width="4"/>
    <circle cx="102" cy="30" r="9" fill="rgba(255,255,255,0.9)" stroke="#7ac5eb" stroke-width="4"/>
    <path d="M44,72 C46,62 54,56 62,54" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="8" stroke-linecap="round"/>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.soap {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
