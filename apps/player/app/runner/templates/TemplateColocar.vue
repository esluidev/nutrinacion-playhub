<template>
  <!-- Colocar · Emparejar, Ordenar, Recorrido. Plano mesa: los destinos arriba, con su número
       encima; las fichas abajo. Tocar una ficha la lleva al siguiente destino libre y tocarla en
       su destino la devuelve; también se arrastra a un destino concreto. Sin «Comprobar»: al
       llenarse los destinos, el juego responde. -->
  <div ref="layer" class="tb-layer" :style="{ '--art-scale': TILE / ART_TILE }">
    <template v-for="(_, i) in order" :key="`slot-${i}`">
      <span class="tb-numero" :style="box(slotX(i), SLOT_Y, SLOT, SLOT)">{{ i + 1 }}</span>
      <div
        :ref="(el) => { slotNodes[i] = el as HTMLElement }"
        :class="['tb-ranura', i === nextSlot && 'is-next', i === drag.state.over && 'is-over']"
        :style="box(slotX(i), SLOT_Y, SLOT, SLOT)"
      />
      <span v-if="i < n - 1" class="tb-flecha" :style="box(slotX(i) + SLOT + slotGap / 2 - 24, SLOT_Y + SLOT / 2 - 24, 48, 48)">
        <UiIcon name="chevron-right" />
      </span>
    </template>

    <button
      v-for="piece in pieces"
      :key="piece.item.id"
      :ref="(el) => { piece.node = el as HTMLElement }"
      type="button"
      :class="['tb-pieza tb-ficha', drag.isActive(piece.item.id) && 'is-held', drag.isDragging(piece.item.id) && 'is-dragging']"
      :data-tone="piece.item.tone"
      :data-state="piece.slot >= 0 ? 'colocada' : undefined"
      :disabled="done"
      :aria-label="t(piece.item.name)"
      :style="{ ...box(piece.x, piece.y, TILE, TILE), translate: held(piece), '--delay': piece.delay }"
      v-bind="drag.bind(piece.item.id)"
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
import { box, prefersReducedMotion, useSceneText } from '../board'
import { librarySvg } from '../content'
import { useDrag } from '../useDrag'
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
  delay: string
  node: HTMLElement | null
}

const { t, str } = useSceneText(props)

// defaults.items es el orden correcto; las fichas nunca empiezan en ese orden.
const order = props.items.map(item => item.id)
const n = order.length
// La ficha mide lo mismo que su destino: al colocarla lo cubre entero, como las cartas de Seedle.
// Su dibujo se hizo para una ficha de 192 y crece en proporción (--art-scale).
const SLOT = 240
const TILE = SLOT
const ART_TILE = 192
const slotGap = n > 2 ? 72 : 120
const TILE_GAP = 48
const MAGNET = 60
// Los destinos arriba, con su número dentro; la bandeja 56 más abajo. Juntos quedan centrados en el
// alto del tablero, con aire abajo para el giro y la base de las fichas.
const SLOT_Y = 32
const TRAY_Y = SLOT_Y + SLOT + 56
const slotX = (i: number) => 640 - (n * SLOT + (n - 1) * slotGap) / 2 + i * (SLOT + slotGap)
const homeOf = (i: number) => ({ x: 640 - (n * TILE + (n - 1) * TILE_GAP) / 2 + i * (TILE + TILE_GAP), y: TRAY_Y })

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
  return { item: props.items.find(it => it.id === id)!, home, x: home.x, y: home.y, slot: -1, delay: '0ms', node: null }
}))
const slots = reactive<(string | null)[]>(Array(n).fill(null))
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
    emit('feedback', { kind: 'success', title: str('completeTitle'), body: t(props.scene.meta.completionFeedback) })
    return
  }
  misses += 1
  // Libre: la pista llega en el segundo error; guiado y pista, en el primero.
  const hint = props.profile.scaffolding === 'libre' && misses < 2 ? str('retry') : str('hint')
  emit('feedback', { kind: 'retry', title: hint })
  slotNodes.value.forEach(node => replay(node, 'is-wrong'))
  time.later(() => pieces.forEach(back), 700)
}

function slotAt(point: { x: number, y: number }) {
  return order.findIndex((_, i) => point.x >= slotX(i) - MAGNET && point.x <= slotX(i) + SLOT + MAGNET && point.y >= SLOT_Y - MAGNET && point.y <= SLOT_Y + SLOT + MAGNET)
}

// Arrastrar (el gesto, en useDrag), o tocar y tocar. Un arrastre que termina en un destino coloca la ficha ahí y sale
// desde donde se soltó; fuera, una ficha colocada vuelve a la bandeja y una de la bandeja, a su sitio. El toque llega por
// el clic (también con el teclado); el que sigue a un arrastre se descarta.
const pieceOf = (id: string) => pieces.find(p => p.item.id === id)!
const drag = useDrag<string, number>({
  layer,
  home: (id) => { const p = pieceOf(id); return { x: p.x, y: p.y } },
  canStart: () => !props.blocked && !done.value,
  targetAt: (point) => { const i = slotAt(point); return i >= 0 ? i : null },
  drop: (id, i) => {
    const piece = pieceOf(id)
    if (i !== null) place(piece, i)
    else if (piece.slot >= 0) back(piece)
  },
  tap: id => tap(pieceOf(id)),
  lift: -24, // va por encima del dedo
  returnMs: prefersReducedMotion() ? 0 : 320,
})
watch(() => props.blocked, (blocked) => { if (blocked) drag.cancel() })
// La ficha en un gesto se dibuja en su sitio más lo que la lleva el dedo.
const held = (piece: Piece) => {
  if (!drag.isActive(piece.item.id)) return undefined
  const o = drag.offsetOf(piece.item.id)
  return `${o.x}px ${o.y}px`
}

defineExpose({ fit: () => {} })
</script>
