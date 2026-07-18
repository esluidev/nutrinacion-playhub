<template>
  <!-- CRECE COMO UN ÁRBOL — mecánica propia (regla 19): la RESPIRACIÓN hace
       crecer al personaje. Cada ciclo de la burbuja avanza una etapa: semilla
       agachada → brote → ramas → árbol alto → árbol en calma (equilibrio).
       El niño acompaña la transformación con su cuerpo, despacio. Una sola
       historia corporal guiada — sin tarjetas, sin reloj (el tiempo lo pone
       la respiración). -->
  <div class="scene">
    <div class="stage-row">
      <!-- Póster: el personaje crece etapa por etapa (tween lento propio) -->
      <div class="sp-card sl-frame sp-card--green" @click="onPosterTap">
        <div class="tree-kid">
          <KidPoseSticker :def="currentDef" variant="girl" shirt="#4a9068" />
        </div>
        <div class="tree-stage">{{ STAGES[stage]!.name }}</div>
      </div>

      <!-- Columna de acción: la burbuja conduce — sus propios puntos de
           ciclo marcan el avance (sin medidores duplicados) -->
      <div class="action-col">
        <BreathGuide
          ref="breathRef"
          :cycles="GROWTH_STEPS"
          :size="140"
          :label-in="t('labelIn')"
          :label-out="t('labelOut')"
          @cycle="onCycle"
          @done="onGrown"
        />
        <button
          class="sp-btn sp-btn-blue sp-btn-big"
          :disabled="growing || grown"
          @click="startGrowth"
        >
          {{ t('startBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useT } from '~/composables/useT'
import BreathGuide from '~/primitives/BreathGuide/BreathGuide.vue'
import { Sounds } from '~/primitives/sounds'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { KID_POSES_BY_AGE, lerpPoseDef, type KidPoseDef } from '~/sprites/kid-poses'
import { treeStagesFor } from '../../moves'
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

const STAGES = treeStagesFor(props.locale ?? 'es')
const GROWTH_STEPS = STAGES.length - 1 // una respiración por etapa de crecimiento
const POINTS = Number(props.config?.pointsOnComplete ?? 30)

const breathRef = ref<InstanceType<typeof BreathGuide> | null>(null)
const growing = ref(false)
const grown = ref(false)
const stage = ref(0)
let completed = false

/* ── Tween de crecimiento: el personaje pasa de una pose a la otra DESPACIO
   (composición de utilidades del rig: lerpPoseDef + KidPoseSticker :def) ──── */

const poseOf = (i: number): KidPoseDef => KID_POSES_BY_AGE.kid[STAGES[i]!.pose]
const currentDef = shallowRef<KidPoseDef>(poseOf(0))

const GROW_MS = 1300
let raf = 0

function growTo(i: number) {
  const from = currentDef.value
  const to = poseOf(i)
  const t0 = performance.now()
  cancelAnimationFrame(raf)
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / GROW_MS)
    const eased = 0.5 - Math.cos(Math.PI * p) / 2 // sine in-out: crecer orgánico
    currentDef.value = lerpPoseDef(from, to, eased)
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

onBeforeUnmount(() => cancelAnimationFrame(raf))

/* ── Flujo ────────────────────────────────────────────────────────────────── */

function startGrowth() {
  if (growing.value || grown.value) return
  emit('knowledge', null)
  Sounds.play('pop')
  growing.value = true
  breathRef.value?.start()
}

function onCycle() {
  // Cada respiración completa hace crecer una etapa
  if (stage.value >= STAGES.length - 1) return
  stage.value++
  Sounds.play('pop')
  growTo(stage.value)
}

function onGrown() {
  growing.value = false
  grown.value = true
  Sounds.play('success')
  emit('score', POINTS)
  showKnowledge()
  if (!completed) {
    completed = true
    emit('complete')
  }
}

function onPosterTap() {
  // El saber es recuperable siempre (regla 15)
  if (grown.value) showKnowledge()
}

function showKnowledge() {
  emit('knowledge', {
    title: t('knTitle'),
    html: t('knHtml'),
    voice: t('knVoice'),
    visual: { component: markRaw(KidPoseSticker), props: { pose: 'balance', variant: 'girl', shirt: '#4a9068' } },
  })
}
</script>

<style scoped>
/* nudge: fuerza re-transform de Vite tras rm+recreate */
.scene {
  position: absolute;
  inset: 0;
  padding: 120px 80px 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  color: var(--ink);
}

.stage-row {
  display: flex;
  align-items: center;
  gap: 72px;
}

.sl-frame {
  width: 370px;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 20px;
}

.tree-kid {
  width: 230px;
  height: 300px;
}

.tree-stage {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}
</style>
