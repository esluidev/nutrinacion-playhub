<template>
  <!-- Corazón (símbolo) con destello — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="heart" viewBox="0 0 256 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.347368)">
    <ellipse cx="95" cy="182" rx="60" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M95,168 C50,132 22,102 22,70 C22,44 42,28 64,28 C78,28 89,36 95,48 C101,36 112,28 126,28 C148,28 168,44 168,70 C168,102 140,132 95,168 Z" :fill="body"/>
    <clipPath :id="`${uid}-a`">
    <path d="M95,168 C50,132 22,102 22,70 C22,44 42,28 64,28 C78,28 89,36 95,48 C101,36 112,28 126,28 C148,28 168,44 168,70 C168,102 140,132 95,168 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M95,168 C50,132 22,102 22,70 C22,44 42,28 64,28 C78,28 89,36 95,48 C101,36 112,28 126,28 C148,28 168,44 168,70 C168,102 140,132 95,168 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <path d="M95,168 C50,132 22,102 22,70 C22,44 42,28 64,28 C78,28 89,36 95,48 C101,36 112,28 126,28 C148,28 168,44 168,70 C168,102 140,132 95,168 Z" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round"/>
    <path d="M44,72 C44,56 52,44 64,40" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="10" stroke-linecap="round"/>
    <path d="M150,34 l3,8 8,3 -8,3 -3,8 -3,-8 -8,-3 8,-3 Z" fill="#fff" opacity="0.9"/>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  body?: string
  shade?: string
}>(), {
  body: '#e63946',
  shade: '#c22f3c',
})

const uid = useId()
</script>

<style scoped>
.heart {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
