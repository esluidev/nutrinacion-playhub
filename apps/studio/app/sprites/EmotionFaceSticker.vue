<template>
  <!-- Carita de emoción (8 emociones, color por props) — lenguaje sticker del DS (contorno ink, cel-shading, brillos,
       sombra de contacto). Pure art, no mechanic. -->
  <svg class="emo" viewBox="0 0 249.08 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.383784)">
    <template v-if="emotion === 'feliz'">
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-a`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-a)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="66" cy="82" r="7" fill="#3d4256"/>
    <circle cx="114" cy="82" r="7" fill="#3d4256"/>
    <path d="M60,110 Q90,134 120,110" fill="none" stroke="#3d4256" stroke-width="7" stroke-linecap="round"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else-if="emotion === 'triste'">
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-b`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-b)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="66" cy="84" r="7" fill="#3d4256"/>
    <circle cx="114" cy="84" r="7" fill="#3d4256"/>
    <path d="M64,122 Q90,104 116,122" fill="none" stroke="#3d4256" stroke-width="7" stroke-linecap="round"/>
    <path d="M120,96 C126,106 129,112 129,118 C129,126 123,130 118,127 C113,124 112,117 115,109 Z" fill="#7ac5eb" stroke="#3d4256" stroke-width="4"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else-if="emotion === 'enojado'">
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-c`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-c)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M52,64 L78,74 M128,64 L102,74" stroke="#3d4256" stroke-width="7" stroke-linecap="round"/>
    <circle cx="66" cy="88" r="7" fill="#3d4256"/>
    <circle cx="114" cy="88" r="7" fill="#3d4256"/>
    <path d="M64,124 Q90,110 116,124" fill="none" stroke="#3d4256" stroke-width="7" stroke-linecap="round"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else-if="emotion === 'asustado'">
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-d`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-d)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <circle cx="66" cy="84" r="13" fill="#fff" stroke="#3d4256" stroke-width="4"/>
    <circle cx="66" cy="84" r="5" fill="#3d4256"/>
    <circle cx="114" cy="84" r="13" fill="#fff" stroke="#3d4256" stroke-width="4"/>
    <circle cx="114" cy="84" r="5" fill="#3d4256"/>
    <ellipse cx="90" cy="122" rx="12" ry="16" fill="#3d4256"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else-if="emotion === 'calmado'">
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-e`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-e)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M56,84 Q66,76 76,84 M104,84 Q114,76 124,84" fill="none" stroke="#3d4256" stroke-width="6" stroke-linecap="round"/>
    <path d="M68,114 Q90,128 112,114" fill="none" stroke="#3d4256" stroke-width="6" stroke-linecap="round"/>
    <circle cx="52" cy="102" r="7" fill="#f7a8a0" opacity="0.6"/>
    <circle cx="128" cy="102" r="7" fill="#f7a8a0" opacity="0.6"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else-if="emotion === 'sorprendido'">
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-f`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-f)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M54,62 Q66,54 78,60 M102,60 Q114,54 126,62" fill="none" stroke="#3d4256" stroke-width="6" stroke-linecap="round"/>
    <circle cx="66" cy="84" r="8" fill="#3d4256"/>
    <circle cx="114" cy="84" r="8" fill="#3d4256"/>
    <circle cx="90" cy="120" r="13" fill="#3d4256"/>
    <circle cx="90" cy="117" r="5" fill="#b9646e"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else-if="emotion === 'curioso'">
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-g`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-g)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M53,65 Q66,55 78,63 M103,59 Q116,50 128,58" fill="none" stroke="#3d4256" stroke-width="6" stroke-linecap="round"/>
    <circle cx="66" cy="86" r="8" fill="#fff" stroke="#3d4256" stroke-width="4"/>
    <circle cx="68" cy="86" r="3.5" fill="#3d4256"/>
    <circle cx="114" cy="83" r="11" fill="#fff" stroke="#3d4256" stroke-width="4"/>
    <circle cx="116" cy="83" r="4" fill="#3d4256"/>
    <path d="M70,116 Q90,128 110,113" fill="none" stroke="#3d4256" stroke-width="6" stroke-linecap="round"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
    <template v-else>
    <ellipse cx="90" cy="176" rx="62" ry="7" fill="#3d4256" opacity="0.10"/>
    <circle cx="90" cy="94" r="68" :fill="body"/>
    <clipPath :id="`${uid}-h`">
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z"/>
    </clipPath>
    <g :clip-path="`url(#${uid}-h)`">
    <rect x="-400" y="-400" width="1200" height="1200" :fill="shade"/>
    <path d="M158,94 A68,68 0 1 1 22,94 A68,68 0 1 1 158,94 Z" transform="translate(-8,-9)" :fill="body"/>
    </g>
    <circle cx="90" cy="94" r="68" fill="none" stroke="#3d4256" stroke-width="6"/>
    <path d="M52,76 Q65,68 78,78 M102,78 Q115,68 128,76" fill="none" stroke="#3d4256" stroke-width="6" stroke-linecap="round"/>
    <path d="M61,88 Q67,94 73,88 M107,88 Q113,94 119,88" fill="none" stroke="#3d4256" stroke-width="5" stroke-linecap="round"/>
    <path d="M87,94 Q82,105 91,108" fill="none" stroke="#3d4256" stroke-width="4" stroke-linecap="round"/>
    <path d="M63,124 Q76,113 89,122 Q102,131 117,118" fill="none" stroke="#3d4256" stroke-width="7" stroke-linecap="round"/>
    <path d="M44,78 C48,62 60,50 74,44" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="9" stroke-linecap="round"/>
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
withDefaults(defineProps<{
  emotion?: 'feliz' | 'triste' | 'enojado' | 'asustado' | 'calmado' | 'sorprendido' | 'curioso' | 'desagrado'
  body?: string
  shade?: string
}>(), {
  emotion: 'feliz',
  body: '#f9d976',
  shade: '#f4c542',
})

const uid = useId()
</script>

<style scoped>
.emo {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
