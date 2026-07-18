<template>
  <!-- LA COREOGRAFÍA — coordinación motora REAL (regla 19, mecánica propia):
       el personaje ejecuta una SECUENCIA de ~3 movimientos encadenados en una
       sola demo; el niño la mira (¡MIRA!, repetible) y luego la hace con su
       cuerpo mientras la demo se repite en bucle y el reloj corre (¡MI TURNO!).
       Tres coreografías, una por ronda. Nada parpadea ni se toca en orden:
       la pantalla solo guía, el ejercicio pasa en el espacio real. -->
  <div class="scene">
    <div class="sp-dots">
      <div
        v-for="(s, i) in SEQS"
        :key="s.id"
        :class="['sp-dot', { 'is-done': i < round, 'is-current': i === round && !allDone }]"
      />
    </div>

    <div class="stage-row">
      <!-- Póster: la coreografía completa vive en UNA tarjeta; el label dice
           el movimiento en curso mientras la demo la ejecuta -->
      <div :class="['sp-card', 'ch-frame', `sp-card--${currentSeq.tint}`]">
        <PoseGuide
          :frames="currentSeq.chain"
          :interval="currentSeq.interval"
          :playing="playing"
          :size="230"
          :variant="currentSeq.variant"
          :shirt="currentSeq.color"
          @step="onStep"
        />
        <div class="ch-name">{{ posterLabel }}</div>
      </div>

      <!-- Columna de acción: reloj + los dos gestos de la mecánica. Nunca
           desaparecen — se deshabilitan según la fase (regla 16) -->
      <div class="action-col">
        <ExerciseTimer
          ref="timerRef"
          :key="currentSeq.id"
          :duration="currentSeq.duration"
          color="red"
          :size="150"
          @done="onTurnDone"
        />
        <button
          class="sp-btn sp-btn-blue sp-btn-big"
          :disabled="phase === 'watching' || phase === 'performing' || allDone"
          @click="watchSequence"
        >
          {{ t('watchBtn') }}
        </button>
        <button
          class="sp-btn sp-btn-green sp-btn-big"
          :disabled="phase !== 'ready' || allDone"
          @click="startTurn"
        >
          {{ t('turnBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import { useT } from '~/composables/useT'
import ExerciseTimer from '~/primitives/ExerciseTimer/ExerciseTimer.vue'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { coordSeqsFor, type CoordSeq } from '../../moves'
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

const SEQS = coordSeqsFor(props.locale ?? 'es')
const POINTS_PER_ROUND = Number(props.config?.pointsPerRound ?? 10)

// idle: aún no vio la coreografía de esta ronda · watching: la demo la ejecuta
// una vez · ready: puede repetirla o hacerla · performing: el niño la hace
type Phase = 'idle' | 'watching' | 'ready' | 'performing'

const phase = ref<Phase>('idle')
const round = ref(0)
const stepIndex = ref(0)
const timerRef = ref<InstanceType<typeof ExerciseTimer> | null>(null)
let completed = false

const allDone = computed(() => round.value >= SEQS.length)
// Terminado todo, el póster conserva la última coreografía (estado final visible)
const currentSeq = computed<CoordSeq>(() => SEQS[Math.min(round.value, SEQS.length - 1)]!)
const playing = computed(() => phase.value === 'watching' || phase.value === 'performing')

// El label del póster nombra el movimiento en curso durante la demo;
// quieto, presenta la coreografía por su nombre
const posterLabel = computed(() => {
  if (!playing.value) return currentSeq.value.title
  const bounds = currentSeq.value.bounds
  let seg = 0
  for (let i = 0; i < bounds.length; i++) {
    if (stepIndex.value >= bounds[i]!) seg = i
  }
  return currentSeq.value.moves[seg]!.name
})

function onStep(i: number) {
  stepIndex.value = i
}

const timers: ReturnType<typeof setTimeout>[] = []
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}
onBeforeUnmount(() => timers.forEach(clearTimeout))

/* ── ¡MIRA!: la demo ejecuta la coreografía una vez (repetible) ───────────── */

function watchSequence() {
  if (playing.value || allDone.value) return
  emit('knowledge', null)
  Sounds.play('pop')
  stepIndex.value = 0
  phase.value = 'watching'
  // Una pasada completa de la cadena y la demo descansa
  later(() => {
    if (phase.value === 'watching') phase.value = 'ready'
  }, currentSeq.value.chain.length * currentSeq.value.interval + 200)
}

/* ── ¡MI TURNO!: el niño la hace; la demo acompaña en bucle ───────────────── */

function startTurn() {
  if (phase.value !== 'ready' || allDone.value) return
  Sounds.play('pop')
  stepIndex.value = 0
  phase.value = 'performing'
  timerRef.value?.reset()
  timerRef.value?.start()
}

function onTurnDone() {
  const seq = currentSeq.value
  phase.value = 'idle'
  Sounds.play('success')
  emit('score', POINTS_PER_ROUND)
  round.value++

  if (round.value >= SEQS.length && !completed) {
    completed = true
    emit('knowledge', {
      title: t('knTitle'),
      html: t('knHtml'),
      voice: t('knVoice'),
      visual: { component: markRaw(KidPoseSticker), props: { pose: 'jump', variant: seq.variant, shirt: seq.color } },
    })
    emit('complete')
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

/* Póster grande: el personaje es el protagonista (mismo lenguaje que
   resistencia) */
.ch-frame {
  width: 370px;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 20px;
}

.ch-name {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26px;
}
</style>
