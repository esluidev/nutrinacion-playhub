<template>
  <!-- MI PLAN TRANQUILO — reflexión personal, no examen ni obligación de que
       la sopa guste. El niño nombra una reacción, elige una estrategia y
       termina con una frase que puede usar en la mesa. -->
  <div class="scene">
    <div class="plan-steps" aria-hidden="true">
      <span :class="['plan-step', { 'is-current': stage === 'feeling', 'is-done': stage !== 'feeling' }]">{{ t('feelingStep') }}</span>
      <span :class="['plan-step', { 'is-current': stage === 'strategy', 'is-done': stage === 'plan' }]">{{ t('strategyStep') }}</span>
      <span :class="['plan-step', { 'is-current': stage === 'plan' }]">{{ t('phraseStep') }}</span>
    </div>

    <!-- Sin tarjeta contenedora: el tablero flota sobre el lienzo (solo las
         OPCIONES son tarjetas — sp-card--pressable) -->
    <div class="plan-board">
      <template v-if="stage === 'feeling'">
        <div class="plan-hero">
          <div class="plan-soup"><SoupBowlSticker /></div>
          <p class="plan-prompt">{{ t('feelingPrompt') }}</p>
        </div>
        <div class="feeling-options">
          <button
            v-for="emotion in PLAN_FEELINGS"
            :key="emotion.id"
            :class="['feeling-option', { 'is-selected': selectedFeeling?.id === emotion.id }]"
            :disabled="(!!selectedFeeling && selectedFeeling.id !== emotion.id)"
            @click="chooseFeeling(emotion)"
          >
            <span class="feeling-art"><EmotionFaceSticker :emotion="emotion.id" :body="emotion.body" :shade="emotion.shade" /></span>
            <span>{{ emotion.label }}</span>
          </button>
        </div>
      </template>

      <template v-else-if="stage === 'strategy'">
        <p class="plan-prompt">{{ t('strategyPrompt') }}</p>
        <div class="strategy-options">
          <button
            v-for="strategy in STRATEGIES"
            :key="strategy.id"
            :class="['strategy-option', 'sp-card', 'sp-card--pressable', { 'is-selected': selectedStrategy?.id === strategy.id }]"
            :disabled="(!!selectedStrategy && selectedStrategy.id !== strategy.id)"
            @click="chooseStrategy(strategy)"
          >
            <span class="strategy-art">
              <KidPoseSticker v-if="strategy.id === 'respirar'" pose="breathe" variant="girl" />
              <span v-else-if="strategy.id === 'hablar'" class="people-art">
                <KidPoseSticker pose="stand" variant="boy" />
                <KidPoseSticker pose="stand" variant="girl" age="teen" />
              </span>
              <SoupBowlSticker v-else />
            </span>
            <span class="strategy-name">{{ strategy.name }}</span>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="plan-result">
          <div class="result-feeling">
            <span class="result-face"><EmotionFaceSticker :emotion="selectedFeeling!.id" :body="selectedFeeling!.body" :shade="selectedFeeling!.shade" /></span>
            <span>{{ selectedFeeling!.noun }}</span>
          </div>
          <div class="result-plus">+</div>
          <div class="result-strategy">
            <span class="result-strategy-name">{{ selectedStrategy!.name }}</span>
            <span class="result-phrase">“{{ selectedStrategy!.phrase }}”</span>
          </div>
        </div>
        <button class="sp-btn sp-btn-green sp-btn-big" :disabled="completed" @click="finishPlan">{{ t('planBtn') }}</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref } from 'vue'
import { useT } from '~/composables/useT'
import { Sounds } from '~/primitives/sounds'
import EmotionFaceSticker from '~/sprites/EmotionFaceSticker.vue'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import SoupBowlSticker from '~/sprites/SoupBowlSticker.vue'
import { emotionsFor, reflectionStrategiesFor, type Emotion, type ReflectionStrategy } from '../../data'
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

const EMOTIONS = emotionsFor(props.locale ?? 'es')
const PLAN_FEELINGS = ['desagrado', 'curioso', 'enojado', 'calmado'].map(id => EMOTIONS.find(emotion => emotion.id === id)!)
const STRATEGIES = reflectionStrategiesFor(props.locale ?? 'es')
const POINTS_PER_CHOICE = Number(props.config?.pointsPerChoice ?? 10)

const stage = ref<'feeling' | 'strategy' | 'plan'>('feeling')
const selectedFeeling = ref<Emotion | null>(null)
const selectedStrategy = ref<ReflectionStrategy | null>(null)
const completed = ref(false)

const timers: ReturnType<typeof setTimeout>[] = []
onBeforeUnmount(() => timers.forEach(clearTimeout))

function chooseFeeling(emotion: Emotion) {
  if (selectedFeeling.value) return
  selectedFeeling.value = emotion
  Sounds.play('success')
  emit('score', POINTS_PER_CHOICE)
  timers.push(setTimeout(() => (stage.value = 'strategy'), 520))
}

function chooseStrategy(strategy: ReflectionStrategy) {
  if (selectedStrategy.value) return
  selectedStrategy.value = strategy
  Sounds.play('success')
  emit('score', POINTS_PER_CHOICE)
  timers.push(setTimeout(() => (stage.value = 'plan'), 520))
}

function finishPlan() {
  if (!selectedFeeling.value || !selectedStrategy.value || completed.value) return
  completed.value = true
  Sounds.play('celebrate')
  emit('score', Number(props.config?.pointsOnComplete ?? 30))
  emit('knowledge', {
    title: t('knTitle'),
    html: t('knHtml'),
    voice: t('knVoice'),
    visual: { component: markRaw(SoupBowlSticker) },
  })
  emit('complete')
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
  gap: 24px;
  font-family: var(--font-body);
  color: var(--ink);
}

.plan-steps {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-step {
  min-width: 210px;
  padding: 10px 16px;
  border: 3px solid var(--ink);
  border-radius: 16px;
  background: var(--slot-bg);
  color: var(--ink-soft);
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 1px;
  text-align: center;
  text-transform: uppercase;
  opacity: 0.5;
}

.plan-step.is-current {
  background: #fbe3cc;
  color: var(--ink);
  opacity: 1;
}

.plan-step.is-done {
  background: var(--green-tint);
  color: var(--accent-green-dark);
  opacity: 1;
}

/* Altura estable entre etapas (el tablero no salta), sin chrome de tarjeta */
.plan-board {
  width: 900px;
  min-height: 410px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
}

.plan-hero {
  display: flex;
  align-items: center;
  gap: 30px;
}

.plan-soup {
  width: 150px;
  height: 118px;
}

.plan-prompt {
  max-width: 600px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 27px;
  line-height: 1.25;
  text-align: center;
}

.feeling-options {
  display: flex;
  align-items: flex-end;
  gap: 30px;
}

.feeling-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 150px;
  padding: 10px;
  border: 3px solid transparent;
  border-radius: 20px;
  background: transparent;
  color: var(--ink);
  font-family: inherit;
  font-weight: 900;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, opacity 160ms ease;
}

.feeling-option:not(:disabled):hover {
  transform: translateY(-5px);
}

.feeling-option:disabled:not(.is-selected) {
  opacity: 0.4;
}

.feeling-option.is-selected {
  background: var(--yellow-tint);
  border-color: var(--ink);
  transform: translateY(-4px);
}

.feeling-art {
  width: 102px;
  height: 105px;
}

.strategy-options {
  display: flex;
  align-items: stretch;
  gap: 24px;
}

.strategy-option {
  width: 235px;
  min-height: 245px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 20px;
  font-family: inherit;
  color: var(--ink);
  cursor: pointer;
}

.strategy-option:disabled:not(.is-selected) {
  opacity: 0.4;
}

.strategy-option.is-selected {
  background: var(--yellow-tint);
}

.strategy-art {
  display: block;
  width: 126px;
  height: 138px;
}

.people-art {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 150px;
  height: 138px;
}

.people-art > :first-child {
  width: 74px;
  height: 112px;
}

.people-art > :last-child {
  width: 80px;
  height: 130px;
  margin-left: -12px;
}

.strategy-name {
  font-weight: 900;
  font-size: 16px;
  text-align: center;
}

.plan-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  width: 100%;
  animation: plan-in 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes plan-in {
  from { opacity: 0; transform: scale(0.82); }
  to { opacity: 1; transform: scale(1); }
}

.result-feeling {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 160px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-face {
  width: 126px;
  height: 130px;
}

.result-plus {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 56px;
  color: var(--accent-green-dark);
}

.result-strategy {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 420px;
}

.result-strategy-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 26px;
  color: var(--accent-green-dark);
}

.result-phrase {
  padding: 18px 20px;
  border: 3px solid var(--ink);
  border-radius: 20px;
  background: #ffffff;
  font-weight: 800;
  font-size: 19px;
  line-height: 1.35;
}
</style>
