<template>
  <div>
    <UiCard :padding="false" :hover="false" class="overflow-hidden mb-4">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="section-title">Demo — Intensidad emocional</h3>
        <span class="text-xs text-gray-400">EmotionGauge (primitiva) + EmotionFaceSticker (sprite)</span>
      </div>
      <div class="demo-stage gap-10">
        <EmotionGauge :value="value" />
        <div style="width: 110px; height: 113px">
          <EmotionFaceSticker :emotion="face.emotion" :body="face.body" :shade="face.shade" />
        </div>
      </div>
    </UiCard>

    <UiCard :hover="false">
      <h3 class="section-title mb-4">Controles</h3>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="outline" size="sm" @click="value = 0.1">Calma</UiButton>
        <UiButton variant="outline" size="sm" @click="value = 0.5">Atención</UiButton>
        <UiButton variant="outline" size="sm" @click="value = 0.9">Intensa</UiButton>
      </div>
      <p class="text-xs text-gray-400 font-mono mt-4 pt-4 border-t border-gray-100">
        :value (0..1) · zonas fijas calma / atención / intensa · presentacional puro
      </p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import EmotionGauge from '~/primitives/EmotionGauge/EmotionGauge.vue'
import EmotionFaceSticker from '~/sprites/EmotionFaceSticker.vue'

const value = ref(0.9)

const face = computed(() => {
  if (value.value < 1 / 3) return { emotion: 'calmado' as const, body: '#6bbf8a', shade: '#4a9068' }
  if (value.value < 2 / 3) return { emotion: 'sorprendido' as const, body: '#f4c542', shade: '#dfa92e' }
  return { emotion: 'enojado' as const, body: '#e63946', shade: '#b82838' }
})
</script>
