<template>
  <!-- Regla 16: the question prompt is NECESSARY text (it IS the game) — no
       title on top of it, no final feedback text (the shell's strip owns
       feedback). When the quiz ends the board stays visible, locked, with the
       last correct answer highlighted. -->
  <div class="scene">
    <div class="quiz-question">
      <span>{{ t(currentQuestion.key) }}</span>
      <button :class="['sp-circle', 'sp-circle-sm', { 'is-speaking': speaking }]" :aria-label="t('listenQuestion')" @click="speakQuestion">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </button>
    </div>

    <div class="sp-quiz-grid">
      <button
        v-for="bean in currentOptions"
        :key="`${questionIndex}-${bean.id}`"
        :class="['sp-quiz-option', {
          'is-wrong': wrongId === bean.id,
          'is-right': rightId === bean.id,
        }]"
        :style="{ '--quiz-tint': pastelize(bean.color) }"
        :disabled="done"
        @click="answer(bean)"
      >
        <div class="quiz-bean">
          <BeanSticker :body="bean.bean.body" :outline="bean.bean.outline" />
        </div>
        <span class="sp-quiz-name">{{ bean.displayName }}</span>
      </button>
    </div>

    <!-- Question progress lives BELOW the board: the question and options
         own the top of the visual flow -->
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
import { computed, ref } from 'vue'
import { useNarrator } from '~/composables/useNarrator'
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import BeanSticker from '~/sprites/BeanSticker.vue'
import { beansFor, pastelize, type Bean } from '../../beans'
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
// Bean varieties resolved to the active content language (strings → plain)
const BEANS = beansFor(props.locale ?? 'es')

interface QuizQuestion {
  key: string
  correctId: string
}

// The prompt text is localized in scene.config (q0..q3); here we keep only the
// question KEY + the right answer.
const QUESTIONS: QuizQuestion[] = [
  { key: 'q0', correctId: 'rojo' },
  { key: 'q1', correctId: 'negro' },
  { key: 'q2', correctId: 'blanco' },
  { key: 'q3', correctId: 'pinto' },
]

const questionIndex = ref(0)
const wrongId = ref<string | null>(null)
const rightId = ref<string | null>(null)
const speaking = ref(false)
const done = ref(false)
let locked = false
let completed = false

const currentQuestion = computed(() => QUESTIONS[questionIndex.value]!)

// 3 options: the correct bean + 2 others, stable per question
const currentOptions = computed<Bean[]>(() => {
  const correct = BEANS.find(b => b.id === currentQuestion.value.correctId)!
  const others = BEANS.filter(b => b.id !== correct.id)
  // deterministic-ish shuffle seeded by question index so options don't jump on re-render
  const picked = [others[questionIndex.value % 3]!, others[(questionIndex.value + 1) % 3]!]
  const options = [correct, ...picked]
  return options.sort((a, b) => ((a.id.charCodeAt(0) + questionIndex.value) % 7) - ((b.id.charCodeAt(0) + questionIndex.value) % 7))
})

function speakQuestion() {
  narrate(t(currentQuestion.value.key), s => (speaking.value = s))
}

function answer(bean: Bean) {
  if (locked || done.value) return

  if (bean.id !== currentQuestion.value.correctId) {
    wrongId.value = bean.id
    Sounds.play('error')
    setTimeout(() => {
      wrongId.value = null
    }, 500)
    return
  }

  locked = true
  rightId.value = bean.id
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

/* El frijol sticker dentro de cada opción */
.quiz-bean {
  width: 120px;
  height: 95px;
}

.sp-dots {
  margin-top: 30px;
}
</style>
