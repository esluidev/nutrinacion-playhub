<template>
  <!-- CALMA EL CUERPO — flujo SECUENCIADO con UNA sola gramática (la de
       motricidad): tres tarjetas iguales en fila, ① respirar → ② estirar alto
       → ③ abrir los brazos, y el reloj compartido arriba (solo lo usan los
       estiramientos; la respiración va por ciclos de la burbuja). La TARJETA
       es la superficie de toque; la insignia numerada se vuelve check al
       completar; los pasos siguientes esperan atenuados (regla 16: visibles,
       nunca ocultos). El saber sale por `knowledge` (regla 15). -->
  <div class="scene">
    <div class="top-timer">
      <ExerciseTimer
        ref="timerRef"
        :duration="TIMER_DURATION"
        color="red"
        :size="140"
        @done="onTimerDone"
      />
    </div>

    <div class="row">
      <!-- ① Respiración: la burbuja guía los ciclos dentro de su tarjeta -->
      <div
        :class="['sp-card', 'rc-card', 'sp-card--blue', {
          'sp-card--pressable': !breathing,
          'is-active': breathing,
          'is-done': breathDone,
        }]"
        @click="onBreathTap"
      >
        <div class="rc-demo">
          <BreathGuide
            ref="breathRef"
            :cycles="BREATH_CYCLES"
            :size="128"
            :label-in="t('labelIn')"
            :label-out="t('labelOut')"
            @cycle="Sounds.play('pop')"
            @done="onBreathDone"
          />
        </div>
        <div class="rc-name">{{ t('breatheBtn') }}</div>
        <div class="rc-badge">
          <svg v-if="breathDone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
          <span v-else>1</span>
        </div>
      </div>

      <!-- ②③ Estiramientos: se desbloquean en orden -->
      <div
        v-for="(move, i) in MOVES"
        :key="move.id"
        :class="['sp-card', 'rc-card', `sp-card--${move.tint}`, {
          'sp-card--pressable': isUnlocked(i) && activeId !== move.id,
          'is-locked': !isUnlocked(i),
          'is-active': activeId === move.id,
          'is-done': doneIds.has(move.id),
        }]"
        @click="onStretchTap(move, i)"
      >
        <div class="rc-demo">
          <PoseGuide
            :frames="move.frames"
            :interval="move.interval"
            :playing="activeId === move.id"
            :size="150"
            :variant="move.variant"
            :shirt="move.color"
          />
        </div>
        <div class="rc-name">{{ move.name }}</div>
        <div class="rc-badge">
          <svg v-if="doneIds.has(move.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
          <span v-else>{{ i + 2 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import BreathGuide from '~/primitives/BreathGuide/BreathGuide.vue'
import ExerciseTimer from '~/primitives/ExerciseTimer/ExerciseTimer.vue'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { cooldownFor, type Move } from '../../moves'
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

const MOVES = cooldownFor(props.locale ?? 'es')
const BREATH_CYCLES = Number(props.config?.breathCycles ?? 3)
const POINTS_BREATH = Number(props.config?.pointsBreath ?? 10)
const POINTS_PER_STRETCH = Number(props.config?.pointsPerStretch ?? 10)

/* ── ① Respiración (por ciclos de la burbuja; el reloj no interviene) ─────── */

const breathRef = ref<InstanceType<typeof BreathGuide> | null>(null)
const breathing = ref(false)
const breathDone = ref(false)

function onBreathTap() {
  if (breathDone.value) {
    // Recuperable siempre (regla 15)
    emit('knowledge', {
      title: t('knBreathTitle'),
      emoji: '🫧',
      html: t('knBreathHtml'),
      voice: t('knBreathVoice'),
    })
    return
  }
  if (breathing.value || activeId.value !== null) return
  emit('knowledge', null)
  Sounds.play('pop')
  breathing.value = true
  breathRef.value?.start()
}

function onBreathDone() {
  breathing.value = false
  breathDone.value = true
  Sounds.play('success')
  emit('score', POINTS_BREATH)
  emit('knowledge', {
    title: t('knBreathTitle'),
    emoji: '🫧',
    html: t('knBreathHtml'),
    voice: t('knBreathVoice'),
  })
  checkComplete()
}

/* ── ②③ Estiramientos: en orden, con el reloj compartido ──────────────────── */

const TIMER_DURATION = MOVES[0]?.duration ?? 10
const timerRef = ref<InstanceType<typeof ExerciseTimer> | null>(null)
const activeId = ref<string | null>(null)
const doneIds = ref(new Set<string>())
let completed = false

/** El estiramiento i se desbloquea al terminar la respiración y todos los
 *  anteriores (secuencia ① → ② → ③) */
function isUnlocked(i: number): boolean {
  if (!breathDone.value) return false
  return MOVES.slice(0, i).every(m => doneIds.value.has(m.id))
}

function onStretchTap(move: Move, i: number) {
  if (doneIds.value.has(move.id)) {
    showKnowledge(move) // recuperable siempre (regla 15)
    return
  }
  if (!isUnlocked(i) || activeId.value !== null || breathing.value) return
  emit('knowledge', null)
  Sounds.play('pop')
  activeId.value = move.id
  timerRef.value?.reset()
  timerRef.value?.start()
}

function onTimerDone() {
  const move = MOVES.find(m => m.id === activeId.value)
  if (!move) return
  activeId.value = null
  doneIds.value = new Set([...doneIds.value, move.id])
  Sounds.play('success')
  emit('score', POINTS_PER_STRETCH)
  showKnowledge(move)
  checkComplete()
  // El check celebra un instante y el reloj vuelve a la duración (si queda
  // secuencia por delante)
  if (doneIds.value.size < MOVES.length) {
    setTimeout(() => {
      if (activeId.value === null) timerRef.value?.reset()
    }, 1100)
  }
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

/* ── Cierre ───────────────────────────────────────────────────────────────── */

function checkComplete() {
  if (!completed && breathDone.value && doneIds.value.size >= MOVES.length) {
    completed = true
    emit('complete')
  }
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

/* Reloj compartido arriba, altura reservada (nada salta) — solo corre con
   los estiramientos */
.top-timer {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row {
  display: flex;
  gap: 36px;
}

/* Una sola gramática: tarjeta vertical uniforme (como motricidad) */
.rc-card {
  position: relative;
  width: 290px;
  height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 26px 18px;
}

.rc-demo {
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rc-name {
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* Bloqueada: espera su turno atenuada (visible, nunca oculta — regla 16) */
.rc-card.is-locked {
  opacity: 0.5;
  filter: saturate(0.55);
}

/* Activa: levantada mientras respira / estira */
.rc-card.is-active {
  transform: translateY(-8px);
  box-shadow: var(--card-shadow-hover);
}

/* Hecha: el pop del DS celebra EN la tarjeta */
.rc-card.is-done {
  animation: sp-card-pop 0.6s ease;
}

/* Insignia de paso en la esquina: número → check verde (mismo lenguaje que
   la insignia de motricidad) */
.rc-badge {
  position: absolute;
  top: -16px;
  right: -14px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--card-surface);
  border: 3.5px solid var(--ink);
  box-shadow: 0 3px 0 var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 21px;
  color: var(--ink);
}

.rc-card.is-done .rc-badge {
  background: var(--accent-green);
  color: #fff;
  animation: rc-badge-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rc-badge svg {
  width: 25px;
  height: 25px;
}

@keyframes rc-badge-in {
  from {
    transform: scale(0);
  }

  to {
    transform: scale(1);
  }
}
</style>
