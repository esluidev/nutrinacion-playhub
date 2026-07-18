<template>
  <!-- LAS ESTRELLAS DEL CUIDADO — repaso por COLECCIÓN, sin examen: cada
       estrella apagada guarda un hábito aprendido en el taller; al tocarla
       se enciende y RE-ENSEÑA su hábito (sprite + dato + voz). No hay
       respuestas incorrectas: descubrir, no adivinar. Re-tocar una estrella
       encendida vuelve a mostrar su saber (regla 15). -->
  <div class="scene">
    <div class="stars-row">
      <button
        v-for="(star, i) in STARS"
        :key="star.id"
        :class="['star-btn', { 'is-lit': litIds.has(star.id) }]"
        :style="{ '--rise': `${STAR_RISE[i]}px` }"
        @click="onStarTap(star)"
      >
        <span class="star-art">
          <StarSticker
            :body="litIds.has(star.id) ? '#f4c542' : '#cfc9ba'"
            :shade="litIds.has(star.id) ? '#dfa92e' : '#b5ae9d'"
          />
        </span>
        <span class="star-name">{{ star.name }}</span>
      </button>
    </div>

    <p class="stars-count">{{ litIds.size }} / {{ STARS.length }}</p>
  </div>
</template>

<script setup lang="ts">
import { markRaw, ref, type Component } from 'vue'
import { Sounds } from '~/primitives/sounds'
import FridgeSticker from '~/sprites/FridgeSticker.vue'
import InsulinPenSticker from '~/sprites/InsulinPenSticker.vue'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import PlateSticker from '~/sprites/PlateSticker.vue'
import StarSticker from '~/sprites/StarSticker.vue'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
import { careStarsFor, type CareStar } from '../../data'
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

const STARS = careStarsFor(props.locale ?? 'es')
const POINTS_PER_STAR = Number(props.config?.pointsPerStar ?? 10)

// Alturas alternadas: la fila se lee como una constelación, no una lista
const STAR_RISE = [0, -34, -52, -34, 0]

const litIds = ref(new Set<string>())
let completed = false

// El sprite que cada hábito deja en la Tarjeta de Saber
const STAR_VISUAL: Record<CareStar['id'], { component: Component, props?: Record<string, unknown> }> = {
  agua: { component: WaterDropSticker },
  horarios: { component: InsulinPenSticker },
  refri: { component: FridgeSticker },
  adulto: { component: KidPoseSticker, props: { pose: 'stand', variant: 'girl', age: 'teen', shirt: '#4a9068' } },
  plato: { component: PlateSticker },
}

function onStarTap(star: CareStar) {
  const already = litIds.value.has(star.id)

  if (!already) {
    litIds.value = new Set([...litIds.value, star.id])
    Sounds.play('coin')
    emit('score', POINTS_PER_STAR)
  }
  else {
    Sounds.play('pop')
  }

  const visual = STAR_VISUAL[star.id]
  emit('knowledge', {
    title: star.name,
    html: star.factHtml,
    voice: star.factVoice,
    visual: { component: markRaw(visual.component), props: visual.props },
  })

  if (litIds.value.size >= STARS.length && !completed) {
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
  gap: 30px;
  font-family: var(--font-body);
  color: var(--ink);
}

/* Constelación: estrellas grandes tocables a alturas alternadas */
.stars-row {
  display: flex;
  align-items: flex-end;
  gap: 34px;
}

.star-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  font-family: inherit;
  color: var(--ink);
  transform: translateY(var(--rise));
  transition: transform 180ms ease-out;
}

.star-btn:not(:disabled):hover {
  transform: translateY(calc(var(--rise) - 6px));
}

.star-btn:disabled {
  cursor: default;
}

.star-art {
  display: block;
  width: 120px;
  height: 120px;
  transition: filter 250ms ease-out;
}

.star-btn:not(.is-lit) .star-art {
  filter: saturate(0.4);
  opacity: 0.85;
}

.star-name {
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  max-width: 130px;
  text-align: center;
}

.stars-count {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 24px;
  margin: 0;
}
</style>
