<template>
  <!-- EL ESPEJO DEL PATIO (mecánica de imitación guiada, regla 19: PoseGuide +
       ExerciseTimer, primitivas nuevas): tres tarjetas de movimiento suave. El
       niño toca una, la demo se anima y él IMITA el movimiento en su espacio
       hasta que la cuenta regresiva termina. UN SOLO reloj compartido sobre las
       tarjetas (no uno por tarjeta): el personaje es el protagonista y el
       feedback de "hecho" lo da la tarjeta misma (pop + insignia de esquina).
       El dato sale como `knowledge` (regla 15); sin popups ni texto (regla 16). -->
  <div class="scene">
    <!-- Reloj compartido, visible SIEMPRE (como en resistencia): en reposo
         muestra la duración; arranca al tocar una tarjeta -->
    <div class="top-timer">
      <ExerciseTimer
        ref="timerRef"
        :duration="TIMER_DURATION"
        color="red"
        :size="150"
        @done="onTimerDone"
      />
    </div>

    <div class="row">
      <div
        v-for="move in MOVES"
        :key="move.id"
        :class="['sp-card', 'mv-card', `sp-card--${move.tint}`, {
          'sp-card--pressable': activeId !== move.id,
          'is-active': activeId === move.id,
          'is-done': doneIds.has(move.id),
        }]"
        @click="onCardTap(move)"
      >
        <div class="mv-demo">
          <PoseGuide
            :frames="move.frames"
            :interval="move.interval"
            :playing="activeId === move.id"
            :size="180"
            :variant="move.variant"
            :shirt="move.color"
          />
        </div>

        <div class="mv-name">{{ move.name }}</div>

        <!-- Hecho: insignia de esquina — la tarjeta ES el feedback -->
        <div v-if="doneIds.has(move.id)" class="mv-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import ExerciseTimer from '~/primitives/ExerciseTimer/ExerciseTimer.vue'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { warmupFor, type Move } from '../../moves'
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

const MOVES = warmupFor(props.locale ?? 'es')
const POINTS_PER_MOVE = Number(props.config?.pointsPerMove ?? 10)

const activeId = ref<string | null>(null)
const doneIds = ref(new Set<string>())
let completed = false

const activeMove = computed(() => MOVES.find(m => m.id === activeId.value) ?? null)

// Un reloj para toda la escena (todos los movimientos del calentamiento duran
// lo mismo): en reposo enseña la duración, cada tarjeta lo reinicia y arranca
const TIMER_DURATION = MOVES[0]?.duration ?? 12
const timerRef = ref<InstanceType<typeof ExerciseTimer> | null>(null)

function onCardTap(move: Move) {
  // Re-tocar un movimiento hecho re-abre su dato (regla 15: recuperable siempre)
  if (doneIds.value.has(move.id)) {
    showKnowledge(move)
    return
  }
  // Un ejercicio a la vez; y mientras la Tarjeta de Saber narra (kid), el dato
  // anterior aterriza antes del siguiente ejercicio (gating sin overlay)
  if (activeId.value !== null) return

  emit('knowledge', null) // el dato anterior se oculta al empezar otro ejercicio
  Sounds.play('pop')
  activeId.value = move.id
  timerRef.value?.reset()
  timerRef.value?.start()
}

function onTimerDone() {
  const move = activeMove.value
  if (move) onMoveDone(move)
}

function onMoveDone(move: Move) {
  activeId.value = null
  doneIds.value = new Set([...doneIds.value, move.id])
  Sounds.play('success')
  emit('score', POINTS_PER_MOVE)
  showKnowledge(move)

  if (doneIds.value.size >= MOVES.length && !completed) {
    completed = true
    emit('complete')
    return // terminado: el check del reloj se queda como cierre
  }
  // El check celebra un instante y el reloj vuelve a la duración, listo
  // para la siguiente tarjeta (si el niño no arrancó otra ya)
  setTimeout(() => {
    if (activeId.value === null) timerRef.value?.reset()
  }, 1100)
}

function showKnowledge(move: Move) {
  emit('knowledge', {
    title: move.name,
    html: move.factHtml,
    voice: move.factVoice,
    visual: {
      component: markRaw(KidPoseSticker),
      props: { pose: move.frames.find(f => f.pose !== 'stand')?.pose ?? 'stand', variant: move.variant, shirt: move.color },
    },
  })
}
</script>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  padding: 108px 80px 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  font-family: var(--font-body);
  color: var(--ink);
}

.top-timer {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row {
  display: flex;
  gap: 36px;
}

/* Superficie/estados base: .sp-card del DS — acá solo tamaño y layout.
   Sin slot de reloj: la tarjeta es más compacta y el personaje manda. */
.mv-card {
  position: relative;
  width: 300px;
  height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 26px 18px;
}

/* Activa: levantada mientras el reloj corre (el vínculo con el reloj de
   arriba es la única tarjeta animándose + elevada) */
.mv-card.is-active {
  transform: translateY(-8px);
  box-shadow: var(--card-shadow-hover);
}

/* Hecha: el pop del DS celebra EN la tarjeta al completar */
.mv-card.is-done {
  animation: sp-card-pop 0.6s ease;
}

.mv-demo {
  height: 236px;
  display: flex;
  align-items: flex-end;
}

.mv-name {
  font-weight: 800;
  font-size: 16px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* Insignia de esquina: mismo lenguaje del DS (fondo accent, borde ink,
   sombra plana con offset) */
.mv-badge {
  position: absolute;
  top: -16px;
  right: -14px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--accent-green);
  border: 3.5px solid var(--ink);
  box-shadow: 0 3px 0 var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  animation: mv-badge-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mv-badge svg {
  width: 26px;
  height: 26px;
}

@keyframes mv-badge-in {
  from {
    transform: scale(0);
  }

  to {
    transform: scale(1);
  }
}
</style>
