<template>
  <!-- El taller (PLAYER-DESIGN.md). Una escena = plantilla + contenido. El modo cambia el marco,
       nunca la escena:
       - educator: la pantalla del taller. Conduce, pausa, reinicia, abre la guía y ve quién está
         conectado; puede pausar, reiniciar o quitar un dispositivo.
       - device: el dispositivo de un participante. No navega: la sesión le manda escena, pausa y
         reinicios; la actividad y su feedback se quedan ahí.
       - home: uso autónomo en casa; la persona avanza.
       - preview: solo el escenario (consigna, juego y su hoja de feedback), para mirar un storyboard
         desde Admin: sin consola ni sesión. Conduce la app que lo incrusta (`ir` y `reiniciar`,
         docs/runner.md). Sin bandas: la escena ocupa todo el alto y la hoja de feedback sube sobre ella
         (runner.css, useFrameFit).
       La consola flota sobre el escenario, un elemento por esquina, todos del alto de un control y sin
       puntos ni tiempo:
       - Arriba a la izquierda, el avance del taller (en el educador, un desplegable con las escenas). En un
         dispositivo, el participante.
       - Arriba a la derecha, Ajustes · Reiniciar · Salir en un solo bloque (en casa, sin Ajustes). Ajustes
         abre su riel: pausa, sonido, pantalla completa (donde se puede) y dispositivos.
       - Abajo, en un pie sin fondo (solo la hoja del feedback le da fondo): Guía (educador) y Siguiente, que lleva el icono de reproducir (Terminar,
         el check). Anterior queda en las teclas (← y Re Pág) y en la lista. La hoja de feedback sube
         sobre el pie, siempre con escuchar y cerrar: nunca lleva Siguiente.
       La sesión se simula entre pestañas del mismo navegador (BroadcastChannel). Del dispositivo solo
       vuelve su presencia, nunca respuestas, intentos ni si terminó. -->
  <main
    ref="frame"
    class="player-frame"
    data-density="touch"
    :data-mode="mode"
    :data-feedback="feedbackType"
    :data-compact="compact || undefined"
    :aria-label="txt('workshop')"
  >
    <header v-if="mode !== 'preview'" class="player-bar" :aria-label="txt('workshopBar')" :inert="Boolean(overlay)">
      <div class="bar-start">
        <template v-if="mode === 'device'">
          <!-- El icono del participante es su única identidad; no sobrevive a la sesión. -->
          <div class="hud-piece participant">
            <span class="ui-symbol" :data-tone="me?.tono"><UiIcon name="user" /></span>
            <span class="participant-name">{{ me?.nombre }}</span>
          </div>
          <span v-if="activeState.ready" class="badge ready-badge" data-tone="lime"><UiIcon name="check" />{{ txt('ready') }}</span>
        </template>
        <template v-else>
          <!-- Dónde va el taller: la barra de avance del kit, del alto de un botón. En el educador es un
               desplegable (su chevron lo dice) que lista las escenas. Al completar un juego, la pieza da un
               pequeño salto mientras la barra crece. -->
          <button
            v-if="mode === 'educator'"
            ref="sceneCard"
            type="button"
            class="hud-piece scene-card scenes-button"
            aria-haspopup="listbox"
            :aria-expanded="scenesOpen"
            :aria-label="txt('sceneProgress', { n: current + 1, total: scenes.length, percent })"
            :title="sceneCaption()"
            @click="setScenes(!scenesOpen)"
          >
            <UiIcon name="clapperboard" class="scene-card-icon" data-tone="sky" aria-hidden="true" />
            <UiProgress class="scene-card-bar" :value="percent" tone="lime" :label="txt('workshopProgress')" />
            <UiIcon name="chevron-down" class="scene-card-chevron" aria-hidden="true" />
          </button>
          <div v-else ref="sceneCard" class="hud-piece scene-card" :title="sceneCaption()">
            <UiIcon name="clapperboard" class="scene-card-icon" data-tone="sky" aria-hidden="true" />
            <UiProgress
              class="scene-card-bar"
              :value="percent"
              tone="lime"
              :label="txt('sceneProgress', { n: current + 1, total: scenes.length, percent })"
            />
          </div>
        </template>
      </div>
      <div class="bar-end">
        <!-- Lo del taller en un solo bloque: Ajustes (educador), Reiniciar la escena y Salir (su icono en coral). -->
        <div v-if="mode !== 'device'" class="hud-group hud-tools" role="group" :aria-label="txt('tools')">
          <UiButton
            v-if="mode === 'educator'"
            tone="neutral"
            :icon="railOpen ? 'close' : 'settings'"
            icon-only
            class="settings-button"
            :aria-expanded="railOpen"
            :label="railOpen ? txt('closeSettings') : txt('settings')"
            :title="txt('settings')"
            @click="setRail(!railOpen)"
          />
          <UiButton tone="neutral" icon="retry" icon-only :label="txt('restartScene')" :title="txt('restartScene')" @click="askRestart" />
          <UiButton tone="neutral" icon="exit" icon-only class="exit-button" :label="txt('exit')" :title="txt('exit')" @click="askExit" />
        </div>
      </div>
    </header>

    <!-- El escenario y sus piezas toman el tono del área del storyboard (runner.css). -->
    <div ref="stage" class="player-stage" tabindex="-1" :data-area="storyboard.category" :inert="Boolean(overlay)">
      <!-- La consigna: qué hacer en esta escena, fija. Se aparta mientras un panel la cubre. -->
      <div v-show="!guideOpen && !devicesOpen" class="consigna" :data-empty="!consigna">
        <button type="button" class="mini-action" data-tone="sky" :aria-label="txt('listenInstruction')" :title="txt('listen')" @click="listen(consigna)">
          <UiIcon name="sound" />
        </button>
        <p class="consigna-text" aria-live="polite">{{ consigna }}</p>
      </div>

      <template v-for="(scene, i) in scenes" :key="`${scene.folder}-${states[i]!.generation}`">
        <template v-if="states[i]!.visited">
          <!-- Toda escena, también la Bienvenida (Anuncio), se compone en el tablero de 1280 × 600. -->
          <section v-show="i === current" class="tb-scene" :aria-label="scene.title" :data-sin-consigna="!showsConsigna(scene) || undefined">
            <div class="tb-board" :data-template="scene.json.template ?? 'propia'" :data-blocked="i !== current || blocked || undefined">
              <component
                :is="sceneComponent(scene)"
                :ref="(el: any) => setInstance(i, el)"
                v-bind="templateProps(scene, i)"
                @feedback="(p: FeedbackPayload) => onFeedback(i, p)"
                @progress="(v: number) => onProgress(i, v)"
                @complete="onComplete(i)"
              />
            </div>
          </section>
        </template>
      </template>

      <!-- Chispas al completar un juego: salen del centro del tablero y caen. Sin texto. -->
      <div v-if="burst" :key="burst" class="spark-burst" aria-hidden="true">
        <span v-for="n in SPARKS" :key="n" class="spark" :data-tone="SPARK_TONES[n % SPARK_TONES.length]" :style="sparkStyle(n)" />
      </div>

      <RunnerGuide
        v-if="guideOpen"
        :scene="active"
        :total="scenes.length"
        :category="storyboard.category"
        :guide="guide?.[active.folder] ?? null"
        :locale="locale"
        @close="setGuide(false)"
      />

      <!-- Las escenas (educador): el menú del kit bajo el avance. Arriba, la cabecera de tarjeta con el
           taller (su nombre en hasta dos líneas). Debajo, una fila por escena que lleva a ella; su insignia
           dice cómo va: hecha (check en lima), la actual (su número en sol, lleno) o pendiente (su número,
           neutro). -->
      <div v-if="scenesOpen" class="ui-listbox scene-list" role="listbox" data-tone="sun" :aria-label="txt('workshopProgress')">
        <div class="ui-panel-header scene-list-head">
          <p class="panel-label">{{ txt('workshop') }}</p>
          <p class="scene-list-title" :title="text(storyboard.json.title)">{{ text(storyboard.json.title) }}</p>
        </div>
        <div class="scene-list-rows">
          <button
            v-for="(scene, i) in scenes"
            :key="scene.folder"
            type="button"
            role="option"
            class="ui-option scene-option"
            :data-state="sceneState(i)"
            :aria-selected="i === current"
            :aria-label="txt('announceScene', { n: i + 1, name: scene.title })"
            :title="scene.title"
            @click="jumpTo(i)"
          >
            <span class="scene-option-label">
              <span class="ui-symbol ui-symbol-sm scene-option-num" :data-tone="SCENE_TONES[sceneState(i)]" aria-hidden="true">
                <UiIcon v-if="sceneState(i) === 'done'" name="check" />
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="scene-option-name">{{ scene.title }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Riel de ajustes (educador): cuelga del engranaje. La pausa, el sonido, la pantalla y los dispositivos. -->
      <div v-if="railOpen" class="quick-rail" role="toolbar" aria-orientation="vertical" :aria-label="txt('settings')">
        <UiButton tone="neutral" icon="pause" icon-only :label="txt('pause')" :title="txt('pauseKey')" @click="fromRail(() => setPause('manual', true))" />
        <UiButton
          tone="neutral"
          :icon="muted ? 'muted' : 'sound'"
          icon-only
          :aria-pressed="muted"
          :label="muted ? txt('unmute') : txt('mute')"
          :title="muted ? txt('unmute') : txt('mute')"
          @click="toggleMute"
        />
        <UiButton
          v-if="canFullscreen"
          tone="neutral"
          :icon="fullscreen ? 'compress' : 'expand'"
          icon-only
          :aria-pressed="fullscreen"
          :label="fullscreen ? txt('exitFullscreen') : txt('fullscreen')"
          :title="fullscreen ? txt('exitFullscreen') : txt('fullscreen')"
          @click="toggleFullscreen"
        />
        <UiButton
          tone="neutral"
          icon="devices"
          icon-only
          class="rail-button-count"
          :aria-expanded="devicesOpen"
          :label="txt('devicesCount', { n: deviceViews.length })"
          :title="txt('devices')"
          @click="setDevices(!devicesOpen)"
        >
          <span v-if="deviceViews.length" class="ui-dot" data-tone="sky">{{ deviceViews.length }}</span>
        </UiButton>
      </div>

      <RunnerDevices
        v-if="devicesOpen"
        :devices="deviceViews"
        :selected="selectedDevice"
        :locale="locale"
        @close="setDevices(false)"
        @select="(id) => selectedDevice = id"
        @pause="pauseDevice"
        @restart="restartDevice"
        @remove="askRemoveDevice"
      />
    </div>

    <footer class="player-footer" :inert="Boolean(overlay)">
      <div v-if="mode === 'educator'" class="footer-start">
        <UiButton tone="sky" icon="book" :aria-expanded="guideOpen" :title="txt('guideKey')" @click="setGuide(!guideOpen)">{{ txt('guide') }}</UiButton>
      </div>
      <!-- La hoja del feedback: sube sobre el pie con el tinte del tono de su tipo. -->
      <span class="feedback-sheet" :data-tone="look.tone" aria-hidden="true" />
      <div class="feedback-slot">
        <!-- El feedback sube sobre el pie, en el tono de su tipo; los controles se apartan hasta cerrarlo. -->
        <div
          ref="feedbackEl"
          class="ui-feedback"
          :data-tone="look.tone"
          :data-visible="Boolean(message)"
          role="status"
          aria-live="polite"
        >
          <span class="ui-feedback-symbol" aria-hidden="true"><UiIcon :name="look.icon" /></span>
          <div class="ui-feedback-body">
            <strong>{{ message?.title }}</strong>
            <p v-if="message?.body" class="sheet-text">{{ message.body }}</p>
          </div>
          <div class="feedback-actions">
            <UiButton tone="neutral" icon="sound" icon-only :label="txt('listen')" :title="txt('listen')" @click="listen([message?.title, message?.body].filter(Boolean).join('. '))" />
            <UiButton :tone="look.tone" icon="close" icon-only :label="txt('closeEsc')" :title="txt('closeEsc')" @click="closeFeedback()" />
          </div>
        </div>
      </div>
      <div v-if="leads" class="footer-end">
        <UiButton
          ref="nextButton"
          class="next-button"
          :icon-right="isLast ? 'check' : 'play'"
          :aria-label="isLast ? txt('finishWorkshop') : `${nextLabel}: ${upcoming?.title ?? ''}`"
          :title="txt('nextKey')"
          @click="next"
        >
          {{ nextLabel }}
        </UiButton>
      </div>
    </footer>

    <!-- Ventana sobre todo el marco: la pausa del educador y, en un dispositivo, los estados de la sesión. -->
    <div v-if="overlay" class="scene-overlay">
      <section class="panel-window" :aria-labelledby="`${uid}-overlay`">
        <div class="panel-head">
          <span class="ui-symbol window-symbol" :data-tone="overlay.tone" aria-hidden="true"><UiIcon :name="overlay.icon" /></span>
          <div class="window-titles">
            <p class="panel-caption">{{ overlay.caption }}</p>
            <h2 :id="`${uid}-overlay`" class="ui-heading">{{ overlay.title }}</h2>
          </div>
          <UiButton v-if="overlay.action" tone="neutral" size="sm" icon="close" icon-only :label="txt('continue')" @click="resume" />
        </div>
        <p class="window-text">{{ overlay.text }}</p>
        <div v-if="overlay.action" class="window-actions">
          <UiButton ref="overlayAction" icon="play" @click="resume">{{ txt('continue') }}</UiButton>
        </div>
      </section>
    </div>

    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>

    <RunnerWindow
      v-model:open="confirmOpen"
      :title="confirmation.title"
      :caption="confirmation.caption"
      :text="confirmation.text"
      :symbol="confirmation.symbol"
      :tone="confirmation.tone"
      :stats="confirmation.stats"
      :close-label="txt('cancel')"
      @closed="onConfirmClosed"
    >
      <template #actions>
        <UiButton tone="neutral" @click="confirmOpen = false">{{ txt('cancel') }}</UiButton>
        <UiButton :tone="confirmation.tone" @click="confirmChosen">{{ confirmation.label }}</UiButton>
      </template>
    </RunnerWindow>

    <div ref="probe" class="safe-probe" aria-hidden="true" />
  </main>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { RunnerMode, StoryboardGuide } from '@playhub/ui/app/utils/runner-contract'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import { tr } from '~/types/i18n'
import type { I18nText } from '~/types/i18n'
import { cancelNarration, narrate, NARRATOR_KEY } from './audio/narration'
import { muted, setMuted } from './audio/settings'
import { itemsOf } from './content'
import { useRunnerText } from './i18n'
import { profileOf } from './profiles'
import RunnerDevices from './RunnerDevices.vue'
import type { DeviceView } from './RunnerDevices.vue'
import RunnerGuide from './RunnerGuide.vue'
import RunnerWindow from './RunnerWindow.vue'
import { TEMPLATES } from './templates'
import type { FeedbackPayload, LoadedStoryboard, RunnerScene } from './types'
import { useFrameFit } from './useFrameFit'
import { replay } from './useTimers'

const props = defineProps<{
  storyboard: LoadedStoryboard
  mode: RunnerMode
  locale: string
  /** Carpeta de la escena con la que abre (?escena=). */
  start?: string
  /** La guía por carpeta de escena, que da la app que incrusta el runner (docs/runner.md). */
  guide?: StoryboardGuide | null
  /** Dentro de otra app: terminar y salir se le cuentan a ella en vez de navegar aquí. */
  embedded?: boolean
}>()

const emit = defineEmits<{
  scene: [index: number, folder: string]
  finish: []
  exit: [index: number, folder: string]
}>()

const txt = useRunnerText(() => props.locale)
const text = (value: I18nText | null | undefined) => (value ? tr(value, props.locale) : '')
const uid = useId()
const router = useRouter()

const scenes = props.storyboard.scenes
const profile = profileOf(props.storyboard.json.audience)
const isGame = (scene: RunnerScene) => scene.json.template !== 'anuncio'
// Quien conduce desde la consola: el educador y la persona en casa (la vista previa la conduce su app).
const leads = props.mode === 'educator' || props.mode === 'home'

// ── Estado por escena ──────────────────────────────────────────────────────────
type FeedbackType = 'success' | 'info' | 'retry'
interface Message { type: FeedbackType, title: string, body?: string, sequence: number }
interface SceneState {
  visited: boolean
  generation: number
  fraction: number
  completed: boolean
  ready: boolean
  message: Message | null
}

const states = reactive<SceneState[]>(scenes.map(() => ({
  visited: false, generation: 0, fraction: 0, completed: false, ready: false, message: null,
})))

// Empieza ya en la escena pedida (?escena=), para que el avance y el título no muestren la primera un instante.
const current = ref(props.mode === 'device' ? 0 : Math.max(0, scenes.findIndex(s => s.folder === props.start)))
const active = computed(() => scenes[current.value]!)
const activeState = computed(() => states[current.value]!)
const isLast = computed(() => current.value === scenes.length - 1)
const nextLabel = computed(() => (isLast.value ? txt('finish') : props.mode === 'home' ? txt('continue') : txt('next')))
// La escena que viene, para el nombre accesible de Siguiente.
const upcoming = computed(() => scenes[current.value + 1] ?? null)
const percent = computed(() => Math.round(states.reduce((sum, s) => sum + s.fraction, 0) / scenes.length * 100))

const instances = new Map<number, { fit?: () => void }>()
function setInstance(i: number, el: { fit?: () => void } | null) {
  if (el) instances.set(i, el)
  else instances.delete(i)
}

const customComponents = new Map<string, Component>()
function sceneComponent(scene: RunnerScene): Component {
  if (scene.json.template) return TEMPLATES[scene.json.template]
  let comp = customComponents.get(scene.folder)
  if (!comp && scene.custom) {
    comp = defineAsyncComponent(scene.custom)
    customComponents.set(scene.folder, comp)
  }
  return comp ?? TEMPLATES.anuncio
}

function templateProps(scene: RunnerScene, i: number) {
  return {
    scene: scene.json,
    items: itemsOf(props.storyboard, scene.json.defaults.items),
    profile,
    locale: props.locale,
    blocked: i !== current.value || blocked.value,
    storyboard: props.storyboard,
  }
}

// ── Pausas: una pausa o un panel abierto congelan el tablero; en un dispositivo, también la sesión.
const pauseReasons = reactive(new Set<string>())
const manualPause = computed(() => pauseReasons.has('manual'))
const guideOpen = ref(false)
const scenesOpen = ref(false)
const railOpen = ref(false)
const devicesOpen = ref(false)
const confirmOpen = ref(false)

// Lo que sabe el dispositivo del taller: solo las órdenes de la sesión.
const session = reactive({ open: false, closed: false, removed: false, scene: null as string | null, paused: false, held: false })
const finished = ref(false)

const blocked = computed(() => {
  if (pauseReasons.size) return true
  return props.mode === 'device' && (!session.open || session.paused || session.held)
})

function setPause(reason: string, value: boolean) {
  if (value) pauseReasons.add(reason)
  else pauseReasons.delete(reason)
  if (reason === 'manual') publish()
}

const resume = () => setPause('manual', false)

// La pausa del riel de Ajustes lo cierra primero.
function fromRail(action: () => void) {
  setRail(false)
  action()
}

interface OverlayLook { icon: UiIconName, tone: UiTone, title: string, caption: string, text: string, action?: boolean }
const sceneCaption = () => txt('sceneCaption', { n: current.value + 1, total: scenes.length, name: active.value.title })
const workshopCaption = () => txt('workshopCaption', { title: text(props.storyboard.json.title) })

const overlay = computed<OverlayLook | null>(() => {
  if (finished.value || (props.mode === 'device' && session.closed && !session.removed)) {
    return { icon: 'check', tone: 'lime', title: txt('closedTitle'), caption: workshopCaption(), text: txt('closedText') }
  }
  if (props.mode === 'device') {
    if (session.removed) return { icon: 'devices', tone: 'sky', title: txt('removedTitle'), caption: workshopCaption(), text: txt('removedText') }
    if (!session.open) return { icon: 'devices', tone: 'sky', title: txt('waitingTitle'), caption: workshopCaption(), text: txt('waitingText') }
    if (session.paused || session.held) return { icon: 'pause', tone: 'sky', title: txt('pausedTitle'), caption: sceneCaption(), text: txt('pausedDevice') }
    return null
  }
  if (manualPause.value && !guideOpen.value && !devicesOpen.value && !confirmOpen.value) {
    return { icon: 'pause', tone: 'sky', title: txt('pausedTitle'), caption: sceneCaption(), text: txt('pausedEducator'), action: props.mode === 'educator' }
  }
  return null
})

const overlayAction = ref<{ $el?: HTMLElement } | null>(null)
watch(() => overlay.value?.action, (action) => {
  if (action) nextTick(() => (overlayAction.value?.$el as HTMLElement | undefined)?.focus({ preventScroll: true }))
})

// ── Consigna y feedback ───────────────────────────────────────────────────────
// La consigna se ve sobre el tablero de todo juego que la trae; la Bienvenida no la muestra (es la frase que suena).
const showsConsigna = (scene: RunnerScene) => isGame(scene) && Boolean(text(scene.json.meta.instruction))
const consigna = computed(() => {
  if (props.mode === 'device' && !session.open) return ''
  return showsConsigna(active.value) ? text(active.value.json.meta.instruction) : ''
})

const LOOKS: Record<FeedbackType, { tone: UiTone, icon: UiIconName }> = {
  success: { tone: 'lime', icon: 'check-circle' },
  info: { tone: 'sky', icon: 'info' },
  retry: { tone: 'sun', icon: 'retry' },
}
const typeOf = (kind: FeedbackPayload['kind']): FeedbackType =>
  kind === 'success' || kind === 'complete' ? 'success' : kind === 'retry' ? 'retry' : 'info'

const message = computed(() => (props.mode === 'device' && !session.open ? null : activeState.value.message))
// Al cerrarse, la hoja baja con el tono que tenía.
const lastType = ref<FeedbackType>('success')
watch(() => message.value?.type, (type) => { if (type) lastType.value = type })
const look = computed(() => LOOKS[message.value?.type ?? lastType.value])
const feedbackType = computed(() => message.value?.type ?? 'none')
const feedbackEl = ref<HTMLElement | null>(null)
let sequence = 0

watch(() => message.value?.sequence, (seq) => {
  if (!seq || !message.value) return
  announce([message.value.title, message.value.body].filter(Boolean).join('. '))
  replay(feedbackEl.value, 'is-entering')
})

const nextButton = ref<{ $el?: HTMLElement } | null>(null)
const stage = ref<HTMLElement | null>(null)

function closeFeedback(focus = true) {
  activeState.value.message = null
  if (!focus) return
  const target = leads ? (nextButton.value?.$el as HTMLElement | undefined) : stage.value
  target?.focus({ preventScroll: true })
}

const announcement = ref('')
function announce(value: string) {
  announcement.value = value
}

// ── Eventos de una plantilla. La plantilla nunca sabe el modo: el marco decide qué significan.
function onProgress(i: number, value: number) {
  const state = states[i]!
  state.fraction = state.completed ? 1 : value
}

// Chispas: una ráfaga por juego completado, en los tonos de las piezas y el lima.
const SPARKS = 22
const SPARK_TONES = ['sun', 'coral', 'sky', 'grape', 'rose', 'lime'] as const
const burst = ref(0)
let burstTimer: ReturnType<typeof setTimeout> | undefined
function sparkStyle(n: number) {
  const angle = (n / SPARKS) * Math.PI * 2 + ((n * 37) % 11) / 20
  const reach = 300 + ((n * 53) % 7) * 34
  return {
    '--dx': `${Math.round(Math.cos(angle) * reach * 1.4)}px`,
    '--dy': `${Math.round(Math.sin(angle) * reach * 0.6 + 140)}px`,
    '--r': `${((n * 97) % 360) - 180}deg`,
    '--delay': `${(n % 5) * 30}ms`,
  }
}

const sceneCard = ref<HTMLElement | null>(null)

function onComplete(i: number) {
  const state = states[i]!
  if (!state.completed && i === current.value) {
    burst.value += 1
    clearTimeout(burstTimer)
    burstTimer = setTimeout(() => { burst.value = 0 }, 1600)
    replay(sceneCard.value, 'is-advancing')
  }
  state.completed = true
  state.fraction = 1
  if (props.mode === 'device') state.ready = true // local: nadie se entera
  publish()
}

function onFeedback(i: number, payload: FeedbackPayload) {
  states[i]!.message = { type: typeOf(payload.kind), title: payload.title, body: payload.body, sequence: ++sequence }
}

// ── Navegación (educador y casa). Un dispositivo solo sigue a la sesión.
function goTo(index: number, focus = true) {
  if (index < 0 || index >= scenes.length) return
  cancelNarration()
  current.value = index
  pauseReasons.delete('manual')
  states[index]!.visited = true
  burst.value = 0
  announce(txt('announceScene', { n: index + 1, name: active.value.title }))
  if (props.mode !== 'device') emit('scene', index, active.value.folder)
  nextTick(() => {
    instances.get(index)?.fit?.()
    if (focus && props.mode !== 'device') stage.value?.focus({ preventScroll: true })
  })
  publish()
}

function next() {
  if (!isGame(active.value)) activeState.value.fraction = 1 // el Anuncio se cumple al presentarlo
  if (!isLast.value) {
    goTo(current.value + 1)
    return
  }
  if (props.mode === 'preview') return // en la vista previa no hay taller que terminar
  confirm({
    title: txt('finishTitle'),
    text: props.mode === 'home' ? txt('finishHome') : txt('closesEverywhere'),
    label: txt('finish'),
    symbol: 'check',
    tone: 'lime',
    action: terminar,
  })
}

const previous = () => goTo(current.value - 1)

function restartScene(i: number) {
  Object.assign(states[i]!, { message: null, completed: false, ready: false, fraction: 0 })
  states[i]!.generation += 1
}

// Salir a medias. Dentro de otra app, ella decide a dónde vuelve; el cierre queda debajo por si
// no responde. Abierto directamente, se vuelve atrás.
function leave() {
  post({ tipo: 'cierre' })
  cancelNarration()
  if (props.embedded) {
    emit('exit', current.value, active.value.folder)
    finished.value = true
  }
  else if (window.history.length > 1) router.back()
  else finished.value = true
}

// Terminar (la última escena): dentro de Educators, el educador sigue en el feedback del taller.
function terminar() {
  if (!props.embedded) return leave()
  post({ tipo: 'cierre' })
  cancelNarration()
  emit('finish')
  finished.value = true
}

function askExit() {
  confirm({
    title: txt('exitTitle'),
    text: props.mode === 'educator' ? txt('closesEverywhere') : txt('exitHome'),
    label: txt('exitAction'),
    symbol: 'exit',
    tone: 'coral',
    stats: [[txt('sceneStat'), txt('sceneStatValue', { n: current.value + 1, total: scenes.length })]],
    action: leave,
  })
}

function askRestart() {
  const i = current.value
  confirm({
    title: txt('restartTitle'),
    text: txt('restartText'),
    label: txt('restart'),
    symbol: 'retry',
    tone: 'sun',
    caption: sceneCaption(),
    action: () => {
      restartScene(i)
      publish()
    },
  })
}

// ── Confirmaciones ────────────────────────────────────────────────────────────
interface Confirmation {
  title: string
  text: string
  label: string
  symbol: UiIconName
  tone: UiTone
  caption?: string
  stats?: [string, string][]
  action?: () => void
}
const confirmation = reactive<Confirmation>({ title: '', text: '', label: '', symbol: 'info', tone: 'sun' })
let chosen: (() => void) | null = null

function confirm(options: Confirmation) {
  Object.assign(confirmation, { caption: workshopCaption(), stats: [], ...options })
  chosen = null
  confirmOpen.value = true
}

function confirmChosen() {
  chosen = confirmation.action ?? null
  confirmOpen.value = false
}

function onConfirmClosed() {
  const action = chosen
  chosen = null
  action?.()
}

watch(confirmOpen, open => setPause('dialog', open))

// ── Guía, escenas, ajustes y dispositivos (educador) ──────────────────────────
function setGuide(open: boolean) {
  guideOpen.value = open
  if (open) {
    if (devicesOpen.value) setDevices(false)
    if (railOpen.value) setRail(false)
    if (scenesOpen.value) setScenes(false)
  }
  setPause('guide', open)
}

function setScenes(open: boolean) {
  scenesOpen.value = open
  if (open) {
    if (railOpen.value) setRail(false)
    if (guideOpen.value) setGuide(false)
  }
  setPause('scenes', open)
}

// Cómo va cada escena en la lista: la actual manda sobre hecha.
type SceneListState = 'current' | 'done' | 'pending'
const SCENE_TONES: Record<SceneListState, UiTone> = { current: 'sun', done: 'lime', pending: 'neutral' }
const sceneState = (i: number): SceneListState => (i === current.value ? 'current' : states[i]!.fraction >= 1 ? 'done' : 'pending')

// Saltar a una escena desde la lista: cambiar de escena conserva su estado, como Anterior.
function jumpTo(index: number) {
  setScenes(false)
  if (index !== current.value) goTo(index)
}

function setRail(open: boolean) {
  railOpen.value = open
  if (open && scenesOpen.value) setScenes(false)
  if (!open && devicesOpen.value) setDevices(false)
  setPause('rail', open)
}

function setDevices(open: boolean) {
  devicesOpen.value = open
  if (open && guideOpen.value) setGuide(false)
  if (!open) selectedDevice.value = null
  setPause('devices', open)
}

// Un toque fuera de la lista o del riel los cierra (Ajustes sigue abierto mientras Dispositivos lo está).
function onPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (scenesOpen.value && !target.closest('.scene-list, .scenes-button')) setScenes(false)
  if (railOpen.value && !devicesOpen.value && !target.closest('.quick-rail, .settings-button')) setRail(false)
}

function toggleMute() {
  setMuted(!muted.value)
  if (muted.value) cancelNarration()
}

// Pantalla completa solo donde el navegador la permite (no en iPhone).
const canFullscreen = ref(false)
const fullscreen = ref(false)
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }
  catch {
    announce(txt('fullscreenUnsupported'))
  }
}
const onFullscreen = () => { fullscreen.value = Boolean(document.fullscreenElement) }

function listen(value: string | undefined) {
  if (!value) return
  void narrate({ category: props.storyboard.category, storyboardId: props.storyboard.json.slug, locale: props.locale }, value)
}
// Las escenas narran por aquí (la Bienvenida, al tocar a sus protagonistas), con la voz del storyboard.
provide(NARRATOR_KEY, (value, onState) => narrate({ category: props.storyboard.category, storyboardId: props.storyboard.json.slug, locale: props.locale }, value, onState))

// ── Sesión entre pestañas (demostración del servicio de taller) ──────────────
type SessionMessage =
  | { tipo: 'estado', escena: string, pausa: boolean, reinicios: Record<string, number> }
  | { tipo: 'orden', id: string, accion: 'pausa' | 'libera' | 'reinicio' | 'quitar' }
  | { tipo: 'presencia', id: string, nombre: string, tono: DeviceView['tono'], escena: string | null, pausado: boolean }
  | { tipo: 'hola' }
  | { tipo: 'adios', id: string }
  | { tipo: 'cierre' }

let channel: BroadcastChannel | null = null
const post = (msg: SessionMessage) => channel?.postMessage(msg)

// Educador → dispositivos: escena, pausa y reinicios. Nada más.
function publish() {
  if (props.mode !== 'educator') return
  post({
    tipo: 'estado',
    escena: active.value.folder,
    pausa: manualPause.value,
    reinicios: Object.fromEntries(scenes.map((s, i) => [s.folder, states[i]!.generation])),
  })
}

interface Device { id: string, nombre: string, tono: DeviceView['tono'], prueba?: boolean, pausado: boolean, escena?: string | null, seen?: number, note?: string }

// Siete dispositivos de prueba: siguen la sesión y obedecen aquí mismo, para probar el panel sin
// abrir pestañas. Una pestaña con ?mode=device se suma de verdad y va primero en la lista.
const TEST_DEVICES: [string, DeviceView['tono']][] = [['Zorro', 'coral'], ['Búho', 'grape'], ['Abeja', 'sun'], ['Pez', 'sky'], ['Rana', 'lime'], ['Conejo', 'rose'], ['Tortuga', 'lime']]
const devices = reactive(new Map<string, Device>(props.mode === 'educator'
  ? TEST_DEVICES.map(([nombre, tono], i) => [`prueba-${i + 1}`, { id: `prueba-${i + 1}`, nombre, tono, prueba: true, pausado: false }])
  : []))
const selectedDevice = ref<string | null>(null)

const sceneOfDevice = (device: Device) => (device.prueba ? current.value : scenes.findIndex(s => s.folder === device.escena))

const deviceViews = computed<DeviceView[]>(() => [...devices.values()]
  .sort((a, b) => Number(Boolean(a.prueba)) - Number(Boolean(b.prueba)))
  .map((device) => {
    const at = sceneOfDevice(device)
    const where = scenes[at]
    const status = device.note || (device.pausado
      ? txt('devicePaused')
      : where ? txt('deviceAt', { n: at + 1, name: where.title }) : txt('deviceWaiting'))
    return { id: device.id, nombre: device.nombre, tono: device.tono, pausado: device.pausado, status }
  }))

let noteTimer: ReturnType<typeof setTimeout> | undefined
function noteDevice(device: Device, note: string) {
  clearTimeout(noteTimer)
  device.note = note
  noteTimer = setTimeout(() => { device.note = '' }, 2000)
}

const order = (device: Device, accion: 'pausa' | 'libera' | 'reinicio' | 'quitar') => {
  if (!device.prueba) post({ tipo: 'orden', id: device.id, accion })
}

function pauseDevice() {
  const device = selectedDevice.value ? devices.get(selectedDevice.value) : undefined
  if (!device) return
  device.pausado = !device.pausado
  order(device, device.pausado ? 'pausa' : 'libera')
  noteDevice(device, device.pausado ? txt('devicePaused') : txt('deviceFreed'))
}

function restartDevice() {
  const device = selectedDevice.value ? devices.get(selectedDevice.value) : undefined
  if (!device) return
  order(device, 'reinicio')
  const at = sceneOfDevice(device)
  noteDevice(device, at >= 0 ? txt('deviceRestarted', { n: at + 1 }) : txt('deviceRestartedPlain'))
}

function askRemoveDevice() {
  const device = selectedDevice.value ? devices.get(selectedDevice.value) : undefined
  if (!device) return
  confirm({
    title: txt('removeTitle', { name: device.nombre }),
    text: txt('removeText'),
    label: txt('remove'),
    symbol: 'close',
    tone: 'coral',
    caption: txt('devices'),
    action: () => {
      order(device, 'quitar')
      devices.delete(device.id)
      selectedDevice.value = null
    },
  })
}

// Dispositivo: su identidad es un animal para esta pestaña; distinto de los de prueba.
const ANIMALS: [string, DeviceView['tono']][] = [['Gato', 'coral'], ['Oso', 'grape'], ['León', 'sun'], ['Ballena', 'sky'], ['Koala', 'rose'], ['Ardilla', 'sun']]
function deviceIdentity(): { id: string, nombre: string, tono: DeviceView['tono'] } {
  try {
    const saved = JSON.parse(sessionStorage.getItem('playhub-dispositivo') ?? 'null')
    if (saved?.id) return saved
  }
  catch { /* sin almacenamiento */ }
  const [nombre, tono] = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]!
  const identity = { id: Math.random().toString(36).slice(2, 10), nombre, tono }
  try { sessionStorage.setItem('playhub-dispositivo', JSON.stringify(identity)) }
  catch { /* sin almacenamiento */ }
  return identity
}
const me = ref<{ id: string, nombre: string, tono: DeviceView['tono'] } | null>(null)

function presence() {
  if (!me.value) return
  post({ tipo: 'presencia', ...me.value, escena: session.open ? active.value.folder : null, pausado: session.held })
}

function applyState(state: Extract<SessionMessage, { tipo: 'estado' }>) {
  if (session.removed) return
  session.closed = false
  session.open = true
  session.paused = state.pausa
  scenes.forEach((scene, i) => {
    const generation = state.reinicios?.[scene.folder] ?? 0
    if (generation !== states[i]!.generation) {
      restartScene(i)
      states[i]!.generation = generation
    }
  })
  const index = scenes.findIndex(s => s.folder === state.escena)
  if (index >= 0 && (index !== current.value || !session.scene)) {
    session.scene = state.escena
    goTo(index, false)
  }
}

let presenceTimer: ReturnType<typeof setInterval> | undefined
// Al irse, el dispositivo se despide. Se quita al desmontar: con el canal ya cerrado, despedirse falla.
const sayGoodbye = () => { if (!session.removed && me.value) post({ tipo: 'adios', id: me.value.id }) }
function obey(accion: Extract<SessionMessage, { tipo: 'orden' }>['accion']) {
  if (session.removed) return
  if (accion === 'pausa' || accion === 'libera') session.held = accion === 'pausa'
  else if (accion === 'reinicio') { if (session.open) restartScene(current.value) }
  else if (accion === 'quitar') {
    Object.assign(session, { removed: true, open: false, held: false })
    clearInterval(presenceTimer)
    if (me.value) post({ tipo: 'adios', id: me.value.id })
    return
  }
  presence()
}

function onSessionMessage({ data }: MessageEvent<SessionMessage>) {
  if (props.mode === 'educator') {
    if (data.tipo === 'hola') publish()
    else if (data.tipo === 'presencia') devices.set(data.id, { ...devices.get(data.id), ...data, seen: Date.now() })
    else if (data.tipo === 'adios') {
      devices.delete(data.id)
      if (selectedDevice.value === data.id) selectedDevice.value = null
    }
  }
  else if (props.mode === 'device') {
    if (data.tipo === 'estado') applyState(data)
    else if (data.tipo === 'orden' && data.id === me.value?.id) obey(data.accion)
    else if (data.tipo === 'cierre' && !session.removed) {
      session.open = false
      session.closed = true
    }
  }
}

let sweeper: ReturnType<typeof setInterval> | undefined

// ── Teclado: los presentadores inalámbricos mandan Av Pág / Re Pág. Un dispositivo no tiene teclas.
function onKey(event: KeyboardEvent) {
  if (props.mode === 'device' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
  if (document.querySelector('dialog[open]')) return
  const key = event.key
  const sheetOpen = Boolean(activeState.value.message) && !guideOpen.value && !devicesOpen.value && !railOpen.value && !scenesOpen.value
  if (key === 'Escape') {
    if (scenesOpen.value) setScenes(false)
    else if (devicesOpen.value) setDevices(false)
    else if (railOpen.value) setRail(false)
    else if (guideOpen.value) setGuide(false)
    else if (sheetOpen) closeFeedback()
    else if (overlay.value?.action) resume()
    return
  }
  // El resto de teclas son de las pestañas de la guía y de cualquier campo con el foco.
  if ((event.target as HTMLElement).closest?.('input, select, textarea, [contenteditable], [role=tablist]')) return
  if (sheetOpen && ['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp'].includes(key)) closeFeedback(false)
  const educator = props.mode === 'educator'
  const conduce = educator || props.mode === 'preview'
  const actions: Record<string, (() => void) | null> = {
    ArrowRight: next,
    PageDown: next,
    ArrowLeft: conduce ? previous : null,
    PageUp: conduce ? previous : null,
    p: educator ? () => setPause('manual', !manualPause.value) : null,
    g: educator ? () => setGuide(!guideOpen.value) : null,
    m: toggleMute,
    f: toggleFullscreen,
  }
  const action = actions[key.length === 1 ? key.toLowerCase() : key]
  if (action) {
    event.preventDefault()
    action()
  }
}

// ── Protección táctil: sin zoom de dedos ni de trackpad, sin menú contextual ni arrastre de imágenes.
const blockEvent = (event: Event) => event.preventDefault()
const BLOCKED = ['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'dragstart', 'dblclick'] as const
const onWheel = (event: WheelEvent) => { if (event.ctrlKey) event.preventDefault() }
const onVisibility = () => { if (props.mode !== 'device') setPause('hidden', document.hidden) }

const frame = ref<HTMLElement | null>(null)
const probe = ref<HTMLElement | null>(null)
const { compact } = useFrameFit(frame, probe, () => instances.get(current.value)?.fit?.(), props.mode === 'preview')

onMounted(() => {
  BLOCKED.forEach(type => document.addEventListener(type, blockEvent))
  window.addEventListener('wheel', onWheel, { passive: false })
  document.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('fullscreenchange', onFullscreen)
  document.addEventListener('visibilitychange', onVisibility)
  canFullscreen.value = Boolean(document.fullscreenEnabled)

  // La vista previa no es un taller: no abre la sesión con los dispositivos.
  channel = props.mode !== 'preview' && 'BroadcastChannel' in window ? new BroadcastChannel('playhub-taller-demo') : null
  if (channel) channel.onmessage = onSessionMessage

  if (props.mode === 'educator') {
    // Un dispositivo real que deja de dar señales sale de la lista.
    sweeper = setInterval(() => {
      const now = Date.now()
      devices.forEach((device, id) => {
        if (!device.prueba && now - (device.seen ?? now) > 6000) {
          devices.delete(id)
          if (selectedDevice.value === id) selectedDevice.value = null
        }
      })
    }, 2000)
  }

  if (props.mode === 'device') {
    me.value = deviceIdentity()
    states[0]!.visited = true
    presenceTimer = setInterval(presence, 2000)
    window.addEventListener('pagehide', sayGoodbye)
    post({ tipo: 'hola' })
    presence()
  }
  else {
    goTo(current.value, false)
  }
})

onBeforeUnmount(() => {
  BLOCKED.forEach(type => document.removeEventListener(type, blockEvent))
  window.removeEventListener('wheel', onWheel)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('fullscreenchange', onFullscreen)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pagehide', sayGoodbye)
  clearInterval(sweeper)
  clearInterval(presenceTimer)
  clearTimeout(noteTimer)
  clearTimeout(burstTimer)
  channel?.close()
  cancelNarration()
})

// Vista previa: la app que lo incrusta conduce (docs/runner.md). Una carpeta que no existe no mueve nada.
defineExpose({
  ir: (escena: number | string) => goTo(typeof escena === 'number' ? escena : scenes.findIndex(s => s.folder === escena)),
  reiniciar: () => {
    cancelNarration()
    restartScene(current.value)
  },
})

useHead({ title: computed(() => `${active.value.title} · ${text(props.storyboard.json.title)} · PlayHub`) })
</script>
