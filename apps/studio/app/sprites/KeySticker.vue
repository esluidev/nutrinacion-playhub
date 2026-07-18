<template>
  <!-- Llave dorada clásica (cabeza redonda, vástago y dos dientes) — la
       metáfora de la insulina que "abre la puerta" de la energía.
       Acabado v2: contorno ink, cel-shading, brillo, sombra de contacto. -->
  <svg class="key" viewBox="0 0 256 139.64" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-h`"><circle cx="52" cy="56" r="34" /></clipPath>
    </defs>

    <ellipse v-if="shadow" cx="110" cy="106" rx="86" ry="6" fill="#3d4256" opacity="0.10" />

    <!-- Cabeza -->
    <circle cx="52" cy="56" r="34" fill="#f4c542" />
    <g :clip-path="`url(#${uid}-h)`">
      <rect x="52" y="20" width="44" height="80" fill="#dfa92e" />
      <circle cx="45" cy="49" r="34" fill="#f4c542" />
    </g>
    <circle cx="52" cy="56" r="34" fill="none" stroke="#3d4256" stroke-width="6" />
    <circle cx="52" cy="56" r="12" fill="#fdf2cf" stroke="#3d4256" stroke-width="5" />

    <!-- Vástago y dientes -->
    <rect x="84" y="48" width="98" height="16" rx="8" fill="#f4c542" stroke="#3d4256" stroke-width="6" />
    <path d="M156,64 L156,88 L170,88 L170,64 M178,64 L178,80 L190,80 L190,64" fill="#f4c542" stroke="#3d4256" stroke-width="6" stroke-linejoin="round" />
    <rect x="152" y="48" width="46" height="16" rx="8" fill="#f4c542" stroke="#3d4256" stroke-width="6" />

    <ellipse cx="40" cy="42" rx="9" ry="6" fill="rgba(255,255,255,0.8)" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  shadow?: boolean
}>(), {
  shadow: true,
})

const uid = useId()
</script>

<style scoped>
.key {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
