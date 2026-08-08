<template>
  <!-- Regla 16: the question prompt is NECESSARY text (it IS the game) — no
       title on top of it, no final feedback text. When the quiz ends the
       board stays visible, locked, with the last correct answer highlighted. -->
  <div class="scene">
    <div class="quiz-question">
      <span>{{ t(currentQuestion.promptKey) }}</span>
      <button :class="['sp-circle', 'sp-circle-sm', { 'is-speaking': speaking }]" :aria-label="t('listenQuestion')" @click="speakQuestion">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </button>
    </div>

    <div class="sp-quiz-grid">
      <button
        v-for="option in currentQuestion.options"
        :key="`${questionIndex}-${option.id}`"
        :class="['sp-quiz-option', {
          'is-wrong': wrongId === option.id,
          'is-right': rightId === option.id,
        }]"
        :style="{ '--quiz-tint': option.tint }"
        :disabled="done"
        @click="answer(option)"
      >
        <div class="quiz-art">
          <component :is="option.art" v-bind="option.props ?? {}" :style="artStyle(option)" />
        </div>
        <span class="sp-quiz-name">{{ option.label }}</span>
      </button>
    </div>

    <!-- Question progress lives BELOW the board -->
    <div class="sp-dots">
      <span
        v-for="(q, i) in QUESTIONS"
        :key="i"
        :class="['sp-dot', { 'is-done': i < questionIndex || done, 'is-current': i === questionIndex && !done }]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, type Component } from 'vue'
import { useNarrator } from '~/composables/useNarrator'
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import BoiledEggSticker from '~/sprites/BoiledEggSticker.vue'
import EggPartSticker from '~/sprites/EggPartSticker.vue'
import EggSticker from '~/sprites/EggSticker.vue'
import FriedEggSticker from '~/sprites/FriedEggSticker.vue'
import { EGGS, PARTS, pastelize } from '../../eggs'
import sceneConfig from './scene.config'

const props = defineProps<{
  locale?: string
  config?: Record<string, unknown>
}>()

const emit = defineEmits<{
  complete: []
  score: [points: number]
}>()

const t = useT(sceneConfig.strings, () => props.locale)
const narrate = useNarrator()

interface QuizOption {
  id: string
  label: string
  art: Component
  props?: Record<string, unknown>
  /** Pastel de identidad para el fondo de la carta (--quiz-tint) */
  tint: string
  /** Tamaño relativo del arte dentro de su caja (1 = llena). Comparaciones de tamaño. */
  artScale?: number
}

interface QuizQuestion {
  promptKey: string
  correctId: string
  options: QuizOption[]
}

const part = (id: 'cascara' | 'clara' | 'yema', label: string): QuizOption => {
  const p = PARTS.find(x => x.id === id)!
  return { id, label, art: markRaw(EggPartSticker), props: { part: id }, tint: pastelize(p.highlightColor) }
}

// Las variedades se muestran con su color/manchitas Y su tamaño relativo: en la
// pregunta "¿cuál es el más grande?" el tamaño ES la respuesta que se refuerza
// (descubrimiento ya la enseñó). La curva ^0.4 (la misma de descubrimiento) comprime
// el rango real (5×) lo justo para que la codorniz siga legible en una caja de 110px.
const eggOf = (id: string, label: string): QuizOption => {
  const egg = EGGS.find(e => e.id === id)!
  return {
    id,
    label,
    art: markRaw(EggSticker),
    props: { body: egg.egg.body, speckled: egg.egg.speckled, speckle: egg.egg.speckle },
    tint: pastelize(egg.color),
    artScale: egg.sizeScale ** 0.4,
  }
}

function artStyle(option: QuizOption) {
  if (!option.artScale || option.artScale >= 1) return undefined
  const pct = `${Math.round(option.artScale * 100)}%`
  return { width: pct, height: pct }
}

const QUESTIONS: QuizQuestion[] = [
  {
    promptKey: 'q0',
    correctId: 'clara',
    options: [part('cascara', t('optCascara')), part('clara', t('optClara')), part('yema', t('optYema'))],
  },
  {
    promptKey: 'q1',
    correctId: 'yema',
    options: [part('clara', t('optClara')), part('yema', t('optYema')), part('cascara', t('optCascara'))],
  },
  {
    promptKey: 'q2',
    correctId: 'avestruz',
    options: [eggOf('gallina', t('optDeGallina')), eggOf('codorniz', t('optDeCodorniz')), eggOf('avestruz', t('optDeAvestruz'))],
  },
  {
    promptKey: 'q3',
    correctId: 'crudo',
    options: [
      { id: 'frito', label: t('optFrito'), art: markRaw(FriedEggSticker), tint: pastelize('#f4c542') },
      { id: 'crudo', label: t('optCrudo'), art: markRaw(EggSticker), props: { body: '#f0c08e', outline: '#80522a' }, tint: pastelize('#e63946') },
      { id: 'hervido', label: t('optHervido'), art: markRaw(BoiledEggSticker), tint: pastelize('#3aa8e0') },
    ],
  },
]

const questionIndex = ref(0)
const wrongId = ref<string | null>(null)
const rightId = ref<string | null>(null)
const speaking = ref(false)
const done = ref(false)
let locked = false
let completed = false

const currentQuestion = computed(() => QUESTIONS[questionIndex.value]!)

function speakQuestion() {
  narrate(t(currentQuestion.value.promptKey), s => (speaking.value = s))
}

function answer(option: QuizOption) {
  if (locked || done.value) return

  if (option.id !== currentQuestion.value.correctId) {
    wrongId.value = option.id
    Sounds.play('error')
    setTimeout(() => {
      wrongId.value = null
    }, 500)
    return
  }

  locked = true
  rightId.value = option.id
  Sounds.play('success')
  emit('score', 10)

  setTimeout(() => {
    if (questionIndex.value < QUESTIONS.length - 1) {
      rightId.value = null
      locked = false
      questionIndex.value++
    }
    else if (!completed) {
      // Board stays visible and locked, last correct answer highlighted —
      // the celebration arrives in the shell's completion sheet
      completed = true
      done.value = true
      Sounds.play('celebrate')
      emit('complete')
    }
  }, 900)
}
</script>

<style scoped>
/* Solo layout/composición de ESTA escena. La carta de opción, el botón
   circular de audio y los dots de progreso viven en el DS
   (.sp-quiz-option, .sp-circle, .sp-dots). */
.scene {
  position: absolute;
  inset: 0;
  padding: 120px 80px 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-family: var(--font-body);
  color: var(--ink);
}

/* Enunciado de la pregunta (tipografía propia del quiz) */
.quiz-question {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 27px;
  text-align: center;
  max-width: 900px;
}

/* El arte (sticker) dentro de cada opción */
.quiz-art {
  width: 140px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quiz-art > * {
  max-width: 100%;
  max-height: 100%;
}

.sp-dots {
  margin-top: 30px;
}
</style>
