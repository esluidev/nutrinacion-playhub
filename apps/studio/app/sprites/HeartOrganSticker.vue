<template>
  <!-- Corazón (órgano) amigable; `beating` lo hace latir — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="organ" viewBox="0 0 243.2 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.280000)">
    <g :class="{ 'is-beating': beating }" class="organ-body">
    <ellipse cx="95" cy="192" rx="58" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M95,52 C95,36 104,26 118,22" fill="none" stroke="#c22f3c" stroke-width="14" stroke-linecap="round"/>
    <path d="M95,52 C95,36 104,26 118,22" fill="none" stroke="none"/>
    <path d="M78,50 C70,40 68,30 72,20" fill="none" stroke="#3aa8e0" stroke-width="12" stroke-linecap="round"/>
    <path d="M78,50 C70,40 68,30 72,20" fill="none" stroke="none"/>
    <path d="M95,178 C58,150 30,116 32,80 C34,52 58,38 80,48 C88,52 93,58 95,66 C99,56 108,47 120,44 C144,38 162,56 160,86 C158,122 130,150 95,178 Z" fill="#e05564"/>
    <clipPath :id="`${uid}-a`">
    <path d="M95,178 C58,150 30,116 32,80 C34,52 58,38 80,48 C88,52 93,58 95,66 C99,56 108,47 120,44 C144,38 162,56 160,86 C158,122 130,150 95,178 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#c43f50"/>
    <path d="M95,178 C58,150 30,116 32,80 C34,52 58,38 80,48 C88,52 93,58 95,66 C99,56 108,47 120,44 C144,38 162,56 160,86 C158,122 130,150 95,178 Z" transform="translate(-8,-9)" fill="#e05564"/>
    </g>
    <path d="M95,178 C58,150 30,116 32,80 C34,52 58,38 80,48 C88,52 93,58 95,66 C99,56 108,47 120,44 C144,38 162,56 160,86 C158,122 130,150 95,178 Z" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M52,92 C52,74 62,60 74,54" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="9" stroke-linecap="round"/>
    <path d="M66,116 L84,116 L92,100 L102,132 L110,116 L128,116" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  /** Late (animación) — solo mientras la escena lo pide (regla 13) */
  beating?: boolean
}>(), {
  beating: false,
})

const uid = useId()
</script>

<style scoped>
.organ {
  width: 100%;
  height: 100%;
  display: block;
}

.organ-body {
  transform-origin: 50% 55%;
}

.organ-body.is-beating {
  animation: organ-beat 900ms ease-in-out infinite;
}

@keyframes organ-beat {
  0%, 100% { transform: scale(1); }
  18% { transform: scale(1.08); }
  36% { transform: scale(1); }
  52% { transform: scale(1.05); }
}
</style>
