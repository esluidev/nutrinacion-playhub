<template>
  <!-- SIGUE AL LÍDER — mecánica propia (regla 19): cues de movimiento en
       TIEMPO REAL, como un instructor. El personaje cambia de ejercicio al
       ritmo y el niño lo copia en vivo, sin memorizar nada (a diferencia de
       La Coreografía de piernas-fuertes, que es memoria-y-ejecución). Tres
       rondas, cada una más rápida. El StepMeter marca cuántos cues van. -->
  <div class="scene">
    <div class="sp-dots">
      <div
        v-for="(r, i) in ROUNDS"
        :key="i"
        :class="['sp-dot', { 'is-done': i < round, 'is-current': i === round && !allDone }]"
      />
    </div>

    <div class="stage-row">
      <!-- Póster: el LÍDER — cambia de movimiento en vivo; el label anuncia
           el cue en curso -->
      <div :class="['sp-card', 'ld-frame', `sp-card--${ROUND_TINTS[round % ROUND_TINTS.length]!.tint}`]">
        <PoseGuide
          :frames="currentCue.frames"
          :interval="cueInterval"
          :playing="running"
          :size="230"
          variant="girl"
          :shirt="ROUND_TINTS[round % ROUND_TINTS.length]!.color"
        />
        <div class="ld-cue">{{ running ? currentCue.name : t('cueIdle') }}</div>
      </div>

      <!-- Columna de acción: progreso de cues + arranque de ronda -->
      <div class="action-col">
        <StepMeter
          ref="meterRef"
          :key="`r${round}`"
          :steps="currentRound.cues.length"
          color="green"
          class="ld-meter"
        />
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
import StepMeter from '~/primitives/StepMeter/StepMeter.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { leaderCuesFor, type LeaderCue } from '../../moves'
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

const CUES = leaderCuesFor(props.locale ?? 'es')
const POINTS_PER_ROUND = Number(props.config?.pointsPerRound ?? 10)

// Rondas fijas (predecibles para el aula): pocas consignas y ventanas LARGAS —
// cada cue da tiempo de reconocerlo y hacerlo varias veces (la demo lo repite
// dos veces por ventana). La progresión: un cue más y un poco más rápido.
const ROUNDS: { cues: string[], cueMs: number }[] = [
  { cues: ['marcha', 'brazos', 'salto'], cueMs: 6000 },
  { cues: ['rodilla', 'izquierda', 'derecha', 'salto'], cueMs: 5000 },
  { cues: ['marcha', 'rodilla', 'salto', 'brazos', 'marcha'], cueMs: 4000 },
]

const ROUND_TINTS = [
  { tint: 'yellow', color: '#c49b2a' },
  { tint: 'blue', color: '#2680ae' },
  { tint: 'red', color: '#b82838' },
] as const

const round = ref(0)
const running = ref(false)
const cueIndex = ref(0)
const meterRef = ref<InstanceType<typeof StepMeter> | null>(null)
let completed = false

const allDone = computed(() => round.value >= ROUNDS.length)
const currentRound = computed(() => ROUNDS[Math.min(round.value, ROUNDS.length - 1)]!)

function cueById(id: string): LeaderCue {
  return CUES.find(c => c.id === id)!
}

const currentCue = computed(() =>
  cueById(currentRound.value.cues[Math.min(cueIndex.value, currentRound.value.cues.length - 1)]!))

// Cada cue dura cueMs y su demo hace DOS pasadas completas en esa ventana —
// se lee como repeticiones que el niño alcanza a imitar
const cueInterval = computed(() =>
  Math.round(currentRound.value.cueMs / Math.max(1, currentCue.value.frames.length * 2)))

const timers: ReturnType<typeof setTimeout>[] = []
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}
onBeforeUnmount(() => timers.forEach(clearTimeout))

function startRound() {
  if (running.value || allDone.value) return
  emit('knowledge', null)
  Sounds.play('pop')
  cueIndex.value = 0
  running.value = true

  const { cues, cueMs } = currentRound.value
  cues.forEach((_, i) => {
    if (i === 0) return
    later(() => {
      cueIndex.value = i
      Sounds.play('tick')
      meterRef.value?.next() // el cue anterior quedó hecho
    }, i * cueMs)
  })
  later(() => {
    meterRef.value?.next() // el último cue
    onRoundDone()
  }, cues.length * cueMs)
}

function onRoundDone() {
  running.value = false
  Sounds.play('success')
  emit('score', POINTS_PER_ROUND)
  round.value++
  cueIndex.value = 0

  if (round.value >= ROUNDS.length && !completed) {
    completed = true
    emit('knowledge', {
      title: t('knTitle'),
      html: t('knHtml'),
      voice: t('knVoice'),
      visual: { component: markRaw(KidPoseSticker), props: { pose: 'jump', variant: 'girl', shirt: '#b82838' } },
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

/* Póster grande: el líder es el protagonista */
.ld-frame {
  width: 370px;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 20px;
}

/* Consigna GRANDE: es lo que el niño lee en movimiento */
.ld-cue {
  font-weight: 800;
  font-size: 21px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 34px;
}

.ld-meter {
  width: 240px;
}
</style>
