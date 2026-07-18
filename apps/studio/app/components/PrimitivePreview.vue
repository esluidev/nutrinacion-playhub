<template>
  <!-- Vista previa VIVA de una primitiva para el catálogo: la primitiva real,
       en miniatura, sobre el canvas StoryPlay y sin interacción (pointer-events
       none). El admin ve QUÉ es antes de abrir el playground. -->
  <div class="pp">
    <div v-if="slug === 'wheel'" class="pp-item">
      <Wheel :size="132" />
    </div>
    <div v-else-if="slug === 'progress-ring'" class="pp-item">
      <ProgressRing :initial="0.66" :size="96" />
    </div>
    <div v-else-if="slug === 'progress-halo'" class="pp-item">
      <ProgressHalo :progress="0.66" color="blue">
        <span class="pp-halo-art"><WaterDropSticker /></span>
      </ProgressHalo>
    </div>
    <div v-else-if="slug === 'progress-bar'" class="pp-item w-44">
      <ProgressBar :initial="0.62" />
    </div>
    <div v-else-if="slug === 'dice'" class="pp-item">
      <Dice :size="92" color="red" />
    </div>
    <div v-else-if="slug === 'score-counter'" class="pp-item">
      <ScoreCounter :initial="120" />
    </div>
    <div v-else-if="slug === 'glass'" class="pp-item pp-s60">
      <Glass :level="0.6" />
    </div>
    <!-- Estufa COMPUESTA (primitiva + sprites): encendida, olla con tapa
         saltando y vapor — así se ve el patrón de composición en acción -->
    <div v-else-if="slug === 'stove'" class="pp-item pp-s60" style="padding-top: 56px">
      <div class="pp-boiling">
        <Particles kind="steam" class="pp-steam" />
        <Stove ref="stoveRef" :duration="99999999" silent>
          <div style="width: 118px; height: 80px">
            <PotSticker lid lid-bouncing />
          </div>
        </Stove>
      </div>
    </div>
    <div v-else-if="slug === 'tap-action'" class="pp-item">
      <TapAction :taps="3">
        <div style="width: 58px; height: 74px">
          <EggSticker body="#f0c08e" outline="#80522a" />
        </div>
      </TapAction>
    </div>
    <div v-else-if="slug === 'particles'" class="pp-item">
      <Particles kind="steam" />
    </div>
    <div v-else-if="slug === 'stir'" class="pp-item pp-s70">
      <Stir />
    </div>
    <div v-else-if="slug === 'step-meter'" class="pp-item w-44">
      <StepMeter :steps="5" :initial="3" color="blue" />
    </div>
    <div v-else-if="slug === 'pose-guide'" class="pp-item">
      <PoseGuide :frames="[{ pose: 'knee-up' }]" :size="82" />
    </div>
    <div v-else-if="slug === 'breath-guide'" class="pp-item pp-s60">
      <BreathGuide label-in="Inhala" label-out="Exhala" :size="120" />
    </div>
    <div v-else-if="slug === 'exercise-timer'" class="pp-item">
      <ExerciseTimer :duration="15" :size="96" color="red" />
    </div>
    <div v-else-if="slug === 'stop-light'" class="pp-item">
      <StopLight state="green" :size="72" />
    </div>
    <div v-else-if="slug === 'draggable'" class="pp-item">
      <Draggable data="preview" label="Frijol" color="red">
        <span class="pp-mini-sprite"><BeanSticker body="#e63946" outline="#b82838" /></span>
      </Draggable>
    </div>
    <div v-else-if="slug === 'drop-zone'" class="pp-item pp-s70">
      <DropZone title="Hervido" color="blue">
        <template #icon>
          <span class="pp-zone-icon"><PotSticker /></span>
        </template>
      </DropZone>
    </div>
    <div v-else-if="slug === 'reorder-list'" class="pp-item pp-s60">
      <ReorderList :items="[
        { id: '1', label: 'Escoger', sprite: BeanSticker, spriteProps: { body: '#e63946', outline: '#b82838' } },
        { id: '2', label: 'Remojar', sprite: BowlSticker },
        { id: '3', label: 'Cocinar', sprite: PotSticker, spriteProps: { lid: true } },
      ]" />
    </div>
    <div v-else-if="slug === 'tap-field'" class="pp-item pp-s45">
      <TapField :columns="2" :targets="[
        { id: '1', sprite: BeanSticker, spriteProps: { body: '#e63946', outline: '#b82838' }, correct: true, color: 'red' },
        { id: '2', sprite: PotSticker, correct: false, color: 'blue' },
        { id: '3', sprite: EggSticker, spriteProps: { body: '#f0c08e', outline: '#80522a' }, correct: true, color: 'yellow' },
        { id: '4', sprite: BowlSticker, correct: false, color: 'green' },
      ]" />
    </div>
    <div v-else-if="slug === 'scale'" class="pp-item pp-s60">
      <Scale />
    </div>
    <div v-else-if="slug === 'ruler'" class="pp-item pp-s45">
      <Ruler />
    </div>
    <div v-else-if="slug === 'thermometer'" class="pp-item pp-s45">
      <Thermometer />
    </div>
    <!-- Sin preview liviano (flujos con datos requeridos): icono grande -->
    <div v-else class="pp-item">
      <div class="w-16 h-16 rounded-2xl bg-white/70 ring-1 ring-gray-200 flex items-center justify-center">
        <PrimitiveIcon :name="slug" class="w-8 h-8 text-gray-400" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BreathGuide from '~/primitives/BreathGuide/BreathGuide.vue'
import Dice from '~/primitives/Dice/Dice.vue'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import DropZone from '~/primitives/DropZone/DropZone.vue'
import ExerciseTimer from '~/primitives/ExerciseTimer/ExerciseTimer.vue'
import StopLight from '~/primitives/StopLight/StopLight.vue'
import Glass from '~/primitives/Glass/Glass.vue'
import Particles from '~/primitives/Particles/Particles.vue'
import PoseGuide from '~/primitives/PoseGuide/PoseGuide.vue'
import ProgressBar from '~/primitives/ProgressBar/ProgressBar.vue'
import ProgressHalo from '~/primitives/ProgressHalo/ProgressHalo.vue'
import ProgressRing from '~/primitives/ProgressRing/ProgressRing.vue'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
import ReorderList from '~/primitives/ReorderList/ReorderList.vue'
import Ruler from '~/primitives/Ruler/Ruler.vue'
import Scale from '~/primitives/Scale/Scale.vue'
import ScoreCounter from '~/primitives/ScoreCounter/ScoreCounter.vue'
import StepMeter from '~/primitives/StepMeter/StepMeter.vue'
import Stir from '~/primitives/Stir/Stir.vue'
import Stove from '~/primitives/Stove/Stove.vue'
import TapAction from '~/primitives/TapAction/TapAction.vue'
import TapField from '~/primitives/TapField/TapField.vue'
import Wheel from '~/primitives/Wheel/Wheel.vue'
import BeanSticker from '~/sprites/BeanSticker.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'
import EggSticker from '~/sprites/EggSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'

const props = defineProps<{
  slug: string
}>()

// La estufa del catálogo se muestra TRABAJANDO (composición primitiva+sprite):
// se enciende sola al montar, con cocción "infinita" para que no se apague
const stoveRef = ref<InstanceType<typeof Stove> | null>(null)

onMounted(() => {
  if (props.slug === 'stove') stoveRef.value?.ignite()
})
</script>

<style scoped>
.pp {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.pp-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pp-s70 { transform: scale(0.7); }
.pp-s60 { transform: scale(0.6); }
.pp-s45 { transform: scale(0.45); }

.pp-mini-sprite {
  display: block;
  width: 48px;
  height: 48px;
}

.pp-zone-icon {
  display: block;
  width: 30px;
  height: 22px;
}

/* Olla hirviendo compuesta: vapor flotando sobre la tapa */
.pp-boiling {
  position: relative;
}

.pp-steam {
  position: absolute;
  bottom: 118px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}
.pp-halo-art {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
}

.pp-halo-art :deep(svg) {
  width: 38px;
  height: 44px;
}
</style>
