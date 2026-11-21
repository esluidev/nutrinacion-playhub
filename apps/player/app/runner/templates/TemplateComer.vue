<template>
  <!-- Comer · Simular (darle de comer al personaje y ver qué le hace). Plano cuerpo. En el centro, el personaje
       (`defaults.character`, un Rive de la librería), suelto y de pie en la isla de su lugar (`defaults.ground`). A cada
       lado, una tarjeta por alimento (los ítems de la escena), con el escenario donde está (`defaults.cards`: un
       interior o un exterior de la librería, que llena la tarjeta), lo que no se mueve (el plato) y, encima, el
       alimento, grande (`food`). El niño arrastra el que quiera hasta el personaje (o lo toca y después toca al
       personaje): el alimento sale de su tarjeta y va a su boca, el personaje lo mastica con el gusto que diga la
       escena y, al terminar, muestra lo que ese alimento le hace (`defaults.targets`: el valor de su View Model), entero
       y en su sitio; la hoja dice su nombre y lo que hace (`name` y `fact`). En la tarjeta se queda el plato vacío;
       tocarla lo vuelve a mostrar. No hay uno equivocado, y mientras come uno no se le da otro. Lo que muestra dura un
       momento: después vuelve a su reposo. Con el último, el cierre de la escena y, ya en reposo, el personaje acepta.
       Si nadie toca, la mano lleva un alimento a su boca. Las reglas, en `comer.ts`. -->
  <div ref="layer" class="tb-layer tb-co">
    <button
      v-for="(card, i) in cards"
      :key="card.item.id"
      type="button"
      class="tb-pieza tb-tarjeta tb-co-carta"
      :class="{ 'is-over': chosen === i, 'is-found': card.eaten }"
      :aria-label="t(card.item.name)"
      :aria-pressed="chosen === i"
      :style="box(cardX(i), cardY(i), CARD.w, CARD.h)"
      @click="tapCard(i)"
    >
      <!-- Lo de dentro está medido para la tarjeta de 300 × 262 y crece o se encoge con ella. -->
      <span class="tb-co-dentro" :style="{ width: `${PART.w}px`, height: `${PART.h}px`, scale: `${S}` }">
        <img v-if="card.spec.interior || card.spec.exterior" class="tb-co-vista" :src="librarySvg(card.spec.interior ?? card.spec.exterior)" alt="" decoding="sync" :style="box(LINE, LINE, PART.w - LINE * 2, PART.h - LINE * 2)">
        <img
          v-for="(piece, k) in card.spec.pieces ?? []"
          :key="k"
          class="tb-co-pieza"
          :src="librarySvg(piece.svg)"
          alt=""
          decoding="sync"
          :style="{ left: `${piece.at[0]}px`, top: `${piece.at[1]}px`, scale: `${piece.scale ?? 1}` }"
        >
      </span>
    </button>

    <!-- El personaje, suelto: la isla de su lugar, que es su base, y, de pie en ella, él. -->
    <img v-if="ground" class="tb-base" :src="librarySvg(ground)" alt="" decoding="sync" :style="{ left: `${BASE.x}px`, top: `${BASE.y}px`, width: `${BASE.w}px` }">
    <RiveCharacter
      v-if="rive"
      ref="character"
      class="tb-co-personaje"
      :src="rive"
      :values="values"
      :flags="spec.close ? { [spec.close]: false } : undefined"
      :paused="blocked"
      :style="box(CANVAS.x, CANVAS.y, CANVAS.size, CANVAS.size)"
    />
    <!-- Tocarlo: con un alimento elegido, se lo da. -->
    <button type="button" class="tb-co-cuerpo" :aria-label="text('feed')" :style="box(BODY.x, BODY.y, BODY.w, BODY.h)" @click="tapCharacter" />

    <!-- Los alimentos: su caja lleva la posición y el dibujo, su tamaño y su opacidad (`placeFood`). -->
    <span
      v-for="food in visibleFoods"
      :key="food.key"
      :ref="(el) => { foodBoxes[food.key] = el as HTMLElement | null }"
      class="tb-co-caja"
      :style="{ zIndex: food.place === 'vuelo' || drag.isActive(food.key) ? 9 : 5 }"
    >
      <img
        :ref="(el) => { foodNodes[food.key] = el as HTMLElement | null }"
        class="tb-co-comida"
        :class="{ 'is-dragging': drag.isDragging(food.key) }"
        :src="librarySvg(food.svg)"
        alt=""
        decoding="sync"
        :style="box(-food.w / 2, -food.h / 2, food.w, food.h)"
      >
    </span>

    <!-- La demostración (useDemo): la mano y, si lleva un alimento, su copia. -->
    <DemoHand :demo="demo.state" :copy="demoCopy?.svg" :size="demoCopy ?? NO_COPY" />

    <!-- El agarre de cada alimento que está en su tarjeta: una zona sobre él (el gesto, en useDrag). -->
    <button
      v-for="food in grabbable"
      :key="`agarre-${food.key}`"
      :ref="(el) => { grabNodes[food.key] = el as HTMLElement | null }"
      type="button"
      class="tb-co-agarre"
      :class="{ 'is-dragging': drag.isDragging(food.key) }"
      :aria-label="t(cards[food.key]?.item.name)"
      :style="{ width: `${GRAB}px`, height: `${GRAB}px` }"
      v-bind="drag.bind(food.key)"
    />
  </div>
</template>

<script setup lang="ts">
import { box, curve, easeInOut, ISLAND, prefersReducedMotion, useSceneText } from '../board'
import type { Point } from '../board'
import { libraryRive, librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { playSound } from '../engine/sound'
import { useWorld } from '../engine/world'
import { useRunnerText } from '../i18n'
import RiveCharacter from '../RiveCharacter.vue'
import { useDemo } from '../useDemo'
import { useDrag } from '../useDrag'
import { replay } from '../useTimers'
import type { FeedbackPayload, TemplateProps } from '../types'
import { createFeeding } from './comer'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, sheet } = useSceneText(props)
const text = useRunnerText(() => props.locale)

type Pair = [number, number]
/** Un dibujo de la tarjeta: apoyado por el centro de su base en un punto de la tarjeta, a su escala. */
interface Drawing { svg: string, at: Pair, scale?: number }
/** El alimento, que se agarra: como un dibujo, más el tamaño de su lienzo (`size`), para saber dónde queda su centro. */
interface Food extends Drawing { size: Pair }
/**
 * Lo que lleva la tarjeta de un alimento: el escenario donde está, que la llena (616 × 536): bajo techo, un interior
 * de la librería (`interior`); al aire libre, un exterior (`exterior`); lo que no se mueve (`pieces`: el plato) y el
 * alimento (`food`).
 */
interface CardSpec { interior?: string, exterior?: string, pieces?: Drawing[], food?: Food }
/**
 * El personaje: su Rive y su View Model. El enum que dice qué muestra (`pose`) y su valor de reposo (`rest`); el
 * booleano que acerca la vista (`close`: va suelto, sin marco que lo recorte, así que se apaga); los triggers con que
 * come (`eat`) y acepta (`accept`), y el enum del gusto con que come (`taste`). De su lienzo cuadrado, en fracciones:
 * a qué altura quedan sus pies (`feet`), cuánto mide (`height`), dónde está su boca (`mouth`) y la caja de su cuerpo
 * donde se suelta un alimento (`body`). Cuánto tarda en masticar (`eatMs`).
 */
interface CharacterSpec {
  rive: string
  pose: string
  rest: string
  close?: string
  eat?: string
  accept?: string
  taste?: string
  feet?: number
  height?: number
  mouth?: Pair
  body?: [number, number, number, number]
  eatMs?: number
}
/** Lo que un alimento le hace al personaje: lo que muestra después de comerlo (`value`) y con qué gusto lo come (`taste`). */
interface Target { value: string, taste?: string }

const spec = props.scene.defaults.character as CharacterSpec
const ground = props.scene.defaults.ground as string | undefined
const targets = (props.scene.defaults.targets ?? {}) as Record<string, Target>
const specs = (props.scene.defaults.cards ?? {}) as Record<string, CardSpec>
const rive = libraryRive(spec?.rive)

const reduced = prefersReducedMotion()
const dur = (ms: number) => (reduced ? 0 : ms)
// El tiempo de juego de la escena: con el tablero en pausa, los vuelos, las piezas y las esperas se quedan quietos.
const world = useWorld(() => props.blocked)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). En el centro, el personaje de pie en la isla de su lugar
// (`ISLAND`, board.ts), que va a 500 de ancho con su canto de delante en y 580; el personaje llena el alto, de donde
// pisa a y 20. A cada lado, las tarjetas de los alimentos, en el borde de la columna: la mitad a la izquierda y la otra
// mitad a la derecha. Cada una mide 320 × 280 (la proporción de un interior, 616 × 536; su contenido se compone en un
// lienzo de 300 × 262) y empiezan a la altura de la cabeza del personaje: su borde de arriba, en la línea de su cabeza
// (Luis, 2026-11-20), muy por encima de su isla: lo que se le da no está en el suelo. Si a un lado van dos o más, se
// encogen para caber, con 36 entre ellas. ----
const PART = { w: 300, h: 262 }
const LINE = 6
const GAP = 36
const STACK = { top: 20, bottom: 580 }
const count = props.items.length
const leftCount = Math.ceil(count / 2)
const perSide = Math.max(leftCount, 1)
const FIT = Math.min(1, (STACK.bottom - STACK.top - (perSide - 1) * GAP) / perSide / (PART.h * 320 / 300))
/** La escala del lienzo de la tarjeta: 320 de ancho, encogida si hace falta. */
const S = 320 / 300 * FIT
const CARD = { w: PART.w * S, h: PART.h * S }
const sideOf = (i: number) => (i < leftCount ? 0 : 1)
const rowOf = (i: number) => (i < leftCount ? i : i - leftCount)
const cardX = (i: number) => (sideOf(i) === 0 ? 120 : 1160 - CARD.w)
const cardY = (i: number) => HEAD + rowOf(i) * (CARD.h + GAP)
const BASE_W = 500
const K = BASE_W / ISLAND.w
const BASE = { w: BASE_W, x: 640 - BASE_W / 2, y: STACK.bottom - ISLAND.foot * K }
const GROUND = ground ? BASE.y + ISLAND.stand * K : STACK.bottom
const size = (GROUND - STACK.top) / (spec?.height ?? 1)
const CANVAS = { size, x: 640 - size / 2, y: GROUND - size * (spec?.feet ?? 1) }
/** Dónde empieza la cabeza del personaje, en el tablero. */
const HEAD = GROUND - size * (spec?.height ?? 1)
const [bx, by, bw, bh] = spec?.body ?? [0.2, 0.05, 0.6, 0.9]
const BODY = { x: CANVAS.x + bx * size, y: CANVAS.y + by * size, w: bw * size, h: bh * size }
const MOUTH: Point = { x: CANVAS.x + (spec?.mouth?.[0] ?? 0.5) * size, y: CANVAS.y + (spec?.mouth?.[1] ?? 0.25) * size }
const GRAB = 190
const LIFTED_SCALE = 1.08
/** En la boca, el alimento llega a este tamaño y se desvanece. */
const MOUTH_SCALE = 0.3
const EAT_MS = spec?.eatMs ?? 2400
const NO_COPY = { w: 0, h: 0 }

// ---- El juego: las reglas, en `comer.ts`; aquí, lo que se ve. ----
const cards = reactive(props.items.map(item => ({ item, spec: specs[item.id] ?? {}, eaten: false })))
const game = createFeeding(count)
/** El alimento elegido con un toque, que se le da al tocar al personaje. */
const chosen = ref<number | null>(null)
/** Lo que muestra el personaje: su reposo o lo que le hizo un alimento. */
const shown = ref(spec?.rest ?? '')
const showing = computed(() => shown.value !== (spec?.rest ?? ''))
/** Con qué gusto come lo que se le da ahora. */
const taste = ref(targets[props.items[0]?.id ?? '']?.taste ?? '')
const values = computed(() => ({
  ...(spec?.pose ? { [spec.pose]: shown.value } : {}),
  ...(spec?.taste && taste.value ? { [spec.taste]: taste.value } : {}),
}))
const character = ref<InstanceType<typeof RiveCharacter> | null>(null)
let eaten = 0

emit('progress', 0)

// ---- Los alimentos: cada uno en su tarjeta, sobre lo que no se mueve, a la escala de la tarjeta. ----
interface FoodPiece { key: number, svg: string, w: number, h: number, x: number, y: number, s: number, o: number, place: 'tarjeta' | 'vuelo' | 'comido' }
/** Dónde descansa el alimento de una tarjeta: el centro de su dibujo, en el tablero. */
function restOf(i: number): Point {
  const food = cards[i]!.spec.food!
  const h = food.size[1] * (food.scale ?? 1)
  return { x: cardX(i) + food.at[0] * S, y: cardY(i) + (food.at[1] - h / 2) * S }
}
const foods = reactive<FoodPiece[]>(cards.flatMap((card, i) => {
  const food = card.spec.food
  if (!food) return []
  const k = (food.scale ?? 1) * S
  return [{ key: i, svg: food.svg, w: food.size[0] * k, h: food.size[1] * k, ...restOf(i), s: 1, o: 1, place: 'tarjeta' as const }]
}))
const foodOf = (key: number) => foods.find(food => food.key === key)
const visibleFoods = computed(() => foods.filter(food => food.place !== 'comido'))
const grabbable = computed(() => foods.filter(food => food.place === 'tarjeta'))
const foodBoxes: Record<number, HTMLElement | null> = {}
const foodNodes: Record<number, HTMLElement | null> = {}
const grabNodes: Record<number, HTMLElement | null> = {}

// ---- Lo que muestra el personaje dura un momento: después vuelve a su reposo.
// Cada vez que muestra algo o vuelve al reposo, la vuelta que estuviera pendiente queda sin efecto. Si la escena ya se
// completó, al volver al reposo acepta, una sola vez. ----
const SHOW_MS = 2400
const ACCEPT_MS = 520
let turn = 0
let owesAccept = false
function rest() {
  turn += 1
  shown.value = spec.rest
}
function show(value: string) {
  const mine = ++turn
  shown.value = value
  world.after(SHOW_MS, () => {
    if (mine !== turn) return
    shown.value = spec.rest
    if (!owesAccept) return
    owesAccept = false
    world.after(ACCEPT_MS, () => { if (spec.accept) character.value?.say(spec.accept) })
  })
}

// ---- Darle un alimento. Tras un arrastre, un salto corto desde donde se soltó; con un toque, un vuelo en arco desde
// su tarjeta. En la boca se hace pequeño y se desvanece; entonces lo mastica con su gusto (el gusto se fija al salir,
// para que el personaje lo tenga antes de empezar) y, al terminar, muestra lo que le hace. ----
function feed(key: number, dropped: boolean) {
  const food = foodOf(key)
  if (!food || !game.give(key)) return
  chosen.value = null
  demo.stop()
  rest()
  taste.value = targets[cards[key]!.item.id]?.taste ?? taste.value
  food.place = 'vuelo'
  const start = { x: food.x, y: food.y }
  const c = { x: (start.x + MOUTH.x) / 2, y: Math.min(start.y, MOUTH.y) - (dropped ? 50 : 140) }
  const startScale = food.s
  // Tras un arrastre ya sonó al soltarlo; con un toque, suena al salir y al llegar.
  if (!dropped) playSound('volar')
  world.tween(dur(dropped ? 380 : 820), (k) => {
    const e = easeInOut(k)
    Object.assign(food, curve(start, c, MOUTH, e))
    food.s = startScale + (MOUTH_SCALE - startScale) * e
    food.o = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25
  }, () => {
    food.place = 'comido'
    food.o = 0
    if (!dropped) playSound('soltar')
    if (spec.eat) character.value?.say(spec.eat)
    world.after(EAT_MS, () => swallow(key))
  })
}

// Terminó de masticarlo: muestra lo que le hace y la hoja lo dice; en la tarjeta queda lo que no se movía. Con el
// último, el cierre de la escena.
function swallow(key: number) {
  const result = game.swallow(key)
  if (!result) return
  const card = cards[key]!
  card.eaten = true
  eaten += 1
  if (result.all) owesAccept = true
  show(targets[card.item.id]?.value ?? spec.rest)
  emit('progress', game.progress())
  if (result.all) emit('complete')
  emit('feedback', sheet('success', card.item.name, card.item.fact, result.all ? props.scene.meta.completionFeedback : null))
}

// ---- Tocar un alimento o su tarjeta: queda elegido y la mano demuestra al momento que ahora se toca al personaje
// (elegir abre un segundo paso). Otro toque lo suelta. Una tarjeta ya sin su alimento lo vuelve a mostrar. ----
function choose(i: number) {
  if (props.blocked) return
  const result = game.choose(i)
  if (!result) return
  demo.stop()
  chosen.value = game.chosen()
  if (result === 'elige') {
    replay(foodNodes[i], 'is-hopping')
    demo.show()
    return
  }
  if (result === 'repite') {
    const { item } = cards[i]!
    show(targets[item.id]?.value ?? spec.rest)
    emit('feedback', sheet('info', item.name, item.fact))
  }
}

// Tocar la tarjeta, fuera del alimento: lo mismo que tocar el alimento (el toque del alimento suena en useDrag).
function tapCard(i: number) {
  if (props.blocked) return
  playSound('tocar')
  choose(i)
}

// Tocar al personaje: con un alimento elegido, se lo da (y suena su vuelo); sin ninguno, la mano demuestra al momento
// cómo se le lleva uno.
function tapCharacter() {
  if (props.blocked || game.eating() !== null) return
  const key = chosen.value
  if (key !== null && game.canGive(key)) {
    feed(key, false)
    return
  }
  playSound('tocar')
  if (!game.done()) demo.show()
}

// ---- Arrastrar un alimento (el gesto, en useDrag, con la física del motor): sale de su tarjeta y, soltado sobre el
// personaje, salta a su boca; fuera, vuelve a su tarjeta. Mientras come otro, no se agarra. ----
const layer = ref<HTMLElement | null>(null)

const drag = useDrag<number, string>({
  layer,
  world,
  home: (key) => {
    const food = foodOf(key)!
    return { x: food.x, y: food.y }
  },
  pieces: () => grabbable.value.map(food => food.key),
  canStart: key => !props.blocked && game.canGive(key),
  zones: () => [{ id: 'personaje', ...BODY }],
  margin: 24,
  press: () => demo.stop(),
  // Sobre el personaje, el alimento se queda donde se soltó, tal como se ve, y salta desde ahí.
  drop: (key, target, { offset }) => {
    const food = foodOf(key)
    if (!food || target === null || !game.canGive(key)) return
    food.x += offset.x
    food.y += offset.y
    food.s *= LIFTED_SCALE
    feed(key, true)
  },
  tap: key => choose(key),
  settle: () => demo.stop(),
  lift: -12, // por encima del dedo
  reduced,
})

watch(() => props.blocked, (blocked) => { if (blocked) drag.cancel() })

// Dónde se dibuja cada alimento: su sitio más lo que lo lleva el dedo; levantado, un poco más grande. Se mueve solo con
// transformaciones y fuera del render de la plantilla: cada cuadro escribe la posición de su caja y el tamaño y la
// opacidad de su dibujo.
const foodAt = (food: FoodPiece): Point => {
  const o = drag.offsetOf(food.key)
  return { x: food.x + o.x, y: food.y + o.y }
}
function placeFood(food: FoodPiece) {
  const boxNode = foodBoxes[food.key]
  const node = foodNodes[food.key]
  if (!boxNode || !node) return
  const s = food.s * (1 + (LIFTED_SCALE - 1) * drag.liftedOf(food.key))
  const { x, y } = foodAt(food)
  boxNode.style.transform = `translate3d(${x}px, ${y}px, 0)`
  node.style.scale = `${s}`
  node.style.opacity = `${food.o}`
}
onMounted(() => {
  foods.forEach(food => watchEffect(() => placeFood(food), { flush: 'post' }))
  // El agarre de cada alimento lo sigue, también solo con su transformación.
  foods.forEach(food => watchEffect(() => {
    if (food.place !== 'tarjeta') return
    const node = grabNodes[food.key]
    if (!node) return
    const { x, y } = foodAt(food)
    node.style.transform = `translate3d(${x - GRAB / 2}px, ${y - GRAB / 2}px, 0)`
  }, { flush: 'post' }))
})

// ---- Demostrar lo que toca (la mano, en useDemo). Con un alimento elegido, un toque sobre el personaje; si no, lleva
// un alimento de su tarjeta a la boca (la siguiente vez, otro). La primera de cada tramo, al poco; después de que coma
// uno, espera más. ----
const demoFood = ref<number | null>(null)
const demoCopy = computed(() => {
  const food = demoFood.value === null ? undefined : foodOf(demoFood.value)
  return food ? { svg: food.svg, w: food.w, h: food.h } : undefined
})

const demo = useDemo<string>({
  ready: () => !props.blocked && !drag.busy() && game.eating() === null && !game.done() && (chosen.value !== null || !showing.value),
  step: () => `${chosen.value ?? 'x'}-${eaten}`,
  first: () => (eaten ? 3200 : 1500),
  move: (n) => {
    if (chosen.value !== null) {
      demoFood.value = null
      const at = { x: BODY.x + BODY.w / 2, y: BODY.y + BODY.h * 0.45 }
      return { from: at, to: at, target: 'personaje', tap: true }
    }
    const left = grabbable.value
    const food = left[n % Math.max(1, left.length)]
    if (!food) return null
    demoFood.value = food.key
    return { from: { x: food.x, y: food.y }, to: MOUTH, target: 'personaje', scale: [1, 0.6] }
  },
  reduced,
})
</script>
