<template>
  <!-- El runner de Player dentro de la app (decisión 004, docs/runner.md). La app pone la URL
       (qué cargar) y la guía; el runner cuenta lo que pasa. Mientras no dice «listo», lo tapa una
       carga; si no responde a tiempo, un error con «Reintentar» y la salida que ponga la app
       (slot `failed`). -->
  <div class="ui-runner" :data-state="state">
    <iframe
      :key="attempt"
      ref="frame"
      class="ui-runner-frame"
      :src="src"
      :title="title ?? labels.runner"
      allow="autoplay; fullscreen; screen-wake-lock"
    />
    <div v-if="state !== 'ready'" class="ui-runner-cover">
      <UiSpinner v-if="state === 'loading'" />
      <UiEmptyState v-else icon="warning" tone="coral" :title="labels.runnerFailed" :text="labels.runnerFailedText">
        <div class="flex flex-wrap justify-center gap-3">
          <UiButton icon="retry" @click="retry">{{ labels.retry }}</UiButton>
          <!-- La salida la pone la app (a dónde volver es cosa suya). -->
          <slot name="failed" />
        </div>
      </UiEmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseRunnerEvent, runnerMessage } from '../../utils/runner-contract'
import type { RunnerCommand, RunnerEvent, StoryboardGuide } from '../../utils/runner-contract'

type Of<T extends RunnerEvent['tipo']> = Extract<RunnerEvent, { tipo: T }>

const props = withDefaults(defineProps<{
  /** URL del runner (runnerUrl). Su origen es el único que se escucha. */
  src: string
  /** Guía del educador por carpeta de escena; solo la usa el modo educador. */
  guide?: StoryboardGuide | null
  title?: string
  /** Milisegundos para que el runner diga «listo» antes de mostrar el error. */
  timeout?: number
}>(), {
  guide: null,
  timeout: 20_000,
})

const emit = defineEmits<{
  ready: [event: Of<'listo'>]
  scene: [event: Of<'escena'>]
  finish: []
  exit: [event: Of<'salir'>]
  error: [event: Of<'error'> | { tipo: 'error', codigo: 'sin-respuesta' }]
}>()

const labels = useUiLabels()
const frame = ref<HTMLIFrameElement | null>(null)
const state = ref<'loading' | 'ready' | 'failed'>('loading')
const attempt = ref(0)
const origin = computed(() => new URL(props.src, window.location.href).origin)

let timer: ReturnType<typeof setTimeout> | undefined
function wait() {
  clearTimeout(timer)
  state.value = 'loading'
  timer = setTimeout(() => {
    state.value = 'failed'
    emit('error', { tipo: 'error', codigo: 'sin-respuesta' })
  }, props.timeout)
}

function retry() {
  attempt.value += 1
  wait()
}

function send(command: RunnerCommand) {
  frame.value?.contentWindow?.postMessage(runnerMessage(command), origin.value)
}

// La guía viaja como datos planos: postMessage no clona los proxies reactivos.
function start() {
  const guia = props.guide ? JSON.parse(JSON.stringify(props.guide)) as StoryboardGuide : undefined
  send({ tipo: 'iniciar', guia })
}

// En la vista previa (`preview`) conduce la app: a qué escena ir y reiniciar la actual.
defineExpose({
  ir: (escena: number | string) => send(typeof escena === 'number' ? { tipo: 'ir', indice: escena } : { tipo: 'ir', escena }),
  reiniciar: () => send({ tipo: 'reiniciar' }),
})

function onMessage(message: MessageEvent) {
  if (message.origin !== origin.value || !frame.value || message.source !== frame.value.contentWindow) return
  const event = parseRunnerEvent(message.data)
  if (!event) return
  switch (event.tipo) {
    case 'listo':
      clearTimeout(timer)
      state.value = 'ready'
      start()
      emit('ready', event)
      break
    case 'escena':
      emit('scene', event)
      break
    case 'terminado':
      emit('finish')
      break
    case 'salir':
      emit('exit', event)
      break
    case 'error':
      clearTimeout(timer)
      state.value = 'failed'
      emit('error', event)
      break
  }
}

watch(() => props.guide, () => { if (state.value === 'ready') start() }, { deep: true })
watch(() => props.src, retry)

onMounted(() => {
  window.addEventListener('message', onMessage)
  wait()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  clearTimeout(timer)
})
</script>
