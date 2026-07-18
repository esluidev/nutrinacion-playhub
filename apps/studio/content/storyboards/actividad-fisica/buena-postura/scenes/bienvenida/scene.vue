<template>
  <!-- HARD RULES (game-rules.md):
       - La Bienvenida ANUNCIA el tema; no adelanta ejercicios posteriores.
       - Sin interacción real, Comenzar avanza INMEDIATAMENTE (advanceOnComplete). -->
  <div class="scene">
    <!-- Una sola ilustración representativa: el niño en equilibrio con la espalda
         recta (el tema es la postura, sin adelantar los ejercicios) -->
    <div class="hero-kid">
      <KidPoseSticker pose="balance" variant="boy" shirt="#6bbf8a" />
    </div>

    <h1 class="scene-title" v-html="t('title')" />
    <p class="scene-subtitle">{{ t('subtitle') }}</p>

    <button class="sp-btn sp-btn-green sp-btn-hero" @click="begin">{{ t('cta') }}</button>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
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

.hero-kid {
  width: 190px;
  height: 250px;
  animation: hero-in 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
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
