<template>
  <!-- Leche — vaso (default) o caja (`kind="box"`). -->
  <svg class="milk" viewBox="0 0 187.32 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.248780)">
    <defs>
      <clipPath :id="`${uid}-c`"><path :d="kind === 'box' ? BOX : GLASS" /></clipPath>
    </defs>

    <ellipse cx="75" cy="197" rx="54" ry="6" fill="#3d4256" opacity="0.10" />

    <template v-if="kind === 'box'">
      <path :d="BOX" fill="#eef3f7" />
      <path d="M30,70 L120,70 L120,92 L30,92 Z" fill="#3aa8e0" />
      <path d="M30,132 L120,132 L120,150 L30,150 Z" fill="#d8ecf6" />
      <g :clip-path="`url(#${uid}-c)`">
        <rect x="86" y="0" width="80" height="210" fill="rgba(61,66,86,0.10)" />
      </g>
      <path :d="BOX" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round" />
      <path d="M30,70 L75,44 L120,70" fill="none" stroke="#3d4256" stroke-width="5" stroke-linejoin="round" />
      <rect x="62" y="26" width="26" height="12" rx="6" fill="#2680ae" stroke="#3d4256" stroke-width="4" />
      <circle cx="60" cy="112" r="4" fill="#3aa8e0" />
      <path d="M40,110 C40,100 42,92 45,86" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="7" stroke-linecap="round" />
    </template>

    <template v-else>
      <!-- Vaso (tinte azulado, contrasta con la leche) -->
      <path :d="GLASS" fill="#d3e2ee" />
      <!-- Leche (blanca) -->
      <path :d="MILK" fill="#ffffff" />
      <!-- Superficie de la leche -->
      <ellipse cx="75" cy="74" rx="41" ry="5" fill="#e6eef5" />
      <!-- Cel-shading -->
      <g :clip-path="`url(#${uid}-c)`">
        <rect x="92" y="0" width="70" height="210" fill="rgba(61,66,86,0.09)" />
      </g>
      <path :d="GLASS" fill="none" stroke="#3d4256" stroke-width="6" stroke-linejoin="round" />
      <!-- Boca del vaso -->
      <ellipse cx="75" cy="40" rx="45" ry="9" fill="#c3d6e6" stroke="#3d4256" stroke-width="5" />
      <path d="M52,120 C52,104 54,94 57,88" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="8" stroke-linecap="round" />
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  /** vaso (default) o caja con techo a dos aguas */
  kind?: 'glass' | 'box'
}>(), {
  kind: 'glass',
})

const uid = useId()

const GLASS = 'M30,40 L120,40 L111,183 Q110,190 102,190 L48,190 Q40,190 39,183 Z'
const MILK = 'M34,74 L116,74 L110,182 Q109,188 102,188 L48,188 Q41,188 40,182 Z'
const BOX = 'M30,70 L75,44 L120,70 L120,180 Q120,188 112,188 L38,188 Q30,188 30,180 Z'
</script>

<style scoped>
.milk {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
