<template>
  <!-- Plato; `divided` marca las secciones del buen comer — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="plate" viewBox="0 0 256 170.67" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.219048)">
    <ellipse cx="105" cy="128" rx="86" ry="8" fill="#3d4256" opacity="0.10"/>
    <ellipse cx="105" cy="88" rx="92" ry="34" fill="#fef7e8"/>
    <clipPath :id="`${uid}-a`">
    <path d="M197,88 A92,34 0 1 1 13,88 A92,34 0 1 1 197,88 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#e7ddc2"/>
    <path d="M197,88 A92,34 0 1 1 13,88 A92,34 0 1 1 197,88 Z" transform="translate(-7,-7)" fill="#fef7e8"/>
    </g>
    <ellipse cx="105" cy="88" rx="92" ry="34" fill="none" stroke="#3d4256" stroke-width="6"/>
    <ellipse cx="105" cy="86" rx="66" ry="22" fill="#ffffff" stroke="#e7ddc2" stroke-width="4"/>

    <template v-if="divided">
      <path d="M105,86 L105,64 M105,86 L48,102 M105,86 L162,102" stroke="#e0d5b8" stroke-width="5" stroke-linecap="round" fill="none"/>
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  divided?: boolean
}>(), {
  divided: true,
})

const uid = useId()
</script>

<style scoped>
.plate {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
