<template>
  <!-- Abrir · Simular. Plano detalle. Una sola tarjeta con su interior (`defaults.interior`: la cocina, como las tarjetas
       de una fila pero grande; `detailCard`, board.ts) y, dentro, sobre la mesa y en su
       apoyo (`defaults.support`: un plato, un tazón, una tabla), el objeto entero (`defaults.whole`). El niño lo toca
       `taps` veces: con cada toque se mece y su grieta (`crack`, un dibujo en su mismo lienzo, encima) crece desde el
       tramo del primer toque (`crackFirst`) hasta verse entera; con el último se abre: el entero se va y de él salen
       sus partes (los ítems de la escena), cada pieza hasta su sitio (`defaults.parts`). Después toca cada parte, en el
       orden que quiera: se marca (un halo blanco y un poco más grande), tiembla y la hoja dice su nombre y lo que trae
       (`name` y `fact`); a la última se le suma el cierre de la escena. Una parte puede tener varias piezas (las dos
       mitades de una cáscara): se marcan juntas. No hay orden ni respuesta incorrecta, y tocar una parte ya vista lo
       repite. Si nadie toca, la mano demuestra un toque sobre lo que toca: el entero o una parte sin ver.
       Las piezas son dibujos sueltos de la librería, cada uno apoyado por el centro de su base en un punto del
       escenario de la tarjeta y todos a una misma escala (`defaults.scale`). Las reglas, en `abrir.ts`. -->
  <div class="tb-layer tb-ab" :data-phase="phase">
    <div class="tb-pieza tb-tarjeta tb-ab-carta" :style="box(CARD_X, CARD_Y, CARD.w, CARD.h)">
      <span class="tb-ab-escena">
        <img v-if="interior" class="tb-ab-interior" :src="librarySvg(interior)" alt="" decoding="sync">
        <img v-if="support" class="tb-ab-apoyado" :src="librarySvg(support.svg)" alt="" decoding="sync" :style="{ ...at(support.at), scale: `${support.scale ?? SCALE}` }">

        <!-- Las partes: cada pieza, en su sitio. Mientras el entero está cerrado no se ven; al abrirse salen de él. Su
             sitio lleva el vuelo y la pieza, su tamaño y su temblor. -->
        <span
          v-for="(piece, i) in pieces"
          :key="piece.key"
          :ref="(el) => { placeNodes[i] = el as HTMLElement | null }"
          class="tb-ab-sitio tb-ab-pieza"
          :class="{ 'is-marked': marked === piece.part }"
          :style="at(piece.at)"
        >
          <button
            :ref="(el) => { touchNodes[i] = el as HTMLElement | null }"
            type="button"
            class="tb-ab-toque"
            :disabled="phase !== 'abierto'"
            :aria-label="parts[piece.part]!.seen ? t(parts[piece.part]!.item.name) : text('part')"
            :style="{ '--s': SCALE }"
            @click="tapPart(piece.part)"
          >
            <img :ref="(el) => { imageNodes[i] = el as HTMLImageElement | null }" :src="librarySvg(piece.svg)" alt="" decoding="sync">
          </button>
        </span>

        <!-- El entero, con su grieta encima: se toca hasta que se abre. -->
        <span v-if="whole" class="tb-ab-sitio tb-ab-entero" :style="at(whole.at)">
          <button
            ref="wholeTouch"
            type="button"
            class="tb-ab-toque"
            :disabled="phase !== 'cerrado'"
            :aria-label="text('open')"
            :style="{ '--s': SCALE }"
            @click="tapWhole"
          >
            <img ref="wholeImage" :src="librarySvg(whole.svg)" alt="" decoding="sync">
            <img v-if="whole.crack" class="tb-ab-grieta" :class="{ 'is-on': crackClip }" :src="librarySvg(whole.crack)" alt="" decoding="sync" :style="{ clipPath: crackClip }">
          </button>
        </span>

        <!-- La capa de delante del apoyo, si lo de dentro va entre dos (el borde de un tazón). -->
        <img v-if="support?.front" class="tb-ab-apoyado" :src="librarySvg(support.front)" alt="" decoding="sync" :style="{ ...at(support.at), scale: `${support.scale ?? SCALE}` }">
      </span>
    </div>

    <!-- La demostración (useDemo): la mano sola, que pulsa lo que toca. -->
    <DemoHand :demo="demo.state" :size="NO_COPY" />
  </div>
</template>

<script setup lang="ts">
import { box, curve, detailCard, easeOut, prefersReducedMotion, useSceneText } from '../board'
import type { Point } from '../board'
import { librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { haptic } from '../engine/haptics'
import { playSound } from '../engine/sound'
import { createWobble } from '../engine/wobble'
import { useWorld } from '../engine/world'
import { useRunnerText } from '../i18n'
import { useDemo } from '../useDemo'
import type { FeedbackPayload, TemplateProps } from '../types'
import { crackSpan, createOpening } from './abrir'
import type { OpeningPhase } from './abrir'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, str, raw, sheet } = useSceneText(props)
const text = useRunnerText(() => props.locale)

type Pair = [number, number]
/** El apoyo del entero (un plato, un tazón): su dibujo, dónde se apoya en el escenario de la tarjeta, su escala si no
 *  es la de las piezas y, si lo de dentro va entre dos capas, la de delante. */
interface Support { svg: string, front?: string, at: Pair, scale?: number }
/** El entero: su dibujo, dónde se apoya, su grieta (un dibujo en su mismo lienzo), el tramo de la grieta que se ve con
 *  el primer toque (fracciones del ancho del lienzo) y cuántos toques lo abren. */
interface Whole { svg: string, at: Pair, crack?: string, crackFirst?: Pair, taps?: number }
/** Una pieza de una parte: su dibujo, dónde se apoya y si es blanda (tiembla como una gelatina) o no (se mece). */
interface PieceSpec { svg: string, at: Pair, soft?: boolean }

const interior = props.scene.defaults.interior as string | undefined
const support = props.scene.defaults.support as Support | undefined
const whole = props.scene.defaults.whole as Whole | undefined
const specs = (props.scene.defaults.parts ?? {}) as Record<string, PieceSpec[]>
/** La escala de las piezas: la misma para el entero y para sus partes, que son un mismo objeto. */
const SCALE = (props.scene.defaults.scale as number | undefined) ?? 1
const TAPS = whole?.taps ?? 3

const reduced = prefersReducedMotion()
const dur = (ms: number) => (reduced ? 0 : ms)
// El tiempo de juego de la escena: con el tablero en pausa, el vuelo de las partes y los temblores se quedan quietos.
const world = useWorld(() => props.blocked)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). La tarjeta del plano detalle (`detailCard`, board.ts), centrada:
// de 732 × 560 para un interior ancho de la librería (704 × 536); si el de la escena tiene otro lienzo, lo dice en
// `defaults.canvas`. Su escenario ocupa la tarjeta entera por dentro del marco (720 × 548): ahí se apoyan el apoyo, el
// entero y las piezas, en coordenadas del escenario. Cada pieza se toca por su dibujo, con una zona de 160 como mínimo
// (runner.css). ----
const canvas = props.scene.defaults.canvas as Pair | undefined
const CARD = detailCard(canvas ? { w: canvas[0], h: canvas[1] } : undefined)
const LINE = CARD.line
const CARD_X = CARD.x
const CARD_Y = CARD.y
const NO_COPY = { w: 0, h: 0 }
/** Un punto del escenario de la tarjeta. */
const at = (point: Pair) => ({ left: `${point[0]}px`, top: `${point[1]}px` })
/** Un punto del escenario, en el tablero, `up` por encima. */
const inBoard = (point: Pair, up = 0): Point => ({ x: CARD_X + LINE + point[0], y: CARD_Y + LINE + point[1] - up })
/** Lo que mide de alto un dibujo en el tablero. */
const heightOf = (image: HTMLImageElement | null | undefined) => (image?.naturalHeight ?? 0) * SCALE
const clamp = (value: number, low = 0, high = 1) => Math.min(Math.max(value, low), high)

// ---- El juego: las reglas, en `abrir.ts`; aquí, lo que se ve. ----
const parts = reactive(props.items.map(item => ({ item, seen: false })))
const pieces = props.items.flatMap((item, part) =>
  (specs[item.id] ?? []).map((spec, k) => ({ key: `${item.id}-${k}`, part, svg: spec.svg, at: spec.at, soft: Boolean(spec.soft) })))
const game = createOpening(TAPS, parts.length)
const phase = ref<OpeningPhase>('cerrado')
const taps = ref(0)
/** La parte marcada: la última que se tocó. */
const marked = ref<number | null>(null)

const placeNodes: (HTMLElement | null)[] = []
const touchNodes: (HTMLElement | null)[] = []
const imageNodes: (HTMLImageElement | null)[] = []
const wholeTouch = ref<HTMLElement | null>(null)
const wholeImage = ref<HTMLImageElement | null>(null)

emit('progress', 0)

// La grieta: el tramo que se ve con los toques que lleva, recortado en su lienzo. Aparece de golpe, con el toque.
const crackClip = computed(() => {
  const span = crackSpan(taps.value, TAPS, whole?.crackFirst)
  return span ? `inset(0 ${(1 - span[1]) * 100}% 0 ${span[0] * 100}%)` : undefined
})

// ---- El temblor (el del motor) del entero y de cada pieza, sobre el centro de su base: lo blando se inclina y se
// aplasta, como una gelatina; lo demás se mece. ----
const ROCK = 5
const JELLY = { skew: 7, squash: 0.06 }
const sway = (node: () => HTMLElement | null | undefined, soft: boolean) => (x: number) => {
  const el = node()
  if (!el) return
  el.style.transform = x === 0 ? '' : soft ? `skewX(${x * JELLY.skew}deg) scaleY(${1 - Math.abs(x) * JELLY.squash})` : `rotate(${x * ROCK}deg)`
}
const wholeWobble = createWobble(world, sway(() => wholeTouch.value, false))
const wobbles = pieces.map((piece, i) => createWobble(world, sway(() => touchNodes[i], piece.soft)))
const shake = (part: number, strength: number) => {
  if (reduced) return
  pieces.forEach((piece, i) => { if (piece.part === part) wobbles[i]!.kick(strength) })
}

// ---- Tocar el entero: se mece y la grieta avanza; con el último toque, se abre. ----
function tapWhole() {
  if (props.blocked) return
  const result = game.tap()
  if (!result) return
  demo.stop()
  taps.value = game.taps()
  emit('progress', game.progress())
  if (result === 'abre') {
    open()
    return
  }
  playSound('tocar')
  if (!reduced) wholeWobble.kick(1)
}

// ---- Abrirse: el entero se va y sus partes salen de él, cada pieza en arco hasta su sitio: lo de fuera primero y
// girando; lo de dentro, un momento después y derecho. Al posarse tiemblan y, si la escena la trae, sale la pregunta
// (`strings.opened`). Cada cuadro escribe solo la transformación y la opacidad del sitio de la pieza. ----
const FLIGHT_MS = 620
const SOFT_WAIT = 0.18
const TURN = 26
function fly(start: Point, k: number) {
  pieces.forEach((piece, i) => {
    const node = placeNodes[i]
    if (!node) return
    const wait = piece.soft ? SOFT_WAIT : 0
    const e = easeOut(clamp((k - wait) / (1 - wait)))
    const from = { x: start.x - piece.at[0], y: start.y - piece.at[1] }
    const over = { x: from.x / 2, y: Math.min(from.y, 0) - Math.min(110, Math.abs(from.x) * 0.3) }
    const p = curve(from, over, { x: 0, y: 0 }, e)
    const turn = clamp(from.x / 300, -1, 1) * TURN * (1 - e)
    node.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${turn}deg) scale(${0.4 + 0.6 * e})`
    node.style.opacity = `${clamp(e * 4)}`
  })
}
function open() {
  playSound('destapar')
  haptic('drop')
  wholeWobble.still()
  // Salen de dentro del entero, a un tercio de su alto.
  const start = { x: whole?.at[0] ?? CARD.w / 2, y: (whole?.at[1] ?? CARD.h / 2) - heightOf(wholeImage.value) * 0.35 }
  fly(start, 0)
  phase.value = 'abriendo'
  world.tween(dur(FLIGHT_MS), k => fly(start, k), () => {
    placeNodes.forEach((node) => {
      if (!node) return
      node.style.transform = ''
      node.style.opacity = ''
    })
    game.opened()
    phase.value = 'abierto'
    if (!reduced) wobbles.forEach((wobble, i) => wobble.kick(pieces[i]!.soft ? 1 : 0.7))
    if (str('opened')) emit('feedback', sheet('info', raw('opened')))
  })
}

// ---- Tocar una parte: se marca, tiembla y la hoja dice su nombre y lo que trae. La primera vez cuenta; a la última
// se le suma el cierre de la escena. Otra vez sobre una ya vista, lo mismo, sin nada nuevo que ganar. ----
function tapPart(part: number) {
  if (props.blocked) return
  const result = game.touch(part)
  if (!result) return
  demo.stop()
  playSound('tocar')
  marked.value = part
  shake(part, 0.8)
  const { item } = parts[part]!
  if (!result.first) {
    emit('feedback', sheet('info', item.name, item.fact))
    return
  }
  parts[part]!.seen = true
  emit('progress', game.progress())
  if (result.all) emit('complete')
  emit('feedback', sheet('success', item.name, item.fact, result.all ? props.scene.meta.completionFeedback : null))
}

// ---- Demostrar lo que toca (la mano, en useDemo): un toque sobre el entero mientras está cerrado y, abierto, sobre la
// primera parte sin ver. Lo que la mano pulsa tiembla un poco, sin sonar ni contar. La primera, al poco; después de
// que alguien tocó, espera más. ----
const WHOLE = -1
const demo = useDemo<number>({
  ready: () => !props.blocked && phase.value !== 'abriendo',
  step: () => `${phase.value}-${taps.value}-${parts.filter(part => part.seen).length}`,
  first: () => (phase.value === 'cerrado' && !taps.value ? 1500 : 3200),
  move: () => {
    if (phase.value === 'cerrado') {
      if (!whole) return null
      const point = inBoard(whole.at, heightOf(wholeImage.value) / 2)
      return { from: point, to: point, target: WHOLE, tap: true }
    }
    const part = parts.findIndex(candidate => !candidate.seen)
    const i = pieces.findIndex(piece => piece.part === part)
    if (i < 0) return null
    const point = inBoard(pieces[i]!.at, heightOf(imageNodes[i]) / 2)
    return { from: point, to: point, target: part, tap: true }
  },
  reduced,
})
watch(() => demo.state.over, (over) => {
  if (over === null || reduced) return
  if (over === WHOLE) wholeWobble.kick(0.45)
  else shake(over, 0.45)
})
</script>
