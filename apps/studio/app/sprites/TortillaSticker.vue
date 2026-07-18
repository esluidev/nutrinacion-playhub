<template>
  <!-- Tortilla — una o en pila (`stack`), con motitas tostadas. -->
  <svg class="tortilla" viewBox="0 0 256 182.86" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.219048)">
    <defs>
      <clipPath v-for="(y, i) in layers" :key="i" :id="`${uid}-t${i}`"><ellipse cx="105" :cy="y" rx="85" ry="26" /></clipPath>
    </defs>

    <ellipse cx="105" cy="132" rx="86" ry="8" fill="#3d4256" opacity="0.10" />

    <g v-for="(y, i) in layers" :key="`l${i}`">
      <ellipse cx="105" :cy="y" rx="85" ry="26" :fill="tone(i)[0]" />
      <g :clip-path="`url(#${uid}-t${i})`">
        <rect x="0" y="0" width="220" height="160" :fill="tone(i)[1]" />
        <ellipse cx="99" :cy="y - 5" rx="85" ry="26" :fill="tone(i)[0]" />
      </g>
      <ellipse cx="105" :cy="y" rx="85" ry="26" fill="none" stroke="#3d4256" stroke-width="5" />
    </g>

    <g fill="#c9a768" opacity="0.8">
      <ellipse :cy="top - 6" cx="65" rx="5" ry="3" />
      <ellipse :cy="top - 12" cx="99" rx="6" ry="3.6" />
      <ellipse :cy="top - 4" cx="135" rx="5" ry="3" />
      <ellipse :cy="top + 2" cx="163" rx="4" ry="2.4" />
      <ellipse :cy="top + 2" cx="41" rx="4" ry="2.4" />
    </g>
  </g></svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(defineProps<{
  /** Pila de tres tortillas */
  stack?: boolean
}>(), {
  stack: true,
})

const uid = useId()

const TONES: [string, string][] = [['#e8cf9c', '#d4b87e'], ['#f0d9a6', '#dcc488'], ['#f6e3b4', '#e2ce96']]
const layers = computed(() => (props.stack ? [112, 100, 88] : [100]))
const top = computed(() => layers.value[layers.value.length - 1]!)

function tone(i: number): [string, string] {
  return TONES[props.stack ? i : 1] ?? TONES[1]!
}
</script>

<style scoped>
.tortilla {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
