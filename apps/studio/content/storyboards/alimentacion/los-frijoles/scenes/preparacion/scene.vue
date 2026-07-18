<template>
  <!-- Regla 16: only playable elements — the ordered steps ARE the game; the
       instruction lives in the HUD audio, the feedback in the shell's strip.
       Mezclar never hides: it disables when the order is locked (regla 5). -->
  <div class="scene">
    <ReorderList
      ref="listRef"
      :items="STEPS"
      :correct-order="CORRECT_ORDER"
      mode="validate"
      shuffled
      class="steps-list"
      @complete="onComplete"
    />

    <button class="sp-btn sp-btn-ghost sp-btn-sm" :disabled="done" @click="listRef?.shuffle()">{{ t('shuffle') }}</button>
  </div>
</template>

<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import ReorderList from '~/primitives/ReorderList/ReorderList.vue'
import BeanSticker from '~/sprites/BeanSticker.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
import type { ReorderItem } from '~/primitives/ReorderList/ReorderList.types'
import sceneConfig from './scene.config'
import type { KnowledgePayload } from '~/types/scene'

const props = defineProps<{
  locale?: string
  config?: Record<string, unknown>
}>()

const emit = defineEmits<{
  complete: []
  score: [points: number]
  knowledge: [payload: KnowledgePayload | null]
}>()

const t = useT(sceneConfig.strings, () => props.locale)

// Cada paso con su sprite (el emoji queda solo donde no hay arte propio)
const STEPS: ReorderItem[] = [
  { id: 'limpiar', label: t('stepLimpiar'), sprite: markRaw(BeanSticker), spriteProps: { body: '#e63946', outline: '#b82838' } },
  { id: 'lavar', label: t('stepLavar'), sprite: markRaw(WaterDropSticker) },
  { id: 'remojar', label: t('stepRemojar'), sprite: markRaw(BowlSticker) },
  { id: 'cocinar', label: t('stepCocinar'), sprite: markRaw(PotSticker), spriteProps: { lid: true } },
  { id: 'comer', label: t('stepComer'), emoji: '🍽️' },
]

const CORRECT_ORDER = STEPS.map(s => s.id)

const listRef = ref<InstanceType<typeof ReorderList> | null>(null)
const done = ref(false)
let completed = false

function onComplete() {
  if (completed) return
  completed = true
  done.value = true
  // The dato goes out as knowledge (regla 15) — the shell narrates it and
  // the completion waits for the voice to finish. Fixed card anatomy:
  // title + illustration (generic emoji here) + fact
  emit('knowledge', {
    title: t('knTitle'),
    emoji: '🍲',
    html: t('knHtml'),
    voice: t('knVoice'),
  })
  emit('score', 30)
  emit('complete')
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
  gap: 16px;
  font-family: var(--font-body);
  color: var(--ink);
}

.steps-list {
  max-width: 470px;
}

/* Botón: DS global .sp-btn (app/assets/css/main.css) */
</style>
