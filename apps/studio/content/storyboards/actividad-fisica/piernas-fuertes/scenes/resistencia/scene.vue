<template>
  <!-- RONDAS DE ENERGÍA (mecánica de ritmo continuo, regla 19): un ejercicio
       dinámico por ronda. El niño arranca la ronda con el botón y acompaña el
       BEAT (tick + pulso del reloj) con su cuerpo hasta terminar el tiempo.
       Distinto del "espejo" de Motricidad: acá manda el ritmo, no la calma. -->
  <div class="scene">
    <div class="sp-dots">
      <div
        v-for="(m, i) in MOVES"
        :key="m.id"
        :class="['sp-dot', { 'is-done': i < roundIndex, 'is-current': i === roundIndex && !allDone }]"
      />
    </div>

    <div class="stage-row">
      <!-- El PÓSTER del ejercicio, GRANDE y primero (izquierda): el personaje
           es lo que captura la atención del niño; label con el tinte de
           identidad de la ronda -->
      <div :class="['sp-card', 'rd-frame', `sp-card--${currentMove.tint}`]">
        <PoseGuide
          :frames="currentMove.frames"
          :interval="currentMove.interval"
          :playing="running"
          :size="230"
          :variant="currentMove.variant"
          :shirt="currentMove.color"
        />
        <div class="rd-name">{{ currentMove.name }}</div>
      </div>

      <!-- Columna de ACCIÓN a la derecha: reloj + botón juntos (lo que se
           toca / se sigue). Botón verde: "arrancar" no compite con el rojo
           del tiempo. Nunca cambia de etiqueta ni se oculta — se deshabilita
           mientras corre y al terminar todo (regla 16) -->
      <div class="action-col">
        <ExerciseTimer
          ref="timerRef"
          :key="currentMove.id"
          :duration="currentMove.duration"
          :beat-ms="currentMove.beatMs"
          :beat-visual="false"
          color="red"
          :size="170"
          @done="onRoundDone"
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
import { computed, markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import ExerciseTimer from '~/primitives/ExerciseTimer/ExerciseTimer.vue'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { energyFor, type Move } from '../../moves'
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

const MOVES = energyFor(props.locale ?? 'es')
const POINTS_PER_ROUND = Number(props.config?.pointsPerRound ?? 10)

const roundIndex = ref(0)
const running = ref(false)
const timerRef = ref<InstanceType<typeof ExerciseTimer> | null>(null)
let completed = false

const allDone = computed(() => roundIndex.value >= MOVES.length)
// Terminadas todas, el marco conserva el último ejercicio (estado final visible)
const currentMove = computed<Move>(() => MOVES[Math.min(roundIndex.value, MOVES.length - 1)]!)

function startRound() {
  if (running.value || allDone.value) return
  emit('knowledge', null)
  Sounds.play('pop')
  running.value = true
  timerRef.value?.start()
}

function onRoundDone() {
  const move = currentMove.value
  running.value = false
  Sounds.play('success')
  emit('score', POINTS_PER_ROUND)
  emit('knowledge', {
    title: move.name,
    html: move.factHtml,
    voice: move.factVoice,
    visual: {
      component: markRaw(KidPoseSticker),
      props: { pose: move.frames.find(f => f.pose !== 'stand')?.pose ?? 'stand', variant: move.variant, shirt: move.color },
    },
  })
  roundIndex.value++

  if (roundIndex.value >= MOVES.length && !completed) {
    completed = true
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

/* Reloj arriba, botón debajo: la columna de acción a la derecha del póster */
.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 34px;
}

/* Marco de la demo: superficie .sp-card del DS; acá solo tamaño/layout */
.rd-frame {
  width: 370px;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 20px;
}

.rd-name {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
</style>
