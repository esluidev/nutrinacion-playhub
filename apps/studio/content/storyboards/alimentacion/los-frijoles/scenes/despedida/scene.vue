<template>
  <!-- The farewell IS the workshop SUMMARY (regla 17): a GENERIC view — no
       topic imagery — with the run's rewards and useful stats for kid and
       teacher. The primary button CLOSES the storyboard right away; the
       discreet white one restarts. -->
  <div class="scene">
    <PlayTrophyIcon class="trophy" />

    <h1 class="scene-title" v-html="t('title')" />

    <p class="scene-message" v-html="t('message')" />

    <!-- Run summary: rewards + useful stats. Big tinted cards (DS hierarchy:
         yellow = reward, green = progress, blue = info), no shadow — this is
         the achievement feedback, it must carry visual weight -->
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

    <!-- One action, centered: closing is the natural end (restart lives in
         the teacher panel / config) -->
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

// Snapshot on mount: the summary is a still photo of the run
const totalScenes = Math.max(game.totalScenes, 1)
// The summary scene counts itself as played (it has no game to complete)
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
  emit('complete') // last scene: the runner closes the storyboard right away
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

.scene-title .accent {
  color: var(--accent-green-dark);
}

.scene-message {
  font-weight: 800;
  font-size: 18px;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.5;
}

/* Big tinted stat cards, horizontal — flat (no shadow): the achievement
   feedback carries the visual weight of this scene */
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

/* DS color hierarchy: yellow = reward, green = progress, blue = info */
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

/* Single centered primary action */
.summary-actions {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* Botón: DS global .sp-btn (app/assets/css/main.css) */
</style>
