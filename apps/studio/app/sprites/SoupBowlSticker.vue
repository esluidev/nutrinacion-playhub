<template>
  <!-- Tazón de sopa de verduras: cerámica verde con caldo humeante y trozos
       de verduras a la vista (zanahoria, elote, verde). Lenguaje sticker del
       DS (contorno ink, cel-shading, brillos, sombra de contacto). Pure art,
       no mechanic. `steam` muestra el vapor (con vaivén suave). -->
  <svg class="soup-bowl" viewBox="0 0 220 172" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath :id="`${uid}-b`"><path :d="BODY" /></clipPath>
    </defs>

    <ellipse v-if="shadow" cx="110" cy="160" rx="70" ry="7" fill="#3d4256" opacity="0.10" />

    <!-- Vapor: dos hebras que suben desde el caldo -->
    <g v-if="steam" class="soup-steam" fill="none" stroke="#b9c7d4" stroke-width="7" stroke-linecap="round" opacity="0.75">
      <path class="soup-steam-a" d="M84,42 C78,32 88,26 84,14" />
      <path class="soup-steam-b" d="M132,46 C126,34 138,28 132,12" />
    </g>

    <!-- Pie -->
    <rect x="86" y="144" width="48" height="12" rx="6" fill="#4a9068" stroke="#3d4256" stroke-width="5" />

    <!-- Cuerpo: base + media luna de cel-shading + franja decorativa -->
    <path :d="BODY" fill="#6bbf8a" />
    <g :clip-path="`url(#${uid}-b)`">
      <rect x="0" y="0" width="220" height="172" fill="#57a476" />
      <path :d="BODY" transform="translate(-12,-8)" fill="#6bbf8a" />
      <rect x="18" y="108" width="184" height="13" fill="#4a9068" opacity="0.5" />
    </g>
    <path :d="BODY" fill="none" stroke="#3d4256" stroke-width="6" />

    <!-- Borde -->
    <ellipse cx="110" cy="68" rx="82" ry="18" fill="#4a9068" stroke="#3d4256" stroke-width="6" />

    <!-- Caldo con trozos de verduras -->
    <ellipse cx="110" cy="68" rx="64" ry="11" fill="#f0a04b" />
    <path d="M50,66 A64,11 0 0 1 170,66 L170,69 A64,11 0 0 1 50,69 Z" fill="#d97f2e" opacity="0.5" />
    <!-- zanahoria -->
    <circle cx="84" cy="68" r="7" fill="#ef8a3c" stroke="#c2661d" stroke-width="3" />
    <!-- elote -->
    <circle cx="126" cy="65" r="4.5" fill="#f4c542" stroke="#c49b2a" stroke-width="2.5" />
    <circle cx="141" cy="70" r="4" fill="#f4c542" stroke="#c49b2a" stroke-width="2.5" />
    <!-- verde (brócoli) -->
    <circle cx="105" cy="72" r="5.5" fill="#6bbf8a" stroke="#4a9068" stroke-width="3" />
    <!-- burbujitas del caldo -->
    <circle cx="68" cy="64" r="2.4" fill="#fbd6a4" />
    <circle cx="152" cy="64" r="2" fill="#fbd6a4" />

    <!-- Brillo -->
    <path d="M46,104 A56,48 0 0 0 70,136" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="8" stroke-linecap="round" />
    <circle cx="82" cy="142" r="4" fill="rgba(255,255,255,0.45)" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  steam?: boolean
  shadow?: boolean
}>(), {
  steam: true,
  shadow: true,
})

const uid = useId()

const BODY = 'M28,68 L192,68 A82,74 0 0 1 110,152 A82,74 0 0 1 28,68 Z'
</script>

<style scoped>
.soup-bowl {
  width: 100%;
  height: 100%;
  display: block;
}

/* Vaivén suave del vapor (arte ambiental, no un control — regla 13 aplica a botones) */
.soup-steam-a {
  animation: soup-steam-sway 2600ms ease-in-out infinite;
}

.soup-steam-b {
  animation: soup-steam-sway 2600ms ease-in-out 800ms infinite;
}

@keyframes soup-steam-sway {
  0%, 100% { transform: translateX(0); opacity: 0.75; }
  50% { transform: translateX(4px); opacity: 0.45; }
}
</style>
