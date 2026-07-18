<template>
  <!-- Animated exercise demo: the kid sprite TWEENS through the frames of a
       movement (march L→R, knee up, jump…) at the exercise tempo — smooth
       60fps interpolation between poses, not discrete swaps. `playing` is
       CONTROLLED by the scene: while an exercise runs the guide demos it;
       stopped, it holds the first frame (static — regla 13: the demo animates
       only while the exercise is active, never as an idle effect). -->
  <div class="pose-guide" :style="{ width: `${size}px`, height: `${size * 1.35}px` }">
    <KidPoseSticker :def="def" :variant="variant" :age="age" :shirt="shirt" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import { KID_POSES_BY_AGE, mirrorPoseDef, type KidAge, type KidPoseDef, type KidVariant } from '~/sprites/kid-poses'
import { usePoseGuide } from './usePoseGuide'
import type { PoseFrame } from './PoseGuide.types'

interface Props {
  frames: PoseFrame[]
  /** ms per frame (demo tempo). Slow for calm moves, fast for dynamic ones. */
  interval?: number
  /** While true the demo cycles; while false it freezes on the first frame */
  playing?: boolean
  /** Rendered width in px (height keeps the sprite aspect) */
  size?: number
  /** Who demos the exercise: 'boy' | 'girl' */
  variant?: KidVariant
  /** Proporción del personaje: 'kid' infantil (default) | 'teen' mayor */
  age?: KidAge
  /** Shirt color of the kid (identity tint of the exercise) */
  shirt?: string
}

const props = withDefaults(defineProps<Props>(), {
  interval: 450,
  playing: false,
  size: 190,
  variant: 'boy',
  age: 'kid',
  shirt: '#3aa8e0',
})

const emit = defineEmits<{
  /** A demo frame advanced (scenes can sync sounds to the demo) */
  step: [index: number]
}>()

// Poses horneadas: se resuelve el rig por edad y se cuecen los espejos en la
// geometría (mirrorPoseDef cruza los pares L/R) para que el tween entre un
// cuadro y su espejo sea continuo y correcto.
const bakedDefs = computed<KidPoseDef[]>(() => props.frames.map((f) => {
  const d = KID_POSES_BY_AGE[props.age][f.pose]
  return f.mirror ? mirrorPoseDef(d) : d
}))

const { def, play, reset, pause } = usePoseGuide({
  defs: () => bakedDefs.value,
  interval: () => props.interval,
  onStep: i => emit('step', i),
})

watch(() => props.playing, (on) => { on ? play() : reset() }, { immediate: true })

defineExpose({ play, pause, reset })
</script>

<style scoped>
.pose-guide {
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
</style>
