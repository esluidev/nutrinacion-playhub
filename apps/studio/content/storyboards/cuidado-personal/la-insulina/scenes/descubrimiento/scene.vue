<template>
  <!-- LA LLAVE DE LA ENERGÍA — mecánica propia del pilar cuidado personal:
       la insulina es una LLAVE. La energía de la comida espera frente a una
       puerta cerrada; el niño usa la llave, la puerta se abre, la energía
       entra y el personaje puede jugar / aprender / crecer. Tres rondas.
       Principio: descubrir, no adivinar — cada apertura ENSEÑA una función
       real de la insulina (el dato aterriza como Tarjeta de Saber). -->
  <div class="scene">
    <div class="sp-dots">
      <div
        v-for="(r, i) in ROUNDS"
        :key="r.id"
        :class="['sp-dot', { 'is-done': i < round, 'is-current': i === round && !allDone }]"
      />
    </div>

    <div class="stage-row">
      <!-- La puerta de la energía: cerrada esconde al personaje; al abrir,
           la energía entra (puntos que cruzan el umbral) y él celebra -->
      <div :class="['sp-card', 'door-frame', `sp-card--${currentRound.tint}`]">
        <div class="door-stage">
          <!-- Energía esperando afuera (lado izquierdo del umbral) -->
          <div :class="['energy-dots', { 'is-flowing': doorOpen }]">
            <span v-for="n in 4" :key="n" class="energy-dot" :style="{ '--i': n }" />
          </div>

          <!-- El umbral: detrás está el personaje haciendo la actividad -->
          <div class="doorway">
            <div class="behind">
              <PoseGuide
                :frames="currentRound.frames"
                :interval="currentRound.interval"
                :playing="doorOpen"
                :size="150"
                :variant="currentRound.variant"
                :shirt="currentRound.color"
              />
            </div>
            <!-- La puerta gira sobre su bisagra izquierda -->
            <div :class="['door', { 'is-open': doorOpen }]">
              <div class="door-knob" />
              <div class="keyhole" />
            </div>
          </div>
        </div>
        <div class="door-name">{{ currentRound.name }}</div>
      </div>

      <!-- La llave-insulina: un gesto — usarla -->
      <div class="action-col">
        <div :class="['key-art', { 'is-turning': turning }]">
          <KeySticker :shadow="false" />
        </div>
        <button
          class="sp-btn sp-btn-blue sp-btn-big"
          :disabled="turning || doorOpen || allDone"
          @click="useKey"
        >
          {{ t('keyBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import { useT } from '~/composables/useT'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import { Sounds } from '~/primitives/sounds'
import KeySticker from '~/sprites/KeySticker.vue'
import { energyRoundsFor } from '../../data'
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

const ROUNDS = energyRoundsFor(props.locale ?? 'es')
const POINTS_PER_ROUND = Number(props.config?.pointsPerRound ?? 10)

const TURN_MS = 800 // la llave gira
const OPEN_MS = 4200 // la puerta queda abierta: energía entra + celebración

const round = ref(0)
const turning = ref(false)
const doorOpen = ref(false)
let completed = false

const allDone = computed(() => round.value >= ROUNDS.length)
// Terminado todo, la última puerta queda como estado final visible
const currentRound = computed(() => ROUNDS[Math.min(round.value, ROUNDS.length - 1)]!)

const timers: ReturnType<typeof setTimeout>[] = []
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}
onBeforeUnmount(() => timers.forEach(clearTimeout))

function useKey() {
  if (turning.value || doorOpen.value || allDone.value) return
  emit('knowledge', null)
  Sounds.play('tick') // la llave entra en la cerradura
  turning.value = true

  later(() => {
    turning.value = false
    doorOpen.value = true
    Sounds.play('whoosh') // la puerta se abre, la energía entra
    later(() => onDoorDone(), OPEN_MS)
  }, TURN_MS)
}

function onDoorDone() {
  const r = currentRound.value
  doorOpen.value = false
  Sounds.play('success')
  emit('score', POINTS_PER_ROUND)
  emit('knowledge', {
    title: r.name,
    html: r.factHtml,
    voice: r.factVoice,
    visual: { component: markRaw(KeySticker) },
  })
  round.value++

  if (round.value >= ROUNDS.length && !completed) {
    completed = true
    emit('complete')
  }
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

.door-frame {
  width: 420px;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  padding: 24px 20px;
  transition: background-color 220ms ease-out;
}

.door-stage {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 280px;
}

/* Energía esperando: puntos dorados que CRUZAN el umbral al abrirse */
.energy-dots {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 56px;
  align-items: center;
}

.energy-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-yellow);
  border: 3px solid var(--ink);
  box-shadow: 0 2px 0 var(--ink);
}

.energy-dots.is-flowing .energy-dot {
  animation: energy-in 1300ms ease-in forwards;
  animation-delay: calc(var(--i) * 240ms);
}

@keyframes energy-in {
  0% { transform: translateX(0); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translateX(150px); opacity: 0; }
}

/* El umbral: marco ink con el personaje detrás y la puerta girando */
.doorway {
  position: relative;
  width: 190px;
  height: 272px;
  border: 6px solid var(--ink);
  border-radius: 16px 16px 8px 8px;
  background: var(--paper, #f5f0e8);
  overflow: visible;
  perspective: 700px;
}

.behind {
  position: absolute;
  inset: 6px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.door {
  position: absolute;
  inset: -3px;
  background: #c98d4e;
  border: 6px solid var(--ink);
  border-radius: 16px 16px 8px 8px;
  transform-origin: left center;
  transition: transform 700ms cubic-bezier(0.35, 0.9, 0.4, 1);
  box-shadow: 0 4px 0 var(--ink);
}

.door.is-open {
  transform: rotateY(-82deg);
}

.door-knob {
  position: absolute;
  right: 14px;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f4c542;
  border: 4px solid var(--ink);
}

/* Cerradura: la puerta espera su llave */
.keyhole {
  position: absolute;
  right: 16px;
  top: calc(50% + 30px);
  width: 12px;
  height: 18px;
  background: var(--ink);
  border-radius: 6px 6px 2px 2px;
}

.door-name {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* La llave: gira al usarse */
.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 34px;
}

.key-art {
  width: 190px;
  height: 104px;
  transition: transform 300ms ease-out;
}

.key-art.is-turning {
  animation: key-turn 800ms ease-in-out;
}

@keyframes key-turn {
  0% { transform: rotate(0deg); }
  35% { transform: translateX(-26px) rotate(0deg); }
  70% { transform: translateX(-26px) rotate(48deg); }
  100% { transform: rotate(0deg); }
}
</style>
