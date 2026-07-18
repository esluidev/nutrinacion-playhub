<template>
  <!-- Medalla con listón; `metal` oro/plata/bronce — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="medal" viewBox="0 0 193.21 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.207547)">
    <template v-if="metal === 'plata'">
    <ellipse cx="80" cy="204" rx="46" ry="6" fill="#3d4256" opacity="0.10"/>
    <path d="M52,16 L80,86 L44,86 Z" fill="#e63946" stroke="#3d4256" stroke-width="5" stroke-linejoin="round"/>
    <path d="M108,16 L116,86 L80,86 Z" fill="#3aa8e0" stroke="#3d4256" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="80" cy="136" r="56" fill="#d5dae2"/>
    <clipPath :id="`${uid}-b`">
    <path d="M136,136 A56,56 0 1 1 24,136 A56,56 0 1 1 136,136 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-b)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#b9c0cc"/>
    <path d="M136,136 A56,56 0 1 1 24,136 A56,56 0 1 1 136,136 Z" transform="translate(-7,-8)" fill="#d5dae2"/>
    </g>
    <circle cx="80" cy="136" r="56" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="80" cy="136" r="41" fill="none" stroke="#98a1b0" stroke-width="4"/>
    <path d="M80,110 L87,127 L106,128 L91,140 L96,158 L80,147 L64,158 L69,140 L54,128 L73,127 Z" fill="#ffffff" opacity="0.85" stroke="#98a1b0" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42,120 C46,106 56,96 68,90" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="8" stroke-linecap="round"/>
    </template>
    <template v-else-if="metal === 'bronce'">
    <ellipse cx="80" cy="204" rx="46" ry="6" fill="#3d4256" opacity="0.10"/>
    <path d="M52,16 L80,86 L44,86 Z" fill="#e63946" stroke="#3d4256" stroke-width="5" stroke-linejoin="round"/>
    <path d="M108,16 L116,86 L80,86 Z" fill="#3aa8e0" stroke="#3d4256" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="80" cy="136" r="56" fill="#d99a5b"/>
    <clipPath :id="`${uid}-c`">
    <path d="M136,136 A56,56 0 1 1 24,136 A56,56 0 1 1 136,136 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-c)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#c07f42"/>
    <path d="M136,136 A56,56 0 1 1 24,136 A56,56 0 1 1 136,136 Z" transform="translate(-7,-8)" fill="#d99a5b"/>
    </g>
    <circle cx="80" cy="136" r="56" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="80" cy="136" r="41" fill="none" stroke="#a5692f" stroke-width="4"/>
    <path d="M80,110 L87,127 L106,128 L91,140 L96,158 L80,147 L64,158 L69,140 L54,128 L73,127 Z" fill="#ffffff" opacity="0.85" stroke="#a5692f" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42,120 C46,106 56,96 68,90" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="8" stroke-linecap="round"/>
    </template>
    <template v-else>
    <ellipse cx="80" cy="204" rx="46" ry="6" fill="#3d4256" opacity="0.10"/>
    <path d="M52,16 L80,86 L44,86 Z" fill="#e63946" stroke="#3d4256" stroke-width="5" stroke-linejoin="round"/>
    <path d="M108,16 L116,86 L80,86 Z" fill="#3aa8e0" stroke="#3d4256" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="80" cy="136" r="56" fill="#f4c542"/>
    <clipPath :id="`${uid}-a`">
    <path d="M136,136 A56,56 0 1 1 24,136 A56,56 0 1 1 136,136 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#dfa92e"/>
    <path d="M136,136 A56,56 0 1 1 24,136 A56,56 0 1 1 136,136 Z" transform="translate(-7,-8)" fill="#f4c542"/>
    </g>
    <circle cx="80" cy="136" r="56" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="80" cy="136" r="41" fill="none" stroke="#c49b2a" stroke-width="4"/>
    <path d="M80,110 L87,127 L106,128 L91,140 L96,158 L80,147 L64,158 L69,140 L54,128 L73,127 Z" fill="#ffffff" opacity="0.85" stroke="#c49b2a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42,120 C46,106 56,96 68,90" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="8" stroke-linecap="round"/>
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  metal?: 'oro' | 'plata' | 'bronce'
}>(), {
  metal: 'oro',
})

const uid = useId()
</script>

<style scoped>
.medal {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
