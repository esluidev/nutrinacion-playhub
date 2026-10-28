<template>
  <canvas ref="canvas" class="tb-ave" aria-hidden="true" />
</template>

<script setup lang="ts">
import type { Rive, ViewModelInstance } from '@rive-app/webgl2'
import { loadRive, loadRiveFile } from './rive'

// Un personaje de la librería en Rive. `values` fija los enums de su View Model (las aves:
// { ave: 'gallina' }); `say(trigger)` dispara un trigger (aceptar, negar, volverIdle).
const props = defineProps<{
  src: string
  values?: Record<string, string>
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let player: Rive | null = null
let vm: ViewModelInstance | null = null
const queue: string[] = []
let disposed = false

function say(trigger: string) {
  if (!vm || !player) {
    queue.push(trigger)
    return
  }
  if (!player.isPlaying) player.play()
  vm.trigger(trigger)?.trigger()
}

function fit() {
  player?.resizeDrawingSurfaceToCanvas()
}

onMounted(async () => {
  try {
    const [rive, buffer] = await Promise.all([loadRive(), loadRiveFile(props.src)])
    if (disposed || !canvas.value) return
    player = new rive.Rive({
      buffer,
      canvas: canvas.value,
      artboard: 'MainArtboard',
      stateMachines: 'MainStateMachine',
      autoBind: true,
      autoplay: true,
      layout: new rive.Layout({ fit: rive.Fit.Contain, alignment: rive.Alignment.Center }),
      onLoad: () => {
        fit()
        vm = player?.viewModelInstance ?? null
        for (const [name, value] of Object.entries(props.values ?? {})) {
          const prop = vm?.enum(name)
          if (prop) prop.value = value
        }
        queue.splice(0).forEach(say)
      },
    })
  }
  catch (error) {
    console.warn('Rive no disponible', error)
  }
})

onBeforeUnmount(() => {
  disposed = true
  player?.cleanup()
  player = null
  vm = null
})

defineExpose({ say, fit })
</script>
