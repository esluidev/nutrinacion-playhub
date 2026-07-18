<template>
  <!-- Muela; `state` sano/caries/brillante — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="tooth" viewBox="0 0 229.05 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.347368)">
    <template v-if="state === 'caries'">
    <ellipse cx="85" cy="180" rx="52" ry="6" fill="#3d4256" opacity="0.10"/>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" fill="#ffffff"/>
    <clipPath :id="`${uid}-b`">
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-b)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#dfe4ea"/>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" transform="translate(-7,-8)" fill="#ffffff"/>
    </g>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round"/>
    <path d="M96,52 C108,46 118,52 116,64 C114,74 102,76 94,68 C88,62 90,55 96,52 Z" fill="#6b4226" stroke="#3d4256" stroke-width="4"/>
    <path d="M56,66 C58,52 66,44 76,40" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="8" stroke-linecap="round"/>
    </template>
    <template v-else-if="state === 'brillante'">
    <ellipse cx="85" cy="180" rx="52" ry="6" fill="#3d4256" opacity="0.10"/>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" fill="#ffffff"/>
    <clipPath :id="`${uid}-c`">
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-c)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#dfe4ea"/>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" transform="translate(-7,-8)" fill="#ffffff"/>
    </g>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round"/>
    <path d="M126,34 l4,10 10,4 -10,4 -4,10 -4,-10 -10,-4 10,-4 Z" fill="#f4c542" stroke="#c49b2a" stroke-width="3"/>
    <path d="M56,66 C58,52 66,44 76,40" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="8" stroke-linecap="round"/>
    </template>
    <template v-else>
    <ellipse cx="85" cy="180" rx="52" ry="6" fill="#3d4256" opacity="0.10"/>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" fill="#ffffff"/>
    <clipPath :id="`${uid}-a`">
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" fill="#dfe4ea"/>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" transform="translate(-7,-8)" fill="#ffffff"/>
    </g>
    <path d="M44,60 C44,26 126,26 126,60 C126,88 118,94 114,124 C110,152 102,168 94,168 C86,168 85,148 85,134 C85,128 85,128 85,134 C85,148 84,168 76,168 C68,168 60,152 56,124 C52,94 44,88 44,60 Z" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round"/>
    <path d="M56,66 C58,52 66,44 76,40" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="8" stroke-linecap="round"/>
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  state?: 'sano' | 'caries' | 'brillante'
}>(), {
  state: 'sano',
})

const uid = useId()
</script>

<style scoped>
.tooth {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
