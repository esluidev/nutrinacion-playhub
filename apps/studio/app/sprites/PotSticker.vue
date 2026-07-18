<template>
  <!-- Cooking pot v2: cuerpo metálico con cel-shading + banda de luz, asas con
       remaches, agua con olas y burbujas, sombra de contacto. With `lid` the
       pot is covered, and `lidBouncing` makes the lid jump while it boils. -->
  <svg class="pot" viewBox="0 0 256 174.55" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-b`"><path :d="BODY" /></clipPath>
    </defs>

    <ellipse cx="110" cy="142" rx="80" ry="7" fill="#3d4256" opacity="0.10" />

    <!-- Asas con remache -->
    <rect x="8" y="58" width="38" height="16" rx="8" fill="#3f4458" stroke="#3d4256" stroke-width="5" />
    <rect x="174" y="58" width="38" height="16" rx="8" fill="#3f4458" stroke="#3d4256" stroke-width="5" />
    <circle cx="20" cy="66" r="2.6" fill="#252a3d" />
    <circle cx="200" cy="66" r="2.6" fill="#252a3d" />

    <!-- Cuerpo: base + media luna de sombra + banda de luz -->
    <path :d="BODY" fill="#3aa8e0" />
    <g :clip-path="`url(#${uid}-b)`">
      <rect x="0" y="0" width="240" height="160" fill="#2b86ba" />
      <path :d="BODY" transform="translate(-12,-9)" fill="#3aa8e0" />
      <rect x="52" y="56" width="16" height="86" rx="8" fill="#fff" opacity="0.22" />
    </g>
    <path :d="BODY" fill="none" stroke="#3d4256" stroke-width="6" />

    <!-- Borde + agua (visible sin tapa) -->
    <ellipse cx="110" cy="54" rx="74" ry="14" fill="#2680ae" stroke="#3d4256" stroke-width="6" />
    <template v-if="!lid">
      <ellipse cx="110" cy="54" rx="58" ry="9" fill="#7ac5eb" />
      <path d="M70,54 C84,50 96,58 110,54 C124,50 136,58 150,54" fill="none" stroke="#a8dcf5" stroke-width="4" stroke-linecap="round" />
      <circle cx="90" cy="52" r="2.6" fill="#d6eefb" />
      <circle cx="132" cy="55" r="2" fill="#d6eefb" />
    </template>

    <!-- Tapa v2: domo simétrico con sombreado lateral, perilla de bolita con
         tallo y borde con canal — salta mientras hierve -->
    <g v-if="lid" :class="['pot-lid', { 'is-bouncing': lidBouncing }]">
      <rect x="104" y="16" width="12" height="10" rx="3" fill="#b82838" stroke="#3d4256" stroke-width="4" />
      <circle cx="110" cy="12" r="8.5" fill="#e63946" stroke="#3d4256" stroke-width="5" />
      <circle cx="107" cy="9" r="2.6" fill="rgba(255,255,255,0.7)" />
      <path d="M46,50 C46,28 74,18 110,18 C146,18 174,28 174,50 Z" fill="#e6e9ee" stroke="#3d4256" stroke-width="6" stroke-linejoin="round" />
      <path d="M138,21 C160,27 172,38 172,50 L150,50 C150,36 146,27 138,21 Z" fill="#cdd3dd" />
      <path d="M60,42 C64,32 76,25 90,22" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="7" stroke-linecap="round" />
      <ellipse cx="110" cy="50" rx="68" ry="11" fill="#c8cdd6" stroke="#3d4256" stroke-width="6" />
      <path d="M52,50 A58,7 0 0 1 168,50" fill="none" stroke="#b3bac7" stroke-width="4" />
    </g>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  lid?: boolean
  lidBouncing?: boolean
}>()

const uid = useId()

const BODY = 'M36,54 L184,54 L184,108 Q184,138 150,138 L70,138 Q36,138 36,108 Z'
</script>

<style scoped>
.pot {
  width: 100%;
  height: 100%;
  display: block;
}

.pot-lid {
  transform-origin: 110px 48px;
}

.pot-lid.is-bouncing {
  animation: pot-lid-jump 460ms ease-in-out infinite;
}

@keyframes pot-lid-jump {
  0%, 100% { transform: translateY(0) rotate(0); }
  30% { transform: translateY(-7px) rotate(-2.5deg); }
  60% { transform: translateY(-2px) rotate(2deg); }
}
</style>
