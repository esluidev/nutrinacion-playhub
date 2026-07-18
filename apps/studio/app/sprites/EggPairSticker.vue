<template>
  <!-- Par de huevos v3 — dos instancias del arte de huevo (noto-emoji adaptado
       al DS) con colores fijos del asset: cáscara #f2a05b, brillo #fecc88,
       pecas #d47858, trace ink #3d4256 y sombra de contacto compartida. -->
  <svg class="egg-pair" viewBox="0 0 256 182.66" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.383784)">
    <defs>
      <g :id="`${uid}-egg`">
        <path
          d="M63.43 4.51c31.68-.07 51.67 51.46 43.78 84.12c-6.98 28.92-27.03 34.91-43.08 34.91s-35.54-7.78-43.08-33.79C12.33 59.63 33.87 4.58 63.43 4.51z"
          fill="#f2a05b"
          stroke="#3d4256"
          stroke-width="3.84"
          stroke-linejoin="round"
        />
        <path
          d="M39.26 29.03c-3.8 6.07-7.63 13.71-8.45 20.08c-1.5 11.73 7.13 13.05 10.14 7.23s6.09-11.71 10.98-19.52c6.76-10.79 17.83-18.02 12.39-22.71s-17.08 2.16-25.06 14.92z"
          fill="#fecc88"
        />
        <g fill="#d47858">
          <ellipse cx="91.4" cy="43.58" rx="2.02" ry="2.06" />
          <ellipse transform="rotate(-27.393 97.64 62.565)" cx="97.65" cy="62.57" rx="3.07" ry="2.7" />
          <ellipse transform="rotate(-27.393 68.515 89.405)" cx="68.52" cy="89.41" rx="3.07" ry="2.7" />
          <ellipse transform="rotate(-51.428 64.796 104.32)" cx="64.79" cy="104.32" rx="3.23" ry="2.7" />
          <ellipse transform="rotate(-48.356 52.395 107.012)" cx="52.39" cy="107.01" rx="3.58" ry="3.46" />
          <ellipse transform="rotate(-67.642 91.663 94.057)" cx="91.66" cy="94.05" rx="2.19" ry="2.18" />
        </g>
      </g>
    </defs>

    <!-- Sombra de contacto compartida -->
    <ellipse cx="92" cy="124" rx="80" ry="9" fill="#3d4256" opacity="0.10" />

    <!-- Huevo trasero (derecha) primero; delantero (izquierda) encima -->
    <use :href="`#${uid}-egg`" transform="translate(76,2) scale(0.84) rotate(8 64 64)" />
    <use :href="`#${uid}-egg`" transform="translate(6,14) scale(0.84) rotate(-7 64 64)" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.egg-pair {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
