<template>
  <!-- Destapar · Revelar, Contrastar. Plano fila: cada elemento muestra lo que se ve (la pista)
       y tapa lo que se descubre. El grupo dice qué cree que hay debajo y un niño toca para
       destapar; lo descubierto reacciona. -->
  <div ref="layer" class="tb-layer">
    <button
      v-for="(card, i) in cards"
      :key="card.item.id"
      :ref="(el) => { nodes[i] = el as HTMLElement }"
      type="button"
      class="tb-pieza tb-carta"
      :data-tone="card.item.tone"
      :data-state="card.open ? 'abierta' : 'tapada'"
      :aria-label="card.open ? t(card.item.name) : (t(card.item.description) || text('uncover'))"
      :style="box(left(i), TOP, CARD.w, CARD.h)"
      @click="touch(i)"
    >
      <RiveCharacter
        v-if="card.open && riveOf(card.item)"
        :ref="(el) => { birds[i] = el as InstanceType<typeof RiveCharacter> | null }"
        :src="riveOf(card.item)!"
        :values="card.item.character?.enum"
        :style="box((CARD.w - 220) / 2, 4, 220, 220)"
      />
      <span v-if="!card.coverGone" :class="['tb-tapa', card.open && 'is-opening']" :style="box(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h)">
        <span class="tb-marca">?</span>
      </span>
      <img class="tb-nido" :src="nestUrl" alt="" :style="nestBox()">
      <img class="tb-huevo" :src="librarySvg(card.item.svg)" alt="" :style="eggBox(card.item)">
      <span v-if="card.open && profile.labels" class="tb-etiqueta" :style="{ top: `${WINDOW.y + WINDOW.h}px` }">{{ t(card.item.name) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { tr } from '~/types/i18n'
import type { I18nText } from '~/types/i18n'
import { libraryRive, librarySvg } from '../content'
import { useRunnerText } from '../i18n'
import RiveCharacter from '../RiveCharacter.vue'
import { replay, useTimers } from '../useTimers'
import type { DatosItem, FeedbackPayload, TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const CARD = { w: 320, h: 500 }
const GAP = 40
const TOP = 300 - CARD.h / 2
// Una sola escala para todos los huevos: los tamaños relativos son contenido, nunca se igualan.
const EGG_SCALE = 180
const WINDOW = { x: 40, y: 18, w: 240, h: 196 }
const NEST = { cx: CARD.w / 2, baseline: 440, width: 170, ratio: 660 / 1200 }

const t = (value: I18nText | null | undefined) => (value ? tr(value, props.locale) : '')
const text = useRunnerText(() => props.locale)
const px = (v: number) => `${v}px`
const box = (x: number, y: number, w: number, h: number) => ({ left: px(x), top: px(y), width: px(w), height: px(h) })
const left = (i: number) => 640 - (props.items.length * CARD.w + (props.items.length - 1) * GAP) / 2 + i * (CARD.w + GAP)
const nestUrl = computed(() => librarySvg('nido'))
const riveOf = (item: DatosItem) => libraryRive(item.character?.rive)

function nestBox() {
  const h = NEST.width * NEST.ratio
  return box(NEST.cx - NEST.width / 2, NEST.baseline - h * 0.52, NEST.width, h)
}
function eggBox(item: DatosItem) {
  const h = (item.sizeScale ?? 0.68) * EGG_SCALE
  const w = h * 164 / 192
  return box(NEST.cx - w / 2, NEST.baseline - h, w, h)
}

const time = useTimers()
const layer = ref<HTMLElement | null>(null)
const nodes = ref<HTMLElement[]>([])
const birds = ref<(InstanceType<typeof RiveCharacter> | null)[]>([])
const cards = reactive(props.items.map(item => ({ item, open: false, coverGone: false })))
let opened = 0
let idleSince = performance.now()

emit('progress', 0)

// Guiado: tras un rato quieto, una carta todavía tapada asiente para indicar qué se puede tocar.
if (props.profile.scaffolding === 'guiado') {
  time.every(() => {
    if (props.blocked) { idleSince = performance.now(); return }
    if (performance.now() - idleSince < 6000) return
    idleSince = performance.now()
    const i = cards.findIndex(c => !c.open)
    if (i >= 0) replay(nodes.value[i], 'is-nudging')
  }, 1000)
}

function touch(i: number) {
  const card = cards[i]
  if (!card || props.blocked) return
  idleSince = performance.now()
  if (card.open) {
    // Mirar otra vez: el mismo descubrimiento, nada nuevo que ganar.
    birds.value[i]?.say('aceptar')
    emit('feedback', { kind: 'info', title: t(card.item.fact) })
    return
  }
  card.open = true
  time.later(() => { card.coverGone = true }, 320)
  time.later(() => birds.value[i]?.say('aceptar'), 380)
  opened += 1
  const all = opened === cards.length
  emit('progress', opened / cards.length)
  if (all) emit('complete')
  emit('feedback', { kind: 'success', title: t(card.item.fact), body: all ? t(props.scene.meta.completionFeedback) : '' })
}

defineExpose({ fit: () => birds.value.forEach(b => b?.fit()) })
</script>
