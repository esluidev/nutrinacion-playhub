<template>
  <!-- QUÉDATE ASÍ — mecánica propia (regla 19): posturas SOSTENIDAS con
       metáfora. El personaje adopta la postura (tween lento) y el niño la
       copia y se queda QUIETO mientras el anillo se LLENA (ProgressRing —
       progreso que crece, no cuenta regresiva). Progresión fija de lo fácil
       al equilibrio: avión → montaña → silla → flamenco. "Mantener la espalda
       firme durante algunos segundos" (brief): holds, no repeticiones. -->
  <div class="scene">
    <div class="sp-dots">
      <div
        v-for="(m, i) in MOVES"
        :key="m.id"
        :class="['sp-dot', { 'is-done': i < holdIndex, 'is-current': i === holdIndex && !allDone }]"
      />
    </div>

    <div class="stage-row">
      <!-- Póster: la postura-metáfora, adoptada con calma y sostenida -->
      <div :class="['sp-card', 'hd-frame', `sp-card--${currentMove.tint}`]" @click="onPosterTap">
        <div class="hd-kid">
          <KidPoseSticker :def="currentDef" :variant="holdIndex % 2 === 0 ? 'boy' : 'girl'" :shirt="currentMove.color" />
        </div>
        <div class="hd-name">{{ currentMove.name }}</div>
      </div>

      <!-- Acción: el anillo se LLENA mientras sostienes; un solo gesto -->
      <div class="action-col">
        <ProgressRing
          ref="ringRef"
          :size="150"
          color="green"
          :show-label="false"
        />
        <button
          class="sp-btn sp-btn-green sp-btn-big"
          :disabled="holding || allDone"
          @click="startHold"
        >
          {{ t('holdBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useT } from '~/composables/useT'
import ProgressRing from '~/primitives/ProgressRing/ProgressRing.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { KID_POSES_BY_AGE, lerpPoseDef, type KidPoseDef } from '~/sprites/kid-poses'
import { holdsFor } from '../../moves'
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

const MOVES = holdsFor(props.locale ?? 'es')
const POINTS_PER_HOLD = Number(props.config?.pointsPerHold ?? 10)
const ADOPT_MS = 1000 // tween de adoptar/soltar la postura

const holdIndex = ref(0)
const holding = ref(false)
const ringRef = ref<InstanceType<typeof ProgressRing> | null>(null)
let completed = false

const allDone = computed(() => holdIndex.value >= MOVES.length)
// Terminado todo, el póster conserva la última postura (estado final visible)
const currentMove = computed(() => MOVES[Math.min(holdIndex.value, MOVES.length - 1)]!)

/* ── Tween de postura (composición del rig, como el árbol de recuperación) ── */

const STAND = KID_POSES_BY_AGE.kid.stand
const currentDef = shallowRef<KidPoseDef>(STAND)

let raf = 0
function tweenTo(target: KidPoseDef, ms: number, onEnd?: () => void) {
  const from = currentDef.value
  const t0 = performance.now()
  cancelAnimationFrame(raf)
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / ms)
    const eased = 0.5 - Math.cos(Math.PI * p) / 2
    currentDef.value = lerpPoseDef(from, target, eased)
    if (p < 1) raf = requestAnimationFrame(step)
    else onEnd?.()
  }
  raf = requestAnimationFrame(step)
}

const timers: ReturnType<typeof setTimeout>[] = []
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}
let holdTicker: ReturnType<typeof setInterval> | null = null
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  if (holdTicker) clearInterval(holdTicker)
  timers.forEach(clearTimeout)
})

/* ── Sostener la postura ──────────────────────────────────────────────────── */

function startHold() {
  if (holding.value || allDone.value) return
  const move = currentMove.value
  emit('knowledge', null)
  Sounds.play('pop')
  holding.value = true

  // 1) Adoptar la postura con calma (tween SOLO cosmético — rAF se congela
  //    con la ventana oculta, así que la lógica NUNCA depende de él);
  // 2) sostener: el anillo se llena en pasos gruesos (250ms) que la
  //    transición CSS de la primitiva suaviza.
  ringRef.value?.setProgress(0)
  tweenTo(KID_POSES_BY_AGE.kid[move.pose], ADOPT_MS)
  later(() => {
    const holdMs = move.holdSeconds * 1000
    const t0 = performance.now()
    holdTicker = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / holdMs)
      ringRef.value?.setProgress(p)
    }, 250)
    later(() => {
      if (holdTicker) clearInterval(holdTicker)
      holdTicker = null
      ringRef.value?.setProgress(1)
      onHoldDone()
    }, holdMs)
  }, ADOPT_MS)
}

function onHoldDone() {
  const move = currentMove.value
  Sounds.play('success')
  emit('score', POINTS_PER_HOLD)
  emit('knowledge', {
    title: move.name,
    html: move.factHtml,
    voice: move.factVoice,
    visual: {
      component: markRaw(KidPoseSticker),
      props: { pose: move.pose, variant: holdIndex.value % 2 === 0 ? 'boy' : 'girl', shirt: move.color },
    },
  })
  holdIndex.value++
  holding.value = false

  if (holdIndex.value >= MOVES.length && !completed) {
    completed = true
    emit('complete')
    return // la última postura se queda como cierre, con el anillo lleno
  }
  // Soltar con calma y preparar la siguiente
  tweenTo(STAND, ADOPT_MS)
  later(() => {
    if (!holding.value) ringRef.value?.setProgress(0)
  }, 1100)
}

function onPosterTap() {
  // El saber es recuperable siempre (regla 15) — re-tocar la postura hecha
  if (holdIndex.value === 0 || holding.value) return
  const doneIdx = Math.min(holdIndex.value, MOVES.length) - 1
  const done = MOVES[doneIdx]!
  emit('knowledge', {
    title: done.name,
    html: done.factHtml,
    voice: done.factVoice,
    visual: {
      component: markRaw(KidPoseSticker),
      props: { pose: done.pose, variant: doneIdx % 2 === 0 ? 'boy' : 'girl', shirt: done.color },
    },
  })
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

/* Póster grande: la postura-metáfora es la protagonista */
.hd-frame {
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

.hd-kid {
  width: 230px;
  height: 300px;
}

.hd-name {
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
