<template>
  <!-- Colocar · Emparejar, Ordenar, Recorrido. Plano mesa: los destinos arriba, con su número
       encima; las fichas abajo. Tocar una ficha la lleva al siguiente destino libre y tocarla en
       su destino la devuelve; también se arrastra a un destino concreto. Sin «Comprobar»: al
       llenarse los destinos, el juego responde. -->
  <div ref="layer" class="tb-layer">
    <template v-for="(_, i) in order" :key="`slot-${i}`">
      <span class="tb-numero" :style="box(slotX(i), NUMBER_Y, SLOT, 40)">{{ i + 1 }}</span>
      <div
        :ref="(el) => { slotNodes[i] = el as HTMLElement }"
        :class="['tb-ranura', i === nextSlot && 'is-next', i === overSlot && 'is-over']"
        :style="box(slotX(i), SLOT_Y, SLOT, SLOT)"
      />
      <span v-if="i < n - 1" class="tb-flecha" :style="box(slotX(i) + SLOT + slotGap / 2 - 24, SLOT_Y + SLOT / 2 - 24, 48, 48)">
        <UiIcon name="chevron-right" />
      </span>
    </template>

    <div v-for="piece in pieces" :key="`well-${piece.item.id}`" class="tb-pozo" :style="box(piece.home.x, piece.home.y, TILE, TILE)" />

    <button
      v-for="piece in pieces"
      :key="piece.item.id"
      :ref="(el) => { piece.node = el as HTMLElement }"
      type="button"
      :class="['tb-pieza tb-ficha', piece.dragging && 'is-dragging']"
      :data-tone="piece.item.tone"
      :data-state="piece.slot >= 0 ? 'colocada' : undefined"
      :disabled="done"
      :aria-label="t(piece.item.name)"
      :style="{ ...box(piece.x, piece.y, TILE, TILE), translate: piece.translate, '--delay': piece.delay }"
      @pointerdown="(e) => onDown(piece, e)"
      @pointermove="(e) => onMove(piece, e)"
      @pointerup="(e) => onEnd(piece, e)"
      @pointercancel="(e) => onEnd(piece, e)"
      @click="onClick(piece)"
    >
      <span class="tb-ficha-arte">
        <template v-if="piece.item.nest">
          <img class="tb-nido" :src="librarySvg('nido')" alt="" :style="nestBox()">
          <img class="tb-huevo" :src="librarySvg(piece.item.svg)" alt="" :style="eggBox(piece.item)">
        </template>
        <img v-else class="tb-ficha-img" :src="librarySvg(piece.item.svg)" alt="">
        <span v-if="piece.item.icon" class="tb-insignia"><UiIcon :name="(piece.item.icon as UiIconName)" /></span>
      </span>
      <span v-if="profile.labels" class="tb-ficha-etiqueta">{{ t(piece.item.name) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import { tr } from '~/types/i18n'
import type { I18nText } from '~/types/i18n'
import { librarySvg } from '../content'
import { replay, useTimers } from '../useTimers'
import type { DatosItem, FeedbackPayload, TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

interface Piece {
  item: DatosItem
  home: { x: number, y: number }
  x: number
  y: number
  slot: number
  dragging: boolean
  translate: string
  delay: string
  node: HTMLElement | null
}

const t = (value: I18nText | null | undefined) => (value ? tr(value, props.locale) : '')
const text = (key: string) => t(props.scene.strings?.[key])
const px = (v: number) => `${v}px`
const box = (x: number, y: number, w: number, h: number) => ({ left: px(x), top: px(y), width: px(w), height: px(h) })

// defaults.items es el orden correcto; las fichas nunca empiezan en ese orden.
const order = props.items.map(item => item.id)
const n = order.length
const SLOT = 240
const TILE = 192
const slotGap = n > 2 ? 72 : 120
const TILE_GAP = 48
const MAGNET = 60
const NUMBER_Y = 40
const SLOT_Y = 88
const slotX = (i: number) => 640 - (n * SLOT + (n - 1) * slotGap) / 2 + i * (SLOT + slotGap)
const homeOf = (i: number) => ({ x: 640 - (n * TILE + (n - 1) * TILE_GAP) / 2 + i * (TILE + TILE_GAP), y: 360 })

// Huevo sobre su nido dentro del arte de la ficha (140 × 120), a una misma escala.
const NEST = { cx: 70, baseline: 94, width: 110, ratio: 660 / 1200 }
function nestBox() {
  const h = NEST.width * NEST.ratio
  return box(NEST.cx - NEST.width / 2, NEST.baseline - h * 0.52, NEST.width, h)
}
function eggBox(item: DatosItem) {
  const h = (item.sizeScale ?? 0.68) * 120
  const w = h * 164 / 192
  return box(NEST.cx - w / 2, NEST.baseline - h, w, h)
}

const time = useTimers()
const layer = ref<HTMLElement | null>(null)
const slotNodes = ref<HTMLElement[]>([])
const tray = [...order.slice(1), order[0]!]
const pieces = reactive<Piece[]>(tray.map((id, i) => {
  const home = homeOf(i)
  return { item: props.items.find(it => it.id === id)!, home, x: home.x, y: home.y, slot: -1, dragging: false, translate: '', delay: '0ms', node: null }
}))
const slots = reactive<(string | null)[]>(Array(n).fill(null))
const overSlot = ref(-1)
const done = ref(false)
let misses = 0

// Guiado: el siguiente destino libre se ilumina.
const nextSlot = computed(() => (props.profile.scaffolding === 'guiado' && !done.value ? slots.indexOf(null) : -1))

emit('progress', 0)

function place(piece: Piece, i: number) {
  const occupant = pieces.find(p => p.slot === i && p !== piece)
  if (occupant) back(occupant)
  if (piece.slot >= 0) slots[piece.slot] = null
  slots[i] = piece.item.id
  piece.slot = i
  piece.x = slotX(i) + (SLOT - TILE) / 2
  piece.y = SLOT_Y + (SLOT - TILE) / 2
  emit('progress', slots.filter(Boolean).length / n * 0.6)
  if (slots.every(Boolean)) time.later(check, 360)
}

function back(piece: Piece) {
  if (piece.slot >= 0) slots[piece.slot] = null
  piece.slot = -1
  piece.x = piece.home.x
  piece.y = piece.home.y
}

function tap(piece: Piece) {
  if (props.blocked || done.value) return
  if (piece.slot >= 0) { back(piece); return }
  const free = slots.indexOf(null)
  if (free >= 0) place(piece, free)
}

function check() {
  if (!slots.every(Boolean)) return
  if (slots.every((id, i) => id === order[i])) {
    done.value = true
    pieces.forEach((p, i) => { p.delay = `${i * 120}ms`; replay(p.node, 'is-celebrating') })
    emit('progress', 1)
    emit('complete')
    emit('feedback', { kind: 'success', title: text('completeTitle'), body: t(props.scene.meta.completionFeedback) })
    return
  }
  misses += 1
  // Libre: la pista llega en el segundo error; guiado y pista, en el primero.
  const hint = props.profile.scaffolding === 'libre' && misses < 2 ? text('retry') : text('hint')
  emit('feedback', { kind: 'retry', title: hint })
  slotNodes.value.forEach(node => replay(node, 'is-wrong'))
  time.later(() => pieces.forEach(back), 700)
}

function slotAt(point: { x: number, y: number }) {
  return order.findIndex((_, i) => point.x >= slotX(i) - MAGNET && point.x <= slotX(i) + SLOT + MAGNET && point.y >= SLOT_Y - MAGNET && point.y <= SLOT_Y + SLOT + MAGNET)
}

// Coordenadas del tablero (1280 × 600), con el zoom del marco y el encaje del tablero.
function toBoard(event: PointerEvent) {
  const rect = layer.value!.getBoundingClientRect()
  const k = rect.width / 1280
  return { x: (event.clientX - rect.left) / k, y: (event.clientY - rect.top) / k }
}

// Arrastrar, o tocar y tocar. Un arrastre que termina en un destino coloca la ficha ahí.
let start: { x: number, y: number } | null = null
let moved = false
let dragged = false

function onDown(piece: Piece, event: PointerEvent) {
  if (props.blocked || done.value) return
  start = toBoard(event)
  moved = false
  try { piece.node?.setPointerCapture(event.pointerId) }
  catch { /* opcional */ }
}

function onMove(piece: Piece, event: PointerEvent) {
  if (!start) return
  const point = toBoard(event)
  const dx = point.x - start.x
  const dy = point.y - start.y
  if (!moved && Math.hypot(dx, dy) < 10) return
  if (!moved) { moved = true; piece.dragging = true }
  piece.translate = `${dx}px ${dy - 24}px` // va por encima del dedo
  overSlot.value = slotAt(point)
}

function onEnd(piece: Piece, event: PointerEvent) {
  if (!start) return
  const point = toBoard(event)
  const wasMoved = moved
  start = null
  moved = false
  piece.dragging = false
  piece.translate = ''
  overSlot.value = -1
  if (!wasMoved || event.type === 'pointercancel') return
  dragged = true
  const i = slotAt(point)
  if (i >= 0) place(piece, i)
  else if (piece.slot >= 0) back(piece)
}

// Toque (y teclado): el clic que sigue a un arrastre se descarta.
function onClick(piece: Piece) {
  if (dragged) { dragged = false; return }
  tap(piece)
}

defineExpose({ fit: () => {} })
</script>
