<template>
  <!-- PAUSA EN MOVIMIENTO — pausa activa del pilar (ritual): dos estiramientos
       suaves para soltar el cuerpo y reducir el tiempo sentado. La demo
       enseña, el niño imita hasta que el reloj termina. Dato clave del tema:
       moverse ayuda a que la insulina trabaje mejor. -->
  <div class="scene">
    <div class="sp-dots">
      <div
        v-for="(s, i) in STRETCHES"
        :key="s.id"
        :class="['sp-dot', { 'is-done': i < idx, 'is-current': i === idx && !allDone }]"
      />
    </div>

    <div class="stage-row">
      <div :class="['sp-card', 'pa-frame', `sp-card--${current.tint}`]">
        <PoseGuide
          :frames="current.frames"
          :interval="current.interval"
          :playing="stretching"
          :size="200"
          :variant="current.variant"
          :shirt="current.color"
        />
        <div class="pa-name">{{ current.name }}</div>
      </div>

      <div class="action-col">
        <ExerciseTimer
          ref="timerRef"
          :duration="TIMER_DURATION"
          color="red"
          :size="140"
          @done="onStretchDone"
        />
        <button
          class="sp-btn sp-btn-green sp-btn-big"
          :disabled="stretching || allDone"
          @click="startStretch"
        >
          {{ t('stretchBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import ExerciseTimer from '~/primitives/ExerciseTimer/ExerciseTimer.vue'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { stretchesFor } from '../../data'
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

const STRETCHES = stretchesFor(props.locale ?? 'es')
const POINTS_PER_STRETCH = Number(props.config?.pointsPerStretch ?? 10)
const TIMER_DURATION = STRETCHES[0]?.duration ?? 10

const idx = ref(0)
const stretching = ref(false)
const timerRef = ref<InstanceType<typeof ExerciseTimer> | null>(null)
let completed = false

const allDone = computed(() => idx.value >= STRETCHES.length)
const current = computed(() => STRETCHES[Math.min(idx.value, STRETCHES.length - 1)]!)

function startStretch() {
  if (stretching.value || allDone.value) return
  emit('knowledge', null)
  Sounds.play('pop')
  stretching.value = true
  timerRef.value?.reset()
  timerRef.value?.start()
}

function onStretchDone() {
  const s = current.value
  stretching.value = false
  Sounds.play('success')
  emit('score', POINTS_PER_STRETCH)
  emit('knowledge', {
    title: s.name,
    html: s.factHtml,
    voice: s.factVoice,
    visual: {
      component: markRaw(KidPoseSticker),
      props: { pose: s.frames.find(f => f.pose !== 'stand')?.pose ?? 'stand', variant: s.variant, shirt: s.color },
    },
  })
  idx.value++

  if (idx.value >= STRETCHES.length && !completed) {
    completed = true
    emit('complete')
    return
  }
  setTimeout(() => {
    if (!stretching.value) timerRef.value?.reset()
  }, 1100)
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
  gap: 26px;
  font-family: var(--font-body);
  color: var(--ink);
}

.stage-row {
  display: flex;
  align-items: center;
  gap: 72px;
}

.pa-frame {
  width: 370px;
  height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 20px;
  transition: background-color 220ms ease-out;
}

.pa-name {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 34px;
}
</style>
