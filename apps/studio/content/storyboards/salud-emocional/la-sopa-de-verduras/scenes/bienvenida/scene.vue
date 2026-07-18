<template>
  <!-- HARD RULES (game-rules.md):
       - La Bienvenida ANUNCIA el tema; no adelanta las situaciones ni los
         juegos posteriores.
       - Sin interacción real, Comenzar avanza INMEDIATAMENTE (advanceOnComplete). -->
  <div class="scene">
    <!-- Una sola ilustración representativa: la sopa y dos reacciones que
         suelen quedar fuera del vocabulario infantil (curiosidad/desagrado). -->
    <div class="hero-row">
      <div class="hero-face hero-face-left"><EmotionFaceSticker emotion="desagrado" body="#b3d69c" shade="#8fbe72" /></div>
      <div class="hero-soup"><SoupBowlSticker /></div>
      <div class="hero-face hero-face-right"><EmotionFaceSticker emotion="curioso" body="#cfb6e5" shade="#b797d3" /></div>
    </div>

    <h1 class="scene-title" v-html="t('title')" />
    <p class="scene-subtitle">{{ t('subtitle') }}</p>

    <button class="sp-btn sp-btn-green sp-btn-hero" @click="begin">{{ t('cta') }}</button>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import EmotionFaceSticker from '~/sprites/EmotionFaceSticker.vue'
import SoupBowlSticker from '~/sprites/SoupBowlSticker.vue'
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

let started = false

function begin() {
  if (started) return
  started = true
  Sounds.play('pop')
  emit('score', 10)
  emit('complete') // advanceOnComplete: el runner salta a la siguiente escena
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

.hero-row {
  display: flex;
  align-items: flex-end;
  gap: 26px;
}

.hero-soup {
  width: 250px;
  height: 196px;
  animation: hero-in 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.hero-face {
  width: 104px;
  height: 107px;
  animation: hero-in 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.hero-face-left {
  animation-delay: 150ms;
}

.hero-face-right {
  animation-delay: 280ms;
}

@keyframes hero-in {
  0% { opacity: 0; transform: translateY(-16px) scale(0.6); }
  60% { opacity: 1; transform: translateY(6px) scale(1.08); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.scene-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 54px;
  line-height: 1;
  text-align: center;
}

.scene-subtitle {
  font-weight: 800;
  font-size: 18px;
  color: var(--ink-soft);
  text-align: center;
}

/* Botón: DS global .sp-btn */
</style>
