<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Respirar para calmarse</h3>
        <span class="text-xs text-gray-400">HoldAction (primitiva) + EmotionFaceSticker (sprite)</span>
      </div>
      <div class="demo-stage flex-col gap-4">
        <HoldAction ref="holdRef" :key="resetKey" :duration="3000" @progress="progress = $event" @complete="done = true">
          <template #default="{ holding }">
            <div style="width: 120px; height: 124px">
              <EmotionFaceSticker
                :emotion="done ? 'calmado' : holding ? 'calmado' : 'enojado'"
                :body="done ? '#6bbf8a' : holding ? '#8ecfa8' : '#e63946'"
                :shade="done ? '#4a9068' : holding ? '#6bbf8a' : '#b82838'"
              />
            </div>
          </template>
        </HoldAction>
        <p class="text-sm font-bold" :style="{ color: done ? 'var(--accent-green-dark)' : 'var(--ink-soft)' }">
          {{ done ? '¡Calma lograda!' : `Mantén presionado (${Math.round(progress * 100)}%)` }}
        </p>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="outline" size="sm" @click="resetKey++; progress = 0; done = false">Reiniciar</UiButton>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        :duration · slot con {progress, holding} · reset() · @holdstart · @holdend(progress) · @progress(progress) · @complete
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import HoldAction from '~/primitives/HoldAction/HoldAction.vue'
import EmotionFaceSticker from '~/sprites/EmotionFaceSticker.vue'

const holdRef = ref<InstanceType<typeof HoldAction> | null>(null)
const resetKey = ref(0)
const progress = ref(0)
const done = ref(false)
</script>
