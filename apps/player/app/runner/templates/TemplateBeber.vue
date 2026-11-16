<template>
  <!-- Beber · la pausa de agua. Es una forma compartida: la misma en todos los storyboards (Hidratación, y también la
       Pausa de actividad física), que solo traen su consigna, su pregunta, su cierre y sus sorbos. Plano detalle: una
       sola tarjeta con su interior (`defaults.interior`, el lugar del taller: la cocina; `detailCard`, board.ts) y,
       dentro, sobre la mesa, un vaso grande centrado en su posavasos de madera. Todos toman un sorbo de
       agua de verdad y un niño toca el vaso: cuenta un sorbo, el agua sube una parte (de `defaults.sips`) y el vaso se
       mece. Con el último queda lleno, la escena se completa y sale la hoja: la pregunta de después (`strings.after`),
       si la hay, y el cierre (`meta.completionFeedback`). Ya lleno, tocarlo solo lo mece. No hay hoja en cada sorbo ni
       tiempo: la pausa es tranquila y el juego no espera a nadie. Si nadie toca, la mano demuestra un toque.
       El vaso y su posavasos son de la librería y los trae la plantilla (`library.ts`); el interior lo nombra la escena. El vaso, en cuatro piezas sobre un
       mismo lienzo: el vaso; el agua y su superficie, recortadas a su hueco; y los brillos, delante. El agua sube solo con
       transformaciones. Las reglas, en `beber.ts`. -->
  <div class="tb-layer tb-be">
    <!-- La tarjeta: su interior, el posavasos sobre la mesa y, en él, el vaso. -->
    <div class="tb-pieza tb-tarjeta tb-be-carta" :style="box(CARD.x, CARD.y, CARD.w, CARD.h)">
      <img v-if="interior" class="tb-be-interior" decoding="sync" :src="librarySvg(interior)" alt="" :style="box(CARD.line, CARD.line, CARD.w - CARD.line * 2, CARD.h - CARD.line * 2)">
      <img decoding="sync" :src="librarySvg(MAT.svg)" alt="" :style="box(SEAT.x - MAT.seat.x, SEAT.y - MAT.seat.y, MAT.w, MAT.h)">
      <span class="tb-be-sitio" :style="{ left: `${SEAT.x}px`, top: `${SEAT.y}px` }">
        <button ref="glassNode" type="button" class="tb-be-vaso" :aria-label="text('sip')" :style="glassStyle" @click="tap">
          <img :src="librarySvg('vaso')" alt="" decoding="sync">
          <span class="tb-be-hueco" :style="{ clipPath: HOLLOW_CLIP }">
            <img ref="waterNode" class="tb-be-agua" :src="librarySvg('vaso-agua')" alt="" decoding="sync">
            <img ref="surfaceNode" class="tb-be-agua" :src="librarySvg('vaso-agua-superficie')" alt="" decoding="sync" :style="{ left: `${GLASS.w / 2 - GLASS.hollow.mouth.half}px` }">
          </span>
          <img :src="librarySvg('vaso-frente')" alt="" decoding="sync">
        </button>
      </span>
    </div>

    <!-- La demostración (useDemo): la mano sola, que pulsa el vaso. -->
    <DemoHand :demo="demo.state" :size="NO_COPY" />
  </div>
</template>

<script setup lang="ts">
import { box, detailCard, easeInOut, prefersReducedMotion, useAnimation, useSceneText } from '../board'
import { librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { playSound } from '../engine/sound'
import { createWobble } from '../engine/wobble'
import { useWorld } from '../engine/world'
import { useRunnerText } from '../i18n'
import { useDemo } from '../useDemo'
import type { FeedbackPayload, TemplateProps } from '../types'
import { createSips, hollowHalf, waterLine } from './beber'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t, str } = useSceneText(props)
const text = useRunnerText(() => props.locale)

const reduced = prefersReducedMotion()
const dur = (ms: number) => (reduced ? 0 : ms)
// El tiempo de juego de la escena: con el tablero en pausa, el agua y el vaso se quedan quietos.
const world = useWorld(() => props.blocked)

// ---- El vaso de la librería (`vaso`, `vaso-agua`, `vaso-agua-superficie` y `vaso-frente`), en su lienzo de 200 × 250:
// su dibujo empieza en y 10 y se apoya en x 100, y 236; su hueco va de la boca (y 30, 76 a cada lado) al piso (y 204, 54 a cada lado, curvo hasta
// y 215); la superficie del agua mide 32 de alto; lleno, queda en y 52, un poco por debajo de la boca; vacío, el agua
// espera bajo el piso, fuera del hueco. ----
const GLASS = {
  w: 200,
  h: 250,
  top: 10,
  seat: { x: 100, y: 236 },
  hollow: { mouth: { y: 30, half: 76 }, floor: { y: 204, half: 54 } },
  floorCurve: 11,
  surfaceHeight: 32,
  full: 52,
  empty: 240,
}
// El hueco, para recortar el agua: de la boca a los lados del piso, y el piso curvo con un punto cada 10 grados.
const HOLLOW_CLIP = (() => {
  const { mouth, floor } = GLASS.hollow
  const cx = GLASS.w / 2
  const curve = Array.from({ length: 19 }, (_, i) => {
    const angle = i * Math.PI / 18
    return `${(cx + floor.half * Math.cos(angle)).toFixed(1)}px ${(floor.y + GLASS.floorCurve * Math.sin(angle)).toFixed(1)}px`
  })
  return `polygon(${cx - mouth.half}px ${mouth.y}px, ${cx + mouth.half}px ${mouth.y}px, ${curve.join(', ')})`
})()

// ---- Medidas (tablero 1280 × 600, columna 120–1160). La tarjeta del plano detalle (`detailCard`, board.ts), centrada:
// de 732 × 560 para un interior ancho de la librería (704 × 536); si el de la escena tiene otro lienzo, lo dice en
// `defaults.canvas`. Dentro, en las unidades del dibujo del interior: el vaso se apoya en la mesa, centrado y en
// y 502 (su punto más bajo), sobre su posavasos (`posavasos`, 360 × 76: lo que lleva queda centrado en él, con su
// punto más bajo en x 180, y 53), y va a escala 1,8 (unos 407 de alto). ----
const interior = props.scene.defaults.interior as string | undefined
const canvas = (props.scene.defaults.canvas as [number, number] | undefined) ?? [704, 536]
const CARD = detailCard({ w: canvas[0], h: canvas[1] })
const SCALE = 1.8
const MAT = { svg: 'posavasos', w: 360, h: 76, seat: { x: 180, y: 53 } }
/** Dónde se apoya el vaso, en la tarjeta. */
const SEAT = { x: CARD.w / 2, y: CARD.line + 502 * CARD.k }
const RISE = (GLASS.seat.y - GLASS.top) * SCALE
const NO_COPY = { w: 0, h: 0 }
// El centro del vaso en el tablero, donde pulsa la mano.
const CENTER = { x: CARD.x + SEAT.x, y: CARD.y + SEAT.y - RISE / 2 }
const glassStyle = {
  width: `${GLASS.w}px`,
  height: `${GLASS.h}px`,
  translate: `${-GLASS.seat.x}px ${-GLASS.seat.y}px`,
  transformOrigin: `${GLASS.seat.x}px ${GLASS.seat.y}px`,
  '--s': SCALE,
}

// ---- El agua: su cuerpo sube entero y su superficie, con él, se ensancha conforme sube (el vaso es más ancho arriba).
// Solo transformaciones, dentro del recorte del hueco. Las escribe el juego y nunca van en el `:style` de la plantilla:
// cada vez que la plantilla se vuelve a pintar (al completarse la escena, por ejemplo) devolvería el agua a ese valor. ----
const glassNode = ref<HTMLElement | null>(null)
const waterNode = ref<HTMLElement | null>(null)
const surfaceNode = ref<HTMLElement | null>(null)
const transforms = (y: number) => ({
  water: `translate3d(0, ${y}px, 0)`,
  surface: `translate3d(0, ${y - GLASS.surfaceHeight / 2}px, 0) scaleX(${hollowHalf(y, GLASS.hollow) / GLASS.hollow.mouth.half})`,
})
let line = GLASS.empty
function paint(y: number) {
  line = y
  const now = transforms(y)
  if (waterNode.value) waterNode.value.style.transform = now.water
  if (surfaceNode.value) surfaceNode.value.style.transform = now.surface
}

// ---- El juego: las reglas, en `beber.ts`. ----
const game = createSips((props.scene.defaults.sips as number | undefined) ?? 3)
const rise = useAnimation(world)
let rising = false
const RISE_MS = 700
// El vaso se mece sobre su base al tocarlo (el temblor del motor).
const ROCK = 3
const wobble = createWobble(world, (x) => {
  if (glassNode.value) glassNode.value.style.transform = x === 0 ? '' : `rotate(${x * ROCK}deg)`
})

emit('progress', 0)
// Vacío al empezar: se pinta al montar, antes de que el navegador dibuje el primer cuadro.
onMounted(() => paint(GLASS.empty))

// Un toque es un sorbo: el agua sube una parte y el vaso se mece. Con el último, al terminar de subir, la escena se
// completa y sale la hoja. Ya lleno, solo se mece.
function tap() {
  if (props.blocked) return
  const result = game.sip()
  demo.stop()
  if (!reduced) wobble.kick(result ? 1 : 0.6)
  if (!result) {
    playSound('tocar')
    return
  }
  playSound('soltar')
  emit('progress', game.level())
  const from = line
  const to = waterLine(game.level(), GLASS.hollow, GLASS.full)
  rising = true
  rise.run(dur(RISE_MS), k => paint(from + (to - from) * easeInOut(k)), () => {
    rising = false
    if (result.full) finish()
  })
}

// La hoja de cierre: la pregunta de después de beber, si la escena la trae, y debajo el cierre.
function finish() {
  emit('complete')
  const question = str('after')
  const closing = t(props.scene.meta.completionFeedback)
  emit('feedback', { kind: 'success', title: question || closing, body: question ? closing || undefined : undefined })
}

// ---- Demostrar lo que toca (la mano, en useDemo): un toque sobre el vaso mientras no está lleno. Lo que la mano
// pulsa se mece un poco, sin sonar ni contar. La primera, al poco; después de un sorbo, espera más. ----
const demo = useDemo<number>({
  ready: () => !props.blocked && !rising,
  step: () => `${game.done()}`,
  first: () => (game.done() ? 3200 : 1500),
  move: () => (game.done() < game.total() ? { from: CENTER, to: CENTER, target: 0, tap: true } : null),
  reduced,
})
watch(() => demo.state.over, (over) => {
  if (over !== null && !reduced) wobble.kick(0.45)
})
</script>
