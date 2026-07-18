<template>
  <!-- Pelota; `kind` futbol/basket/playa — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="ball" viewBox="0 0 256 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.347368)">
    <template v-if="kind === 'basket'">
    <ellipse cx="95" cy="182" rx="66" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="95" cy="98" r="70" fill="#f08c1e"/>
    <clipPath :id="`${uid}-b`">
    <path d="M165,98 A70,70 0 1 1 25,98 A70,70 0 1 1 165,98 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-b)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#d97612"/>
    <path d="M165,98 A70,70 0 1 1 25,98 A70,70 0 1 1 165,98 Z" transform="translate(-9,-9)" fill="#f08c1e"/>
    </g>
    <path d="M25,98 L165,98 M95,28 L95,168 M43,46 C70,80 70,116 43,150 M147,46 C120,80 120,116 147,150" fill="none" stroke="#3d4256" stroke-width="5"/>
    <circle cx="95" cy="98" r="70" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M48,80 C52,64 64,52 78,46" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else-if="kind === 'playa'">
    <ellipse cx="95" cy="182" rx="66" ry="7" fill="#3d4256" opacity="0.10"/>
    <path d="M95,98 L95,28 A70,70 0 0 1 156,63 Z" fill="#e63946"/>
    <path d="M95,98 L156,63 A70,70 0 0 1 156,133 Z" fill="#f4c542"/>
    <path d="M95,98 L156,133 A70,70 0 0 1 95,168 Z" fill="#3aa8e0"/>
    <path d="M95,98 L95,168 A70,70 0 0 1 34,133 Z" fill="#6bbf8a"/>
    <path d="M95,98 L34,133 A70,70 0 0 1 34,63 Z" fill="#ffffff"/>
    <path d="M95,98 L34,63 A70,70 0 0 1 95,28 Z" fill="#a29bfe"/>
    <circle cx="95" cy="98" r="70" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="95" cy="98" r="13" fill="#ffffff" stroke="#3d4256" stroke-width="5"/>
    <path d="M48,80 C52,64 64,52 78,46" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else>
    <ellipse cx="95" cy="182" rx="66" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="95" cy="98" r="70" fill="#ffffff"/>
    <clipPath :id="`${uid}-a`">
    <path d="M165,98 A70,70 0 1 1 25,98 A70,70 0 1 1 165,98 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#dfe4ea"/>
    <path d="M165,98 A70,70 0 1 1 25,98 A70,70 0 1 1 165,98 Z" transform="translate(-9,-9)" fill="#ffffff"/>
    </g>
    <path d="M95,72 L120,90 L110,119 L80,119 L70,90 Z" fill="#3d4256"/>
    <path d="M95,72 L95,32" stroke="#3d4256" stroke-width="5"/>
    <path d="M120,90 L158,78" stroke="#3d4256" stroke-width="5"/>
    <path d="M110,119 L134,151" stroke="#3d4256" stroke-width="5"/>
    <path d="M80,119 L56,151" stroke="#3d4256" stroke-width="5"/>
    <path d="M70,90 L32,78" stroke="#3d4256" stroke-width="5"/>
    <circle cx="95" cy="98" r="70" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M48,80 C52,64 64,52 78,46" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  kind?: 'futbol' | 'basket' | 'playa'
}>(), {
  kind: 'futbol',
})

const uid = useId()
</script>

<style scoped>
.ball {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
