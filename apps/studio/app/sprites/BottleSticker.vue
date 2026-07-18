<template>
  <!-- Botella de agua deportiva — `level` (0-1) controla el agua. -->
  <svg class="bottle" viewBox="0 0 148.57 256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.142857)">
    <defs>
      <clipPath :id="`${uid}-c`"><path :d="BODY" /></clipPath>
    </defs>

    <ellipse cx="65" cy="216" rx="44" ry="6" fill="#3d4256" opacity="0.10" />

    <path :d="BODY" fill="#dff0fa" />
    <g :clip-path="`url(#${uid}-c)`">
      <rect x="20" :y="waterTop" width="90" :height="206 - waterTop" fill="#7ac5eb" />
      <path :d="`M20,${waterTop} C40,${waterTop - 6} 60,${waterTop + 6} 80,${waterTop} C95,${waterTop - 4} 105,${waterTop + 3} 112,${waterTop}`" fill="none" stroke="#a8dcf5" stroke-width="5" />
      <rect x="94" y="0" width="40" height="224" fill="rgba(61,66,86,0.08)" />
    </g>
    <path :d="BODY" fill="none" stroke="#3d4256" stroke-width="6" />

    <rect x="44" y="54" width="42" height="22" rx="6" fill="#3aa8e0" stroke="#3d4256" stroke-width="5" />
    <rect x="54" y="34" width="22" height="24" rx="7" fill="#2680ae" stroke="#3d4256" stroke-width="5" />
    <path d="M40,120 C40,106 42,96 46,88" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="8" stroke-linecap="round" />
  </g></svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(defineProps<{
  /** Nivel de agua 0-1 */
  level?: number
}>(), {
  level: 0.7,
})

const uid = useId()

const BODY = 'M38,74 Q28,92 28,120 L28,186 Q28,206 48,206 L82,206 Q102,206 102,186 L102,120 Q102,92 92,74 Z'
const waterTop = computed(() => Math.round(196 - (196 - 84) * Math.min(1, Math.max(0, props.level))))
</script>

<style scoped>
.bottle {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
