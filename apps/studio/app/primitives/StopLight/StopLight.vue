<template>
  <!-- Semáforo del DS: carcasa sticker (ink + sombra plana) con tres luces.
       Presentacional puro — la escena decide el estado y los sonidos.
       'off' = todas apagadas (reposo). Regla 13: sin efectos idle; la luz
       activa solo cambia cuando el juego lo pide. -->
  <div class="stop-light" :style="{ width: `${size}px` }">
    <div
      v-for="l in LIGHTS"
      :key="l.id"
      :class="['stop-light-lamp', { 'is-on': state === l.id }]"
      :style="{ '--lamp-color': l.color, '--lamp-dim': l.dim }"
    />
  </div>
</template>

<script setup lang="ts">
export type StopLightState = 'off' | 'green' | 'yellow' | 'red'

withDefaults(defineProps<{
  state?: StopLightState
  /** Ancho de la carcasa en px (la altura la dan las tres luces) */
  size?: number
}>(), {
  state: 'off',
  size: 96,
})

const LIGHTS = [
  { id: 'red', color: 'var(--accent-red)', dim: '#e6c9c9' },
  { id: 'yellow', color: 'var(--accent-yellow)', dim: '#e8dfc4' },
  { id: 'green', color: 'var(--accent-green)', dim: '#c9dcc9' },
] as const
</script>

<style scoped>
.stop-light {
  background: var(--card-surface);
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: 22px;
  box-shadow: var(--card-shadow, 0 4px 0 var(--ink));
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.stop-light-lamp {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3.5px solid var(--ink);
  background: var(--lamp-dim);
  transition: background 180ms ease-out, box-shadow 180ms ease-out, transform 180ms ease-out;
}

.stop-light-lamp.is-on {
  background: var(--lamp-color);
  transform: scale(1.06);
  /* halo del color de la luz (sin blur del DS en sombras de contacto; esto
     es EMISIÓN de luz, no sombra) */
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--lamp-color) 30%, transparent);
}
</style>
