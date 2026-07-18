<template>
  <!-- DS EmotionGauge: medidor VERTICAL de intensidad emocional con tres
       zonas semánticas — calma (verde), atención (amarillo), intensa (rojo).
       La columna sube/baja con `value` (0..1) y toma el color de su zona.
       Presentacional puro (como Glass/StopLight): la escena decide el valor
       y el ritmo — subirlo con el enojo, bajarlo al respirar. -->
  <div class="emotion-gauge">
    <!-- Leyenda de zonas: tres bandas fijas junto a la columna -->
    <div class="emotion-gauge-zones" aria-hidden="true">
      <span class="emotion-gauge-zone" style="background: var(--accent-red)" />
      <span class="emotion-gauge-zone" style="background: var(--accent-yellow)" />
      <span class="emotion-gauge-zone" style="background: var(--accent-green)" />
    </div>

    <div class="emotion-gauge-track">
      <div
        class="emotion-gauge-fill"
        :style="{ height: `${clampedValue * 100}%`, background: zoneColor }"
      >
        <div class="emotion-gauge-surface" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EmotionGaugeProps, EmotionGaugeZone } from './EmotionGauge.types'

const props = defineProps<EmotionGaugeProps>()

const clampedValue = computed(() => Math.min(Math.max(props.value, 0), 1))

const zone = computed<EmotionGaugeZone>(() =>
  clampedValue.value < 1 / 3 ? 'calma' : clampedValue.value < 2 / 3 ? 'atencion' : 'intensa')

const ZONE_COLORS: Record<EmotionGaugeZone, string> = {
  calma: 'var(--accent-green)',
  atencion: 'var(--accent-yellow)',
  intensa: 'var(--accent-red)',
}

const zoneColor = computed(() => ZONE_COLORS[zone.value])

defineExpose({ zone })
</script>

<style scoped>
.emotion-gauge {
  display: flex;
  align-items: stretch;
  gap: 8px;
  width: 64px;
  height: 260px;
}

.emotion-gauge-zones {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 10px;
  padding: 2px 0;
}

.emotion-gauge-zone {
  flex: 1;
  border-radius: 5px;
  border: 2px solid var(--ink);
}

/* Columna: mismo lenguaje sticker que Glass (borde ink, sombra plana) */
.emotion-gauge-track {
  position: relative;
  flex: 1;
  background: #ffffff;
  border: 4px solid var(--ink);
  border-radius: 18px;
  box-shadow: 0 3px 0 var(--ink);
  overflow: hidden;
}

.emotion-gauge-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  transition: height 600ms cubic-bezier(0.25, 0.8, 0.4, 1), background 400ms ease;
}

.emotion-gauge-surface {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.45);
}
</style>
