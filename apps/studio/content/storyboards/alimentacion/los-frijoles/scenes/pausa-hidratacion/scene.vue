<template>
  <!-- Regla 16: only playable elements — no title, no instruction text (the
       HUD audio reads it), no in-scene feedback text (the shell's strip owns
       feedback). The button never hides: it disables (regla 5). -->
  <div class="scene">
    <!-- Glass (DS primitive) that fills sip by sip, leaving headroom at the
         rim when complete -->
    <div class="glass-zone">
      <Glass :level="sips / TOTAL_SIPS" />

      <div class="glass-side">
        <StepMeter ref="meterRef" :steps="TOTAL_SIPS" color="blue" class="sip-meter" />
        <button class="sp-btn sp-btn-blue sp-btn-big" :disabled="done" @click="sip">
          {{ t('sipBtn') }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import Glass from '~/primitives/Glass/Glass.vue'
import StepMeter from '~/primitives/StepMeter/StepMeter.vue'
import { Sounds } from '~/primitives/sounds'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
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

const TOTAL_SIPS = 5

const meterRef = ref<InstanceType<typeof StepMeter> | null>(null)
const sips = ref(0)
const done = computed(() => sips.value >= TOTAL_SIPS)
let completed = false

function sip() {
  if (done.value) return
  sips.value++
  meterRef.value?.next()
  Sounds.play('pop')

  if (done.value && !completed) {
    completed = true
    setTimeout(() => {
      Sounds.play('success')
      // The dato goes out as knowledge (regla 15) — the shell narrates it
      // and the completion waits for the voice to finish. Fixed card anatomy:
      // title + illustration (generic emoji here) + fact
      emit('knowledge', {
        title: t('knTitle'),
        visual: { component: markRaw(WaterDropSticker) },
        html: t('knHtml'),
        voice: t('knVoice'),
      })
      emit('score', 10)
      emit('complete')
    }, 500)
  }
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
  gap: 20px;
  font-family: var(--font-body);
  color: var(--ink);
}

.glass-zone {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 64px;
}

.glass-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 44px;
  width: 330px;
}

.sip-meter {
  max-width: 330px;
}

/* Botón: DS global .sp-btn (app/assets/css/main.css) */

</style>
