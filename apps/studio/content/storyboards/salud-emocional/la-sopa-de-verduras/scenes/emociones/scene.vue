<template>
  <!-- ¿QUÉ SIENTES TÚ? — la pregunta va DIRECTA a los niños del taller: la
       sopa de la pantalla es LA sopa de la que habla el educador, sin
       personajes intermedios. Toda respuesta es válida (nombrar, no adivinar)
       y cada saber enseña los beneficios de la sopa y qué hacer cuando un
       alimento genera rechazo. Re-tocar la carita elegida recupera su saber. -->
  <div class="scene">
    <div class="story-row">
      <!-- LA sopa del taller, protagonista -->
      <div class="soup-art">
        <SoupBowlSticker :steam="true" />
      </div>

      <!-- La pregunta directa: el educador la lee al grupo — el texto en
           pantalla es su guion, sin botón de audio que compita -->
      <div class="story-prompt">
        <span>{{ currentRound.prompt }}</span>
      </div>
    </div>

    <!-- Tres caritas por pregunta: todas valen — nombrar, no adivinar -->
    <div class="faces-row">
      <button
        v-for="emotion in currentOptions"
        :key="`${round}-${emotion.id}`"
        :class="['face-btn', { 'is-selected': selectedEmotion?.id === emotion.id, 'is-muted': selectedEmotion && selectedEmotion.id !== emotion.id }]"
        :disabled="allDone || (!!selectedEmotion && selectedEmotion.id !== emotion.id)"
        @click="selectEmotion(emotion)"
      >
        <span class="face-art">
          <EmotionFaceSticker :emotion="emotion.id" :body="emotion.body" :shade="emotion.shade" />
        </span>
        <span class="face-name">{{ emotion.label }}</span>
      </button>
    </div>

    <div class="sp-dots">
      <span
        v-for="(sensoryRound, i) in ROUNDS"
        :key="sensoryRound.id"
        :class="['sp-dot', { 'is-done': i < round || allDone, 'is-current': i === round && !allDone }]"
      />
    </div>

    <!-- Hueco reservado: el botón aparece sin mover el resto del tablero -->
    <div class="next-slot">
      <button
        v-if="selectedEmotion && !isLastRound"
        class="sp-btn sp-btn-green sp-btn-sm next-situation"
        @click="nextRound"
      >
        {{ t('nextBtn') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import EmotionFaceSticker from '~/sprites/EmotionFaceSticker.vue'
import SoupBowlSticker from '~/sprites/SoupBowlSticker.vue'
import { emotionsFor, sensoryRoundsFor, type Emotion } from '../../data'
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

const EMOTION_LIST = emotionsFor(props.locale ?? 'es')
const ROUNDS = sensoryRoundsFor(props.locale ?? 'es')
const POINTS_PER_ROUND = Number(props.config?.pointsPerRound ?? 10)

const round = ref(0)
const selectedEmotion = ref<Emotion | null>(null)
let completed = false

const allDone = computed(() => round.value >= ROUNDS.length)
const currentRound = computed(() => ROUNDS[Math.min(round.value, ROUNDS.length - 1)]!)
const isLastRound = computed(() => round.value >= ROUNDS.length - 1)
const currentOptions = computed(() => currentRound.value.options.map(id => EMOTION_LIST.find(emotion => emotion.id === id)!))

function showKnowledge(emotion: Emotion) {
  emit('knowledge', {
    title: emotion.noun,
    html: currentRound.value.factHtml,
    voice: currentRound.value.factVoice,
    visual: {
      component: markRaw(EmotionFaceSticker),
      props: { emotion: emotion.id, body: emotion.body, shade: emotion.shade },
    },
  })
}

function selectEmotion(emotion: Emotion) {
  if (allDone.value) return

  // Re-tocar la respuesta elegida recupera el saber (regla 15).
  if (selectedEmotion.value?.id === emotion.id) {
    Sounds.play('pop')
    showKnowledge(emotion)
    return
  }

  selectedEmotion.value = emotion
  Sounds.play('success')
  emit('score', POINTS_PER_ROUND)
  showKnowledge(emotion)

  if (isLastRound.value && !completed) {
    completed = true
    emit('score', Number(props.config?.pointsOnComplete ?? 10))
    emit('complete')
  }
}

function nextRound() {
  if (!selectedEmotion.value || isLastRound.value) return
  emit('knowledge', null)
  round.value++
  selectedEmotion.value = null
  Sounds.play('tick')
}
</script>

<style scoped>
/* Solo layout/composición de ESTA escena. El botón circular de audio y los
   dots de progreso viven en el DS (.sp-circle, .sp-dots). */
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

/* ── La sopa y la pregunta ────────────────────────────────────────────────── */

.story-row {
  display: flex;
  align-items: center;
  gap: 56px;
  max-width: 920px;
}

.soup-art {
  flex-shrink: 0;
  width: 240px;
  height: 190px;
}

.story-prompt {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 30px;
  line-height: 1.3;
  max-width: 560px;
}

/* ── Las caritas ──────────────────────────────────────────────────────────── */

.faces-row {
  display: flex;
  align-items: flex-end;
  gap: 46px;
}

.face-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  font-family: inherit;
  color: var(--ink);
  transition: transform 180ms ease-out, opacity 180ms ease;
}

.face-btn:not(:disabled):hover {
  transform: translateY(-6px);
}

.face-btn:disabled {
  cursor: default;
}

/* Selección SIN tarjeta (encajonar sobrecarga el UI): la carita elegida se
   levanta y su nombre se enciende como pill sticker — el mismo lenguaje del
   pill "Aquí" de la lista de escenas */
.face-btn.is-selected {
  transform: translateY(-6px);
}

.face-btn.is-muted {
  opacity: 0.42;
}

.face-art {
  display: block;
  width: 112px;
  height: 115px;
}

/* Padding/borde reservados SIEMPRE: encenderse no reacomoda la fila */
.face-name {
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 4px 14px;
  border: 2px solid transparent;
  border-radius: 999px;
  transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
}

.face-btn.is-selected .face-name {
  background: var(--accent-green);
  border-color: var(--ink);
  color: #ffffff;
}

/* Hueco fijo del botón Siguiente: aparecer no reacomoda caritas ni dots */
.next-slot {
  height: 44px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.next-situation {
  min-width: 170px;
}
</style>
