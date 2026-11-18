<template>
  <!-- Repasar · Recordar. Plano mesa: armar el recorrido. Arriba, un lugar numerado por cada momento que se repasa (los
       ítems de la escena, en su orden); abajo, sus fichas, revueltas y un poco giradas. El niño lleva cada ficha a su
       lugar, arrastrándola o tocándola (va al primer lugar libre). Si es su lugar, se queda y la hoja dice lo aprendido
       (`name` y `fact`); si no, vuelve a la bandeja y el lugar tiembla, sin hoja ni cuenta. Los lugares se llenan en
       cualquier orden. Con la última, el cierre de la escena: el recorrido armado baja al centro del tablero y crece
       hasta el ancho de los controles del player (ya no hay nada que tocar) y, si una ficha trae un personaje, este
       celebra. Lo que
       lleva cada ficha lo dice `defaults.cards`: un lugar sobre su suelo, unos dibujos o un personaje de Rive. Sin
       mano que demuestre: mostrar el arrastre diría la respuesta. Los lugares y las fichas son los del tablero
       (runner.css, `tb-ranura` y `tb-ficha`). Las reglas, en `repasar.ts`. -->
  <div ref="layer" class="tb-layer tb-re" :class="{ 'is-armed': armed }" :style="ARMED">
    <template v-for="(_, i) in order" :key="`lugar-${i}`">
      <span class="tb-numero" :style="box(slotX(i), SLOT_Y, TILE, TILE)">{{ i + 1 }}</span>
      <div
        :ref="(el) => { slotNodes[i] = el as HTMLElement | null }"
        :class="['tb-ranura', i === drag.state.over && 'is-over']"
        :style="box(slotX(i), SLOT_Y, TILE, TILE)"
      />
      <span v-if="i < count - 1" class="tb-flecha" :style="box(slotX(i) + TILE + GAP / 2 - 24, SLOT_Y + TILE / 2 - 24, 48, 48)">
        <UiIcon name="chevron-right" />
      </span>
    </template>

    <div
      v-for="(piece, i) in pieces"
      :key="piece.item.id"
      :ref="(el) => { boxes[piece.item.id] = el as HTMLElement | null }"
      class="tb-ficha-caja"
      :class="{ 'is-held': drag.isActive(piece.item.id) }"
      :data-state="piece.fixed ? 'colocada' : undefined"
    >
      <button
        :ref="(el) => { piece.node = el as HTMLElement | null }"
        type="button"
        :class="['tb-pieza tb-ficha tb-re-ficha', drag.isDragging(piece.item.id) && 'is-dragging']"
        :data-tilt="i % 3"
        :data-state="piece.fixed ? 'colocada' : undefined"
        :disabled="piece.fixed"
        :aria-label="t(piece.item.name)"
        :style="box(0, 0, TILE, TILE)"
        v-bind="drag.bind(piece.item.id)"
      >
        <img v-if="piece.spec.ground" class="tb-isla" :src="librarySvg(piece.spec.ground)" alt="" decoding="sync" :style="box(SCENERY.island.x, SCENERY.island.y, SCENERY.island.w, SCENERY.island.h)">
        <img
          v-for="(drawing, k) in piece.spec.pieces ?? []"
          :key="k"
          class="tb-re-pieza"
          :src="librarySvg(drawing.svg)"
          alt=""
          decoding="sync"
          :style="drawingStyle(piece.spec, drawing)"
        >
        <span v-if="piece.spec.character && riveOf(piece.spec)" class="tb-re-dentro">
          <RiveCharacter
            :ref="(el) => { characters[piece.index] = el as InstanceType<typeof RiveCharacter> | null }"
            :src="riveOf(piece.spec)!"
            :values="piece.spec.character.values"
            :flags="piece.spec.character.flags"
            :paused="blocked"
            :settle="SETTLE_MS"
            :style="characterBox(piece.spec.character.box)"
          />
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { box, islandTile, prefersReducedMotion, useSceneText } from '../board'
import { libraryRive, librarySvg } from '../content'
import { useWorld } from '../engine/world'
import RiveCharacter from '../RiveCharacter.vue'
import { useDrag } from '../useDrag'
import { replay } from '../useTimers'
import type { DatosItem, FeedbackPayload, TemplateProps } from '../types'
import { createJourney } from './repasar'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, sheet } = useSceneText(props)

type Pair = [number, number]
/**
 * Un dibujo de la ficha, apoyado por el centro de su base: `at` es dónde se apoya (x desde el centro de la ficha, y
 * desde su borde de arriba); sin él, sobre el suelo de la ficha o, si no lo tiene, un poco por debajo de su centro.
 * `drop` es el aire que el dibujo trae debajo de su base, en su propio lienzo (un edificio).
 */
interface Drawing { svg: string, at?: Pair, scale?: number, drop?: number }
/**
 * Un personaje de Rive en la ficha: su archivo, los valores de su View Model, el trigger con que celebra al completar
 * el recorrido (`accept`) y dónde va su lienzo cuadrado (x de su centro desde el centro de la ficha, y de su borde de
 * arriba y su lado). Lo recorta el marco de la ficha.
 */
interface Character { rive: string, values?: Record<string, string>, flags?: Record<string, boolean>, accept?: string, box: [number, number, number] }
/** Lo que lleva una ficha: la isla de su lugar (`ground`), si es un lugar; sus dibujos; o un personaje. */
interface CardSpec { ground?: string, pieces?: Drawing[], character?: Character }
interface Piece {
  item: DatosItem
  spec: CardSpec
  /** Su lugar en el recorrido. */
  index: number
  home: { x: number, y: number }
  x: number
  y: number
  fixed: boolean
  node: HTMLElement | null
}

const specs = (props.scene.defaults.cards ?? {}) as Record<string, CardSpec>
// defaults.items es el recorrido en su orden; las fichas nunca empiezan así.
const order = props.items
const count = order.length

// ---- Medidas (tablero 1280 × 600, columna 120–1160). Los lugares arriba y la bandeja 56 más abajo, centrados en el
// alto del tablero. La ficha mide lo mismo que su lugar: al llegar lo cubre entero. Con cuatro, de 228 y 36 entre
// ellas; con menos, de 240 y 72. ----
const TILE = count >= 4 ? 228 : 240
const GAP = count >= 4 ? 36 : 72
const LINE = 6
const MAGNET = 60
const SLOT_Y = (600 - (TILE * 2 + 56)) / 2
const TRAY_Y = SLOT_Y + TILE + 56
const slotX = (i: number) => 640 - (count * TILE + (count - 1) * GAP) / 2 + i * (TILE + GAP)
const SCENERY = islandTile(TILE, TILE)
// Lo que tarda un personaje en quedar en la pose que piden sus valores: entra ya en ella.
const SETTLE_MS = 700
// Al completarse, el recorrido armado baja al centro del tablero y crece: de la columna del juego al ancho que ocupan
// los controles del player (el tablero menos 48 a cada lado), sin pasar de 1,3. Es el único momento en que algo sale
// de la columna, cuando ya no queda nada que tocar. Crece toda la capa, desde el centro de la fila de arriba.
const ROW = count * TILE + (count - 1) * GAP
const GROW = Math.min((1280 - 48 * 2) / Math.max(ROW, 1), 1.3)
const ARMED = { '--re-grow': GROW, '--re-dy': `${300 - (SLOT_Y + TILE / 2)}px`, 'transformOrigin': `640px ${SLOT_Y + TILE / 2}px` }

function drawingStyle(spec: CardSpec, drawing: Drawing) {
  const scale = drawing.scale ?? 1
  const [dx, y] = drawing.at ?? [0, spec.ground ? SCENERY.back : Math.round(TILE * 0.74)]
  return { left: `${TILE / 2 + dx}px`, top: `${y + (drawing.drop ?? 0) * scale}px`, scale: `${scale}` }
}
const riveOf = (spec: CardSpec) => libraryRive(spec.character?.rive)
// El lienzo va dentro del marco de la ficha, que lo recorta: sus medidas se dan desde la ficha.
const characterBox = ([dx, top, size]: [number, number, number]) => box(TILE / 2 + dx - size / 2 - LINE, top - LINE, size, size)

// ---- El juego: las reglas, en `repasar.ts`; aquí, lo que se ve. ----
// El tiempo de juego de la escena: con el tablero en pausa, las fichas y las esperas se detienen y siguen al volver.
const world = useWorld(() => props.blocked)
const layer = ref<HTMLElement | null>(null)
const slotNodes: (HTMLElement | null)[] = []
const boxes: Record<string, HTMLElement | null> = {}
const characters = ref<(InstanceType<typeof RiveCharacter> | null)[]>([])
const game = createJourney(count)
// La bandeja: las mismas fichas, corridas media vuelta para que ninguna quede bajo su lugar.
const turn = Math.floor(count / 2)
const tray = order.map((_, k) => (k + turn) % count)
const pieces = reactive<Piece[]>(tray.map((index, k) => {
  const home = { x: slotX(k), y: TRAY_Y }
  const item = order[index]!
  return { item, spec: specs[item.id] ?? {}, index, home, x: home.x, y: home.y, fixed: false, node: null }
}))
const pieceOf = (id: string) => pieces.find(p => p.item.id === id)!
/** El recorrido ya está armado y crecido. */
const armed = ref(false)

emit('progress', 0)

// ---- Llevar una ficha a un lugar (arrastrándola hasta él, o tocándola: va al primer lugar libre). Si es el suyo, se
// queda: llega con el resorte del motor, la hoja dice lo aprendido y, con la última, sale el cierre y el personaje
// celebra. Si no, vuelve a la bandeja: tiembla el lugar donde se soltó o, tocada, la ficha. ----
const GROW_MS = 450
// Cuando el recorrido termina de crecer, el personaje vuelve a ajustar su lienzo al tamaño nuevo, para seguir nítido.
const GROWN_MS = GROW_MS + 600
const CELEBRATE_MS = 1300
function arrive(piece: Piece) {
  drag.shift(piece.item.id, () => {
    piece.fixed = true
    piece.x = slotX(piece.index)
    piece.y = SLOT_Y
  }, { arrive: 'soltar' })
  emit('progress', game.progress())
  const all = game.done()
  if (all) emit('complete')
  emit('feedback', sheet('success', piece.item.name, piece.item.fact, all ? props.scene.meta.completionFeedback : null))
  if (!all) return
  world.after(GROW_MS, () => { armed.value = true })
  world.after(GROWN_MS, () => characters.value.forEach(character => character?.fit()))
  world.after(CELEBRATE_MS, () => pieces.forEach((p) => {
    if (p.spec.character?.accept) characters.value[p.index]?.say(p.spec.character.accept)
  }))
}

function tap(piece: Piece) {
  if (props.blocked || piece.fixed) return
  const result = game.tap(piece.index)
  if (result === 'fija') arrive(piece)
  else if (result === 'vuelve') replay(piece.node, 'is-wrong')
}

// Arrastrar (el gesto, en useDrag, con la física del motor), o tocar. Los lugares libres son las zonas: el que queda
// bajo el dedo se marca, sea o no el de la ficha. Solo el suyo la acepta: en otro, suena y vuelve como al soltarla
// fuera. El toque llega por el clic (también con el teclado); el que sigue a un arrastre se descarta.
const drag = useDrag<string, number>({
  layer,
  world,
  home: (id) => { const p = pieceOf(id); return { x: p.x, y: p.y } },
  canStart: id => !props.blocked && !pieceOf(id).fixed,
  zones: () => order.flatMap((_, i) => (game.isFixed(i) ? [] : [{ id: i, x: slotX(i), y: SLOT_Y, w: TILE, h: TILE }])),
  margin: MAGNET,
  accepts: (id, place) => pieceOf(id).index === place,
  drop: (id, place) => {
    if (place === null) return
    const piece = pieceOf(id)
    const result = game.drop(piece.index, place)
    if (result === 'fija') arrive(piece)
    // El lugar tiembla cuando ya se repintó sin su marca de «debajo del dedo»: antes, el repintado se la quitaría.
    else if (result === 'vuelve') nextTick(() => replay(slotNodes[place], 'is-wrong'))
  },
  tap: id => tap(pieceOf(id)),
  lift: -24, // va por encima del dedo
  reduced: prefersReducedMotion(),
})
watch(() => props.blocked, (blocked) => { if (blocked) drag.cancel() })
// Dónde se dibuja la ficha: su sitio más su desplazamiento (el del dedo o el de llegar a su lugar). Se escribe en la
// transformación de su caja, fuera del render de la plantilla: nada del tablero se recalcula mientras se mueve.
function placePiece(piece: Piece) {
  const node = boxes[piece.item.id]
  if (!node) return
  const o = drag.offsetOf(piece.item.id)
  node.style.transform = `translate3d(${piece.x + o.x}px, ${piece.y + o.y}px, 0)`
}
onMounted(() => pieces.forEach(piece => watchEffect(() => placePiece(piece))))

defineExpose({ fit: () => characters.value.forEach(c => c?.fit()) })
</script>
