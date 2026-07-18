<template>
  <!-- EL SEMÁFORO — mecánica propia de este storyboard (regla 19): juego de
       estatuas por control inhibitorio. Verde = marcha rápida, amarillo =
       marcha lenta, rojo = ¡ESTATUA con la espalda firme! La demo obedece la
       luz y el niño también, en su espacio. Tres rondas con guiones cada vez
       más exigentes. Sin reloj de cuenta regresiva: la ronda la conduce el
       semáforo (primitiva StopLight). -->
  <div class="scene">
    <div class="sp-dots">
      <div
        v-for="(r, i) in ROUNDS"
        :key="i"
        :class="['sp-dot', { 'is-done': i < round, 'is-current': i === round && !allDone }]"
      />
    </div>

    <div class="stage-row">
      <!-- Póster: la demo marcha u obedece la estatua; el label dice la
           consigna de la luz en curso -->
      <div :class="['sp-card', 'sl-frame', light === 'off' ? 'sp-card--green' : `sp-card--${light}`]">
        <PoseGuide
          :frames="SEMAFORO_MARCH"
          :interval="marchInterval"
          :playing="marching"
          :size="230"
          variant="boy"
          shirt="#4a9068"
        />
        <div class="sl-cue">{{ cueLabel }}</div>
      </div>

      <!-- Columna de acción: el semáforo manda; el botón arranca la ronda -->
      <div class="action-col">
        <StopLight :state="light" :size="92" />
        <button
          class="sp-btn sp-btn-green sp-btn-big"
          :disabled="running || allDone"
          @click="startRound"
        >
          {{ t('startBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import { useT } from '~/composables/useT'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import StopLight, { type StopLightState } from '~/primitives/StopLight/StopLight.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { SEMAFORO_MARCH } from '../../moves'
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

const POINTS_PER_ROUND = Number(props.config?.pointsPerRound ?? 10)

// Guiones de ronda: [luz, segundos]. Fijos y predecibles (el educador puede
// anticipar y acompañar); cada ronda frena y arranca más seguido.
type Light = Exclude<StopLightState, 'off'>
const ROUNDS: [Light, number][][] = [
  [['green', 5], ['yellow', 4], ['red', 3], ['green', 4], ['red', 3]],
  [['green', 4], ['red', 3], ['yellow', 4], ['green', 3], ['red', 3], ['green', 3]],
  [['green', 3], ['red', 2], ['green', 3], ['yellow', 3], ['red', 2], ['green', 3], ['red', 2]],
]

const round = ref(0)
const running = ref(false)
const light = ref<StopLightState>('off')
let completed = false

const allDone = computed(() => round.value >= ROUNDS.length)
// La demo obedece la luz: verde marcha rápido, amarillo lento, rojo ESTATUA
const marching = computed(() => running.value && light.value !== 'red')
const marchInterval = computed(() => (light.value === 'yellow' ? 820 : 400))

const cueLabel = computed(() => {
  if (light.value === 'green') return t('cueGo')
  if (light.value === 'yellow') return t('cueSlow')
  if (light.value === 'red') return t('cueFreeze')
  return t('cueIdle')
})

const timers: ReturnType<typeof setTimeout>[] = []
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}
onBeforeUnmount(() => timers.forEach(clearTimeout))

const LIGHT_SOUND: Record<Light, Parameters<typeof Sounds.play>[0]> = {
  green: 'pop',
  yellow: 'tick',
  red: 'whoosh',
}

function startRound() {
  if (running.value || allDone.value) return
  emit('knowledge', null)
  running.value = true

  const script = ROUNDS[round.value]!
  let at = 0
  for (const [l, seconds] of script) {
    later(() => {
      light.value = l
      Sounds.play(LIGHT_SOUND[l])
    }, at)
    at += seconds * 1000
  }
  later(() => onRoundDone(), at)
}

function onRoundDone() {
  running.value = false
  light.value = 'off'
  Sounds.play('success')
  emit('score', POINTS_PER_ROUND)
  round.value++

  if (round.value >= ROUNDS.length && !completed) {
    completed = true
    emit('knowledge', {
      title: t('knTitle'),
      html: t('knHtml'),
      voice: t('knVoice'),
      visual: { component: markRaw(KidPoseSticker), props: { pose: 'march', variant: 'boy', shirt: '#4a9068' } },
    })
    emit('complete')
  }
}
</script>

<style scoped>
/* nudge: fuerza re-transform de Vite tras rm+recreate */
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

/* Póster grande: el personaje obedece el semáforo; el tinte acompaña la luz */
.sl-frame {
  width: 370px;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 20px;
  transition: background-color 220ms ease-out;
}

.sl-cue {
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
