<template>
  <!-- Estaciones · Simular. Plano fila. Arriba, una tarjeta por estación (cada ítem de la escena) con su escenario
       dentro (`interior` del ítem): sobre la mesa, la estufa (`defaults.stove`) con el utensilio de la estación (`svg`)
       y, delante, el plato (`defaults.plate`). Abajo, al centro, el origen común (`defaults.origin`: un cartón, una
       canasta) con una pieza por estación (`defaults.traveler`). El niño arrastra la pieza que quiera a la estación que
       quiera (o toca una tarjeta libre y sale la más cercana) y todo ocurre dentro de la tarjeta: lo que llega cae en
       el utensilio, recién puesto; con el dedo mantenido sobre la tarjeta se enciende la llama y lo de dentro pasa
       poco a poco a hecho; al levantar el dedo, si ya está hecho, pasa al plato; si todavía no, tiembla y se queda
       como iba. Cada estación recibe una sola pieza: otra que se suelte en una tarjeta ocupada vuelve al origen. No hay
       orden obligado ni forma de pasarse: una vez hecho, se queda hecho. Si nadie toca, la mano demuestra lo que toca
       hacer: arrastrar una pieza a una tarjeta libre o mantener el dedo en una que espera.
       Las piezas son dibujos sueltos de la librería, cada uno a la escala del tablero y con sus puntos de apoyo: la
       plantilla los compone. La estufa, la llama, el utensilio, lo de dentro y lo que se mueve encima forman el fogón,
       que se coloca y se escala entero (`defaults.stove`); el plato va aparte, delante. -->
  <div ref="layer" class="tb-layer tb-es">
    <button
      v-for="(st, i) in stations"
      :key="st.item.id"
      :ref="(el) => { cardNodes[i] = el as HTMLElement | null }"
      type="button"
      class="tb-pieza tb-tarjeta tb-es-carta"
      :class="{ 'is-over': overCard === i, 'is-held': hold.state.id === i }"
      :data-state="st.state"
      :data-stir="st.item.station?.tool ? '' : undefined"
      :aria-label="t(st.item.name)"
      :style="box(columnX(i), CARD_Y, CARD.w, CARD.h)"
      v-bind="hold.bind(i)"
      @click="tapCard(i)"
    >
      <span class="tb-es-escena">
        <img v-if="st.item.interior" class="tb-es-interior" :src="librarySvg(st.item.interior)" alt="" decoding="sync">
        <!-- El fogón: la estufa, su llama, el utensilio con lo de dentro y lo que se mueve encima. Su origen es el
             centro de la base de la estufa. -->
        <span :ref="(el) => { fogonNodes[i] = el as HTMLElement | null }" class="tb-es-fogon" :style="{ ...at(STOVE.at), scale: `${STOVE.scale}` }">
          <img v-if="stove" class="tb-es-apoyado" :src="librarySvg(stove.svg)" alt="" decoding="sync">
          <!-- La llama: varias lenguas sobre el quemador, cada una con su tamaño y su ritmo. -->
          <span v-if="flame" class="tb-es-llama" :style="at(STOVE.burner)">
            <span v-for="(tongue, k) in TONGUES" :key="k" class="tb-es-lengua" :style="{ left: `${tongue.x}px`, '--alto': tongue.size, '--ritmo': `${tongue.beat}ms`, '--desfase': `${tongue.offset}ms`, '--turno': k }">
              <img class="tb-es-apoyado" :src="librarySvg(flame.svg)" alt="" decoding="sync">
            </span>
          </span>
          <img class="tb-es-utensilio" :src="librarySvg(st.item.svg)" alt="" decoding="sync" :style="anchored(st.item)">
          <!-- Lo que se mueve encima va metido en lo de dentro: su pala queda debajo y solo asoma el mango. -->
          <span v-if="st.item.station?.tool" class="tb-es-util" :style="toolStyle(st.item)">
            <img :src="librarySvg(st.item.station.tool.svg)" alt="" decoding="sync" :style="{ translate: `${-st.item.station.tool.pivot[0]}px ${-st.item.station.tool.pivot[1]}px` }">
          </span>
          <span :ref="(el) => { foodNodes[i] = el as HTMLElement | null }" class="tb-es-comida" :style="at(insideOf(st.item))">
            <img v-if="st.item.station?.raw" class="tb-es-apoyado" :src="librarySvg(st.item.station.raw)" alt="" decoding="sync" :style="{ scale: `${st.item.station.rawScale ?? 1}` }">
            <img v-if="st.item.station?.done" :ref="(el) => { doneNodes[i] = el as HTMLElement | null }" class="tb-es-apoyado tb-es-hecho" :src="librarySvg(st.item.station.done)" alt="" decoding="sync">
          </span>
          <img v-if="st.item.station?.front" class="tb-es-utensilio" :src="librarySvg(st.item.station.front)" alt="" decoding="sync" :style="anchored(st.item)">
        </span>
        <img v-if="plate" class="tb-es-apoyado" :src="librarySvg(plate.svg)" alt="" decoding="sync" :style="at(plate.at)">
        <span class="tb-es-servido" :class="{ 'is-celebrating': celebrating }" :style="{ ...at(servedAt), '--delay': `${i * 90}ms` }">
          <img v-if="st.item.station?.served" class="tb-es-apoyado" :src="librarySvg(st.item.station.served)" alt="" decoding="sync" :style="{ scale: `${st.item.station.servedScale ?? 1}` }">
        </span>
      </span>
    </button>

    <!-- El origen, en dos capas: el fondo detrás de las piezas y el frente delante. -->
    <img v-if="origin?.svg" class="tb-es-origen" :src="librarySvg(origin.svg)" alt="" decoding="sync" :style="box(ORIGIN.x, ORIGIN.y, ORIGIN.w, ORIGIN.h)">
    <img v-if="origin?.front" class="tb-es-origen tb-es-origen-frente" :src="librarySvg(origin.front)" alt="" decoding="sync" :style="box(ORIGIN.x, ORIGIN.y, ORIGIN.w, ORIGIN.h)">

    <!-- Lo que viaja: su caja lleva la posición y el dibujo, su tamaño, su giro y su opacidad (`placeEgg`). -->
    <span
      v-for="egg in eggs"
      :key="egg.key"
      :ref="(el) => { eggBoxes[egg.key] = el as HTMLElement | null }"
      class="tb-hv-huevo-caja"
      :style="{ zIndex: egg.place === 'vuelo' || drag.isActive(egg.key) ? 9 : 5 }"
    >
      <img
        :ref="(el) => { eggNodes[egg.key] = el as HTMLElement | null }"
        class="tb-hv-huevo"
        :class="{ 'is-flying': egg.place === 'vuelo' && !egg.dropped, 'is-dragging': drag.isDragging(egg.key) }"
        :src="librarySvg(traveler?.svg)"
        alt=""
        decoding="sync"
        :style="box(-EGG.w / 2, -EGG.h / 2, EGG.w, EGG.h)"
      >
    </span>

    <!-- La demostración (useDemo): la mano y, si demuestra el arrastre, la copia de lo que lleva. -->
    <DemoHand :demo="demo.state" :copy="demoCopy" :size="EGG" />

    <!-- El agarre de cada pieza que espera en el origen: una zona de 160 sobre ella (el gesto, en useDrag). -->
    <button
      v-for="egg in grabbable"
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
import { box, curve, easeInOut, prefersReducedMotion, useSceneText } from '../board'
import type { Point } from '../board'
import { librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { haptic } from '../engine/haptics'
import { createSustain, playSound } from '../engine/sound'
import { createWobble } from '../engine/wobble'
import { useWorld } from '../engine/world'
import { useDemo } from '../useDemo'
import { useDrag } from '../useDrag'
import { useHold } from '../useHold'
import { replay } from '../useTimers'
import type { DatosItem, FeedbackPayload, TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, str, raw, sheet } = useSceneText(props)

/** El origen común de las piezas (`defaults.origin`): su dibujo en dos capas, su lienzo y dónde se sienta cada pieza. */
interface Origin { svg: string, front?: string, w: number, h: number, seats: number[], base: number }

/** La estufa: su dibujo, dónde se apoya en el escenario de la tarjeta, a qué escala va el fogón entero y, desde el
 *  centro de su base, dónde descansa el utensilio (`rest`) y dónde nace la llama (`burner`). */
interface Stove { svg: string, at: [number, number], scale?: number, rest: [number, number], burner: [number, number] }
/** El plato: su dibujo, dónde se apoya en el escenario de la tarjeta y, desde el centro de su base, dónde descansa lo servido. */
interface Plate { svg: string, at: [number, number], inside: [number, number] }

const origin = props.scene.defaults.origin as Origin | undefined
const stove = props.scene.defaults.stove as Stove | undefined
const plate = props.scene.defaults.plate as Plate | undefined
const traveler: DatosItem | undefined = props.storyboard.datos.items.find(item => item.id === props.scene.defaults.traveler)
/** La llama: el dibujo de una lengua y cuántas se reparten a lo ancho del quemador. */
interface Flame { svg: string, width?: number, count?: number }
const flame = props.scene.defaults.flame as Flame | undefined
/** Lo que hay que mantener el dedo para que quede hecho, en milisegundos de juego. */
const HOLD_MS = (props.scene.defaults.holdMs as number | undefined) ?? 4000
const reduced = prefersReducedMotion()
const dur = (ms: number) => (reduced ? 0 : ms)
// El tiempo de juego de la escena: con el tablero en pausa, los vuelos, las piezas y la cocción se quedan quietos.
const world = useWorld(() => props.blocked)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). Arriba, una tarjeta por estación, de 320 × 280 y con 40 entre
// ellas. Su escenario ocupa la tarjeta entera por dentro del marco (308 × 268): ahí se colocan el fogón y el plato, en
// coordenadas del escenario. Abajo, a 40 de las tarjetas, el origen centrado, con una pieza por estación en sus
// asientos. La pieza (lienzo de 164 × 192) mide 150 de alto y se agarra por una zona de 160. El conjunto va centrado
// en el alto. ----
const CARD = { w: 320, h: 280 }
const GAP = 40
const LINE = 6
const STOVE = { at: stove?.at ?? [154, 220], scale: stove?.scale ?? 1, rest: stove?.rest ?? [0, 0], burner: stove?.burner ?? [0, 0] }
const EGG = { h: 150, w: 150 * 164 / 192 }
const GRAB = 160
const TOP_GAP = 40
const SEAT_PITCH = 192
const count = props.items.length
const columnX = (i: number) => 640 - (count * CARD.w + (count - 1) * GAP) / 2 + i * (CARD.w + GAP)
const originSize = { w: origin?.w ?? SEAT_PITCH * count, h: origin?.h ?? EGG.h, base: origin?.base ?? EGG.h }
// Lo que asoma la pieza por encima del origen.
const rise = Math.max(0, EGG.h - originSize.base)
const CARD_Y = (600 - (CARD.h + TOP_GAP + rise + originSize.h)) / 2
const ORIGIN = { x: 640 - originSize.w / 2, y: CARD_Y + CARD.h + TOP_GAP + rise, w: originSize.w, h: originSize.h }
const seats = origin?.seats ?? props.items.map((_, i) => originSize.w / 2 + (i - (count - 1) / 2) * SEAT_PITCH)
const seatOf = (i: number): Point => ({ x: ORIGIN.x + seats[i % seats.length]!, y: ORIGIN.y + originSize.base - EGG.h / 2 })
// Dentro del utensilio la pieza llega más pequeña y se desvanece: lo que queda es el dibujo de la estación.
const IN_SCALE = 0.46
// Las lenguas de la llama, repartidas a lo ancho del quemador: las de los extremos, más altas; las de dentro, de
// alturas distintas. Cada una baila a su ritmo y desfasada de las demás, para que el fuego no lata como un bloque.
const lastTongue = (flame?.count ?? 0) - 1
const TONGUES = Array.from({ length: flame?.count ?? 0 }, (_, k) => {
  const last = lastTongue
  const edge = k === 0 || k === last
  return {
    x: last ? -(flame?.width ?? 0) / 2 + k * (flame?.width ?? 0) / last : 0,
    size: edge ? 1.5 : [0.8, 0.98, 0.86][k % 3]!,
    beat: 340 + (k * 67) % 190,
    offset: -((k * 113) % 400),
  }
})
const LIFTED_SCALE = 1.08
// Cómo se recuesta cada pieza en su asiento.
const TILT = [-5, 4, -3]

// ---- Las estaciones. ----
type StationState = 'vacia' | 'llega' | 'cruda' | 'firme' | 'servida'
const stations = reactive(props.items.map(item => ({ item, state: 'vacia' as StationState })))
// Cuánto lleva hecho cada una, de 0 a 1. Fuera de lo reactivo: cambia en cada cuadro mientras se mantiene el dedo.
const cooked = props.items.map(() => 0)
const cardNodes: (HTMLElement | null)[] = []
const fogonNodes: (HTMLElement | null)[] = []
const foodNodes: (HTMLElement | null)[] = []
const doneNodes: (HTMLElement | null)[] = []
const celebrating = ref(false)
let served = 0
let early = 0
let hinted = false

// ---- Componer las piezas. Cada dibujo va a la escala del tablero; se coloca por un punto.
type Pair = readonly [number, number] | readonly number[]
/** Un punto dentro de su capa (el escenario de la tarjeta o el fogón). */
const at = (point: Pair) => ({ left: `${point[0]}px`, top: `${point[1]}px` })
/** El utensilio, con su punto de apoyo (`anchor`, en su lienzo) sobre la parrilla de la estufa. */
const anchored = (item: DatosItem) => {
  const [ax, ay] = item.station?.anchor ?? [0, 0]
  return { ...at(STOVE.rest), translate: `${-ax}px ${-ay}px` }
}
/** Dónde descansa lo de dentro del utensilio, en el fogón. */
const insideOf = (item: DatosItem): [number, number] => {
  const [ax, ay] = item.station?.anchor ?? [0, 0]
  const [ix, iy] = item.station?.inside ?? [ax, ay]
  return [STOVE.rest[0]! + ix - ax, STOVE.rest[1]! + iy - ay]
}
/** Lo que se mueve encima: su pivote, desde donde descansa lo de dentro, con su giro y su tamaño. */
const toolStyle = (item: DatosItem) => {
  const tool = item.station!.tool!
  const [x, y] = insideOf(item)
  return { ...at([x + tool.at[0], y + tool.at[1]]), '--giro': `${tool.rotate ?? 0}deg`, scale: `${tool.scale ?? 1}` }
}
/** Dónde descansa lo servido: sobre el plato. */
const servedAt: [number, number] = plate ? [plate.at[0] + plate.inside[0], plate.at[1] + plate.inside[1]] : [154, 250]

// Un punto del fogón de una estación, en el tablero.
const inBoard = (i: number, point: Pair): Point => ({
  x: columnX(i) + LINE + STOVE.at[0]! + point[0]! * STOVE.scale,
  y: CARD_Y + LINE + STOVE.at[1]! + point[1]! * STOVE.scale,
})
// Dónde cae lo que llega (un poco por encima de donde descansa) y dónde está la llama (para la mano).
const spotOf = (i: number): Point => {
  const [x, y] = insideOf(stations[i]!.item)
  return inBoard(i, [x, y - 24])
}
const flameOf = (i: number): Point => inBoard(i, [STOVE.burner[0]!, STOVE.burner[1]! - 10])

// ---- Las piezas: una por estación, sentadas en el origen. ----
interface Egg { key: number, x: number, y: number, s: number, r: number, o: number, place: 'origen' | 'vuelo' | 'dentro', dropped: boolean }
const eggs = reactive<Egg[]>(props.items.map((_, i) => ({ key: i, ...seatOf(i), s: 1, r: TILT[i % TILT.length]!, o: 1, place: 'origen', dropped: false })))
const grabbable = computed(() => eggs.filter(egg => egg.place === 'origen'))
const eggNodes: Record<number, HTMLElement | null> = {}
const eggBoxes: Record<number, HTMLElement | null> = {}
const grabNodes: Record<number, HTMLElement | null> = {}

function progress() {
  const total = stations.reduce((sum, st, i) => sum + (st.state === 'servida' ? 1 : st.state === 'cruda' || st.state === 'firme' ? 0.2 + cooked[i]! * 0.6 : 0), 0)
  emit('progress', total / stations.length)
}
emit('progress', 0)

// ---- Llevar una pieza a una estación. Tras un arrastre, un salto corto desde donde se soltó; con un toque en la
// tarjeta, un vuelo en arco desde el origen. Mientras llega, la estación ya está tomada. ----
function send(egg: Egg, i: number, dropped: boolean) {
  const st = stations[i]!
  st.state = 'llega'
  egg.place = 'vuelo'
  egg.dropped = dropped
  const start = { x: egg.x, y: egg.y }
  const end = spotOf(i)
  const c = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - (dropped ? 60 : 150) }
  const startScale = egg.s
  const startRotation = egg.r
  eggNodes[egg.key]?.classList.remove('is-hopping')
  // Tras un arrastre ya sonó al soltarla; con un toque en la tarjeta, suena al salir y al caer.
  if (!dropped) playSound('volar')
  world.tween(dur(dropped ? 420 : 900), (k) => {
    const e = easeInOut(k)
    Object.assign(egg, curve(start, c, end, e))
    egg.s = startScale + (IN_SCALE - startScale) * e
    egg.r = startRotation * (1 - Math.min(e * 3, 1))
    egg.o = k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2
  }, () => {
    egg.place = 'dentro'
    egg.o = 0
    if (!dropped) playSound('soltar')
    st.state = 'cruda'
    replay(cardNodes[i], 'is-landing')
    if (!reduced) wobbles[i]!.kick(0.9)
    progress()
  })
}

// Tocar una tarjeta libre: sale la pieza del origen que le queda más cerca.
function tapCard(i: number) {
  const st = stations[i]
  if (!st || props.blocked || st.state !== 'vacia') return
  const x = columnX(i) + CARD.w / 2
  const egg = eggs
    .filter(candidate => candidate.place === 'origen' && !drag.isActive(candidate.key))
    .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]
  if (!egg) return
  demo.stop()
  send(egg, i, false)
}

// ---- Arrastrar una pieza (el gesto, en useDrag, con la física del motor): sale del origen, la tarjeta libre que
// queda debajo se marca y, al soltarla encima, salta dentro; fuera, o sobre una tarjeta ocupada, vuelve a su asiento. ----
const layer = ref<HTMLElement | null>(null)

const drag = useDrag<number, number>({
  layer,
  world,
  home: key => ({ x: eggs[key]!.x, y: eggs[key]!.y }),
  pieces: () => grabbable.value.map(egg => egg.key),
  canStart: key => !props.blocked && eggs[key]?.place === 'origen',
  // Las tarjetas libres, con 24 de holgura alrededor.
  zones: () => stations.flatMap((st, i) => (st.state === 'vacia' ? [{ id: i, x: columnX(i), y: CARD_Y, w: CARD.w, h: CARD.h }] : [])),
  margin: 24,
  press: () => demo.stop(),
  // Sobre una tarjeta libre, la pieza se queda donde se soltó, tal como se ve, y salta desde ahí.
  drop: (key, target, { offset }) => {
    const egg = eggs[key]
    if (!egg || target === null || stations[target]?.state !== 'vacia') return
    egg.x += offset.x
    egg.y += offset.y
    egg.s *= LIFTED_SCALE
    egg.r = 0
    send(egg, target, true)
  },
  tap: key => replay(eggNodes[key], 'is-hopping'),
  settle: () => demo.stop(),
  lift: -12, // por encima del dedo
  reduced,
})

// ---- Mantener el dedo en la tarjeta (el gesto, en useHold): mientras sigue, la llama está encendida y lo de dentro
// avanza de recién puesto a hecho; suena a que se cuece, cada vez más seguido y más agudo. Al llegar a hecho, la
// campanilla y un salto. Levantar el dedo es intentar servir. ----
const simmer = createSustain('cocer')
const smooth = (k: number) => k * k * (3 - 2 * k)

const hold = useHold<number>({
  world,
  canStart: i => !props.blocked && (stations[i]?.state === 'cruda' || stations[i]?.state === 'firme'),
  start: () => {
    demo.stop()
    simmer.reset()
  },
  tick: (i, dt) => {
    const st = stations[i]!
    if (st.state !== 'cruda') return
    cooked[i] = Math.min(1, cooked[i]! + dt * 1000 / HOLD_MS)
    const done = doneNodes[i]
    if (done) done.style.opacity = `${smooth(cooked[i]!)}`
    simmer.tick(dt, cooked[i]!)
    if (cooked[i]! < 1) return
    st.state = 'firme'
    haptic('drop')
    playSound('listo')
    replay(foodNodes[i], 'is-hopping')
    progress()
  },
  end: (i, { released }) => {
    // Un gesto que se corta no es una decisión: solo se apaga el fuego.
    if (!released) return
    if (stations[i]!.state === 'firme') serve(i)
    else notYet(i)
  },
})

// Levantó el dedo antes de tiempo: lo de dentro tiembla y se queda como iba. La pista sale una vez, cuando la marca el
// perfil de la edición (en libre, al segundo intento).
function notYet(i: number) {
  playSound('tocar')
  if (!reduced) wobbles[i]!.kick(1)
  progress()
  early += 1
  if (hinted || (props.profile.scaffolding === 'libre' && early < 2)) return
  hinted = true
  emit('feedback', sheet('retry', raw('hint'), raw('hintBody')))
}

// Servir: el plato ocupa el lugar del utensilio y la hoja dice qué forma es (su nombre y su `fact`); a la última se le
// suma el cierre de la escena.
function serve(i: number) {
  const st = stations[i]!
  st.state = 'servida'
  served += 1
  wobbles[i]!.still()
  // Lo que estaba a la vista pasa al plato; lo que no se veía hecho (`reveal`), se descubre.
  playSound(st.item.station?.reveal ? 'destapar' : 'soltar')
  replay(cardNodes[i], 'is-landing')
  progress()
  const all = served === stations.length
  if (all) {
    celebrating.value = true
    emit('complete')
  }
  emit('feedback', sheet('success', st.item.name, st.item.fact, all ? props.scene.meta.completionFeedback : null))
}

// El temblor de cada estación (el del motor): lo de dentro se inclina y se aplasta sobre su base, como un líquido.
const wobbles = props.items.map((_, i) => createWobble(world, (x) => {
  const node = foodNodes[i]
  if (node) node.style.transform = x === 0 ? '' : `skewX(${x * 9}deg) scaleY(${1 - Math.abs(x) * 0.05})`
}))

watch(() => props.blocked, (blocked) => {
  if (!blocked) return
  drag.cancel()
  hold.cancel()
})

// Dónde se dibuja cada pieza: su sitio más lo que la lleva el dedo; levantada, derecha y un poco más grande. Se mueve
// solo con transformaciones y fuera del render de la plantilla: cada cuadro del arrastre o del vuelo escribe la
// transformación de su caja (la posición), y el tamaño, el giro y la opacidad de su dibujo.
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
  node.style.opacity = `${egg.o}`
}
onMounted(() => {
  eggs.forEach(egg => watchEffect(() => placeEgg(egg)))
  // El agarre de cada pieza la sigue, también solo con su transformación (después de que exista en la página).
  eggs.forEach(egg => watchEffect(() => {
    if (egg.place !== 'origen') return
    const node = grabNodes[egg.key]
    if (!node) return
    const { x, y } = eggAt(egg)
    node.style.transform = `translate3d(${x - GRAB / 2}px, ${y - GRAB / 2}px, 0)`
  }, { flush: 'post' }))
})

// ---- Demostrar lo que toca hacer (la mano, en useDemo). Si una estación espera con lo suyo dentro, la mano se queda
// apoyada sobre su llama, que se enciende mientras tanto: mantener el dedo. Si no, lleva una pieza del origen a una
// tarjeta libre (la siguiente vez, a otra). La primera de cada tramo, al poco; luego, cada 6 s sin tocar. ----
const waiting = computed(() => stations.findIndex(st => st.state === 'cruda' || st.state === 'firme'))
const demoCopy = computed(() => (waiting.value >= 0 ? undefined : traveler?.svg))

const demo = useDemo<number>({
  ready: () => !props.blocked && !drag.busy() && hold.state.id === null && !eggs.some(egg => egg.place === 'vuelo'),
  step: () => stations.map(st => st.state).join('-'),
  first: () => (stations.some(st => st.state !== 'vacia') ? 2200 : 1500),
  move: (n) => {
    if (waiting.value >= 0) {
      const at = flameOf(waiting.value)
      return { from: at, to: at, target: waiting.value }
    }
    const egg = eggs.find(candidate => candidate.place === 'origen')
    const free = stations.flatMap((st, i) => (st.state === 'vacia' ? [i] : []))
    if (!egg || !free.length) return null
    const i = free[n % free.length]!
    return { from: { x: egg.x, y: egg.y }, to: spotOf(i), target: i, scale: [1, IN_SCALE] }
  },
  reduced,
})

// La llama de la demostración: encendida mientras la mano presiona. Se escribe en el fogón de la estación, fuera del
// render, porque la mano cambia en cada cuadro.
watchEffect(() => {
  const i = waiting.value
  const pressing = demo.state.on && i >= 0 && demo.state.hand.s < 0.95 && demo.state.hand.o > 0.5
  fogonNodes.forEach((node, j) => node?.classList.toggle('is-lit', pressing && j === i))
})

// La tarjeta marcada: la libre que queda bajo la pieza arrastrada o, en la demostración del arrastre, la que la mano elige.
const overCard = computed(() => drag.state.over ?? (waiting.value >= 0 ? null : demo.state.over))
</script>
