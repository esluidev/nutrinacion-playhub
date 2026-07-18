<template>
  <div class="runner">
    <!-- ══ Storyboard without playable content ══ -->
    <div v-if="!definition" class="runner-center">
      <div class="runner-card">
        <p class="runner-eyebrow">STORYPLAY</p>
        <h1 class="runner-title">{{ t('noContentTitle') }}</h1>
        <p class="runner-subtitle">
          No existe <code>{{ category }}/{{ storyboardId }}</code> en <code>content/storyboards/</code>.
        </p>
        <button class="sp-btn sp-btn-green" @click="exitToDetail">{{ t('back') }}</button>
      </div>
    </div>

    <template v-else>
      <!-- ══ Scene area ══ -->
      <div class="scene-area">
        <component
          :is="currentComponent"
          v-if="currentComponent"
          :key="`${currentIndex}-${sceneKey}`"
          :locale="locale"
          :config="currentScene?.config ?? {}"
          @complete="onSceneComplete"
          @score="onScore"
          @knowledge="onKnowledge"
          @restart="restartWorkshop"
        />
        <div v-else class="runner-center">
          <div class="runner-card">
            <p class="runner-eyebrow">{{ t('sceneLabel', { n: currentIndex + 1 }) }}</p>
            <h1 class="runner-title">{{ currentScene?.title }}</h1>
            <p class="runner-subtitle">{{ t('notImplemented') }}</p>
          </div>
        </div>
      </div>

      <!-- ══ HUD top: close (left) · progress bar (center) · points + audio + config (right) ══ -->
      <div class="hud-top">
        <div class="hud-side hud-side-left">
          <!-- Close is ALWAYS available — confirmation popup guards it.
               A DIRECT button: in-game actions must be quick, no nested
               menus. Neutral white: a utility that must not call attention -->
          <button class="hud-circle" :aria-label="t('exitWorkshop')" @click="askExit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <!-- Scene counter (current / total) grouped with the close button,
               same 12px gap as the right-side buttons share between them.
               Tapping it opens the scene-list modal (overview + navigation). -->
          <button
            :class="['hud-scene-count', { 'is-bumping': sceneBump }]"
            :aria-label="t('ariaScenes')"
            @click="showScenes = true"
          >
            <!-- filled screen with a play triangle cut out (evenodd): a "play"
                 button on a slide — represents the scenes -->
            <svg class="hud-scene-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm5 4.5v7l6-3.5z" />
            </svg>
            <span class="hud-scene-nums">
              <span class="hud-scene-now">{{ currentIndex + 1 }}</span>
              <span class="hud-scene-sep">/</span>
              <span class="hud-scene-total">{{ scenes.length }}</span>
            </span>
          </button>
        </div>

        <div class="hud-progress">
          <ProgressBar ref="progressRef" color="green" size="lg" class="hud-progress-bar" />
        </div>

        <div class="hud-side hud-side-right">
          <!-- Effects from the ScoreCounter primitive (its composable): tweened
               count-up, bump on change and floating "+N" deltas -->
          <div class="hud-points-wrap">
            <div :class="['hud-points', { 'is-bumping': scoreBumping }]">
              <PlayCoinIcon />
              <span>{{ scoreDisplay }}</span>
            </div>
            <div
              v-for="d in scoreDeltas"
              :key="d.id"
              :class="['hud-points-delta', { 'is-negative': d.amount < 0 }]"
            >
              {{ d.amount > 0 ? '+' : '' }}{{ d.amount }}
            </div>
          </div>

          <!-- Scene instructions (NOT mute): reads scene.config meta.instruction
               on demand — the educator can play it to the group -->
          <button
            :class="['hud-circle', 'hud-audio', { 'is-speaking': speakingInstruction }]"
            :disabled="!currentScene?.instruction"
            :aria-label="t('ariaInstruction')"
            @click="speakInstruction"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>

          <!-- The educator's control sheet toggle — navigation, guide and
               config all live inside the panel -->
          <button
            :class="['hud-circle', 'hud-sheet-toggle', { 'is-open': sheetOpen }]"
            :aria-label="t('teacherPanel')"
            :title="t('teacherPanel')"
            @click="toggleSheet"
          >
            <!-- panel-bottom: pictures exactly what it does — show/hide the
                 bottom panel (the chevron read as mere navigation) -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 15h18" />
              <path v-if="sheetOpen" d="M3 15h18v6H3z" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      <!-- ══ BottomSheet: non-modal — the completed scene stays visible because
           the result IS the reward. Never auto-speaks. Two contents: the
           Tarjeta de Saber and the educator's control panel (scene info ·
           guide · config · reset · nav), summonable anytime from the HUD
           toggle and auto-opened on scene completion ══ -->
      <BottomSheet :open="sheetOpen" :height="SHEET_HEIGHT">
        <!-- ── Tarjeta de Saber (regla 15): the scene's knowledge feedback,
             same card in EVERY scene. The educator reads the visible text
             aloud (their script); the audio button plays it on demand.
             Audio goes at the FAR END: glued to the illustration the two
             round shapes read as one confusing cluster ── -->
        <template v-if="sheetContent === 'knowledge'">
          <!-- Fixed anatomy (regla 15): ALWAYS illustration (specific
               component or generic emoji) + ALWAYS title + fact — every
               knowledge card reads the same -->
          <div class="sheet-info">
            <div class="sheet-visual">
              <component :is="knowledge!.visual!.component" v-bind="knowledge!.visual!.props ?? {}" v-if="knowledge?.visual" />
              <span v-else class="sheet-visual-emoji">{{ knowledge?.emoji }}</span>
            </div>
            <div class="sheet-copy">
              <p class="sheet-headline">{{ knowledge?.title }}</p>
              <!-- Scene-provided fact (inline-styled highlights) -->
              <p class="sheet-desc sheet-fact" v-html="knowledge?.html" />
            </div>
          </div>
          <div class="sheet-actions">
            <button
              :class="['hud-circle', 'hud-audio', 'sheet-audio', { 'is-speaking': knowledgeNarrating }]"
              :aria-label="t('listen')"
              @click="speakKnowledge"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
            <!-- Scene completed while the card holds the strip: the card
                 STAYS (the last fact is the educator's script) and gains the
                 next arrow right here — one tap to advance, no need to summon
                 the panel. Green = navigation (same language as the panel's
                 arrow); the pop-in is finite, so regla 13 holds. -->
            <button
              v-if="sceneCompleted && !isLast"
              class="hud-circle hud-green sheet-audio sheet-next"
              :aria-label="t('nextScene')"
              :title="t('nextScene')"
              @click="next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </template>

        <template v-else>
          <div class="sheet-scene">
            <p class="sheet-eyebrow">
              {{ t('sceneCounter', { n: currentIndex + 1, total: scenes.length }) }}
              <span v-if="sceneCompleted" class="sheet-done">{{ t('sceneDone') }}</span>
            </p>
            <p class="sheet-title">{{ currentScene?.title }}</p>
          </div>
          <div class="sheet-actions">
            <button class="hud-guide" @click="showGuide = true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              {{ t('guide') }}
            </button>
            <button class="hud-circle" :aria-label="t('settings')" @click="showConfig = true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button class="hud-circle" :aria-label="t('resetScene')" :title="t('resetScene')" @click="resetScene">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
            <button class="hud-circle hud-green sheet-nav-start" :disabled="currentIndex === 0" :aria-label="t('prevScene')" @click="prev">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              class="hud-circle hud-green"
              :disabled="nextLocked"
              :aria-label="t('nextScene')"
              @click="next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </template>

      </BottomSheet>

      <!-- ══ Config: STORYBOARD-level settings (DS Modal) ══ -->
      <Modal :open="showConfig" :eyebrow="t('settings')" @close="showConfig = false">
        <div class="config-row">
          <span class="config-label">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            {{ t('sound') }}
          </span>
          <button :class="['config-toggle', { 'is-on': !muted }]" role="switch" :aria-checked="!muted" @click="toggleMute">
            <span class="config-toggle-knob" />
          </button>
        </div>

        <div class="config-row">
          <span class="config-label">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            {{ t('workshop') }}
          </span>
          <button class="sp-btn sp-btn-red sp-btn-sm" @click="restartWorkshop">{{ t('restart') }}</button>
        </div>

        <template #footer>
          <button class="sp-btn sp-btn-green sp-btn-sm" @click="showConfig = false">{{ t('ready') }}</button>
        </template>
      </Modal>

      <!-- ══ Pedagogical guide (DS Modal · teacher only): owns ALL educator
           guidance (regla 12). Full per-scene guide content lands with the
           Educators integration ══ -->
      <Modal :open="showGuide" :eyebrow="t('guide')" variant="info" @close="showGuide = false">
        <p class="sp-modal-title">{{ currentScene?.title }}</p>
        <p v-if="currentScene?.instruction" class="sp-modal-text">{{ currentScene.instruction }}</p>
        <p class="sp-modal-text guide-note">{{ t('guideNote') }}</p>
        <template #footer>
          <button class="sp-btn sp-btn-green sp-btn-sm" @click="showGuide = false">{{ t('ready') }}</button>
        </template>
      </Modal>

      <!-- ══ Exit confirmation (DS Modal): closing is always available, guarded
           with audio for non-readers. In Educators this becomes
           storyboard:close-request → native dialog (bridge) ══ -->
      <Modal
        :open="showExitConfirm"
        :eyebrow="t('exitWorkshop')"
        variant="danger"
        :audio-text="t('exitAudio')"
        :audio-label="t('listen')"
        @close="showExitConfirm = false"
      >
        <span class="sp-modal-asset">🚪</span>
        <p class="sp-modal-title">{{ t('exitTitle') }}</p>
        <p class="sp-modal-text">{{ t('exitText') }}</p>
        <template #footer>
          <button class="sp-btn sp-btn-green sp-btn-sm" @click="showExitConfirm = false">{{ t('stay') }}</button>
          <button class="sp-btn sp-btn-red sp-btn-sm" @click="confirmExit">{{ t('exit') }}</button>
        </template>
      </Modal>

      <!-- ══ Scene list (DS Modal): overview + navigation, opened from the
           scene-count pill. The current scene is highlighted; the educator
           jumps freely (regla 2) ══ -->
      <Modal :open="showScenes" :eyebrow="t('scenesList')" size="lg" @close="showScenes = false">
        <ol class="scene-list">
          <li v-for="(s, i) in scenes" :key="i" class="scene-list-item">
            <button
              :class="['scene-row', `is-${sceneStatus(i)}`]"
              :disabled="!canNav(i)"
              :aria-current="i === currentIndex ? 'step' : undefined"
              @click="goToScene(i)"
            >
              <span class="scene-row-badge">
                <svg v-if="sceneStatus(i) === 'done'" class="scene-row-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                <span v-else>{{ i + 1 }}</span>
              </span>
              <span class="scene-row-title">{{ s.title }}</span>
              <span v-if="sceneStatus(i) === 'current'" class="scene-row-here">{{ t('sceneHere') }}</span>
              <svg v-else-if="canNav(i)" class="scene-row-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </li>
        </ol>
        <template #footer>
          <button class="sp-btn sp-btn-green sp-btn-sm" @click="showScenes = false">{{ t('close') }}</button>
        </template>
      </Modal>

    </template>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { RUNNER_STRINGS } from '~/i18n/runner'
import BottomSheet from '~/primitives/BottomSheet/BottomSheet.vue'
import Modal from '~/primitives/Modal/Modal.vue'
import ProgressBar from '~/primitives/ProgressBar/ProgressBar.vue'
import { useScoreCounter } from '~/primitives/ScoreCounter/useScoreCounter'
import { Sounds } from '~/primitives/sounds'
import { NARRATOR_KEY, cancelNarration, narrate } from '~/primitives/narration'
import { tr } from '~/types/i18n'
import type { KnowledgePayload } from '~/types/scene'

definePageMeta({
  layout: 'play',
})

const route = useRoute()
const category = computed(() => String(route.params.category))
const storyboardId = computed(() => String(route.params.id))

// Content language comes from the URL (?lang=); the runner validates it against
// the storyboard's declared `languages` and resolves all content to it.
const { definition, scenes, sceneComponent, locale } = useStoryboardRunner(
  category.value,
  storyboardId.value,
  String(route.query.lang ?? ''),
)

// Runner shell strings (HUD, sheets, modals) follow the game's content locale —
// this is the play experience, not Studio's authoring UI (which stays Spanish).
const t = useT(RUNNER_STRINGS, () => locale)

// Pre-recorded narration resolves BY TEXT against the storyboard's
// audio.manifest.json (Web Speech fallback when a line has no wav). Scenes
// that narrate on demand (quiz questions) get the same context-bound narrator
// via inject — they pass text, never a key.
const narrationCtx = { category: category.value, storyboardId: storyboardId.value, locale }

function runnerNarrate(text: string, onState?: (s: boolean) => void): Promise<void> {
  return narrate(narrationCtx, text, onState)
}
provide(NARRATOR_KEY, runnerNarrate)

const game = useGameState()
game.start(storyboardId.value, scenes.length)

// HUD points with the ScoreCounter primitive's effects (its composable —
// the pill keeps the compact HUD look): tween, bump, floating deltas.
// Snap without animation when dropping to 0 (restart isn't a score event).
const {
  displayValue: scoreDisplay,
  isBumping: scoreBumping,
  deltas: scoreDeltas,
  set: scoreSet,
  destroy: scoreDestroy,
} = useScoreCounter({ initial: game.points })
watch(() => game.points, p => scoreSet(p, p > 0))

const startIndex = (() => {
  const raw = Number(route.query.start ?? 0)
  if (Number.isNaN(raw) || raw < 0) return 0
  return Math.min(raw, Math.max(scenes.length - 1, 0))
})()

const currentIndex = ref(startIndex)
const sceneKey = ref(0)

// ── The bottom strip has ONE owner (the runner) and two contents: the
// knowledge card and the educator's panel are INDEPENDENT states that
// coexist — the one showing is whichever was activated last (stripFocus),
// so closing the panel restores the card.
const panelOpen = ref(false) // educator control panel (HUD toggle)
const knowledge = shallowRef<KnowledgePayload | null>(null)
const knowledgeNarrating = ref(false)
const stripFocus = ref<'knowledge' | 'panel'>('knowledge')

const sheetContent = computed<'knowledge' | 'panel' | null>(() => {
  if (knowledge.value && panelOpen.value) return stripFocus.value
  if (knowledge.value) return 'knowledge'
  if (panelOpen.value) return 'panel'
  return null
})
const sheetOpen = computed(() => sheetContent.value !== null)
// ONE height for every content: swapping card/panel/completion must never
// resize the strip (the stage would jump around)
const SHEET_HEIGHT = 140
// Tell the play layout to cede the sheet's strip: the stage rescales and
// recenters in the remaining area so the sheet NEVER covers scene content
const sheetInset = inject<Ref<number>>('playSheetInset', ref(0))
watchEffect(() => (sheetInset.value = sheetOpen.value ? SHEET_HEIGHT : 0))
const showConfig = ref(false)
const showExitConfirm = ref(false)
const showGuide = ref(false)
const showScenes = ref(false)
const muted = ref(Sounds.isMuted())
const speakingInstruction = ref(false)
const progressRef = ref<InstanceType<typeof ProgressBar> | null>(null)

const currentScene = computed(() => scenes[currentIndex.value])
const currentComponent = computed(() => sceneComponent(currentIndex.value))
const sceneCompleted = computed(() => game.isSceneCompleted(currentIndex.value))
const isLast = computed(() => currentIndex.value >= scenes.length - 1)
// Announcement scenes (advanceOnComplete) gate the flow through their own
// button: the educator's next arrow stays disabled until the scene completes
const nextLocked = computed(() =>
  Boolean(currentScene.value?.config.advanceOnComplete) && !sceneCompleted.value,
)

// Scene counter (HUD): a quick pulse each time the scene changes
const sceneBump = ref(false)
watch(currentIndex, () => {
  sceneBump.value = true
  setTimeout(() => (sceneBump.value = false), 320)
})

useHead({
  title: definition ? `${tr(definition.title, locale)} — StoryPlay` : 'StoryPlay',
})

/* ── Progress bar (the primitive, not dots) ───────────────────────────────── */

// La barra es POSICIÓN en el taller, igual que el contador de escenas del
// HUD: escena i de N ⇒ (i+1)/N. Avanza al CAMBIAR de escena — nunca al
// completar juegos — y en el resumen (última escena) se lee LLENA. Siempre
// converge al índice actual, así que no puede desincronizarse.
function syncProgress(animate = true) {
  const total = Math.max(scenes.length, 1)
  const value = (currentIndex.value + 1) / total
  const from = progressRef.value?.current() ?? currentIndex.value / total
  if (animate && from !== value) progressRef.value?.animate(from, value, 600)
  else progressRef.value?.setProgress(value)
}

onMounted(() => syncProgress(false))

// Reaching the summary IS completing the workshop (regla 17): the last scene
// has no game of its own — mark it so the summary's N/N stat and the scene
// list read complete. (The bar itself is position-based and already full.)
watch(currentIndex, (i) => {
  if (scenes.length > 0 && i >= scenes.length - 1 && !game.isSceneCompleted(i)) {
    game.markCompleted(i)
  }
  syncProgress()
}, { immediate: true })

/* ── Scene events ─────────────────────────────────────────────────────────── */

// Scenes fire their completion feedback (success/celebrate jingle) and emit
// `complete` in the same tick. The sheet neither covers the scene nor speaks
// on its own, so it only needs a short beat for the jingle to land.
const FEEDBACK_MIN_MS = 600 // let the synthesized jingles (≤0.7s) land

// Generation token: navigating, replaying or exiting invalidates a pending wait
let feedbackWaitId = 0

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

/** Resolves when the exit confirmation closes (event-driven, our own state). */
function exitConfirmClosed(): Promise<void> {
  if (!showExitConfirm.value) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = watch(showExitConfirm, (open) => {
      if (!open) {
        stop()
        resolve()
      }
    })
  })
}

async function afterSceneFeedback(fn: () => void) {
  const id = ++feedbackWaitId
  await sleep(FEEDBACK_MIN_MS)
  if (id !== feedbackWaitId) return
  // While the exit confirmation is up, hold
  await exitConfirmClosed()
  if (id !== feedbackWaitId) return
  fn()
}

function onScore(points: number) {
  // Replays of an already-completed scene don't inflate the score
  if (game.isSceneCompleted(currentIndex.value)) return
  game.addScore(points)
  // Points SOUND like coins (à la Mario) — paired with the counter's bump
  Sounds.play('coin')
}

function onSceneComplete() {
  // Completar marca el estado (stats, lista de escenas, nextLocked) pero NO
  // mueve la barra: la barra es posición y avanza al cambiar de escena
  if (!game.isSceneCompleted(currentIndex.value)) {
    game.markCompleted(currentIndex.value)
  }

  // Announcement-type scenes (e.g. Bienvenida) jump straight to the next
  // scene — no waiting (regla 10). Also on replays: their button must
  // ALWAYS move forward.
  if (currentScene.value?.config.advanceOnComplete) {
    next()
    return
  }

  // The LAST scene is the workshop SUMMARY (regla 17): its main button
  // closes the storyboard right away — no extra modal
  if (isLast.value) {
    finish()
    return
  }

  // The educator's control sheet slides up with "next" lit — they decide.
  // (If a knowledge card is up, it keeps priority until they dismiss it.)
  afterSceneFeedback(() => (panelOpen.value = true))
}

function speakInstruction() {
  const scene = currentScene.value
  if (!scene?.instruction) return
  runnerNarrate(scene.instruction, s => (speakingInstruction.value = s))
}

/* ── Knowledge feedback (regla 15): scenes emit WHAT was learned, the shell
   delivers it — same card, same place, in every scene ─────────────────────── */

function onKnowledge(payload: KnowledgePayload | null) {
  const wasNarrating = knowledgeNarrating.value
  knowledge.value = payload
  if (!payload) {
    if (wasNarrating) cancelNarration()
    return
  }
  // A fresh dato is live feedback: it takes the strip even over the panel.
  // It NEVER auto-narrates: the visible text is the educator's script; the
  // card's audio button plays it on demand (regla 15).
  stripFocus.value = 'knowledge'
}

function speakKnowledge() {
  const k = knowledge.value
  if (k?.voice) runnerNarrate(k.voice, s => (knowledgeNarrating.value = s))
}

/** The HUD toggle shows/hides the control panel WITHOUT touching the
 *  knowledge card — closing the panel restores the card */
function toggleSheet() {
  if (sheetContent.value === 'panel') {
    panelOpen.value = false
    stripFocus.value = 'knowledge'
    return
  }
  panelOpen.value = true
  stripFocus.value = 'panel'
}

/* ── Navigation (free will, like Duolingo lesson controls) ────────────────── */

function next() {
  feedbackWaitId++
  // Everything in the strip leaves with the scene — including the panel:
  // the new scene loads clean (toggle/completion bring it back)
  knowledge.value = null
  panelOpen.value = false
  cancelNarration()
  if (isLast.value) {
    finish()
    return
  }
  Sounds.play('tick')
  currentIndex.value++
}

function prev() {
  if (currentIndex.value === 0) return
  feedbackWaitId++
  knowledge.value = null
  panelOpen.value = false
  cancelNarration()
  Sounds.play('tick')
  currentIndex.value--
}

/** Scene-list modal (opened from the HUD scene-count pill): the educator
 *  jumps anywhere (regla 2, free nav). */
type SceneStatus = 'current' | 'done' | 'pending'
function sceneStatus(i: number): SceneStatus {
  if (i === currentIndex.value) return 'current'
  if (game.isSceneCompleted(i)) return 'done'
  return 'pending'
}

function canNav(i: number): boolean {
  return i !== currentIndex.value
}

function goToScene(i: number) {
  if (!canNav(i)) return
  showScenes.value = false
  feedbackWaitId++
  knowledge.value = null
  panelOpen.value = false
  cancelNarration()
  Sounds.play('tick')
  currentIndex.value = i
}

/** Remount the current scene from scratch (panel reset) */
function resetScene() {
  feedbackWaitId++
  knowledge.value = null
  cancelNarration()
  sceneKey.value++
  Sounds.play('tick')
}

/** The summary lives in the LAST SCENE (regla 17) — finishing simply closes
 *  the storyboard. In Educators this becomes storyboard:complete (bridge). */
function finish() {
  feedbackWaitId++
  knowledge.value = null
  panelOpen.value = false
  cancelNarration()
  // TODO(bridge): emit storyboard:complete { points, scenes, ... } to Educators
  return exitToDetail()
}

function restartWorkshop() {
  feedbackWaitId++
  game.reset()
  game.start(storyboardId.value, scenes.length)
  knowledge.value = null
  panelOpen.value = false
  showConfig.value = false
  currentIndex.value = 0
  sceneKey.value++
  syncProgress(false)
}

function toggleMute() {
  muted.value = !muted.value
  Sounds.setMuted(muted.value)
  // Mute silences everything, including a line already sounding
  if (muted.value) cancelNarration()
}

function exitToDetail() {
  return navigateTo(`/storyboards/${category.value}/${storyboardId.value}`)
}

/* ── Exit flow: always available, guarded by a spoken confirmation ────────── */

function askExit() {
  showExitConfirm.value = true
}

function confirmExit() {
  feedbackWaitId++
  cancelNarration()
  showExitConfirm.value = false
  // TODO(bridge): in Educators this emits storyboard:close-request instead
  return exitToDetail()
}


onUnmounted(() => {
  feedbackWaitId++
  sheetInset.value = 0
  scoreDestroy()
  cancelNarration()
})
</script>

<style scoped>
.runner {
  position: absolute;
  inset: 0;
  font-family: var(--font-body);
  color: var(--ink);
}

.scene-area {
  position: absolute;
  inset: 0;
}

/* ── HUD ── */
.hud-top {
  position: absolute;
  /* A touch more breathing room above the HUD than the original 20px
     (stage-logical px, scales with the stage). Scenes pad ~120px top. */
  top: 20px;
  left: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  z-index: 40;
  pointer-events: none;
}

.hud-top > *,
.hud-bottom > * {
  pointer-events: auto;
}

.hud-side {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hud-side-left {
  justify-content: flex-start;
}

.hud-side-right {
  justify-content: flex-end;
}

/* Sticker circle buttons */
.hud-circle {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid var(--ink);
  color: var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 0 var(--ink);
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.25s ease;
  flex-shrink: 0;
}

.hud-circle svg {
  width: 26px;
  height: 26px;
}

.hud-circle:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 var(--ink);
}

.hud-circle:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

/* Color hierarchy (regla 2): the GAME owns the saturated colors — the HUD
   signals function with soft tints + dark-accent icons, never competing for
   attention. green tint = navigation (prev/next), light blue = information
   (audio, guide), white = neutral utilities (close, config, reset) */
.hud-circle.hud-green {
  background: var(--green-tint);
  color: var(--accent-green-dark);
}

.hud-circle.hud-audio {
  background: #dde8f0;
}

/* Disabled neutralizes the color: the function is unavailable */
.hud-circle:disabled {
  background: #ffffff;
  color: var(--ink);
  opacity: 0.35;
  cursor: not-allowed;
}

.hud-circle.is-speaking {
  animation: hud-speak-pulse 0.5s ease-in-out infinite;
}

@keyframes hud-speak-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* Progress bar (primitive): spans the space between its neighbors with the
   SAME breathing room on each side (flex gap + symmetric padding) */
.hud-progress {
  flex: 1;
  display: flex;
  padding: 0 80px;
}

/* Scene counter pill (current / total) — neutral white sticker chrome like the
   HUD circles; grouped with the close button on the left (same .hud-side 12px
   gap as the right buttons). Bumps on change, mirroring the points pill. */
.hud-scene-count {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 53px;
  padding: 0 18px;
  /* Same yellow sticker chrome as the points pill */
  background: var(--yellow-tint);
  border: 3px solid var(--ink);
  border-radius: 999px;
  box-shadow: 0 3px 0 var(--ink);
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  transition:
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hud-scene-count.is-bumping {
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 6px 0 var(--ink);
}

.hud-scene-count:hover:not(.is-bumping) {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 var(--ink);
}

.hud-scene-count:active:not(.is-bumping) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.hud-scene-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* Numbers baseline-aligned among themselves, the group centered with the icon */
.hud-scene-nums {
  display: inline-flex;
  align-items: baseline;
}

.hud-scene-now {
  font-size: 26px;
}

.hud-scene-sep,
.hud-scene-total {
  font-size: 20px;
  color: var(--ink-soft);
}

.hud-scene-sep {
  margin: 0 3px;
}

.hud-progress-bar {
  flex: 1;
  width: auto;
  max-width: none !important;
  height: 34px !important;
}

.hud-points-wrap {
  position: relative;
}

.hud-points {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  /* Optical correction: a stadium shape at circle height READS taller than
     the 56px circles (its silhouette holds full height across the whole
     width) — slightly shorter evens the perceived weight. min-width keeps
     the pill stable when the score grows to 3+ digits */
  min-width: 124px;
  height: 53px;
  padding: 0 22px;
  background: var(--yellow-tint);
  border: 3px solid var(--ink);
  border-radius: 999px;
  box-shadow: 0 3px 0 var(--ink);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 26px;
  font-variant-numeric: tabular-nums;
  transition:
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hud-points.is-bumping {
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 6px 0 var(--ink);
}

.hud-points svg {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hud-points.is-bumping svg {
  transform: rotate(-15deg) scale(1.2);
}

/* Floating "+N" deltas — ported from the ScoreCounter primitive */
.hud-points-delta {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 22px;
  color: var(--accent-yellow-dark);
  pointer-events: none;
  animation: hud-points-delta 900ms ease-out forwards;
  white-space: nowrap;
}

.hud-points-delta.is-negative {
  color: var(--accent-red);
}

@keyframes hud-points-delta {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, -10px) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -56px) scale(1); }
}

/* Open state feedback lives in the ICON (filled bottom strip) — no color
   change: a lit button would read as a different function, not a state */

/* ── BottomSheet content (teleported; scoped attrs travel with it) ── */
.sheet-info {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

/* Card audio: bigger tap target than the HUD circles */
.sheet-audio {
  width: 68px;
  height: 68px;
}

.sheet-audio svg {
  width: 32px;
  height: 32px;
}

/* Next arrow on the completed scene's knowledge card: pops in ONCE when the
   scene completes (finite animation — not an idle effect, regla 13) */
.sheet-next {
  animation: sheet-next-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes sheet-next-pop {
  0% { opacity: 0; transform: scale(0.4); }
  100% { opacity: 1; transform: scale(1); }
}

.sheet-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

/* Tarjeta de Saber: illustration (component or generic emoji) + fact */
.sheet-visual {
  width: 98px;
  height: 78px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-visual-emoji {
  font-size: 58px;
  line-height: 1;
}

.sheet-fact {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}

.sheet-headline {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 28px;
  line-height: 1.1;
}

.sheet-desc {
  font-weight: 800;
  font-size: 16px;
  line-height: 1.3;
  color: var(--ink-soft);
}

.sheet-scene {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sheet-eyebrow {
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.sheet-done {
  color: var(--accent-green-dark);
}

.sheet-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 26px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

/* Proximity groups stronger than color: utilities (guide/config/reset) sit
   apart from the prev/next navigation pair */
.sheet-actions .sheet-nav-start {
  margin-left: 12px;
}

.hud-guide {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: #dde8f0;
  border: 3px solid var(--ink);
  border-radius: 999px;
  box-shadow: 0 3px 0 var(--ink);
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.hud-guide:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 var(--ink);
}

.hud-guide:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.hud-guide svg {
  width: 18px;
  height: 18px;
}

.guide-note {
  color: var(--ink-soft);
  font-size: 13px;
}

.config-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: var(--paper);
  border-radius: 18px;
}

.config-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 16px;
}

.config-label svg {
  width: 22px;
  height: 22px;
}

/* Sticker toggle switch */
.config-toggle {
  position: relative;
  width: 70px;
  height: 38px;
  border-radius: 999px;
  border: 3px solid var(--ink);
  background: var(--paper-deep);
  cursor: pointer;
  transition: background 200ms ease-out;
  flex-shrink: 0;
}

.config-toggle.is-on {
  background: var(--accent-green);
}

.config-toggle-knob {
  position: absolute;
  top: 2px;
  left: 3px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  border: 2.5px solid var(--ink);
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.config-toggle.is-on .config-toggle-knob {
  transform: translateX(30px);
}

/* Sticker buttons (.sp-btn + variantes) viven en el DS global
   (app/assets/css/main.css). Aquí solo overrides locales (p. ej. .sheet-audio). */

.runner-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.runner-card {
  width: 620px;
  background: #ffffff;
  border: 3px solid var(--ink);
  border-radius: 28px;
  box-shadow: 0 3px 0 var(--ink);
  padding: 44px 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.runner-eyebrow {
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 3px;
  color: var(--ink-soft);
}

.runner-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 32px;
  line-height: 1.15;
}

.runner-subtitle {
  font-weight: 700;
  font-size: 15px;
  color: var(--ink-soft);
}

.runner-subtitle code {
  background: var(--canvas);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 13px;
}

/* ══ Scene-list modal content (rows live in the DS Modal body) ══════════════ */
.scene-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 540px;
  overflow-y: auto;
}

.scene-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: #faf7f1;
  border: 2.5px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  color: var(--ink);
  transition:
    transform 0.12s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.scene-row:hover:not(:disabled):not(.is-current) {
  transform: translateY(-1px);
  background: #f1ebe0;
}

.scene-row:active:not(:disabled):not(.is-current) {
  transform: translateY(1px);
}

/* Badge — holds the number, or a check (done) / lock (locked) */
.scene-row-badge {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  background: #ffffff;
  border: 2.5px solid var(--ink);
  color: var(--ink);
}

.scene-row-ic {
  width: 19px;
  height: 19px;
}

.scene-row-title {
  flex: 1;
  min-width: 0;
  font-weight: 800;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* "Aquí" pill on the current scene */
.scene-row-here {
  flex-shrink: 0;
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #fff;
  background: var(--accent-green);
  border: 2px solid var(--ink);
  border-radius: 999px;
  padding: 3px 11px;
}

/* Chevron affordance on navigable rows */
.scene-row-go {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--slot-mark);
  opacity: 0.55;
}

.scene-row:hover:not(:disabled) .scene-row-go {
  opacity: 1;
  color: var(--ink-soft);
}

/* ── States ── */
.scene-row.is-current {
  background: var(--green-tint);
  border-color: var(--accent-green-dark);
  cursor: default;
}

.scene-row.is-current .scene-row-badge {
  background: var(--accent-green);
  color: #fff;
}

.scene-row.is-done .scene-row-badge {
  background: var(--accent-green);
  color: #fff;
}

.scene-row.is-pending .scene-row-badge {
  color: var(--ink-soft);
}

/* The current row is not navigable, just highlighted */
.scene-row:disabled {
  cursor: default;
}
</style>
