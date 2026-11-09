<template>
  <!-- Historia · Recorrido (Reconocer), en dos columnas que pesan lo mismo. A la izquierda, la granja: el granero
       grande al fondo y, delante, la gallina con su nido al lado y, echados en el nido, los huevos, uno por camino. A la
       derecha, una tarjeta por cada lugar al que puede llegar el huevo, una encima de otra (la tienda y la casa).
       Las tarjetas no respiran: lo que se puede hacer lo dice la mano. En cada tramo (del
       nido al primer lugar y de un lugar de paso al siguiente), si nadie toca, una mano demuestra el arrastre: presiona
       el huevo, lleva una copia translúcida hasta una de ellas (alternando), que reacciona como al soltar encima, y se
       desvanece. Se elige tocando la tarjeta,
       y el huevo vuela hasta ella, o arrastrando el huevo hasta la tarjeta: la que queda debajo se agranda y se marca en
       cielo (selección); al soltarlo encima, salta a ella; fuera, vuelve a su sitio. Cada lugar al que llega el huevo
       dice en la hoja qué pasa ahí (su nombre y su `fact`); en un lugar de paso, también adónde siguen
       (`strings.next`). Si el lugar tiene interior (`interior`), la tarjeta lo muestra mientras el huevo está ahí,
       y el huevo se posa a su tamaño en su hueco del cartón; cuando se va, vuelve al exterior. Al destino
       la hoja le suma el cierre del recorrido (su `body` o `meta.completionFeedback`), y se queda hasta que la cierran:
       nada cambia solo. El siguiente huevo ya espera en el nido.
       Un lugar de paso ya recorrido queda apagado, con su marca de hecho. La escena se completa con todos los caminos de
       `defaults.routes`. Las tarjetas son las del patrón de las piezas del tablero
       (runner.css): blancas e iguales, planas, con el contorno suave del kit; con escenario (`backdrop` del ítem), el
       mismo marco con el escenario dentro de un margen blanco y el edificio centrado y apoyado en su suelo. -->
  <div ref="layer" class="tb-layer tb-hv">

    <img v-if="origin.svg" class="tb-hv-granja" :src="librarySvg(origin.svg)" alt="" :style="box(FARM.cx - FARM.w / 2, FARM.bottom - FARM.h * 480 / 520, FARM.w, FARM.h)">
    <RiveCharacter
      v-if="henSrc"
      ref="henRef"
      class="tb-hv-gallina"
      :src="henSrc"
      :values="origin.character?.enum"
      :style="box(HEN.cx - HEN.size / 2, HEN.bottom - HEN.size, HEN.size, HEN.size)"
    />
    <img class="tb-hv-nido" :src="librarySvg('nido')" alt="" :style="box(NEST.x, NEST.y, NEST.w, NEST.h)">
    <img class="tb-hv-nido-frente" :src="librarySvg('nido-frente')" alt="" :style="box(NEST.x, NEST.y, NEST.w, NEST.h)">

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
        <img v-if="card.item.backdrop" class="tb-suelo" :src="librarySvg(card.item.backdrop)" alt="" :style="box(SCENERY.strip.x, SCENERY.strip.y, SCENERY.strip.w, SCENERY.strip.h)">
        <img :src="librarySvg(card.item.svg)" alt="" :style="box((CARD.w - ART.w) / 2, artTop(card.item), ART.w, ART.h)">
      </span>
      <img v-if="card.item.interior" class="tb-hv-interior" :src="librarySvg(card.item.interior)" alt="" :style="box(LINE, LINE, CARD.w - LINE * 2, CARD.h - LINE * 2)">
      <span v-if="isDone(card)" class="tb-insignia" data-tone="lime" aria-hidden="true"><UiIcon name="check" /></span>
    </button>

    <!-- El cartón del interior, en dos capas sobre la tarjeta: el fondo detrás del huevo y el frente delante. -->
    <template v-for="card in cards" :key="`carton-${card.item.id}`">
      <span v-if="card.item.interior" class="tb-hv-carton tb-hv-carton-fondo" :class="{ 'is-over': overCard === card.item.id, 'is-inside': isInside(card) }" :style="box(card.x, card.y, CARD.w, CARD.h)">
        <img :src="librarySvg('carton')" alt="" :style="box(CARTON.x, CARTON.y, CARTON.w, CARTON.h)">
      </span>
      <span v-if="card.item.interior" class="tb-hv-carton tb-hv-carton-frente" :class="{ 'is-over': overCard === card.item.id, 'is-inside': isInside(card) }" :style="box(card.x, card.y, CARD.w, CARD.h)">
        <img :src="librarySvg('carton-frente')" alt="" :style="box(CARTON.x, CARTON.y, CARTON.w, CARTON.h)">
      </span>
    </template>

    <img
      v-for="egg in eggs"
      :key="egg.key"
      :ref="(el) => { eggNodes[egg.key] = el as HTMLElement | null }"
      class="tb-hv-huevo"
      :class="{ 'is-flying': egg.flying, 'is-dragging': drag.isDragging(egg.key) }"
      :src="librarySvg(traveler?.svg)"
      alt=""
      :style="eggStyle(egg)"
    >

    <!-- La demostración del arrastre (useDemo): la mano y la copia del huevo que lleva. -->
    <DemoHand :demo="demo.state" :copy="traveler?.svg" :size="EGG" />

    <!-- El agarre del huevo que toca: una zona de 160 sobre él para arrastrarlo (el gesto, en useDrag). -->
    <button
      v-if="activeEgg && phase === 'choose'"
      type="button"
      class="tb-hv-agarre"
      :class="{ 'is-dragging': drag.isDragging(activeEgg.key) }"
      :aria-label="t(traveler?.name)"
      :style="box(eggAt(activeEgg).x - GRAB / 2, eggAt(activeEgg).y - GRAB / 2, GRAB, GRAB)"
      v-bind="drag.bind(activeEgg.key)"
    />
  </div>
</template>

<script setup lang="ts">
import { box, curve, easeInOut, prefersReducedMotion, sceneryCard, useAnimation, useSceneText } from '../board'
import type { Point } from '../board'
import { libraryRive, librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import RiveCharacter from '../RiveCharacter.vue'
import { useDemo } from '../useDemo'
import { useDrag } from '../useDrag'
import { replay } from '../useTimers'
import type { DatosItem, FeedbackPayload, TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, str } = useSceneText(props)

interface Route { stops: string[], body?: string }

const routes = (props.scene.defaults.routes as Route[] | undefined) ?? [{ stops: props.items.map(item => item.id) }]
const traveler: DatosItem | undefined = props.storyboard.datos.items.find(item => item.id === props.scene.defaults.traveler)
const reduced = prefersReducedMotion()
const dur = (ms: number) => (reduced ? 0 : ms)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). Dos columnas que pesan lo mismo, centradas en x 320 y 960.
// A la derecha, las tarjetas de los lugares (320 × 240: lo más alto que cabe en la columna, y 40–580, con 40 entre
// ellas), una encima de otra y centradas en el alto.
// A la izquierda, la granja: el granero grande al fondo (su dibujo mide unos 402 × 363 a este tamaño), con la base 56
// por encima del final de la columna derecha; delante, apoyados donde acaba esa columna, la gallina y, pegado a ella, su
// nido con los huevos echados dentro, uno por camino, lo más cercano a las tarjetas: de ahí sale el vuelo. Entre
// columnas queda el aire para el vuelo. Dentro de cada tarjeta, el lugar arriba, grande y dentro de ella, y el sitio
// del huevo delante, sobre el suelo. ----
const CARD = { w: 320, h: 240, gap: 40 }
const COLUMN = { left: 320, right: 960 }
const origin = props.items[0]!
const others = props.items.slice(1)
const stackH = others.length * CARD.h + Math.max(others.length - 1, 0) * CARD.gap
const stackTop = 300 - stackH / 2
const stackBottom = stackTop + stackH
const FRONT = stackBottom - 4
const FARM = { cx: COLUMN.left, bottom: stackBottom - 56, w: 540, h: 540 * 520 / 580 }
const HEN = { cx: COLUMN.left - 92, bottom: FRONT + 14, size: 280 }
// El nido (lienzo de 1200 × 660 desde 170, 180): el nido entero detrás y su borde anterior delante de los huevos.
const NEST = { x: COLUMN.left + 100 - 125, y: FRONT + 4 - 250 * 660 / 1200, w: 250, h: 250 * 660 / 1200 }
const inNest = (vx: number, vy: number): Point => ({ x: NEST.x + (vx - 170) * NEST.w / 1200, y: NEST.y + (vy - 180) * NEST.w / 1200 })
// Dónde se echa cada huevo (su centro, en el lienzo del nido) y cuánto se inclina, como caen en un nido de verdad: el
// primero que vuela, a la derecha y delante; el otro, a la izquierda, recostado hacia el otro lado.
const NEST_EGGS = [{ vx: 900, vy: 335, r: 18 }, { vx: 690, vy: 325, r: -20 }]
// Dentro de la tarjeta con escenario (`sceneryCard`, board.ts), el marco (LINE: el contorno de 3 y un margen blanco de
// 3) y, abajo, el suelo del lugar (`backdrop`); arriba, el blanco de la tarjeta. El edificio (lienzo 580 × 520, apoyado
// en 480) va centrado y apoyado en ese suelo, a 0,41 de su lienzo: así el más alto (la casa, de 73 a 480) queda dentro
// con aire arriba. Sin suelo, centrado en la tarjeta según lo que ocupa su dibujo (de 90 a 480).
const SCENERY = sceneryCard(CARD.w, CARD.h)
const LINE = SCENERY.line
const ART = { w: 580 * 0.41, h: 520 * 0.41 }
const artTop = (item: DatosItem) => (item.backdrop
  ? SCENERY.ground - ART.h * 480 / 520
  : CARD.h / 2 - ART.h * ((90 + 480) / 2) / 520)
const EGG = { h: 104, w: 104 * 164 / 192 }
const EGG_IN_CARD = 0.68
const GRAB = 160

const cards = others.map((item, i) => ({ item, x: COLUMN.right - CARD.w / 2, y: stackTop + i * (CARD.h + CARD.gap) }))
type Card = typeof cards[number]
const cardOf = (id: string) => cards.find(card => card.item.id === id)
const cardNodes: Record<string, HTMLElement | null> = {}
const henSrc = libraryRive(origin.character?.rive)
const henRef = ref<InstanceType<typeof RiveCharacter> | null>(null)

// Dónde está el huevo (su centro): en el nido; en un lugar con interior (`interior` del ítem), en su hueco del cartón y a
// su tamaño de viaje; sin interior, posado en el suelo del lugar, más pequeño. Los caminos salen del centro del nido.
const farmSpot: Point = inNest(800, 340)
// El cartón (lienzo de 240 × 112, apoyado en 111, huecos en x 70 y 170 con la base del huevo en 98) a 230 de ancho,
// centrado y apoyado donde el interior pone lo que muestra (y 352 de su lienzo de 616 × 456).
const CARTON_K = 230 / 240
const CARTON = { w: 230, h: 112 * CARTON_K, x: (CARD.w - 230) / 2, y: LINE + 352 / 2 - 111 * CARTON_K }
const cupOf = (card: Card, k: number): Point => ({ x: card.x + CARTON.x + (k % 2 ? 170 : 70) * CARTON_K, y: card.y + CARTON.y + 98 * CARTON_K - EGG.h / 2 })
const scaleAt = (id: string) => (cardOf(id)?.item.interior ? 1 : EGG_IN_CARD)
function spotOf(id: string, k = 0): Point {
  const card = cardOf(id)
  if (!card) return farmSpot
  if (card.item.interior) return cupOf(card, k)
  // Con suelo, el huevo se posa delante del edificio, sobre el suelo, a un lado de la entrada (el siguiente, al otro);
  // sin él, abajo a la derecha en la tarjeta.
  if (card.item.backdrop) return { x: card.x + CARD.w * (k % 2 ? 0.36 : 0.64), y: card.y + CARD.h - LINE - 8 - EGG.h * EGG_IN_CARD / 2 }
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
  ...inNest(NEST_EGGS[i % NEST_EGGS.length]!.vx, NEST_EGGS[i % NEST_EGGS.length]!.vy),
  s: 1,
  r: NEST_EGGS[i % NEST_EGGS.length]!.r,
  at: origin.id,
  path: [origin.id],
  rest: false,
  flying: false,
})))
const activeEgg = computed(() => eggs.find(egg => !egg.rest) ?? null)
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
// La tarjeta muestra su interior mientras un huevo está en el lugar (el que se va ya no cuenta) o vuela hacia él.
const entering = ref<string | null>(null)
const isInside = (card: Card) => Boolean(card.item.interior) && (entering.value === card.item.id || eggs.some(egg => egg.at === card.item.id && !egg.flying))
const canGo = (card: Card) => phase.value === 'choose' && !props.blocked && targets.value.includes(card.item.id)
// Un lugar de paso ya recorrido, al que no queda camino abierto, se apaga con su marca de hecho.
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

// El vuelo, cuadro a cuadro (useAnimation: termina siempre, aunque el navegador deje de pintar cuadros).
const flight = useAnimation()

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
  if (egg.at === origin.id) henRef.value?.say('aceptar')
  egg.flying = true
  flight.run(dur(dropped ? 420 : 1100), (s) => {
    const e = easeInOut(s)
    Object.assign(egg, curve(start, c, end, e))
    egg.s = startScale + (endScale - startScale) * e
    egg.r = startRotation * (1 - Math.min(e * 3, 1))
  }, () => {
    egg.flying = false
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

// ---- Arrastrar el huevo (el gesto, en useDrag). Sigue al dedo, derecho y un poco más grande; la tarjeta elegible que queda
// debajo se agranda y se marca. Al soltar encima, salta a ella desde donde se soltó; fuera, vuelve a su sitio, que es
// siempre donde está en la escena (el nido o el cartón del lugar). Un toque sin arrastre: el huevo da un saltito. ----
const layer = ref<HTMLElement | null>(null)
const cardAt = (p: Point) => cards.find(card => p.x >= card.x - 24 && p.x <= card.x + CARD.w + 24 && p.y >= card.y - 24 && p.y <= card.y + CARD.h + 24)

const drag = useDrag<number, string>({
  layer,
  home: key => ({ x: eggs[key]!.x, y: eggs[key]!.y }),
  canStart: key => phase.value === 'choose' && !props.blocked && activeEgg.value?.key === key,
  targetAt: (p) => {
    const card = cardAt(p)
    return card && targets.value.includes(card.item.id) ? card.item.id : null
  },
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
  returnMs: dur(320),
})
watch(() => props.blocked, (blocked) => { if (blocked) drag.cancel() })

// Dónde se dibuja el huevo: su sitio más lo que lo lleva el dedo; levantado, derecho y un poco más grande.
const LIFTED_SCALE = 1.08
const eggAt = (egg: Egg): Point => {
  const o = drag.offsetOf(egg.key)
  return { x: egg.x + o.x, y: egg.y + o.y }
}
function eggStyle(egg: Egg) {
  const lifted = drag.liftedOf(egg.key)
  const s = egg.s * (1 + (LIFTED_SCALE - 1) * lifted)
  const { x, y } = eggAt(egg)
  return {
    ...box(x - EGG.w * s / 2, y - EGG.h * s / 2, EGG.w * s, EGG.h * s),
    rotate: `${egg.r * (1 - lifted)}deg`,
    zIndex: egg.flying || drag.isActive(egg.key) ? 9 : egg.at === origin.id ? 6 - egg.key : 5,
  }
}

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
