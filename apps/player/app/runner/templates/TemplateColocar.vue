<template>
  <!-- Colocar · Emparejar, Ordenar, Recorrido. Plano mesa: los destinos arriba, con su número
       encima; las fichas abajo. Tocar una ficha la lleva al siguiente destino libre y tocarla en
       su destino la devuelve; también se arrastra a un destino concreto. Sin «Comprobar»: al
       llenarse los destinos, el juego responde. Sin mano que demuestre: mostrar el arrastre diría
       la respuesta. Cada ficha va en una caja que lleva su posición con una transformación
       (`placePiece`): cambiar de sitio no recalcula ni repinta el tablero. -->
  <div ref="layer" class="tb-layer" :style="{ '--art-scale': TILE / ART_TILE }">
    <template v-for="(_, i) in order" :key="`slot-${i}`">
      <span class="tb-numero" :style="box(slotX(i), SLOT_Y, SLOT, SLOT)">{{ i + 1 }}</span>
      <div
        :ref="(el) => { slotNodes[i] = el as HTMLElement }"
        :class="['tb-ranura', i === drag.state.over && 'is-over']"
        :style="box(slotX(i), SLOT_Y, SLOT, SLOT)"
      />
      <span v-if="i < n - 1" class="tb-flecha" :style="box(slotX(i) + SLOT + slotGap / 2 - 24, SLOT_Y + SLOT / 2 - 24, 48, 48)">
        <UiIcon name="chevron-right" />
      </span>
    </template>

    <div
      v-for="(piece, i) in pieces"
      :key="piece.item.id"
      :ref="(el) => { boxes[piece.item.id] = el as HTMLElement | null }"
      class="tb-ficha-caja"
      :class="{ 'is-held': drag.isActive(piece.item.id) }"
      :data-state="piece.slot >= 0 ? 'colocada' : undefined"
    >
      <button
        :ref="(el) => { piece.node = el as HTMLElement }"
        type="button"
        :class="['tb-pieza tb-ficha', drag.isDragging(piece.item.id) && 'is-dragging']"
        :data-tone="piece.item.tone"
        :data-tilt="i % 3"
        :data-state="piece.slot >= 0 ? 'colocada' : undefined"
        :disabled="done"
        :aria-label="t(piece.item.name)"
        :style="{ ...box(0, 0, TILE, TILE), '--delay': piece.delay }"
        v-bind="drag.bind(piece.item.id)"
      >
        <span class="tb-ficha-arte">
          <template v-if="piece.item.nest && support">
            <img decoding="sync" class="tb-nido" :src="librarySvg(support.svg)" alt="" :style="nestBox()">
            <img decoding="sync" class="tb-huevo" :src="librarySvg(piece.item.svg)" alt="" :style="eggBox(piece.item)">
            <img v-if="support.front" decoding="sync" class="tb-nido" :src="librarySvg(support.front)" alt="" :style="nestBox()">
          </template>
          <img decoding="sync" v-else class="tb-ficha-img" :src="librarySvg(piece.item.svg)" alt="">
          <span v-if="piece.item.icon" class="tb-insignia"><UiIcon :name="(piece.item.icon as UiIconName)" /></span>
        </span>
        <span v-if="profile.labels" class="tb-ficha-etiqueta">{{ t(piece.item.name) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import { box, prefersReducedMotion, useSceneText } from '../board'
import { librarySvg } from '../content'
import { useWorld } from '../engine/world'
import { useDrag } from '../useDrag'
import { replay } from '../useTimers'
import type { DatosItem, FeedbackPayload, SupportSpec, TemplateProps } from '../types'

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

const { t, str, raw, sheet } = useSceneText(props)

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

// Una pieza con `nest` va asentada en el apoyo de la escena (`defaults.support`: su dibujo y sus medidas los trae la
// escena), dentro del arte de la ficha (140 × 120) y todas a una misma escala: el apoyo, a 110 de ancho, con su
// asiento centrado en x 70, y 94; la base de lo dibujado en la pieza (lienzo de 164 × 192, dibujado hasta y 176)
// descansa en ese asiento y la capa de delante del apoyo la tapa.
const support = props.scene.defaults.support as SupportSpec | undefined
const NEST = { cx: 70, baseline: 94, width: 110 }
const DRAWN_BASE = 176 / 192
function nestBox() {
  if (!support) return {}
  const k = NEST.width / support.w
  const [x, y] = support.seats[0] ?? [support.w / 2, support.h]
  return box(NEST.cx - x * k, NEST.baseline - y * k, support.w * k, support.h * k)
}
function eggBox(item: DatosItem) {
  const h = (item.sizeScale ?? 0.68) * 120
  const w = h * 164 / 192
  return box(NEST.cx - w / 2, NEST.baseline - h * DRAWN_BASE, w, h)
}

// El tiempo de juego de la escena: con el tablero en pausa, las fichas y las esperas se detienen y siguen al volver.
const world = useWorld(() => props.blocked)
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

emit('progress', 0)

// Cambiar de sitio pasa siempre por `drag.shift`: la ficha sigue viéndose donde estaba y llega al nuevo con el resorte.
function place(piece: Piece, i: number) {
  const occupant = pieces.find(p => p.slot === i && p !== piece)
  if (occupant) back(occupant)
  drag.shift(piece.item.id, () => {
    if (piece.slot >= 0) slots[piece.slot] = null
    slots[i] = piece.item.id
    piece.slot = i
    piece.x = slotX(i) + (SLOT - TILE) / 2
    piece.y = SLOT_Y + (SLOT - TILE) / 2
  }, { arrive: 'soltar' })
  emit('progress', slots.filter(Boolean).length / n * 0.6)
  if (slots.every(Boolean)) world.after(360, check)
}

function back(piece: Piece) {
  drag.shift(piece.item.id, () => {
    if (piece.slot >= 0) slots[piece.slot] = null
    piece.slot = -1
    piece.x = piece.home.x
    piece.y = piece.home.y
  })
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
    emit('feedback', sheet('success', raw('completeTitle'), props.scene.meta.completionFeedback))
    return
  }
  misses += 1
  // Libre: la pista llega en el segundo error; guiado y pista, en el primero.
  emit('feedback', sheet('retry', raw(props.profile.scaffolding === 'libre' && misses < 2 ? 'retry' : 'hint')))
  slotNodes.value.forEach(node => replay(node, 'is-wrong'))
  world.after(700, () => pieces.forEach(back))
}

// Arrastrar (el gesto, en useDrag, con la física del motor), o tocar y tocar. Un arrastre que termina en un destino
// coloca la ficha ahí y sale desde donde se soltó, con la velocidad del dedo; fuera, una ficha colocada vuelve a la
// bandeja y una de la bandeja, a su sitio. El toque llega por el clic (también con el teclado); el que sigue a un
// arrastre se descarta.
const pieceOf = (id: string) => pieces.find(p => p.item.id === id)!
const drag = useDrag<string, number>({
  layer,
  world,
  home: (id) => { const p = pieceOf(id); return { x: p.x, y: p.y } },
  canStart: () => !props.blocked && !done.value,
  // Los destinos, con su imán alrededor.
  zones: () => order.map((_, i) => ({ id: i, x: slotX(i), y: SLOT_Y, w: SLOT, h: SLOT })),
  margin: MAGNET,
  drop: (id, i) => {
    const piece = pieceOf(id)
    if (i !== null) place(piece, i)
    else if (piece.slot >= 0) back(piece)
  },
  tap: id => tap(pieceOf(id)),
  lift: -24, // va por encima del dedo
  reduced: prefersReducedMotion(),
})
watch(() => props.blocked, (blocked) => { if (blocked) drag.cancel() })
// Dónde se dibuja la ficha: su sitio más su desplazamiento (el del dedo o el de llegar a un sitio nuevo). Se escribe
// en la transformación de su caja, fuera del render de la plantilla: nada del tablero se recalcula mientras se mueve.
const boxes: Record<string, HTMLElement | null> = {}
function placePiece(piece: Piece) {
  const node = boxes[piece.item.id]
  if (!node) return
  const o = drag.offsetOf(piece.item.id)
  node.style.transform = `translate3d(${piece.x + o.x}px, ${piece.y + o.y}px, 0)`
}
onMounted(() => pieces.forEach(piece => watchEffect(() => placePiece(piece))))

defineExpose({ fit: () => {} })
</script>
