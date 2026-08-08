<template>
  <div class="scene">
    <div class="main">
      <!-- WHEEL column -->
      <div class="wheel-col">
        <div class="sp-wheel">
          <div class="sp-wheel-shadow" />

          <div :class="['sp-wheel-pointer', { tick: isTicking }]">
            <svg viewBox="0 0 56 72" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 68 Q14 50 8 30 Q4 4 28 4 Q52 4 48 30 Q42 50 28 68 Z" fill="var(--ink)" />
              <circle cx="28" cy="22" r="8" fill="var(--paper)" />
              <circle cx="28" cy="22" r="3.5" fill="var(--accent-red)" />
            </svg>
          </div>

          <!-- Wheel SVG verbatim from ruleta-frijoles-v2: cream rims, 4 sectors
               with flat bean silhouettes, concentric hub -->
          <svg
            ref="wheelEl"
            class="sp-wheel-disc"
            viewBox="0 0 400 400"
            xmlns="http://www.w3.org/2000/svg"
            :style="{ transform: `rotate(${rotation}deg)` }"
            @transitionend="onSpinEnd"
          >
            <circle cx="200" cy="200" r="199.5" fill="var(--paper)" stroke="#e8e4d8" stroke-width="1" />
            <circle cx="200" cy="200" r="186" fill="var(--paper-dark)" />
            <circle cx="200" cy="200" r="180" fill="var(--paper)" />

            <g>
              <path d="M200,200 L76.44,76.44 A175,175 0 0,1 323.56,76.44 Z" :fill="BEANS[0]!.color" />
              <path d="M200,200 L323.56,76.44 A175,175 0 0,1 323.56,323.56 Z" :fill="BEANS[1]!.color" />
              <path d="M200,200 L323.56,323.56 A175,175 0 0,1 76.44,323.56 Z" :fill="BEANS[2]!.color" />
              <path d="M200,200 L76.44,323.56 A175,175 0 0,1 76.44,76.44 Z" :fill="BEANS[3]!.color" />
            </g>

            <g stroke="var(--paper)" stroke-width="3" stroke-linecap="round">
              <line x1="200" y1="200" x2="76.44" y2="76.44" />
              <line x1="200" y1="200" x2="323.56" y2="76.44" />
              <line x1="200" y1="200" x2="323.56" y2="323.56" />
              <line x1="200" y1="200" x2="76.44" y2="323.56" />
            </g>

            <!-- Bean por sector: silueta plana mientras es misterio; al descubrirlo, el
                 frijol REAL (cuerpo + trace + brillos del BeanSticker — la silueta es el
                 mismo path) se enciende en su sector y ahí se queda: la ruleta recuerda
                 lo ya descubierto. -->
            <g v-for="(b, i) in BEANS" :key="b.id" :transform="SILHOUETTE_TRANSFORMS[i]">
              <path v-if="!revealed.has(b.id)" :d="BEAN_SILHOUETTE" :fill="b.sectorBean" />
              <g v-else class="wheel-bean-in">
                <path :d="BEAN_SILHOUETTE" :fill="b.bean.body" stroke="#3d4256" stroke-width="10" stroke-linejoin="round" />
                <path d="M171.111,237.747C171.564,233.63 168.593,229.925 164.476,229.472C160.356,229.031 156.654,231.99 156.201,236.107C154.004,256.075 147.57,270.433 135.34,282.665C123.108,294.896 108.749,301.331 88.781,303.527C84.663,303.98 81.693,307.685 82.146,311.802C82.568,315.641 85.817,318.483 89.592,318.483C89.866,318.483 90.143,318.467 90.421,318.437C114.012,315.842 131.137,308.081 145.946,293.271C160.754,278.462 168.515,261.337 171.111,237.747Z" fill="rgba(255,255,255,0.5)" />
                <path d="M183.307,207.714C185.032,207.714 186.766,207.122 188.18,205.912C198.008,197.501 210.577,192.869 223.573,192.869C227.715,192.869 231.073,189.512 231.073,185.369C231.073,181.226 227.715,177.869 223.573,177.869C207.004,177.869 190.971,183.781 178.427,194.515C175.28,197.208 174.912,201.943 177.605,205.089C179.088,206.825 181.191,207.714 183.307,207.714Z" fill="rgba(255,255,255,0.5)" />
              </g>
            </g>

            <circle cx="200" cy="200" r="30" fill="var(--paper)" />
            <circle cx="200" cy="200" r="22" fill="var(--ink)" />
            <circle cx="200" cy="200" r="8" fill="var(--paper)" />
          </svg>
        </div>

        <!-- The button NEVER morphs into "reiniciar" (regla 5: replay
             lives in the teacher panel); with everything revealed it just
             disables -->
        <button class="sp-btn sp-btn-green sp-btn-big" :disabled="isSpinning || allRevealed" @click="spin">
          {{ t('spin') }}
        </button>
      </div>

      <!-- CARDS: slot pattern — hidden = tan slot with ?, revealed = flip card.
           Tapping a revealed card re-opens its Tarjeta de Saber (regla 15:
           knowledge feedback is always recoverable) -->
      <div class="sp-reveal-grid">
        <div
          v-for="bean in BEANS"
          :key="bean.id"
          :class="['sp-reveal-card', { 'revealed': revealed.has(bean.id), 'just-won': justWon === bean.id }]"
          @click="reshowKnowledge(bean)"
        >
          <div class="sp-reveal-card-inner">
            <div class="sp-reveal-face sp-reveal-back">
              <div class="sp-reveal-q">?</div>
            </div>
            <div class="sp-reveal-face sp-reveal-front" :style="{ background: pastelize(bean.color) }">
              <div class="card-body">
                <BeanSticker :body="bean.bean.body" :outline="bean.bean.outline" />
              </div>
              <div class="sp-reveal-name">{{ bean.displayName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Instruction audio lives in the HUD (reads scene.config meta.instruction).
         Bean facts go out as `knowledge` — the shell's Tarjeta de Saber shows
         and narrates them (regla 15); the scene renders no popup of its own. -->
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import BeanSticker from '~/sprites/BeanSticker.vue'
import { beansFor, factHtml, factSpeech, pastelize, type Bean } from '../../beans'
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
// Bean varieties resolved to the active content language (strings → plain)
const BEANS = beansFor(props.locale ?? 'es')

// Sector centers at 0/90/180/270 (BEANS order = sector order, like v2 SLICES)
const CENTER_ANGLES = [0, 90, 180, 270]
const SILHOUETTE_TRANSFORMS = [
  'translate(200, 100) rotate(0) scale(0.24) translate(-161, -310)',
  'translate(300, 200) rotate(90) scale(0.24) translate(-161, -310)',
  'translate(200, 300) rotate(180) scale(0.24) translate(-161, -310)',
  'translate(100, 200) rotate(270) scale(0.24) translate(-161, -310)',
]
const BEAN_SILHOUETTE = 'M243.244,390.569C283.494,350.319 306.354,303.922 307.614,259.923C309.038,210.2 278.613,169.725 235.27,163.681C231.401,163.142 227.466,162.868 223.574,162.868C181.156,162.868 145.782,193.648 141.291,234.465C139.444,251.252 134.646,262.143 124.732,272.057C114.818,281.971 103.927,286.768 87.14,288.616C65.879,290.955 46.776,301.744 33.351,318.994C19.413,336.904 13.218,360.086 16.357,382.596C22.205,424.537 61.349,454.982 109.431,454.986C110.509,454.962 111.538,454.97 112.598,454.94C156.596,453.679 202.994,430.819 243.244,390.569Z'

const rotation = ref(0)
const isSpinning = ref(false)
const isTicking = ref(false)
const revealed = ref(new Set<string>())
const justWon = ref<string | null>(null)

const allRevealed = computed(() => revealed.value.size >= BEANS.length)

let spinTarget: Bean | null = null
let tickRaf: number | null = null
let tickLockTimer: ReturnType<typeof setTimeout> | null = null
let pendingComplete = false
let completed = false
const timers: ReturnType<typeof setTimeout>[] = []

/* ── Spin (verbatim port of ruleta-frijoles-v2) ───────────────────────────── */

function spin() {
  if (isSpinning.value) return
  const remaining = BEANS.filter(b => !revealed.value.has(b.id))
  if (!remaining.length) return

  // Focus back on the game: the previous bean's card leaves with the new spin
  emit('knowledge', null)
  isSpinning.value = true
  spinTarget = remaining[Math.floor(Math.random() * remaining.length)]!
  const targetAngle = CENTER_ANGLES[BEANS.indexOf(spinTarget)]!

  const desiredMod = (360 - targetAngle) % 360
  const currentMod = ((rotation.value % 360) + 360) % 360
  const extraTurns = 5 + Math.floor(Math.random() * 3)
  const delta = ((desiredMod - currentMod + 360) % 360) + extraTurns * 360

  const startRotation = rotation.value
  const duration = 4500 // must match the CSS transition
  const startTime = performance.now()
  rotation.value = startRotation + delta

  // Pointer ticks on each 90° boundary crossing (boundaries offset by 45°)
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
  let lastBoundaryCount = 0

  const checkTicks = (now: number) => {
    if (!isSpinning.value) return
    const t = Math.min((now - startTime) / duration, 1)
    const angleSoFar = startRotation + delta * easeOut(t)
    const startBoundary = Math.floor((startRotation + 45) / 90)
    const nowBoundary = Math.floor((angleSoFar + 45) / 90)
    const crossed = nowBoundary - startBoundary
    if (crossed > lastBoundaryCount) {
      tickPointer()
      lastBoundaryCount = crossed
    }
    if (t < 1) tickRaf = requestAnimationFrame(checkTicks)
  }
  tickRaf = requestAnimationFrame(checkTicks)
}

let tickLocked = false
function tickPointer() {
  if (tickLocked) return
  tickLocked = true
  isTicking.value = true
  timers.push(setTimeout(() => {
    isTicking.value = false
  }, 35))
  if (tickLockTimer) clearTimeout(tickLockTimer)
  tickLockTimer = setTimeout(() => {
    tickLocked = false
  }, 180)
  Sounds.play('tick')
}

function onSpinEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform' || !isSpinning.value || !spinTarget) return
  const target = spinTarget
  spinTarget = null

  revealed.value = new Set([...revealed.value, target.id])
  justWon.value = target.id
  timers.push(setTimeout(() => {
    if (justWon.value === target.id) justWon.value = null
  }, 650))

  Sounds.play('whoosh') // card flip reveal
  emit('score', target.points)

  if (allRevealed.value && !completed) pendingComplete = true

  // The Tarjeta de Saber slides up AFTER the card flip finishes (flip is
  // 700ms) — the reveal is the ceremony, the card is the dato
  timers.push(setTimeout(() => {
    showKnowledge(target)
    isSpinning.value = false
    // Workshop scene contract: complete fires with the last reveal — the
    // runner waits for the card's narration before celebrating
    if (pendingComplete && !completed) {
      completed = true
      pendingComplete = false
      Sounds.play('success')
      emit('complete')
    }
  }, 900))
}

/* ── Tarjeta de Saber (regla 15): the scene only DECLARES the dato — the
   shell shows it, narrates it (kid) and keeps it recoverable ────────── */

function showKnowledge(bean: Bean) {
  emit('knowledge', {
    title: bean.displayName,
    html: factHtml(bean),
    voice: factSpeech(bean),
    visual: { component: markRaw(BeanSticker), props: { body: bean.bean.body, outline: bean.bean.outline } },
  })
}

/** Tapping a revealed card re-opens its dato */
function reshowKnowledge(bean: Bean) {
  if (!revealed.value.has(bean.id) || isSpinning.value) return
  showKnowledge(bean)
}

onBeforeUnmount(() => {
  if (tickRaf) cancelAnimationFrame(tickRaf)
  if (tickLockTimer) clearTimeout(tickLockTimer)
  timers.forEach(clearTimeout)
})
</script>

<style scoped>
/* Solo layout/composición de ESTA escena. El lenguaje visual de la ruleta y
   las cartas de revelación vive en el DS (.sp-wheel*, .sp-reveal-*). */
.scene {
  position: absolute;
  inset: 0;
  padding: 120px 80px 104px;
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
  color: var(--ink);
}

.main {
  flex: 1;
  display: grid;
  grid-template-columns: 520px 1fr;
  gap: 80px;
  align-items: center;
}

.wheel-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

/* El frijol sticker dentro de la cara de la carta (proporción del frijol) */
.card-body {
  width: 60%;
  max-width: 125px;
  aspect-ratio: 1 / 0.78;
}

/* El frijol descubierto se enciende en su sector. SOLO opacidad: un transform de CSS
   pisaría el transform SVG que posiciona el grupo en el sector. */
.wheel-bean-in {
  animation: wheel-bean-in 500ms ease-out both;
}

@keyframes wheel-bean-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

