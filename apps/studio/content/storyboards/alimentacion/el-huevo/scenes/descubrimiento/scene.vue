<template>
  <!-- Mecánica PROPIA de el-huevo (regla 19): NO la ruleta de los frijoles. El
       niño toca cada tarjeta para descubrir el huevo (reusa .sp-reveal-* del DS,
       sin la rueda). Cada huevo sale a su tamaño relativo (codorniz pequeño →
       avestruz grande): explorar la diversidad y comparar tamaños, el objetivo de
       Descubrimiento. El alimento es inerte (regla 1): se presenta tal cual.

       Medidas al área jugable (stage 1280×800; escena con 80px laterales y
       120/104 verticales → ~1120×576). Las tarjetas llenan ese ancho. -->
  <div class="scene">
    <div class="row">
      <div
        v-for="egg in EGGS_BY_SIZE"
        :key="egg.id"
        :class="['sp-reveal-card', { 'revealed': revealed.has(egg.id), 'just-won': justWon === egg.id }]"
        @click="onCardClick(egg)"
      >
        <div class="sp-reveal-card-inner">
          <div class="sp-reveal-face sp-reveal-back">
            <div class="sp-reveal-q">?</div>
          </div>
          <div class="sp-reveal-face sp-reveal-front" :style="{ background: pastelize(egg.color) }">
            <!-- Huevo centrado en su área; el ancho lo fija el tamaño relativo
                 del huevo (alto por aspect). El nombre queda fijo abajo, alineado
                 entre todas las tarjetas. -->
            <div class="egg-area">
              <div class="card-egg" :style="{ width: `${eggWidth(egg)}px` }">
                <EggSticker :body="egg.egg.body" :outline="egg.egg.outline" :speckled="egg.egg.speckled" :speckle="egg.egg.speckle" />
              </div>
            </div>
            <div class="sp-reveal-name">{{ egg.displayName }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Instruction audio lives in the HUD (reads scene.config meta.instruction).
         Egg facts go out as `knowledge` — the shell's Tarjeta de Saber shows
         and narrates them (regla 15); the scene renders no popup of its own. -->
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import { Sounds } from '~/primitives/sounds'
import EggSticker from '~/sprites/EggSticker.vue'
import { eggsFor, factHtml, factSpeech, pastelize, type Egg } from '../../eggs'
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

// Egg varieties resolved to the active content language, laid out small→big so
// the row reads as a size line (codorniz → avestruz)
const EGGS_BY_SIZE = [...eggsFor(props.locale ?? 'es')].sort((a, b) => a.sizeScale - b.sizeScale)

// Egg width follows the variety's real relative size (sizeScale) through a soft power
// curve — the same rule as the retro quiz. Honest linear (5× range) made the small
// eggs unreadable dots; plain √ still read small on the big cards. ^0.4 keeps the
// size line teaching (codorniz clearly small, avestruz clearly dominant) with every
// egg comfortably visible: codorniz 89 · gallina 112 · pata 120 · avestruz 170.
const MAX_EGG_W = 170 // avestruz llena la carta (alto 221 ≤ área disponible)
const SIZE_CURVE = 0.4
function eggWidth(egg: Egg): number {
  return Math.round(MAX_EGG_W * egg.sizeScale ** SIZE_CURVE)
}

const revealed = ref(new Set<string>())
const justWon = ref<string | null>(null)
const allRevealed = computed(() => revealed.value.size >= EGGS_BY_SIZE.length)

let completed = false
const timers: ReturnType<typeof setTimeout>[] = []

/* ── Reveal (tap a card) ──────────────────────────────────────────────────── */

function onCardClick(egg: Egg) {
  // Tapping a revealed card re-opens its dato (regla 15: recuperable siempre)
  if (revealed.value.has(egg.id)) {
    showKnowledge(egg)
    return
  }
  // While the Tarjeta de Saber narrates (kid), the previous fact must land
  // before the next reveal — gating sin overlay (regla 15)
  reveal(egg)
}

function reveal(egg: Egg) {
  // Focus back on the game: the previous egg's card leaves with the new reveal
  emit('knowledge', null)

  revealed.value = new Set([...revealed.value, egg.id])
  justWon.value = egg.id
  timers.push(setTimeout(() => {
    if (justWon.value === egg.id) justWon.value = null
  }, 650))

  Sounds.play('whoosh') // card flip reveal
  emit('score', egg.points)

  const last = allRevealed.value && !completed

  // The Tarjeta de Saber slides up AFTER the card flip finishes (flip is 700ms)
  // — the reveal is the ceremony, the card is the dato
  timers.push(setTimeout(() => {
    showKnowledge(egg)
    // Workshop scene contract: complete fires with the last reveal — the
    // runner waits for the card's narration before celebrating
    if (last) {
      completed = true
      Sounds.play('success')
      emit('complete')
    }
  }, 900))
}

/* ── Tarjeta de Saber (regla 15): the scene only DECLARES the dato — the
   shell shows it, narrates it (kid) and keeps it recoverable ────────── */

function showKnowledge(egg: Egg) {
  emit('knowledge', {
    title: egg.displayName,
    html: factHtml(egg),
    voice: factSpeech(egg),
    visual: { component: markRaw(EggSticker), props: { body: egg.egg.body, outline: egg.egg.outline, speckled: egg.egg.speckled, speckle: egg.egg.speckle } },
  })
}

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
})
</script>

<style scoped>
/* Solo layout/composición de ESTA escena. El lenguaje visual de las cartas de
   revelación vive en el DS (.sp-reveal-*); aquí se dimensionan al área jugable. */
.scene {
  position: absolute;
  inset: 0;
  padding: 120px 80px 104px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: var(--font-body);
  color: var(--ink);
}

.row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 28px;
}

/* Tarjetas que llenan el ancho jugable (4×256 + 3×28 = 1108 ≤ 1120); proporción
   acorde al lenguaje de tarjetas del UI (no demasiado portrait) */
.sp-reveal-card {
  width: 256px;
  height: 322px;
}

/* El ? llena la carta más grande */
.sp-reveal-card :deep(.sp-reveal-q) {
  font-size: 150px;
}

/* Cara frontal en columna: huevo centrado arriba, nombre fijo abajo */
.sp-reveal-front {
  flex-direction: column;
  padding: 22px 18px;
  gap: 10px;
}

/* El huevo se centra en el espacio sobre el nombre (sin clavarse al fondo) */
.egg-area {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-egg {
  aspect-ratio: 200 / 260;
}

.sp-reveal-name {
  text-align: center;
  font-size: 16px;
  line-height: 1.25;
}
</style>
