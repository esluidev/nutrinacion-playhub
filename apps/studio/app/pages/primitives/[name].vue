<template>
  <div v-if="entry">
    <!-- Header -->
    <div class="mb-6 flex items-start gap-4">
      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shrink-0', categoryStyle.iconBg]">
        <PrimitiveIcon :name="entry.slug" :class="['w-6 h-6', categoryStyle.iconText]" />
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-3 mb-1 flex-wrap">
          <h2 class="text-2xl font-display font-bold text-brand-dark">{{ entry.label }}</h2>
          <UiBadge variant="gray">{{ categoryLabel }}</UiBadge>
          <UiBadge :variant="entry.status === 'portada' ? 'green' : 'gray'" dot>
            {{ entry.status === 'portada' ? 'Portada' : 'Pendiente' }}
          </UiBadge>
        </div>
        <p class="text-xs text-gray-400 font-mono mb-2">app/primitives/{{ entry.name }}/ · {{ entry.cssClass }}</p>
        <p class="text-sm text-gray-500 max-w-2xl">{{ entry.description }}</p>
      </div>
    </div>

    <!-- Playground -->
    <component :is="demoComponent" v-if="demoComponent" />

    <!-- Pending state -->
    <UiCard v-else class="text-center py-12" :hover="false">
      <p class="text-gray-500 font-semibold mb-1">Esta primitiva aun no fue portada</p>
      <p class="text-sm text-gray-400">Se portara desde el design system de referencia en una proxima tarea.</p>
    </UiCard>
  </div>

  <!-- Not found -->
  <UiCard v-else class="text-center py-12">
    <p class="text-gray-500 font-semibold mb-1">Primitiva no encontrada</p>
    <UiButton variant="outline" size="sm" @click="navigateTo('/primitives')">Volver a Primitivas</UiButton>
  </UiCard>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { PRIMITIVE_CATEGORY_LABELS, PRIMITIVE_CATEGORY_STYLES } from '~/composables/usePrimitivesCatalog'
import DemoProgressBar from '~/components/demos/DemoProgressBar.vue'
import DemoScoreCounter from '~/components/demos/DemoScoreCounter.vue'
import DemoWheel from '~/components/demos/DemoWheel.vue'
import DemoProgressHalo from '~/components/demos/DemoProgressHalo.vue'
import DemoProgressRing from '~/components/demos/DemoProgressRing.vue'
import DemoDice from '~/components/demos/DemoDice.vue'
import DemoStepMeter from '~/components/demos/DemoStepMeter.vue'
import DemoDragDrop from '~/components/demos/DemoDragDrop.vue'
import DemoReorderList from '~/components/demos/DemoReorderList.vue'
import DemoTapField from '~/components/demos/DemoTapField.vue'
import DemoScale from '~/components/demos/DemoScale.vue'
import DemoRuler from '~/components/demos/DemoRuler.vue'
import DemoThermometer from '~/components/demos/DemoThermometer.vue'
import DemoGlucometer from '~/components/demos/DemoGlucometer.vue'
import DemoPoseGuide from '~/components/demos/DemoPoseGuide.vue'
import DemoStopLight from '~/components/demos/DemoStopLight.vue'
import DemoExerciseTimer from '~/components/demos/DemoExerciseTimer.vue'
import DemoBreathGuide from '~/components/demos/DemoBreathGuide.vue'
import DemoStove from '~/components/demos/DemoStove.vue'
import DemoGlass from '~/components/demos/DemoGlass.vue'
import DemoTapAction from '~/components/demos/DemoTapAction.vue'
import DemoHoldAction from '~/components/demos/DemoHoldAction.vue'
import DemoEmotionGauge from '~/components/demos/DemoEmotionGauge.vue'
import DemoParticles from '~/components/demos/DemoParticles.vue'
import DemoStir from '~/components/demos/DemoStir.vue'

const route = useRoute()
const { getPrimitive } = usePrimitivesCatalog()

const entry = computed(() => getPrimitive(String(route.params.name)))

// Draggable and DropZone share one playground: they only work as a system
const DEMOS: Record<string, Component> = {
  'progress-bar': DemoProgressBar,
  'score-counter': DemoScoreCounter,
  'wheel': DemoWheel,
  'progress-ring': DemoProgressRing,
  'progress-halo': DemoProgressHalo,
  'dice': DemoDice,
  'step-meter': DemoStepMeter,
  'draggable': DemoDragDrop,
  'drop-zone': DemoDragDrop,
  'reorder-list': DemoReorderList,
  'tap-field': DemoTapField,
  'scale': DemoScale,
  'ruler': DemoRuler,
  'thermometer': DemoThermometer,
  'glucometer': DemoGlucometer,
  'pose-guide': DemoPoseGuide,
  'stop-light': DemoStopLight,
  'exercise-timer': DemoExerciseTimer,
  'breath-guide': DemoBreathGuide,
  'stove': DemoStove,
  'glass': DemoGlass,
  'tap-action': DemoTapAction,
  'hold-action': DemoHoldAction,
  'emotion-gauge': DemoEmotionGauge,
  'particles': DemoParticles,
  'stir': DemoStir,
}

const demoComponent = computed(() =>
  entry.value && entry.value.status === 'portada' ? DEMOS[entry.value.slug] : undefined)

const categoryStyle = computed(() =>
  entry.value ? PRIMITIVE_CATEGORY_STYLES[entry.value.category] : PRIMITIVE_CATEGORY_STYLES.interactions)

const categoryLabel = computed(() =>
  entry.value ? PRIMITIVE_CATEGORY_LABELS[entry.value.category] : '')
</script>
