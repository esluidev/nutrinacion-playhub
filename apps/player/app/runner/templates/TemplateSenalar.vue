<template>
  <!-- Señalar · Conectar, Localizar. Plano cuerpo, en dos columnas. A la izquierda, una tarjeta por cada cosa que se
       busca (los ítems de la escena: lo que trae el huevo), con su dibujo y, si la escena lo trae, el escenario donde
       está (`defaults.cards`: un interior o un exterior de la librería, que llena la tarjeta). A la derecha, el personaje
       (`defaults.character`, un Rive de la librería), suelto: es lo que se toca, así que no va en tarjeta, y está de
       pie en la isla de su lugar (`defaults.ground`), su base. El niño elige una tarjeta, en el orden que quiera: se
       marca y, al momento, la mano demuestra que ahora se toca al personaje: sobre una zona y otra, sin decir cuál.
       Todos se señalan en su propio cuerpo dónde les sirve y un niño toca esa zona en el personaje (`defaults.zones`,
       regiones grandes de su lienzo): si es la de esa cosa (`defaults.targets`), el personaje la muestra, entero y en
       su sitio, la tarjeta queda resuelta y la hoja dice su nombre y lo que hace (`name` y `fact`); si no, el
       personaje niega y se reintenta, sin hoja ni cuenta. Tocar una tarjeta ya resuelta la vuelve a mostrar. Lo que
       muestra dura un momento: después el personaje vuelve a su reposo. Con la última, el cierre de la escena y, ya
       en reposo, el personaje acepta. Si nadie toca y no hay tarjeta elegida, la mano demuestra un toque sobre una
       sin resolver. Las reglas, en `senalar.ts`. -->
  <div class="tb-layer tb-se">
    <button
      v-for="(card, i) in cards"
      :key="card.item.id"
      type="button"
      class="tb-pieza tb-tarjeta tb-se-parte"
      :class="{ 'is-over': chosen === i || demo.state.over === `card-${i}`, 'is-found': card.found }"
      :aria-label="t(card.item.name)"
      :aria-pressed="chosen === i"
      :style="box(PART_X, partY(i), PART.w * FIT, PART.h * FIT)"
      @click="choose(i)"
    >
      <!-- Lo de dentro está medido para la tarjeta entera (300 × 262) y se encoge con ella si hay más de dos. -->
      <span class="tb-se-dentro" :style="{ width: `${PART.w}px`, height: `${PART.h}px`, scale: `${FIT}` }">
        <img v-if="card.spec.interior || card.spec.exterior" class="tb-se-vista" :src="librarySvg(card.spec.interior ?? card.spec.exterior)" alt="" decoding="sync" :style="box(LINE, LINE, PART.w - LINE * 2, PART.h - LINE * 2)">
        <img
          v-for="(piece, k) in card.spec.pieces ?? []"
          :key="k"
          class="tb-se-pieza"
          :src="librarySvg(piece.svg)"
          alt=""
          decoding="sync"
          :style="{ left: `${piece.at[0]}px`, top: `${piece.at[1]}px`, scale: `${piece.scale ?? 1}` }"
        >
      </span>
    </button>

    <!-- El personaje, suelto: la isla de su lugar, que es su base, y, de pie en ella, él con las zonas que se tocan. -->
    <img v-if="ground" class="tb-base" :src="librarySvg(ground)" alt="" decoding="sync" :style="{ left: `${BASE.x}px`, top: `${BASE.y}px`, width: `${BASE.w}px` }">
    <RiveCharacter
      v-if="rive"
      ref="character"
      class="tb-se-personaje"
      :src="rive"
      :values="{ [spec.pose]: shown }"
      :flags="spec.close ? { [spec.close]: false } : undefined"
      :paused="blocked"
      :style="box(CANVAS.x, CANVAS.y, CANVAS.size, CANVAS.size)"
    />
    <button
      v-for="zone in zoneList"
      :key="zone.name"
      type="button"
      class="tb-se-zona"
      :aria-label="str(`zone.${zone.name}`) || text('point')"
      :style="box(zone.x, zone.y, zone.w, zone.h)"
      @click="point(zone.name)"
    />

    <!-- La demostración (useDemo): la mano sola, que pulsa lo que toca. -->
    <DemoHand :demo="demo.state" :size="NO_COPY" />
  </div>
</template>

<script setup lang="ts">
import { box, ISLAND, prefersReducedMotion, useSceneText } from '../board'
import type { Point } from '../board'
import { libraryRive, librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { playSound } from '../engine/sound'
import { useWorld } from '../engine/world'
import { useRunnerText } from '../i18n'
import RiveCharacter from '../RiveCharacter.vue'
import { useDemo } from '../useDemo'
import type { FeedbackPayload, TemplateProps } from '../types'
import { createPointing } from './senalar'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, str, sheet } = useSceneText(props)
const text = useRunnerText(() => props.locale)

type Pair = [number, number]
/** Un dibujo de la tarjeta de una cosa: apoyado por el centro de su base en un punto de la tarjeta, a su escala. */
interface Drawing { svg: string, at: Pair, scale?: number }
/**
 * Lo que lleva la tarjeta de una cosa: sus dibujos (`pieces`) y, si la escena lo trae, el escenario donde está, que
 * llena la tarjeta (616 × 536): bajo techo, un interior de la librería (`interior`); al aire libre, un exterior
 * (`exterior`). En una escena, todas de una clase.
 */
interface CardSpec { interior?: string, exterior?: string, pieces?: Drawing[] }
/**
 * El personaje: su Rive, el enum de su View Model que dice qué muestra (`pose`) y el valor de reposo (`rest`); el
 * booleano que acerca la vista a lo que muestra (`close`: el personaje va suelto, sin marco que lo recorte, así que
 * la plantilla lo apaga y se le ve siempre entero) y los triggers con que acepta y niega. De su lienzo cuadrado, a
 * qué altura quedan sus pies (`feet`) y cuánto mide de alto (`height`), en fracciones del lienzo.
 */
interface CharacterSpec { rive: string, pose: string, rest: string, close?: string, accept?: string, deny?: string, feet?: number, height?: number }
/** Dónde le sirve una cosa: la zona que hay que tocar y lo que el personaje muestra al encontrarla. */
interface Target { zone: string, value: string }
/** Una zona del personaje: x, y, ancho y alto, en fracciones de su lienzo. */
type ZoneBox = [number, number, number, number]

const spec = props.scene.defaults.character as CharacterSpec
/** La base del personaje: la isla de su lugar, de la librería. */
const ground = props.scene.defaults.ground as string | undefined
const zones = (props.scene.defaults.zones ?? {}) as Record<string, ZoneBox>
const targets = (props.scene.defaults.targets ?? {}) as Record<string, Target>
const specs = (props.scene.defaults.cards ?? {}) as Record<string, CardSpec>
const rive = libraryRive(spec?.rive)

const reduced = prefersReducedMotion()
// El tiempo de juego de la escena: con el tablero en pausa, sus esperas no corren.
const world = useWorld(() => props.blocked)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). Dos columnas centradas en el tablero, con 100 entre ellas. A la
// izquierda, las tarjetas de las cosas, de 300 × 262 (la proporción de un interior de la librería, 616 × 536) y con 36
// entre ellas: dos ocupan de y 20 a y 580; con más, se encogen para caber en ese alto. A la derecha, el personaje,
// suelto, de pie en la isla de su lugar (`ISLAND`, board.ts), que va a 500 de ancho y con su canto de delante a la
// altura del final de las tarjetas: las dos columnas terminan en la misma línea. El personaje llena el alto, de donde
// pisa en la isla a donde empiezan las tarjetas; sin isla, pisa donde terminan. ----
const PART = { w: 300, h: 262 }
const GAP = 36
const BETWEEN = 100
const LINE = 6
const STACK = { top: 20, bottom: 580 }
const count = Math.max(props.items.length, 1)
const FIT = Math.min(1, (STACK.bottom - STACK.top - (count - 1) * GAP) / count / PART.h)
const stackH = count * PART.h * FIT + (count - 1) * GAP
const BASE_W = 500
const PART_X = (1280 - (PART.w * FIT + BETWEEN + BASE_W)) / 2
const partY = (i: number) => 300 - stackH / 2 + i * (PART.h * FIT + GAP)
const K = BASE_W / ISLAND.w
const BASE = { w: BASE_W, x: PART_X + PART.w * FIT + BETWEEN, y: STACK.bottom - ISLAND.foot * K }
// Dónde pisa el personaje y cuánto mide su lienzo, un cuadrado centrado en su base.
const GROUND = ground ? BASE.y + ISLAND.stand * K : STACK.bottom
const FEET = spec?.feet ?? 1
const size = (GROUND - STACK.top) / (spec?.height ?? 1)
const CANVAS = { size, x: BASE.x + BASE.w / 2 - size / 2, y: GROUND - size * FEET }
const zoneList = Object.entries(zones).map(([name, [x, y, w, h]]) =>
  ({ name, x: CANVAS.x + x * size, y: CANVAS.y + y * size, w: w * size, h: h * size }))
const NO_COPY = { w: 0, h: 0 }

// ---- El juego: las reglas, en `senalar.ts`; aquí, lo que se ve. ----
const cards = reactive(props.items.map(item => ({ item, spec: specs[item.id] ?? {}, found: false })))
const game = createPointing(props.items.map(item => targets[item.id]?.zone ?? ''))
/** La tarjeta elegida: la cosa que se está buscando. */
const chosen = ref<number | null>(null)
/** Lo que muestra el personaje: su reposo o la parte de una cosa encontrada. */
const shown = ref(spec?.rest ?? '')
/** El personaje está mostrando algo: todavía no ha vuelto a su reposo. */
const showing = computed(() => shown.value !== (spec?.rest ?? ''))
const character = ref<InstanceType<typeof RiveCharacter> | null>(null)

emit('progress', 0)

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

// ---- Elegir una tarjeta: se marca, el personaje vuelve a su reposo y la mano demuestra al momento que ahora se le
// toca a él: elegir abre el segundo paso, y lo que sigue se dice enseguida. Una ya resuelta se vuelve a mostrar, sin
// nada nuevo que ganar. ----
function choose(i: number) {
  if (props.blocked) return
  const result = game.choose(i)
  if (!result) return
  demo.stop()
  playSound('tocar')
  chosen.value = game.chosen()
  const { item } = cards[i]!
  if (result === 'busca') {
    rest()
    demo.show()
    return
  }
  show(targets[item.id]?.value ?? spec.rest)
  emit('feedback', sheet('info', item.name, item.fact))
}

// ---- Tocar una zona del personaje. Sin tarjeta elegida, la mano demuestra al momento un toque sobre una de las que
// faltan: primero se elige. Con una elegida, si la zona es la suya el personaje la muestra y la hoja lo dice; si no,
// niega y se reintenta. Con la última, el cierre y, cuando vuelve a su reposo, acepta. ----
function point(zone: string) {
  if (props.blocked) return
  const result = game.point(zone)
  playSound('tocar')
  if (!result) {
    demo.show()
    return
  }
  demo.stop()
  if (!result.hit) {
    if (spec.deny) character.value?.say(spec.deny)
    return
  }
  const card = cards[result.item]!
  card.found = true
  chosen.value = null
  if (result.all) owesAccept = true
  show(targets[card.item.id]?.value ?? spec.rest)
  emit('progress', game.progress())
  if (result.all) emit('complete')
  emit('feedback', sheet('success', card.item.name, card.item.fact, result.all ? props.scene.meta.completionFeedback : null))
}

// ---- Demostrar lo que toca (la mano, en useDemo): un toque sobre la primera tarjeta sin resolver y, con una elegida,
// sobre una zona y otra del personaje, alternando, para no decir cuál es. Con una tarjeta recién elegida, o si se toca
// al personaje sin haber elegido, llega al momento (`demo.show`): es lo que dice qué se hace ahora. Al empezar, al
// poco; después de un acierto, espera más. ----
const demo = useDemo<string>({
  ready: () => !props.blocked && !game.done() && (chosen.value !== null || !showing.value),
  step: () => `${chosen.value ?? 'x'}-${cards.filter(card => card.found).length}`,
  first: () => (cards.some(card => card.found) ? 3200 : 1500),
  move: (n) => {
    if (chosen.value === null) {
      const i = cards.findIndex(card => !card.found)
      if (i < 0) return null
      const at = { x: PART_X + PART.w * FIT / 2, y: partY(i) + PART.h * FIT / 2 }
      return { from: at, to: at, target: `card-${i}`, tap: true }
    }
    const zone = zoneList[n % Math.max(1, zoneList.length)]
    if (!zone) return null
    const at: Point = { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2 }
    return { from: at, to: at, target: `zone-${zone.name}`, tap: true }
  },
  reduced,
})
</script>
