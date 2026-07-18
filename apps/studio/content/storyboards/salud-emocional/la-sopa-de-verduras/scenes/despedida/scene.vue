<template>
  <!-- La despedida ES el RESUMEN del taller (regla 17): vista GENÉRICA — sin
       imágenes del tema — con recompensas y estadísticas útiles. El botón
       principal cierra el storyboard de inmediato. -->
  <div class="scene">
    <PlayTrophyIcon class="trophy" />

    <h1 class="scene-title" v-html="t('title')" />

    <p class="scene-message" v-html="t('message')" />

    <!-- Resumen: recompensas + datos útiles. Jerarquía de color del DS:
         amarillo = recompensa, verde = progreso, azul = info -->
    <div class="summary-stats">
      <div class="summary-stat summary-stat-points">
        <PlayCoinStackIcon class="summary-stat-icon" />
        <div class="summary-stat-col">
          <span class="summary-stat-value">{{ game.points }}</span>
          <span class="summary-stat-label">{{ t('statPoints') }}</span>
        </div>
      </div>
      <div class="summary-stat summary-stat-scenes">
        <span class="summary-stat-value">{{ scenesPlayed }}/{{ totalScenes }}</span>
        <span class="summary-stat-label">{{ t('statScenes') }}</span>
      </div>
      <div class="summary-stat summary-stat-time">
        <span class="summary-stat-value">{{ elapsedLabel }}</span>
        <span class="summary-stat-label">{{ t('statTime') }}</span>
      </div>
    </div>

    <!-- Una sola acción, centrada (reiniciar vive en el panel del docente) -->
    <div class="summary-actions">
      <button class="sp-btn sp-btn-green sp-btn-big" :disabled="closing" @click="finish">{{ t('byeBtn') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useT } from '~/composables/useT'
import PlayCoinStackIcon from '~/components/PlayCoinStackIcon.vue'
import PlayTrophyIcon from '~/components/PlayTrophyIcon.vue'
import { Sounds } from '~/primitives/sounds'
import { useGameState } from '~/stores/gameState'
import sceneConfig from './scene.config'

const props = defineProps<{
  locale?: string
  config?: Record<string, unknown>
}>()

const emit = defineEmits<{
  complete: []
  score: [points: number]
}>()

const t = useT(sceneConfig.strings, () => props.locale)

const game = useGameState()

// Snapshot al montar: el resumen es una foto fija de la corrida
const totalScenes = Math.max(game.totalScenes, 1)
const scenesPlayed = Math.min(game.completedCount + 1, totalScenes)
const elapsedLabel = (() => {
  const secs = game.startedAt ? Math.max(0, Math.round((Date.now() - game.startedAt) / 1000)) : 0
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
})()

const closing = ref(false)

function finish() {
  if (closing.value) return
  closing.value = true
  Sounds.play('celebrate')
  emit('complete') // última escena: el runner cierra el storyboard de inmediato
}
</script>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  padding: 120px 80px 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  font-family: var(--font-body);
  color: var(--ink);
}

.trophy {
  width: 132px;
  height: 132px;
  animation: trophy-in 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes trophy-in {
  0% { opacity: 0; transform: translateY(-20px) scale(0.5) rotate(-15deg); }
  60% { opacity: 1; transform: translateY(8px) scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
}

.scene-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 56px;
  line-height: 1;
}

.scene-message {
  font-weight: 800;
  font-size: 18px;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.5;
}

/* Tarjetas de estadística: tintes planos, sin sombra */
.summary-stats {
  display: flex;
  gap: 22px;
  margin-top: 30px;
}

.summary-stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-width: 196px;
  padding: 26px 34px;
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: var(--card-radius);
  flex-direction: column;
}

.summary-stat:first-child {
  flex-direction: row;
}

.summary-stat-points { background: var(--yellow-tint); }
.summary-stat-scenes { background: var(--green-tint); }
.summary-stat-time { background: #dde8f0; }

.summary-stat-icon {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
}

.summary-stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-stat-value {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 40px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.summary-stat-label {
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.summary-actions {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* Botón: DS global .sp-btn */
</style>
