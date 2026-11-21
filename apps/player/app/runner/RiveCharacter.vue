<template>
  <canvas ref="canvas" class="tb-ave" aria-hidden="true" :data-loaded="loaded || undefined" />
</template>

<script setup lang="ts">
import type { Rive, ViewModelInstance } from '@rive-app/webgl2'
import { loadRive, loadRiveFile } from './rive'
import { SCENE_HOLD_KEY } from './useSceneLoad'

// Un personaje de la librería en Rive. `values` fija los enums de su View Model (las aves: { ave: 'gallina' }) y
// `flags`, sus booleanos (el niño: { acercar: true }), al cargar y cada vez que cambian; `say(trigger)` dispara un
// trigger (aceptar, negar, volverIdle).
// Mientras carga retiene su escena (useSceneLoad): la escena se muestra cuando el personaje ya pintó su primer cuadro,
// no antes con su hueco vacío. `data-loaded` avisa al CSS de que ya se ve (la entrada del ave al destapar).
const props = defineProps<{
  src: string
  values?: Record<string, string>
  flags?: Record<string, boolean>
  /** La escena está en pausa o no es la que se ve: el personaje se queda quieto y no gasta cuadros. */
  paused?: boolean
  /**
   * Cuánto tarda, en ms, en quedar en la pose que piden sus valores (un personaje que entra ya mostrando algo, con la
   * vista cerca, llega a ella con su propia transición). Mientras tanto retiene su escena y no se ve: aparece ya en su
   * pose, no a medio camino.
   */
  settle?: number
  /**
   * Cuánto espera, en ms, para empezar a moverse, ya pintado y quieto en su primer cuadro: varios personajes que se
   * montan a la vez (las aves de las fotos de la Despedida) no se mueven al unísono. Cuenta desde que la escena se ve.
   */
  delay?: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const loaded = ref(false)
const hold = inject(SCENE_HOLD_KEY, null)
let player: Rive | null = null
// El personaje ya abrió su archivo. Entre que se crea y que lo abre no tiene todavía qué pintar ni qué reproducir, y
// el runtime falla si se le pregunta: lo que llegue en ese rato (el marco pide ajustar el lienzo un cuadro después de
// montar la escena) se deja pasar, porque al abrirlo se ajusta solo.
let opened = false
let vm: ViewModelInstance | null = null
const queue: string[] = []
let disposed = false
// El lienzo se mide solo: una escena se monta oculta y por adelantado, y su personaje tiene entonces otro tamaño. Cada
// vez que cambia el que ocupa, se vuelve a ajustar la superficie donde se pinta, para que no se vea pixelado.
let sizes: ResizeObserver | null = null
let settling: ReturnType<typeof setTimeout> | undefined
// La espera para empezar a moverse (`delay`): pendiente hasta que la escena se ve, y en curso mientras corre.
let pendingDelay = props.delay ?? 0
let waiting: ReturnType<typeof setTimeout> | undefined
function startAfterDelay() {
  if (!player) return
  if (!pendingDelay) { player.play(); return }
  player.pause()
  const ms = pendingDelay
  pendingDelay = 0
  waiting = setTimeout(() => {
    waiting = undefined
    if (!disposed && !props.paused) player?.play()
  }, ms)
}

function say(trigger: string) {
  if (!vm || !player) {
    queue.push(trigger)
    return
  }
  if (!player.isPlaying) player.play()
  vm.trigger(trigger)?.trigger()
}

function fit() {
  if (!player || !opened) return
  player.resizeDrawingSurfaceToCanvas()
  // En pausa nadie lo vuelve a pintar: se pinta aquí, a su tamaño nuevo.
  if (!player.isPlaying) player.drawFrame()
}

/** Pone en el View Model los valores que pide la escena. */
function apply() {
  if (!vm) return
  for (const [name, value] of Object.entries(props.values ?? {})) {
    const prop = vm.enum(name)
    if (prop && prop.value !== value) prop.value = value
  }
  for (const [name, value] of Object.entries(props.flags ?? {})) {
    const prop = vm.boolean(name)
    if (prop && prop.value !== value) prop.value = value
  }
}
// La escena cambia lo que muestra el personaje (el niño pasa a señalarse los ojos): se le dice en cuanto cambia.
watch(() => [props.values, props.flags], apply, { deep: true })

// En pausa no se anima; al volver, sigue donde estaba.
watch(() => props.paused, (paused) => {
  if (!player || !loaded.value) return
  if (paused) player.pause()
  else if (!waiting) startAfterDelay()
})

onMounted(async () => {
  const release = canvas.value ? hold?.(canvas.value) : undefined
  try {
    const [rive, buffer] = await Promise.all([loadRive(), loadRiveFile(props.src)])
    if (disposed || !canvas.value) {
      release?.()
      return
    }
    player = new rive.Rive({
      buffer,
      canvas: canvas.value,
      artboard: 'MainArtboard',
      stateMachines: 'MainStateMachine',
      autoBind: true,
      autoplay: true,
      layout: new rive.Layout({ fit: rive.Fit.Contain, alignment: rive.Alignment.Center }),
      onLoad: () => {
        opened = true
        fit()
        if (canvas.value) {
          sizes = new ResizeObserver(fit)
          sizes.observe(canvas.value)
        }
        vm = player?.viewModelInstance ?? null
        apply()
        queue.splice(0).forEach(say)
        // Dos cuadros después ya está pintado: entonces se da por cargado y, si la escena no se ve, se queda quieto.
        // Si necesita un momento para llegar a su pose (`settle`), se espera a que llegue.
        const ready = () => {
          if (disposed) return
          loaded.value = true
          if (props.paused) player?.pause()
          else startAfterDelay()
          release?.()
        }
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (props.settle) settling = setTimeout(ready, props.settle)
          else ready()
        }))
      },
      onLoadError: () => release?.(),
    })
  }
  catch (error) {
    console.warn('Rive no disponible', error)
    release?.()
  }
})

onBeforeUnmount(() => {
  disposed = true
  opened = false
  clearTimeout(settling)
  clearTimeout(waiting)
  sizes?.disconnect()
  sizes = null
  player?.cleanup()
  player = null
  vm = null
})

defineExpose({ say, fit })
</script>
