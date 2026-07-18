<template>
  <!-- Fried egg v2: clara ondulada con sombreado interior, yema con media luna
       + doble brillo, burbujitas y sombra de contacto.
       `raw` = recién cascado al sartén (clara translúcida, yema pálida) -->
  <svg class="fried" viewBox="0 0 256 174.55" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-b`"><path :d="BLOB" /></clipPath>
      <clipPath :id="`${uid}-y`"><circle cx="112" cy="76" r="32" /></clipPath>
    </defs>

    <ellipse v-if="!raw" cx="112" cy="136" rx="84" ry="8" fill="#3d4256" opacity="0.10" />

    <path :d="BLOB" :fill="raw ? 'rgba(253, 248, 238, 0.55)' : '#fdf8ee'" />
    <g v-if="!raw" :clip-path="`url(#${uid}-b)`">
      <rect x="0" y="0" width="240" height="160" fill="#eadfc6" />
      <path :d="BLOB" transform="translate(-9,-9)" fill="#fdf8ee" />
    </g>
    <path :d="BLOB" fill="none" stroke="#3d4256" stroke-width="6" />

    <g v-if="!raw" fill="#fff">
      <circle cx="64" cy="58" r="4" opacity="0.75" />
      <circle cx="152" cy="102" r="3.5" opacity="0.7" />
      <circle cx="88" cy="114" r="3" opacity="0.7" />
    </g>

    <circle cx="112" cy="76" r="32" :fill="raw ? '#f8d56a' : '#f4c542'" />
    <g v-if="!raw" :clip-path="`url(#${uid}-y)`">
      <rect x="76" y="40" width="80" height="80" fill="#dfa92e" />
      <circle cx="105" cy="68" r="32" fill="#f4c542" />
    </g>
    <circle cx="112" cy="76" r="32" fill="none" stroke="#c49b2a" stroke-width="6" />
    <ellipse cx="101" cy="64" rx="11" ry="7" fill="rgba(255,255,255,0.85)" />
    <circle cx="92" cy="80" r="3.5" fill="rgba(255,255,255,0.7)" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  raw?: boolean
}>()

const uid = useId()

const BLOB = 'M40,80 C30,58 48,34 76,32 C96,16 140,18 158,36 C186,38 200,62 188,84 C198,108 174,128 146,124 C124,138 84,136 66,120 C42,120 30,100 40,80 Z'
</script>

<style scoped>
.fried {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
