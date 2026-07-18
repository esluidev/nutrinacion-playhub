<template>
  <!-- DS Stir: a wooden spoon mixing in circles — overlay it on any cookware
       while food is being mixed (scrambled eggs, dough, soup…). Pure visual
       effect; the scene positions it. -->
  <div v-if="active" class="stir" aria-hidden="true">
    <svg class="stir-spoon" viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="6" width="12" height="66" rx="6" fill="#d8a35f" stroke="#3d4256" stroke-width="5" />
      <ellipse cx="30" cy="92" rx="20" ry="26" fill="#e2b478" stroke="#3d4256" stroke-width="5" />
      <ellipse cx="30" cy="88" rx="10" ry="14" fill="#c08c4d" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { StirProps } from './Stir.types'

withDefaults(defineProps<StirProps>(), {
  active: true,
})
</script>

<style scoped>
.stir {
  width: 56px;
  height: 110px;
  pointer-events: none;
  animation: stir-orbit 1s linear infinite;
}

.stir-spoon {
  width: 100%;
  height: 100%;
  display: block;
  transform-origin: 50% 20%;
  animation: stir-tilt 1s linear infinite;
}

/* The spoon head traces a small circle while the handle sways */
@keyframes stir-orbit {
  0% { transform: translate(10px, 0); }
  25% { transform: translate(0, 7px); }
  50% { transform: translate(-10px, 0); }
  75% { transform: translate(0, -7px); }
  100% { transform: translate(10px, 0); }
}

@keyframes stir-tilt {
  0% { transform: rotate(7deg); }
  50% { transform: rotate(-7deg); }
  100% { transform: rotate(7deg); }
}
</style>
