<template>
  <!-- Frying pan v2 (isométrico): aro rojo con cel-shading, interior con brillo
       de aceite, mango con agujero para colgar y tornillo, sombra de contacto. -->
  <svg class="pan" viewBox="0 0 256 174.55" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-t`"><ellipse cx="92" cy="82" rx="80" ry="42" /></clipPath>
    </defs>

    <ellipse cx="100" cy="134" rx="82" ry="7" fill="#3d4256" opacity="0.10" />

    <!-- Mango: alma clara + agujero para colgar -->
    <g transform="rotate(-16 168 70)">
      <rect x="150" y="60" width="70" height="20" rx="10" fill="#3f4458" stroke="#3d4256" stroke-width="5" />
      <rect x="152" y="63" width="60" height="6" rx="3" fill="#565d78" />
      <circle cx="208" cy="70" r="4" fill="#f5f0e8" stroke="#252a3d" stroke-width="2.5" />
    </g>

    <!-- Aro con profundidad + cel-shading -->
    <ellipse cx="92" cy="88" rx="80" ry="42" fill="#b82838" stroke="#3d4256" stroke-width="6" />
    <ellipse cx="92" cy="82" rx="80" ry="42" fill="#e63946" />
    <g :clip-path="`url(#${uid}-t)`">
      <rect x="0" y="0" width="240" height="160" fill="#cf3140" />
      <ellipse cx="83" cy="76" rx="80" ry="42" fill="#e63946" />
    </g>
    <ellipse cx="92" cy="82" rx="80" ry="42" fill="none" stroke="#3d4256" stroke-width="6" />

    <!-- Interior + brillo de aceite -->
    <ellipse cx="92" cy="82" rx="60" ry="29" fill="#474d63" stroke="#3d4256" stroke-width="4" />
    <ellipse cx="92" cy="80" rx="52" ry="24" fill="#3f4458" />
    <ellipse cx="80" cy="76" rx="26" ry="10" fill="#fff" opacity="0.10" transform="rotate(-16 80 76)" />

    <path d="M28,74 A64,32 0 0 1 58,52" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="7" stroke-linecap="round" />
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
</script>

<style scoped>
.pan {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
