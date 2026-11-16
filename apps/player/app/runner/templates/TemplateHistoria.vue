<template>
  <!-- Historia · Recorrido (Reconocer), en dos columnas que pesan lo mismo. A la izquierda, la granja: el granero
       grande al fondo y, delante, la gallina con su nido al lado y, echados en el nido, los huevos, uno por camino. A la
       derecha, una tarjeta por cada lugar al que puede llegar el huevo, una encima de otra (la tienda y la casa).
       Lo que se puede hacer lo dice la mano. En cada tramo (del
       nido al primer lugar y de un lugar de paso al siguiente), si nadie toca, una mano demuestra el arrastre: presiona
       el huevo, lleva una copia translúcida hasta una de ellas (alternando), que reacciona como al soltar encima, y se
       desvanece. Se elige tocando la tarjeta,
       y el huevo vuela hasta ella, o arrastrando el huevo hasta la tarjeta: la que queda debajo se agranda y se marca en
       cielo (selección); al soltarlo encima, salta a ella; fuera, vuelve a su sitio. Cada lugar al que llega el huevo
       dice en la hoja qué pasa ahí (su nombre y su `fact`); en un lugar de paso, también adónde siguen
       (`strings.next`). Si el lugar tiene interior (`interior`), la tarjeta lo muestra desde que el huevo llega,
       y el huevo se posa a su tamaño en un asiento del apoyo de ese lugar (un cartón); cuando se va, la tarjeta se
       queda por dentro, con el apoyo vacío. El nido del origen y el cartón de cada lugar los nombra la escena, con
       las medidas de su dibujo (`defaults.supports`, por id de ítem). Al destino
       la hoja le suma el cierre del recorrido (su `body` o `meta.completionFeedback`), y se queda hasta que la cierran:
       nada cambia solo. El siguiente huevo ya espera en el nido. Mientras esperan en el nido se puede agarrar
       cualquiera (el más cercano al dedo); el que ya salió termina su camino antes de que salga otro.
       Un lugar de paso ya recorrido queda apagado, por dentro si tiene interior, sin ninguna marca: su estado basta. La escena se completa con todos los caminos de
       `defaults.routes`. Las tarjetas son las del patrón de las piezas del tablero
       (runner.css): blancas e iguales, planas, con el contorno suave del kit; con escenario (`ground` del ítem: la
       isla del lugar), el mismo marco con la isla dentro, sin tocarlo, y el edificio centrado y apoyado en ella. -->
  <div ref="layer" class="tb-layer tb-hv">

    <!-- La base del origen: el suelo donde se apoyan el granero, la gallina y el nido. -->
    <img v-if="origin.ground" class="tb-base" :src="librarySvg(origin.ground)" alt="" decoding="sync" :style="{ left: `${GROUND.x}px`, top: `${GROUND.y}px`, width: `${GROUND.w}px` }">
    <img v-if="origin.svg" class="tb-hv-granja" :src="librarySvg(origin.svg)" alt="" decoding="sync" :style="box(FARM.cx - FARM.w / 2, FARM.bottom - FARM.h * 480 / 520, FARM.w, FARM.h)">
    <RiveCharacter
      v-if="henSrc"
      ref="henRef"
      class="tb-hv-gallina"
      :src="henSrc"
      :values="origin.character?.enum"
      :paused="blocked"
      :style="box(HEN.cx - HEN.size / 2, HEN.bottom - HEN.size, HEN.size, HEN.size)"
    />
    <!-- El apoyo donde espera lo que viaja (`defaults.supports`, el del origen: un nido), en dos capas. -->
    <template v-if="nest && NEST">
      <img class="tb-hv-nido" :src="librarySvg(nest.svg)" alt="" decoding="sync" :style="box(NEST.x, NEST.y, NEST.w, NEST.h)">
      <img v-if="nest.front" class="tb-hv-nido-frente" :src="librarySvg(nest.front)" alt="" decoding="sync" :style="box(NEST.x, NEST.y, NEST.w, NEST.h)">
    </template>

    <button
      v-for="card in cards"
      :key="card.item.id"
      :ref="(el) => { cardNodes[card.item.id] = el as HTMLElement | null }"
      type="button"
      class="tb-pieza tb-tarjeta tb-hv-carta"
      :class="{ 'is-over': overCard === card.item.id, 'is-inside': isInside(card) }"
      :data-done="isDone(card) || undefined"
      :disabled="!canGo(card)"
      :aria-label="t(card.item.name)"
      :style="box(card.x, card.y, CARD.w, CARD.h)"
      @click="tapCard(card)"
    >
      <span class="tb-hv-exterior">
        <img v-if="card.item.ground" class="tb-isla" :src="librarySvg(card.item.ground)" alt="" decoding="sync" :style="box(SCENERY.island.x, SCENERY.island.y, SCENERY.island.w, SCENERY.island.h)">
        <img :src="librarySvg(card.item.svg)" alt="" decoding="sync" :style="box((CARD.w - ART.w) / 2, artTop(card.item), ART.w, ART.h)">
      </span>
      <img v-if="card.item.interior" class="tb-hv-interior" :src="librarySvg(card.item.interior)" alt="" decoding="sync" :style="box(LINE, LINE, CARD.w - LINE * 2, CARD.h - LINE * 2)">
    </button>

    <!-- El apoyo del interior de un lugar (`defaults.supports`, el del lugar: un cartón), en dos capas sobre la
         tarjeta: el fondo detrás de lo que viaja y el frente delante. -->
    <template v-for="card in cards" :key="`carton-${card.item.id}`">
      <template v-if="card.holder">
        <span class="tb-hv-carton tb-hv-carton-fondo" :class="{ 'is-over': overCard === card.item.id, 'is-inside': isInside(card) }" :data-done="isDone(card) || undefined" :style="box(card.x, card.y, CARD.w, CARD.h)">
          <img :src="librarySvg(card.holder.spec.svg)" alt="" decoding="sync" :style="box(card.holder.x, card.holder.y, card.holder.w, card.holder.h)">
        </span>
        <span v-if="card.holder.spec.front" class="tb-hv-carton tb-hv-carton-frente" :class="{ 'is-over': overCard === card.item.id, 'is-inside': isInside(card) }" :data-done="isDone(card) || undefined" :style="box(card.x, card.y, CARD.w, CARD.h)">
          <img :src="librarySvg(card.holder.spec.front)" alt="" decoding="sync" :style="box(card.holder.x, card.holder.y, card.holder.w, card.holder.h)">
        </span>
      </template>
    </template>

    <!-- El huevo: su caja lleva la posición y el dibujo, su tamaño y su giro (`placeEgg`). -->
    <span
      v-for="egg in eggs"
      :key="egg.key"
      :ref="(el) => { eggBoxes[egg.key] = el as HTMLElement | null }"
      class="tb-hv-huevo-caja"
      :style="{ zIndex: egg.flying || drag.isActive(egg.key) ? 9 : egg.at === origin.id ? 6 - egg.key : 5 }"
    >
      <img
        :ref="(el) => { eggNodes[egg.key] = el as HTMLElement | null }"
        class="tb-hv-huevo"
        :class="{ 'is-flying': egg.flying, 'is-dragging': drag.isDragging(egg.key) }"
        :src="librarySvg(traveler?.svg)"
        alt=""
        decoding="sync"
        :style="box(-EGG.w / 2, -EGG.h / 2, EGG.w, EGG.h)"
      >
    </span>

    <!-- La demostración del arrastre (useDemo): la mano y la copia del huevo que lleva. -->
    <DemoHand :demo="demo.state" :copy="traveler?.svg" :size="EGG" />

    <!-- El agarre de cada huevo que se puede llevar: una zona de 160 sobre él para arrastrarlo (el gesto, en useDrag).
         En el nido se pisan: se agarra el huevo más cercano al dedo. -->
    <button
      v-for="egg in (phase === 'choose' ? grabbable : [])"
      :key="`agarre-${egg.key}`"
      :ref="(el) => { grabNodes[egg.key] = el as HTMLElement | null }"
      type="button"
      class="tb-hv-agarre"
      :class="{ 'is-dragging': drag.isDragging(egg.key) }"
      :aria-label="t(traveler?.name)"
      :style="{ width: `${GRAB}px`, height: `${GRAB}px` }"
      v-bind="drag.bind(egg.key)"
    />
  </div>
</template>

<script setup lang="ts">
import { box, curve, easeInOut, ISLAND, prefersReducedMotion, sceneryCard, useAnimation, useSceneText } from '../board'
import type { Point } from '../board'
import { libraryRive, librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { playSound } from '../engine/sound'
import { useWorld } from '../engine/world'
import RiveCharacter from '../RiveCharacter.vue'
import { useDemo } from '../useDemo'
import { useDrag } from '../useDrag'
import { replay } from '../useTimers'
import type { DatosItem, FeedbackPayload, SupportSpec, TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, str } = useSceneText(props)

interface Route { stops: string[], body?: string }

const routes = (props.scene.defaults.routes as Route[] | undefined) ?? [{ stops: props.items.map(item => item.id) }]
// Los apoyos de la escena (`defaults.supports`, por id de ítem): en el origen, donde espera lo que viaja (un nido); en
// un lugar con interior, donde se posa dentro (un cartón). Sus dibujos y las medidas de cada uno los trae la escena.
const supports = (props.scene.defaults.supports ?? {}) as Record<string, SupportSpec>
const traveler: DatosItem | undefined = props.storyboard.datos.items.find(item => item.id === props.scene.defaults.traveler)
const reduced = prefersReducedMotion()
const dur = (ms: number) => (reduced ? 0 : ms)
// El tiempo de juego de la escena: con el tablero en pausa, el vuelo y las piezas se quedan quietos y siguen al volver.
const world = useWorld(() => props.blocked)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). Dos columnas que pesan lo mismo, centradas en x 385 y 984:
// así la base del origen empieza donde empieza la columna (x 120) y las tarjetas terminan donde termina (x 1160).
// A la derecha, las tarjetas de los lugares (352 × 264, con 32 entre ellas: las dos ocupan de y 20 a y 580), una
// encima de otra y centradas en el alto. Lo de dentro de cada tarjeta crece con ella (`K`).
// A la izquierda, la granja: el granero grande al fondo (su dibujo mide unos 402 × 363 a este tamaño), con la base 52
// por encima de donde se apoyan, delante, la gallina y, pegado a ella, su nido con los huevos echados dentro, uno por
// camino, lo más cercano a las tarjetas: de ahí sale el vuelo. Sin base, la gallina y el nido se apoyan donde acaba la
// columna derecha; con base, es el canto de delante de la base el que queda ahí. Entre
// columnas queda el aire para el vuelo. Dentro de cada tarjeta, el lugar arriba, grande y dentro de ella, y el sitio
// del huevo delante, sobre el suelo. ----
const CARD = { w: 352, h: 264, gap: 32 }
const COLUMN = { left: 385, right: 984 }
const origin = props.items[0]!
const others = props.items.slice(1)
const stackH = others.length * CARD.h + Math.max(others.length - 1, 0) * CARD.gap
const stackTop = 300 - stackH / 2
const stackBottom = stackTop + stackH
// Con base (`ground`), el grupo sube lo que la base asoma por delante de la gallina y el nido (34): el canto de
// delante de la base queda a la altura del final de la columna derecha, y las dos columnas terminan en la misma línea.
const LIFT = origin.ground ? 34 : 0
const FRONT = stackBottom - 4 - LIFT
const FARM = { cx: COLUMN.left, bottom: FRONT - 52, w: 540, h: 540 * 520 / 580 }
const HEN = { cx: COLUMN.left - 92, bottom: FRONT + 14, size: 280 }
// El apoyo del origen (un nido), a 250 de ancho, 100 a la derecha del centro de la columna y con su pie 4 por debajo
// de donde se apoya el grupo: entero detrás y su capa de delante por delante de lo que viaja.
const nest = supports[origin.id]
const NEST_W = 250
const WAIT = { x: COLUMN.left + 100, y: FRONT + 4 }
const NEST = nest ? { x: WAIT.x - NEST_W / 2, y: WAIT.y - NEST_W * nest.h / nest.w, w: NEST_W, h: NEST_W * nest.h / nest.w, k: NEST_W / nest.w } : null
// La base del origen (`ground` del ítem), si la trae: la isla de su lugar (`ISLAND`, board.ts), suelta bajo todo el
// grupo. El granero se apoya al fondo de la isla; la gallina y el nido quedan delante, sobre ella. Va centrada bajo el
// granero y el nido juntos (15 a la derecha del centro del granero).
const GROUND = { w: ISLAND.w, x: FARM.cx + 15 - ISLAND.w / 2, y: FARM.bottom - ISLAND.back }
// Dentro de la tarjeta con escenario (`sceneryCard`, board.ts), el marco (LINE: el contorno de 3 y un margen blanco de
// 3) y, abajo, la isla del lugar (`ground` del ítem), que no toca el marco; arriba, el blanco de la tarjeta. El edificio
// (lienzo 580 × 520, apoyado en 480) va centrado y apoyado al fondo de la isla, a 0,40 de su lienzo: así el más alto (la
// casa, de 73 a 480) queda dentro con aire arriba. Sin isla, centrado en la tarjeta según lo que ocupa su dibujo (de 90
// a 480).
const SCENERY = sceneryCard(CARD.w, CARD.h)
const LINE = SCENERY.line
// Lo de dentro de la tarjeta está medido para una de 320 × 240 (308 de ancho por dentro) y crece con ella: el
// edificio, el cartón del interior y el huevo que se posa en el lugar.
const K = (CARD.w - LINE * 2) / 308
const ART = { w: 580 * 0.40 * K, h: 520 * 0.40 * K }
const artTop = (item: DatosItem) => (item.ground
  ? SCENERY.back - ART.h * 480 / 520
  : CARD.h / 2 - ART.h * ((90 + 480) / 2) / 520)
// Lo que viaja mide 120 de alto: es lo único que se agarra y no baja del mínimo de un dibujo jugable.
const EGG = { h: 120, w: 120 * 164 / 192 }
// Dónde espera cada uno de los que viajan (su centro) y cuánto se recuesta: en los asientos del apoyo del origen, en
// su orden (el primero que vuela, el más cercano a las tarjetas). Sin apoyo, de pie y en fila donde iría.
function waitingAt(i: number): Point & { r: number } {
  if (nest && NEST) {
    const [x, y, tilt = 0] = nest.seats[i % nest.seats.length] ?? [nest.w / 2, nest.h]
    return { x: NEST.x + x * NEST.k, y: NEST.y + y * NEST.k - EGG.h / 2, r: tilt }
  }
  return { x: WAIT.x + (i - (routes.length - 1) / 2) * EGG.w, y: WAIT.y - EGG.h / 2, r: 0 }
}
const waiting = routes.map((_, i) => waitingAt(i))
// Lo que viaja, posado en un lugar: delante del edificio, más pequeño (crece con la tarjeta); en un asiento del apoyo
// del lugar, del mismo tamaño que en el origen: un mismo objeto mide lo mismo en todos sus estados.
const EGG_IN_CARD = 0.68 * K
const EGG_IN_CUP = 1
const GRAB = 160

// El apoyo del interior de un lugar (un cartón), a 240 de ancho en una tarjeta de 320 (a la medida de lo que viaja,
// que cabe entero en cada asiento), centrado y con su pie donde el interior pone lo que muestra (y 352 de su lienzo de
// 616 × 456, que en la tarjeta va a la mitad de `K`).
const HOLDER_W = 240
const INTERIOR_STAND = 352
function holderOf(item: DatosItem) {
  const spec = item.interior ? supports[item.id] : undefined
  if (!spec) return null
  const k = HOLDER_W * K / spec.w
  return { spec, k, w: spec.w * k, h: spec.h * k, x: (CARD.w - spec.w * k) / 2, y: LINE + INTERIOR_STAND * K / 2 - (spec.h - (spec.drop ?? 0)) * k }
}
const cards = others.map((item, i) => ({ item, x: COLUMN.right - CARD.w / 2, y: stackTop + i * (CARD.h + CARD.gap), holder: holderOf(item) }))
type Card = typeof cards[number]
const cardOf = (id: string) => cards.find(card => card.item.id === id)
const cardNodes: Record<string, HTMLElement | null> = {}
const henSrc = libraryRive(origin.character?.rive)
const henRef = ref<InstanceType<typeof RiveCharacter> | null>(null)

// Dónde está lo que viaja (su centro): en el origen, en su asiento; en un lugar con interior y su apoyo, en un asiento
// de ese apoyo y a su tamaño de viaje; si no, posado en el suelo del lugar, más pequeño. Los caminos salen del centro
// de los asientos del origen.
const farmSpot: Point = {
  x: waiting.reduce((sum, spot) => sum + spot.x, 0) / waiting.length,
  y: waiting.reduce((sum, spot) => sum + spot.y, 0) / waiting.length,
}
type Holder = NonNullable<ReturnType<typeof holderOf>>
function cupOf(card: Card, holder: Holder, k: number): Point {
  const [x, y] = holder.spec.seats[k % holder.spec.seats.length] ?? [holder.spec.w / 2, holder.spec.h]
  return { x: card.x + holder.x + x * holder.k, y: card.y + holder.y + y * holder.k - EGG.h * EGG_IN_CUP / 2 }
}
const scaleAt = (id: string) => (cardOf(id)?.holder ? EGG_IN_CUP : EGG_IN_CARD)
function spotOf(id: string, k = 0): Point {
  const card = cardOf(id)
  if (!card) return farmSpot
  if (card.holder) return cupOf(card, card.holder, k)
  // Con suelo, el huevo se posa delante del edificio, sobre el suelo, a un lado de la entrada (el siguiente, al otro);
  // sin él, abajo a la derecha en la tarjeta.
  if (card.item.ground) return { x: card.x + CARD.w * (k % 2 ? 0.36 : 0.64), y: card.y + SCENERY.front - EGG.h * EGG_IN_CARD / 2 }
  return { x: card.x + CARD.w * (0.8 - 0.22 * k), y: card.y + CARD.h - 14 - EGG.h * EGG_IN_CARD / 2 }
}

// ---- Los caminos que existen: uno por cada par de paradas seguidas de algún recorrido. No se dibujan: dan la forma del
// vuelo del huevo. Entre columnas, en arco por arriba; entre dos tarjetas de la misma columna, por el aire entre
// columnas; el que se salta lugares, en diagonal y un poco combado hacia arriba, por encima del granero y la gallina. ----
interface Leg { key: string, from: string, to: string, a: Point, c: Point, b: Point }
function makeLeg(from: string, to: string, skips: number): Leg {
  const a = from === origin.id ? farmSpot : spotOf(from)
  const b = spotOf(to)
  const c = Math.abs(b.x - a.x) < 80
    ? { x: Math.min(a.x, b.x) - 560, y: (a.y + b.y) / 2 }
    : skips
      ? { x: a.x + (b.x - a.x) * 0.6, y: a.y + (b.y - a.y) * 0.3 }
      : { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 170 }
  return { key: `${from}>${to}`, from, to, a, b, c }
}
const indexOf = (id: string) => props.items.findIndex(item => item.id === id)
const legs = new Map<string, Leg>()
routes.forEach(route => route.stops.slice(1).forEach((to, j) => {
  const from = route.stops[j]!
  if (!legs.has(`${from}>${to}`)) legs.set(`${from}>${to}`, makeLeg(from, to, Math.abs(indexOf(to) - indexOf(from)) - 1))
}))
const legList = [...legs.values()]


// ---- Los huevos: uno por camino, echados en el nido. Vuela primero el de la derecha, el más cercano a las tarjetas;
// cada uno va de tarjeta en tarjeta, ya derecho, y se queda donde llega. ----
interface Egg { key: number, x: number, y: number, s: number, r: number, at: string, path: string[], rest: boolean, flying: boolean }
const eggs = reactive<Egg[]>(routes.map((_, i) => ({
  key: i,
  x: waiting[i]!.x,
  y: waiting[i]!.y,
  s: 1,
  r: waiting[i]!.r,
  at: origin.id,
  path: [origin.id],
  rest: false,
  flying: false,
})))
// El huevo que sigue su camino: el que ya salió del nido y no ha llegado; si ninguno salió, el primero que espera (el
// que vuela al tocar una tarjeta y el que lleva la mano que demuestra).
const traveling = computed(() => eggs.find(egg => !egg.rest && egg.path.length > 1) ?? null)
const activeEgg = computed(() => traveling.value ?? eggs.find(egg => !egg.rest) ?? null)
// Los que se pueden agarrar: el que va de camino o, mientras ninguno ha salido, cualquiera de los que esperan en el nido.
const grabbable = computed(() => (traveling.value ? [traveling.value] : eggs.filter(egg => !egg.rest)))
const eggNodes: Record<number, HTMLElement | null> = {}

// ---- El juego. ----
type Phase = 'choose' | 'fly' | 'done'
const phase = ref<Phase>('choose')
const doneRoutes = ref<number[]>([])
let completed = false

// Los recorridos que siguen abiertos para el huevo: los que no se han contado y empiezan como lo que ya recorrió.
const openRoutes = () => {
  const egg = activeEgg.value
  if (!egg) return []
  return routes
    .map((route, i) => ({ route, i }))
    .filter(({ route, i }) => !doneRoutes.value.includes(i) && egg.path.every((stop, j) => route.stops[j] === stop) && route.stops.length > egg.path.length)
}
const targets = computed(() => {
  void doneRoutes.value
  const egg = activeEgg.value
  return egg ? [...new Set(openRoutes().map(({ route }) => route.stops[egg.path.length]!))] : []
})
// La tarjeta muestra su interior desde que un huevo vuela hacia el lugar y lo conserva cuando el huevo sigue su camino:
// un lugar por el que ya pasó un huevo se queda por dentro, con su cartón vacío (Luis, 2026-11-13).
const entering = ref<string | null>(null)
const isInside = (card: Card) => Boolean(card.item.interior) && (entering.value === card.item.id || eggs.some(egg => egg.path.includes(card.item.id)))
const canGo = (card: Card) => phase.value === 'choose' && !props.blocked && targets.value.includes(card.item.id)
// Un lugar de paso ya recorrido, al que no queda camino abierto, se apaga. Sin marca: el estado de la tarjeta basta.
const isDone = (card: Card) => {
  const passed = routes.some((route, i) => doneRoutes.value.includes(i) && route.stops.slice(1, -1).includes(card.item.id))
  return passed && !targets.value.includes(card.item.id)
}

function progress() {
  const egg = activeEgg.value
  const open = openRoutes()[0]?.route
  const within = egg && open ? (egg.path.length - 1) / (open.stops.length - 1) : 0
  emit('progress', Math.min((doneRoutes.value.length + within * 0.9) / routes.length, 1))
}
emit('progress', 0)

// El vuelo, cuadro a cuadro y en el tiempo de juego (useAnimation: termina siempre, aunque el navegador deje de pintar
// cuadros, y se detiene con el tablero en pausa).
const flight = useAnimation(world)

// Tocar una tarjeta: el huevo vuela hasta ella por su camino y se endereza al salir del nido.
function tapCard(card: Card) {
  const egg = activeEgg.value
  if (!egg || !canGo(card) || drag.busy()) return
  demo.stop()
  launch(egg, card, false)
}

// El vuelo hasta la tarjeta. Tras un arrastre, un salto corto desde donde se soltó.
function launch(egg: Egg, card: Card, dropped: boolean) {
  const leg = legs.get(`${egg.at}>${card.item.id}`)!
  const final = !legList.some(next => next.from === card.item.id)
  const k = final ? eggs.filter(other => other.rest && other.at === card.item.id).length : 0
  const end = spotOf(card.item.id, k)
  const endScale = scaleAt(card.item.id)
  entering.value = card.item.id
  const start = { x: egg.x, y: egg.y }
  const c = dropped ? { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 60 } : leg.c
  const startScale = egg.s
  const startRotation = egg.r
  phase.value = 'fly'
  eggNodes[egg.key]?.classList.remove('is-hopping')
  // El personaje del origen responde cuando sale uno de los que viajan, con su trigger (`character.accept`), si lo trae.
  if (egg.at === origin.id && origin.character?.accept) henRef.value?.say(origin.character.accept)
  // Tras un arrastre ya sonó al soltarlo; con un toque en la tarjeta, suena al salir y al posarse.
  if (!dropped) playSound('volar')
  egg.flying = true
  flight.run(dur(dropped ? 420 : 1100), (s) => {
    const e = easeInOut(s)
    Object.assign(egg, curve(start, c, end, e))
    egg.s = startScale + (endScale - startScale) * e
    egg.r = startRotation * (1 - Math.min(e * 3, 1))
  }, () => {
    egg.flying = false
    if (!dropped) playSound('soltar')
    land(egg, card, final)
  })
}

function land(egg: Egg, card: Card, final: boolean) {
  egg.at = card.item.id
  egg.path = [...egg.path, card.item.id]
  egg.s = scaleAt(card.item.id)
  entering.value = null
  replay(cardNodes[card.item.id], 'is-landing')
  if (final) {
    finish(egg, card)
    return
  }
  progress()
  // Un lugar de paso: qué pasa aquí y adónde siguen (`strings.next`); el huevo espera en el borde y la mano demuestra el tramo.
  emit('feedback', { kind: 'info', title: t(card.item.name), body: [t(card.item.fact), str('next')].filter(Boolean).join(' ') })
  phase.value = 'choose'
}

// El destino: qué pasa ahí y el cierre del recorrido. La hoja se queda hasta que la cierran.
function finish(egg: Egg, card: Card) {
  const index = routes.findIndex(route => route.stops.length === egg.path.length && route.stops.every((stop, j) => stop === egg.path[j]))
  if (index >= 0 && !doneRoutes.value.includes(index)) doneRoutes.value = [...doneRoutes.value, index]
  egg.rest = true
  const route = routes[index]
  const closing = route?.body ? str(route.body) : t(props.scene.meta.completionFeedback)
  emit('feedback', { kind: 'success', title: t(card.item.name), body: [t(card.item.fact), closing].filter(Boolean).join(' ') })
  if (doneRoutes.value.length === routes.length) {
    phase.value = 'done'
    progress()
    if (!completed) { completed = true; emit('complete') }
    return
  }
  // Hay otro recorrido: el siguiente huevo ya espera en el nido.
  phase.value = 'choose'
  progress()
}

// ---- Arrastrar el huevo (el gesto, en useDrag, con la física del motor). Sigue al dedo y, al levantarlo, se endereza
// y crece un poco; la tarjeta elegible que queda debajo se agranda y se marca. Al soltar encima, salta a ella desde donde
// se soltó; fuera, sigue con la velocidad del dedo y vuelve a su sitio, que es siempre donde está en la escena (el nido
// o el cartón del lugar). Un toque sin arrastre: el huevo da un saltito. ----
const layer = ref<HTMLElement | null>(null)

const drag = useDrag<number, string>({
  layer,
  world,
  home: key => ({ x: eggs[key]!.x, y: eggs[key]!.y }),
  pieces: () => grabbable.value.map(egg => egg.key),
  canStart: key => phase.value === 'choose' && !props.blocked && grabbable.value.some(egg => egg.key === key),
  // Las tarjetas a las que puede ir, con 24 de holgura alrededor.
  zones: () => cards.filter(card => targets.value.includes(card.item.id)).map(card => ({ id: card.item.id, x: card.x, y: card.y, w: CARD.w, h: CARD.h })),
  margin: 24,
  press: () => demo.stop(),
  // Sobre una tarjeta a la que puede ir, el huevo se queda donde se soltó, tal como se ve, y salta desde ahí.
  drop: (key, target, { offset }) => {
    const egg = eggs[key]
    const card = target ? cardOf(target) : undefined
    if (!egg || !card || !canGo(card)) return
    egg.x += offset.x
    egg.y += offset.y
    egg.s *= LIFTED_SCALE
    egg.r = 0
    launch(egg, card, true)
  },
  tap: (key) => { if (phase.value === 'choose') replay(eggNodes[key], 'is-hopping') },
  settle: () => demo.stop(),
  lift: -12, // por encima del dedo
  reduced,
})
watch(() => props.blocked, (blocked) => { if (blocked) drag.cancel() })

// Dónde se dibuja el huevo: su sitio más lo que lo lleva el dedo; levantado, derecho y un poco más grande. Se mueve
// solo con transformaciones y fuera del render de la plantilla: cada cuadro del arrastre o del vuelo escribe la
// transformación de su caja (la posición), y el tamaño y el giro de su dibujo, que crece y gira sobre el centro de su
// base. Nada del tablero se recalcula ni se repinta mientras se mueve.
const LIFTED_SCALE = 1.08
const eggBoxes: Record<number, HTMLElement | null> = {}
const eggAt = (egg: Egg): Point => {
  const o = drag.offsetOf(egg.key)
  return { x: egg.x + o.x, y: egg.y + o.y }
}
function placeEgg(egg: Egg) {
  const boxNode = eggBoxes[egg.key]
  const node = eggNodes[egg.key]
  if (!boxNode || !node) return
  const lifted = drag.liftedOf(egg.key)
  const s = egg.s * (1 + (LIFTED_SCALE - 1) * lifted)
  const { x, y } = eggAt(egg)
  // El dibujo crece desde su base: la caja baja la mitad de lo que crece, y su centro queda en (x, y).
  boxNode.style.transform = `translate3d(${x}px, ${y + EGG.h * (s - 1) / 2}px, 0)`
  node.style.scale = `${s}`
  node.style.rotate = `${egg.r * (1 - lifted)}deg`
}
// El agarre de cada huevo lo sigue, también solo con su transformación (después de que el agarre exista en la página).
const grabNodes: Record<number, HTMLElement | null> = {}
onMounted(() => {
  eggs.forEach(egg => watchEffect(() => placeEgg(egg)))
  eggs.forEach(egg => watchEffect(() => {
    if (phase.value !== 'choose' || !grabbable.value.includes(egg)) return
    const node = grabNodes[egg.key]
    if (!node) return
    const { x, y } = eggAt(egg)
    node.style.transform = `translate3d(${x - GRAB / 2}px, ${y - GRAB / 2}px, 0)`
  }, { flush: 'post' }))
})

// ---- Demostrar el arrastre (la mano, en useDemo) en cada tramo: del nido al primer lugar y de un lugar de paso al
// siguiente. La mano presiona el huevo que toca y lleva su copia por el camino del vuelo hasta una tarjeta a la que puede
// ir (la siguiente vez, la otra). La primera de cada tramo, al poco: 1,5 s al empezar la escena, 2 s en un lugar de paso
// y 6 s con un huevo nuevo (la hoja del recorrido anterior se está escuchando); luego, cada 6 s sin tocar. ----
const demo = useDemo<string>({
  ready: () => Boolean(activeEgg.value) && phase.value === 'choose' && !props.blocked && !drag.busy(),
  step: () => `${activeEgg.value?.key}:${activeEgg.value?.path.length}`,
  first: () => ((activeEgg.value?.path.length ?? 1) > 1 ? 2000 : doneRoutes.value.length ? 6000 : 1500),
  move: (n) => {
    const egg = activeEgg.value
    const ids = targets.value
    const card = egg && ids.length ? cardOf(ids[n % ids.length]!) : undefined
    if (!egg || !card) return null
    return {
      from: { x: egg.x, y: egg.y },
      to: spotOf(card.item.id),
      via: legs.get(`${egg.at}>${card.item.id}`)?.c,
      target: card.item.id,
      scale: [egg.s, scaleAt(card.item.id)],
    }
  },
  reduced,
})

// La tarjeta marcada: la que queda bajo el huevo arrastrado o, en la demostración, la que la mano elige.
const overCard = computed(() => drag.state.over ?? demo.state.over)

defineExpose({ fit: () => henRef.value?.fit() })
</script>
