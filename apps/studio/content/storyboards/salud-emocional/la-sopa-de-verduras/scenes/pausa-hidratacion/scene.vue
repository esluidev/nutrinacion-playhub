<template>
  <!-- Pausa de agua de SALUD EMOCIONAL — mecánica PROPIA del tipo: el SORBO
       LENTO. Como toda estrategia de calma del tipo, beber se HACE con el
       cuerpo: mantener presionado para tomar un sorbo despacio (soltar pausa,
       no castiga). El vaso se VACÍA mientras se sostiene — se bebe de verdad —
       y cada sorbo revela una señal corporal por la Tarjeta de Saber (boca →
       garganta → cuerpo). Sin contador de pasos ni carita fija: un estado
       (el vaso) y una acción (la gota). La distinción con alimentación es
       deliberada: allá el vaso se LLENA con toques contados. -->
  <div class="scene">
    <div class="drink-row">
      <div class="glass-wrap">
        <Glass :level="level" />
      </div>

      <!-- UN solo hold continuo: el anillo se llena una única vez (beber toda
           el agua) y las señales corporales llegan como HITOS del camino
           (⅓ → ⅔ → final). Soltar pausa donde vas; re-presionar continúa.
           Nada se remonta: el gesto nunca queda muerto. -->
      <HoldAction :duration="DRINK_MS" @progress="onDrinkProgress" @complete="onDrinkDone">
        <span class="sip-art"><WaterDropSticker /></span>
        <template #label>
          <span :class="['sip-pill', { 'is-done': done }]">{{ t('sipBtn') }}</span>
        </template>
      </HoldAction>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import Glass from '~/primitives/Glass/Glass.vue'
import HoldAction from '~/primitives/HoldAction/HoldAction.vue'
import { Sounds } from '~/primitives/sounds'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
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

const TOTAL_SIPS = Number(props.config?.sips ?? 3)
const DRINK_MS = Number(props.config?.sipDuration ?? 2400) * Number(props.config?.sips ?? 3)

const drinkProgress = ref(0)
const milestones = ref(0)
const done = computed(() => drinkProgress.value >= 1)
let completed = false

// El agua baja EN VIVO con la presión sostenida: beber se ve mientras se hace
const level = computed(() => Math.max(0, 1 - drinkProgress.value))

// Los hitos del camino (⅓ y ⅔) son feedback de ACCIÓN puro (regla 15A):
// solo un pop — la franja no se abre a mitad del ejercicio. El saber llega
// UNA vez, al final, con el recorrido completo del agua por el cuerpo.
function onDrinkProgress(progress: number) {
  drinkProgress.value = progress
  const crossed = Math.min(Math.floor(progress * TOTAL_SIPS), TOTAL_SIPS - 1)
  while (milestones.value < crossed) {
    milestones.value++
    Sounds.play('pop')
  }
}

function onDrinkDone() {
  drinkProgress.value = 1
  if (completed) return
  completed = true
  Sounds.play('success')
  emit('knowledge', {
    title: t('knTitle'),
    html: t('knHtml'),
    voice: t('knVoice'),
    visual: { component: markRaw(WaterDropSticker) },
  })
  emit('score', Number(props.config?.pointsOnComplete ?? 10))
  emit('complete')
}
</script>

<style scoped>
/* Solo layout/composición de ESTA escena: el anillo de sostener es de
   HoldAction, el vaso de Glass, la tarjeta de señal la pinta el shell. */
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

.drink-row {
  display: flex;
  align-items: center;
  gap: 110px;
}

/* Glass usa su tamaño natural; el wrap solo evita que flex lo comprima */
.glass-wrap {
  flex-shrink: 0;
}

/* Zona CUADRADA para que el anillo de HoldAction sea un círculo perfecto:
   la gota se centra dentro (su svg conserva proporción) */
.sip-art {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 152px;
  height: 152px;
}

.sip-art :deep(svg) {
  width: 106px;
  height: 124px;
}

.sip-pill {
  padding: 9px 28px;
  background: var(--accent-blue);
  border: 3px solid var(--ink);
  border-radius: 999px;
  box-shadow: 0 3px 0 var(--ink);
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #ffffff;
}

/* Terminó de beber: la acción se apaga conservando su etiqueta (regla 5) */
.sip-pill.is-done {
  background: #ffffff;
  color: var(--ink);
  opacity: 0.45;
  box-shadow: none;
}</style>
