<template>
  <!-- HARD RULES (game-rules.md):
       - La Bienvenida ANUNCIA el tema; no adelanta contenido de otras escenas.
       - Sin interacción real, Comenzar avanza INMEDIATAMENTE a la siguiente
         escena (advanceOnComplete en el config) — sin feedback intermedio. -->
  <div class="scene">
    <!-- A single representative illustration announces the topic -->
    <div class="hero-bean">
      <BeanSticker :body="HERO.bean.body" :outline="HERO.bean.outline" />
    </div>

    <h1 class="scene-title" v-html="t('title')" />
    <p class="scene-subtitle">{{ t('subtitle') }}</p>

    <button class="sp-btn sp-btn-green sp-btn-hero mt-4" @click="begin">{{ t('cta') }}</button>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import BeanSticker from '~/sprites/BeanSticker.vue'
import { BEANS } from '../../beans'
import sceneConfig from './scene.config'

const props = defineProps<{
  locale?: string
  config?: Record<string, unknown>
}>()

const t = useT(sceneConfig.strings, () => props.locale)

const emit = defineEmits<{
  complete: []
  score: [points: number]
}>()

// One representative bean as topic icon (varieties belong to Descubrimiento)
const HERO = BEANS[0]!

let started = false

function begin() {
  if (started) return
  started = true
  Sounds.play('pop')
  emit('score', 10)
  emit('complete') // advanceOnComplete: the runner jumps to the next scene
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

.hero-bean {
  width: 230px;
  height: 185px;
  animation: hero-float 2.4s ease-in-out infinite;
}

@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.scene-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 58px;
  line-height: 1;
  text-align: center;
}

.scene-title .accent {
  color: var(--accent-red);
}

.scene-subtitle {
  font-weight: 800;
  font-size: 20px;
  color: var(--ink-soft);
  text-align: center;
}

/* Botón: DS global .sp-btn (app/assets/css/main.css) */
</style>
