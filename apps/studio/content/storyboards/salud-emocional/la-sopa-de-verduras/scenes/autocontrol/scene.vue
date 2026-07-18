<template>
  <!-- SOPA (detonante) → ALTO → RESPIRA → HABLA. Un solo PUNTO FOCAL: la
       acción activa ocupa el escenario a tamaño completo bajo la carita (que
       preside y reacciona). Sin mapa ni pasos en miniatura: la secuencia se
       aprende haciéndola y cada pill nombra su paso. Lógica causal: leo la
       situación → la ACTÚO tocando la sopa → la emoción ESCALA (la carita
       tiembla: el impulso) → ALTO congela la escalada (se frena la REACCIÓN,
       nunca la emoción) → RESPIRA la baja → HABLA la reemplaza con palabras.
       Marco de ensayo ("Imagina:"): se actúa un papel — nadie le dice al niño
       qué siente, aunque a él la sopa le encante. -->
  <div class="scene">
    <!-- El guion de la situación: el educador lo narra al grupo -->
    <p class="situation-copy">{{ currentRound.prompt }}</p>

    <!-- La emoción, protagonista: escala tras el detonante, se congela con
         el alto y baja al respirar -->
    <div :class="['emotion-anchor', { 'is-escalating': escalating }]">
      <EmotionFaceSticker :emotion="face.emotion" :body="face.body" :shade="face.shade" />
    </div>

    <!-- ── El escenario: UNA acción a la vez, a tamaño completo ── -->
    <div class="action-stage">
      <!-- 0 · EL DETONANTE: actuar la situación tocando la sopa -->
      <button v-if="phase === 'trigger'" key="trigger" class="token-btn stage-enter" @click="onTrigger">
        <span class="token-art"><SoupBowlSticker :steam="true" /></span>
        <span class="token-pill pill-orange">{{ currentRound.trigger }}</span>
      </button>

      <!-- 1 · ALTO: congela la escalada -->
      <button v-else-if="phase === 'stop'" key="stop" class="token-btn stage-enter" @click="onStop">
        <span class="token-art"><HandSticker :soapy="false" /></span>
        <span class="token-pill pill-red">{{ t('stopLabel') }}</span>
      </button>

      <!-- 2 · RESPIRA -->
      <HoldAction
        v-else-if="phase === 'breathe'"
        :key="round"
        class="stage-enter"
        :duration="HOLD_DURATION"
        @progress="onBreath"
        @complete="onCalm"
      >
        <template #default="{ progress }">
          <div class="breath-bubble" :style="{ transform: `scale(${1 + progress * 0.14})` }">
            <span class="breath-label">{{ t('breatheLabel') }}</span>
          </div>
        </template>
      </HoldAction>

      <!-- 3 · HABLA -->
      <button v-else-if="phase === 'speak'" key="speak" class="token-btn stage-enter" @click="onSpeak">
        <span class="speech-bubble">“{{ currentRound.speech }}”</span>
        <span class="token-pill pill-green">{{ t('speakLabel') }}</span>
      </button>

      <!-- Ronda hecha: siguiente situación (el resultado queda en la carita
           verde y la Tarjeta de Saber) -->
      <button v-else-if="!isLastRound" key="next" class="sp-btn sp-btn-green stage-enter" @click="nextRound">
        {{ t('nextBtn') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import { useT } from '~/composables/useT'
import HoldAction from '~/primitives/HoldAction/HoldAction.vue'
import { Sounds } from '~/primitives/sounds'
import EmotionFaceSticker from '~/sprites/EmotionFaceSticker.vue'
import HandSticker from '~/sprites/HandSticker.vue'
import SoupBowlSticker from '~/sprites/SoupBowlSticker.vue'
import { calmRoundsFor } from '../../data'
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

const ROUNDS = calmRoundsFor(props.locale ?? 'es')
const POINTS_PER_ROUND = Number(props.config?.pointsPerRound ?? 15)
const HOLD_DURATION = Number(props.config?.holdDuration ?? 3200)
/** Cuánto tarda la emoción en escalar de calma al tope (el impulso subiendo) */
const ESCALATE_MS = Number(props.config?.escalateDuration ?? 4200)
const CALM_BASE = 0.12

const round = ref(0)
const gaugeValue = ref(CALM_BASE)
const phase = ref<'trigger' | 'stop' | 'breathe' | 'speak' | 'done'>('trigger')
/** Intensidad congelada por el ALTO: respirar baja desde aquí */
let frozenHeat = CALM_BASE
let completed = false

const allDone = computed(() => round.value >= ROUNDS.length)
const currentRound = computed(() => ROUNDS[Math.min(round.value, ROUNDS.length - 1)]!)
const isLastRound = computed(() => round.value >= ROUNDS.length - 1)
/** La carita tiembla mientras el impulso escala (fase stop) — se detiene EN
 *  SECO con el alto: ese es el pago visual de frenar */
const escalating = computed(() => phase.value === 'stop')

// La carita sigue la intensidad: roja arriba, verde en la calma
const face = computed(() => {
  if (gaugeValue.value < 1 / 3) return { emotion: 'calmado' as const, body: '#a4d9b5', shade: '#6bbf8a' }
  if (gaugeValue.value < 2 / 3) return { emotion: 'sorprendido' as const, body: '#f9d976', shade: '#f4c542' }
  return { emotion: 'enojado' as const, body: '#f08a8a', shade: '#e63946' }
})

// Motor de escalada por reloj (como HoldAction): el impulso sube solo hasta
// el tope y ahí ESPERA el alto — nunca estalla (sin castigo)
let escalateTimer: ReturnType<typeof setInterval> | null = null

function stopEscalate() {
  if (escalateTimer) {
    clearInterval(escalateTimer)
    escalateTimer = null
  }
}

onBeforeUnmount(stopEscalate)

/** El detonante: el grupo actúa la situación (oler/probar/mirar la sopa) y
 *  la emoción empieza a subir */
function onTrigger() {
  if (phase.value !== 'trigger') return
  Sounds.play('whoosh')
  phase.value = 'stop'
  const from = CALM_BASE
  const to = currentRound.value.heat
  const startedAt = performance.now()
  escalateTimer = setInterval(() => {
    const p = Math.min(1, (performance.now() - startedAt) / ESCALATE_MS)
    gaugeValue.value = from + (to - from) * p
    if (p >= 1) stopEscalate()
  }, 50)
}

/** ALTO congela la escalada donde va: se frena la REACCIÓN (el temblor), la
 *  emoción sigue ahí (el color queda) — eso es lo que se enseña */
function onStop() {
  if (phase.value !== 'stop') return
  stopEscalate()
  frozenHeat = gaugeValue.value
  Sounds.play('pop')
  phase.value = 'breathe'
}

// Respirar baja la intensidad desde donde quedó congelada
function onBreath(progress: number) {
  gaugeValue.value = Math.max(0.08, frozenHeat * (1 - progress))
}

function onCalm() {
  if (phase.value !== 'breathe' || allDone.value) return
  gaugeValue.value = 0.08
  Sounds.play('success')
  phase.value = 'speak'
}

function onSpeak() {
  if (phase.value !== 'speak' || allDone.value) return
  phase.value = 'done'
  Sounds.play('success')
  emit('score', POINTS_PER_ROUND)
  emit('knowledge', {
    title: currentRound.value.name,
    html: currentRound.value.factHtml,
    voice: currentRound.value.factVoice,
    visual: {
      component: markRaw(EmotionFaceSticker),
      props: { emotion: 'calmado', body: '#a4d9b5', shade: '#6bbf8a' },
    },
  })

  if (isLastRound.value && !completed) {
    completed = true
    emit('score', Number(props.config?.pointsOnComplete ?? 10))
    emit('complete')
  }
}

function nextRound() {
  if (phase.value !== 'done' || isLastRound.value) return
  emit('knowledge', null)
  round.value++
  phase.value = 'trigger'
  gaugeValue.value = CALM_BASE
  frozenHeat = CALM_BASE
  Sounds.play('tick')
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

/* ── El guion de la situación ─────────────────────────────────────────────── */

.situation-copy {
  max-width: 760px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 26px;
  line-height: 1.35;
  text-align: center;
}

/* ── La emoción PRESIDE ───────────────────────────────────────────────────── */

.emotion-anchor {
  width: 170px;
  height: 175px;
}

/* El impulso escalando: temblor creciente que el ALTO corta en seco. No es
   un efecto ocioso (regla 13): es el estado del juego, con final por acción */
.emotion-anchor.is-escalating {
  animation: impulse-shake 320ms ease-in-out infinite;
}

@keyframes impulse-shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-3px) rotate(-2deg); }
  75% { transform: translateX(3px) rotate(2deg); }
}

/* ── El escenario: la acción activa a tamaño completo ─────────────────────── */

.action-stage {
  display: grid;
  place-items: center;
  /* Altura RESERVADA: cambiar de acción nunca reacomoda la escena */
  height: 300px;
  width: 100%;
}

/* Cada acción entra con un pop corto (finito — regla 13) */
.stage-enter {
  animation: stage-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes stage-pop {
  0% { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}

/* Acción: sticker + pill (el patrón de acción del DS, sin caja) */
.token-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.14s ease-out;
}

.token-btn:hover {
  transform: translateY(-5px);
}

.token-btn:active {
  transform: translateY(2px);
}

.token-art {
  display: block;
  width: 158px;
  height: 158px;
}

.token-pill {
  padding: 11px 34px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  box-shadow: 0 3px 0 var(--ink);
  font-weight: 900;
  font-size: 20px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #ffffff;
  transition: box-shadow 0.14s ease-out;
}

.pill-orange { background: var(--accent-orange); }
.pill-red { background: var(--accent-red); }
.pill-green { background: var(--accent-green); }

.token-btn:hover .token-pill { box-shadow: 0 5px 0 var(--ink); }
.token-btn:active .token-pill { box-shadow: 0 1px 0 var(--ink); }

/* Burbuja de respirar */
.breath-bubble {
  width: 176px;
  height: 176px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #eaf6fc, var(--blue-tint) 55%, #a8d8ef);
  border: 5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 160ms ease-out;
}

.breath-label {
  font-weight: 900;
  font-size: 21px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--accent-blue-dark);
}

/* Globo de la frase */
.speech-bubble {
  position: relative;
  display: block;
  max-width: 560px;
  padding: 22px 26px;
  border: 4px solid var(--ink);
  border-radius: 24px;
  background: #ffffff;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 21px;
  line-height: 1.4;
  text-align: center;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -15px;
  width: 24px;
  height: 24px;
  background: #ffffff;
  border-right: 4px solid var(--ink);
  border-bottom: 4px solid var(--ink);
  transform: translateX(-50%) rotate(45deg);
}
</style>
