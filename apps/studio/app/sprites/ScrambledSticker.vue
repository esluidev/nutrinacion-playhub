<template>
  <!-- Scrambled eggs v3 — tres estados del MISMO alimento:
       raw    = mezcla batida recién vertida (charco, sin plato)
       pan    = cuajándose en el sartén (grumos esponjosos, sin plato)
       served = platillo servido (plato + grumos + cebollín)
       `raw` (boolean) se mantiene como alias de variant="raw". -->
  <svg class="scrambled" viewBox="0 0 256 174.55" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.163636)">
    <defs>
      <clipPath :id="`${uid}-p`"><ellipse cx="110" cy="102" rx="92" ry="34" /></clipPath>
      <clipPath :id="`${uid}-c`"><path :d="CURDS" /></clipPath>
    </defs>

    <!-- Plato SOLO en el estado cocido: la mezcla cruda (raw) siempre vive
         sobre un utensilio (tazón/sartén) — con plato debajo parecía huevo
         estrellado -->
    <template v-if="state === 'served'">
      <ellipse cx="110" cy="140" rx="94" ry="8" fill="#3d4256" opacity="0.10" />
      <ellipse cx="110" cy="102" rx="92" ry="34" fill="#fef7e8" />
      <g :clip-path="`url(#${uid}-p)`">
        <rect x="0" y="0" width="240" height="160" fill="#e7ddc2" />
        <ellipse cx="103" cy="94" rx="92" ry="34" fill="#fef7e8" />
      </g>
      <ellipse cx="110" cy="102" rx="92" ry="34" fill="none" stroke="#3d4256" stroke-width="6" />
      <ellipse cx="110" cy="99" rx="66" ry="21" fill="#e8e0c8" />
    </template>

    <template v-if="state === 'raw'">
      <ellipse cx="110" cy="96" rx="62" ry="20" fill="#f8d56a" stroke="#c49b2a" stroke-width="5" />
      <path d="M74,92 C87,85 100,99 112,92 C124,85 137,99 148,92" fill="none" stroke="#c49b2a" stroke-width="4" stroke-linecap="round" />
      <ellipse cx="88" cy="90" rx="9" ry="4.5" fill="rgba(255,255,255,0.55)" />
    </template>
    <template v-if="state !== 'raw'">
      <!-- Montículo esponjoso con cel-shading (en sartén y servido) -->
      <path :d="CURDS" fill="#f6cd55" />
      <g :clip-path="`url(#${uid}-c)`">
        <rect x="0" y="0" width="240" height="160" fill="#e0b23a" />
        <path :d="CURDS" transform="translate(-8,-11)" fill="#f6cd55" />
      </g>
      <path :d="CURDS" fill="none" stroke="#c49b2a" stroke-width="6" />
      <g fill="none" stroke="#e0b13c" stroke-width="5" stroke-linecap="round">
        <path d="M70,92 C78,86 88,90 94,84" />
        <path d="M108,98 C118,92 128,96 136,88" />
        <path d="M92,72 C100,68 108,72 114,66" />
      </g>
      <ellipse cx="84" cy="66" rx="10" ry="6" fill="rgba(255,255,255,0.7)" />
      <!-- Cebollín: solo en el platillo servido -->
      <g v-if="state === 'served'" fill="#4a9068">
        <rect x="88" y="78" width="9" height="3.6" rx="1.8" transform="rotate(-24 92 80)" />
        <rect x="124" y="70" width="9" height="3.6" rx="1.8" transform="rotate(14 128 72)" />
        <rect x="106" y="106" width="8" height="3.4" rx="1.7" transform="rotate(-10 110 108)" />
        <rect x="146" y="92" width="8" height="3.4" rx="1.7" transform="rotate(22 150 94)" />
      </g>
    </template>
  </g></svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  /** Alias de variant="raw" (compat) */
  raw?: boolean
  /** raw = mezcla vertida · pan = cuajándose en el sartén · served = platillo */
  variant?: 'raw' | 'pan' | 'served'
}>()

const state = computed(() => props.variant ?? (props.raw ? 'raw' : 'served'))

const uid = useId()

const CURDS = 'M46,100 C38,88 48,74 62,76 C62,62 80,54 92,62 C98,48 120,46 130,58 C140,50 158,56 158,68 C172,66 182,78 176,90 C186,96 180,110 166,110 C156,118 132,120 116,114 C100,122 72,118 60,110 C50,110 44,106 46,100 Z'
</script>

<style scoped>
.scrambled {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
