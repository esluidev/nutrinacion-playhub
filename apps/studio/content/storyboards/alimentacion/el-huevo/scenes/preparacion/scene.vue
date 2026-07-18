<template>
  <!-- THE WORKING KITCHEN (reglas 18/19), AUTOMATIC: the kid's one action is
       bringing the egg — then the kitchen runs its show with theatrical
       pacing (crack… whisk… flames… particles… ding). Station lifecycle:
       cookware waits alone on the counter; the stove appears when needed and
       everything clears when the dish is served. -->
  <div class="scene">
    <!-- Raw eggs tray -->
    <div class="tray">
      <Draggable
        v-for="n in STATIONS.length"
        :key="n"
        data="huevo"
        :label="t('eggLabel')"
        :color="TRAY_COLORS[n - 1]"
        class="tray-card"
        @dragstart="emit('knowledge', null)"
      >
        <div class="tray-egg">
          <EggSticker body="#f0c08e" outline="#80522a" />
        </div>
      </Draggable>
    </div>

    <!-- Cooking stations -->
    <div class="stations">
      <div v-for="station in STATIONS" :key="station.id" class="station">
        <div class="station-stage">
          <DropZone
            :accepts="['huevo']"
            :max="1"
            :title="station.name"
            class="station-zone"
            @drop="onDrop(station)"
          >
            <template #icon>
              <span class="station-icon"><component :is="station.icon" /></span>
            </template>
            <template #chip>
              <span class="station-chip-hidden" />
            </template>
          </DropZone>

          <!-- Station layers overlay the counter slot (drops hit the zone rect) -->
          <div class="station-content">
            <!-- Stove: only while there is something on the fire -->
            <Stove
              v-if="stoveVisible(station.id)"
              :ref="el => setStoveRef(station.id, el)"
              class="station-stove"
              :ready="false"
              :duration="station.cookMs"
              @done="onCooked(station)"
            />

            <!-- Cookware (+ everything that happens ON it, so it tracks it) -->
            <div
              v-if="cookwareOf(station.id)"
              :class="['station-cookware', { 'on-stove': stoveVisible(station.id) }]"
            >
              <component :is="cookwareOf(station.id)" v-bind="cookwareProps(station.id)" />

              <!-- The egg cracking itself open (kept: the effect works) -->
              <div v-if="phases[station.id] === 'crack'" class="cookware-crack">
                <EggSticker body="#f0c08e" outline="#80522a" :cracks="cracks[station.id]" />
              </div>

              <!-- Lo que hay sobre el sartén: crudo al llegar, CUAJÁNDOSE
                   durante la cocción (el alimento se transforma a la vista) -->
              <div v-if="loadVisible(station.id)" class="cookware-load">
                <FriedEggSticker v-if="station.id === 'frito'" :raw="phases.frito !== 'cook'" />
                <ScrambledSticker v-else :variant="phases.revuelto === 'cook' ? 'pan' : 'raw'" />
              </div>

              <!-- The spoon whisks ONLY in the bowl — on the fire it just cooks -->
              <Stir
                v-if="station.id === 'revuelto' && phases.revuelto === 'beat'"
                class="cookware-stir"
              />

              <!-- Cooking ambience -->
              <template v-if="phases[station.id] === 'cook'">
                <Particles v-if="station.id === 'frito'" kind="splatter" class="cookware-particles" />
                <Particles v-else kind="steam" class="cookware-particles" />
              </template>
            </div>

            <!-- The served dish: everything else is gone -->
            <div v-if="phases[station.id] === 'done'" class="station-result">
              <component :is="station.result" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw, nextTick, onBeforeUnmount, reactive, type Component } from 'vue'
import { useT } from '~/composables/useT'
import type { DraggableColor } from '~/primitives/Draggable/Draggable.types'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import DropZone from '~/primitives/DropZone/DropZone.vue'
import Particles from '~/primitives/Particles/Particles.vue'
import { Sounds } from '~/primitives/sounds'
import Stir from '~/primitives/Stir/Stir.vue'
import Stove from '~/primitives/Stove/Stove.vue'
import BoiledEggSticker from '~/sprites/BoiledEggSticker.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'
import EggSticker from '~/sprites/EggSticker.vue'
import FriedEggSticker from '~/sprites/FriedEggSticker.vue'
import PanSticker from '~/sprites/PanSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'
import ScrambledSticker from '~/sprites/ScrambledSticker.vue'
import sceneConfig from './scene.config'
import type { KnowledgePayload } from '~/types/scene'

const props = defineProps<{
  locale?: string
  config?: Record<string, unknown>
}>()

const emit = defineEmits<{
  complete: []
  score: [points: number]
  knowledge: [payload: KnowledgePayload | null]
}>()

const t = useT(sceneConfig.strings, () => props.locale)

type Phase = 'await' | 'arrive' | 'crack' | 'load' | 'beat' | 'swap' | 'cook' | 'done'

interface Station {
  id: 'hervido' | 'frito' | 'revuelto'
  name: string
  /** Mini sprite del utensilio en el badge de la estación (antes emoji) */
  icon: Component
  cookMs: number
  result: Component
  knowledgeTitle: string
  factHtml: string
  factVoice: string
}

const STATIONS: Station[] = [
  {
    id: 'hervido',
    name: t('hervidoName'),
    icon: markRaw(PotSticker),
    cookMs: 3800,
    result: markRaw(BoiledEggSticker),
    knowledgeTitle: t('hervidoKnTitle'),
    factHtml: t('hervidoHtml'),
    factVoice: t('hervidoVoice'),
  },
  {
    id: 'frito',
    name: t('fritoName'),
    icon: markRaw(PanSticker),
    cookMs: 3000,
    result: markRaw(FriedEggSticker),
    knowledgeTitle: t('fritoKnTitle'),
    factHtml: t('fritoHtml'),
    factVoice: t('fritoVoice'),
  },
  {
    id: 'revuelto',
    name: t('revueltoName'),
    icon: markRaw(BowlSticker),
    cookMs: 2800,
    result: markRaw(ScrambledSticker),
    knowledgeTitle: t('revueltoKnTitle'),
    factHtml: t('revueltoHtml'),
    factVoice: t('revueltoVoice'),
  },
]

// Same eggs, varied card tints — the tray gets life without inventing types
const TRAY_COLORS: DraggableColor[] = ['yellow', 'green', 'red']

const phases = reactive<Record<Station['id'], Phase>>({
  hervido: 'await',
  frito: 'await',
  revuelto: 'await',
})
const cracks = reactive<Record<Station['id'], number>>({ hervido: 0, frito: 0, revuelto: 0 })
const stoveRefs: Partial<Record<Station['id'], InstanceType<typeof Stove> | null>> = {}
let completed = false

function setStoveRef(id: Station['id'], el: unknown) {
  stoveRefs[id] = el as InstanceType<typeof Stove> | null
}

/* ── Timeline helpers (all timers cleaned on unmount) ─────────────────────── */

const pending: ReturnType<typeof setTimeout>[] = []
function wait(ms: number) {
  return new Promise<void>((resolve) => {
    pending.push(setTimeout(resolve, ms))
  })
}
onBeforeUnmount(() => pending.forEach(clearTimeout))

/* ── Layer visibility ─────────────────────────────────────────────────────── */

function stoveVisible(id: Station['id']): boolean {
  const p = phases[id]
  if (id === 'hervido') return p === 'arrive' || p === 'cook'
  if (id === 'frito') return p === 'arrive' || p === 'crack' || p === 'load' || p === 'cook'
  return p === 'swap' || p === 'cook' // revuelto: whisking happens off the fire
}

function cookwareOf(id: Station['id']): Component | null {
  const p = phases[id]
  if (p === 'done') return null
  if (id === 'hervido') return markRaw(PotSticker)
  if (id === 'frito') return markRaw(PanSticker)
  return (p === 'swap' || p === 'cook') ? markRaw(PanSticker) : markRaw(BowlSticker)
}

function cookwareProps(id: Station['id']): Record<string, unknown> {
  if (id === 'hervido') return { lid: phases.hervido === 'cook', lidBouncing: phases.hervido === 'cook' }
  if (id === 'revuelto' && (phases.revuelto === 'beat')) return { filled: true }
  return {}
}

function loadVisible(id: Station['id']): boolean {
  const p = phases[id]
  if (id === 'frito') return p === 'load' || p === 'cook'
  if (id === 'revuelto') return p === 'swap' || p === 'cook'
  return false
}

/* ── The automatic show: drag is the kid's ONLY job ───────────────────────── */

function onDrop(station: Station) {
  void runStation(station)
}

async function runStation(station: Station) {
  const id = station.id
  if (id === 'hervido') {
    // Whole egg → pot → lid on → boil
    phases[id] = 'arrive'
    await wait(700)
    await startCook(station)
  }
  else if (id === 'frito') {
    // Egg cracks itself over the pan → sizzles
    phases[id] = 'arrive'
    await wait(700)
    phases[id] = 'crack'
    await runCrack(id)
    phases[id] = 'load'
    await wait(550)
    await startCook(station)
  }
  else {
    // Crack into the bowl (on the counter) → whisk → pour into the pan → fire
    phases[id] = 'crack'
    await runCrack(id)
    phases[id] = 'beat'
    await wait(2600)
    Sounds.play('whoosh')
    phases[id] = 'swap'
    await wait(700)
    await startCook(station)
  }
}

async function runCrack(id: Station['id']) {
  await wait(500) // the egg hovers whole for a beat
  for (let i = 1; i <= 3; i++) {
    cracks[id] = i
    Sounds.play('tick')
    await wait(500)
  }
  Sounds.play('whoosh')
}

async function startCook(station: Station) {
  phases[station.id] = 'cook'
  await nextTick()
  stoveRefs[station.id]?.ignite()
}

function onCooked(station: Station) {
  phases[station.id] = 'done'
  emit('score', 10)
  emit('knowledge', {
    title: station.knowledgeTitle,
    html: station.factHtml,
    voice: station.factVoice,
    visual: { component: station.result },
  })

  if (STATIONS.every(s => phases[s.id] === 'done') && !completed) {
    completed = true
    pending.push(setTimeout(() => {
      Sounds.play('celebrate')
      emit('complete')
    }, 600))
  }
}
</script>

<style scoped>
.station-icon {
  display: block;
  width: 30px;
  height: 22px;
}

.scene {
  position: absolute;
  inset: 0;
  padding: 120px 70px 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  font-family: var(--font-body);
  color: var(--ink);
}

.tray {
  display: flex;
  gap: 28px;
  justify-content: center;
  transition: opacity 200ms ease;
}

.tray-locked {
  pointer-events: none;
  opacity: 0.55;
}

.tray-card {
  min-width: 132px;
  padding: 16px 18px 12px;
  border-radius: 26px;
}

.tray-egg {
  width: 60px;
  height: 78px;
}

/* ── Stations ── */
.stations {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  width: 100%;
  max-width: 1020px;
}

.station {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.station-stage {
  position: relative;
  width: 100%;
}

.station-zone {
  width: 100%;
  min-height: 330px;
}

/* The cookware IS the drop target — no hint arrow/text on top of it */
.station-zone :deep(.drop-zone-empty) {
  display: none;
}

.station-chip-hidden {
  display: none;
}

/* Layered station content — the show is fully automatic, no pointer events */
.station-content {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.station-stove {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
}

.station-cookware {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: 156px;
  height: 104px;
  transition: bottom 340ms cubic-bezier(0.34, 1.2, 0.64, 1);
}

.station-cookware > svg,
.station-cookware > .pot,
.station-cookware > .pan,
.station-cookware > .bowl {
  width: 100%;
  height: 100%;
}

/* Lifts onto the burner plate when the stove appears */
.station-cookware.on-stove {
  bottom: 86px;
}

/* The cracking egg hovers just above the cookware */
.cookware-crack {
  position: absolute;
  left: 50%;
  bottom: 90%;
  transform: translateX(-50%);
  width: 56px;
  height: 72px;
  animation: crack-hover 900ms ease-in-out infinite;
}

@keyframes crack-hover {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-5px); }
}

/* Raw content INSIDE the pan interior (tracks the cookware box) */
.cookware-load {
  position: absolute;
  left: 12%;
  top: 30%;
  width: 56%;
  height: 42%;
}

.cookware-load > * {
  width: 100%;
  height: 100%;
}

/* The spoon dips into the bowl/pan */
.cookware-stir {
  position: absolute;
  left: 26%;
  bottom: 42%;
}

/* Steam/splatter rise from the cookware mouth */
.cookware-particles {
  position: absolute;
  left: 50%;
  bottom: 86%;
  transform: translateX(-50%);
}

/* Cooked result pops in the middle of the cleared station */
.station-result {
  position: absolute;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  width: 176px;
  height: 120px;
  animation: result-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.station-result > * {
  width: 100%;
  height: 100%;
}

@keyframes result-in {
  0% { opacity: 0; transform: translateX(-50%) translateY(-18px) scale(0.6); }
  60% { opacity: 1; transform: translateX(-50%) translateY(4px) scale(1.08); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
</style>
