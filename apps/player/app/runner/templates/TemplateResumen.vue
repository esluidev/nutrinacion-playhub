<template>
  <!-- Resumen · Cerrar: la Despedida, el álbum de fotos del taller. Es una forma compartida: la misma en todos los
       storyboards, que solo traen sus fotos y sus textos. Plano detalle: en el centro, una pila con una foto por logro
       (`defaults.photos`, de tres a cinco, en el orden del taller) y, al final, la de la invitación a seguir aprendiendo
       (`defaults.invitation`). Cada toque en la foto de arriba (o empujarla fuera de la pila) la pasa: vuela a su sitio
       alrededor y se posa, girada, como una foto dejada en la mesa. Las fotos no llevan hoja ni voz: son recuerdos, no
       un repaso (Luis, 2026-11-20); su texto (`strings[id]`) es solo su nombre para un lector de pantalla. La única
       frase de recuerdo es la de la consigna. La última, la invitación, también vuela al collage; al posarse, cae en el
       centro la foto del grupo, un poco más grande: la foto de recuerdo, la misma en todos los storyboards (la cocina y
       los dos niños del taller, `GROUP_PHOTO` en `library.ts`), con lo que cada uno pone en la mesa (`defaults.group`:
       el alimento del taller). Con ella llegan el cierre de la escena y la invitación (`strings.invitacion` y
       `meta.completionFeedback`), que no sube en hoja: ocupa el lugar de la consigna en el pie (`closing`) y Terminar
       se activa. No hay orden que acertar ni nada que llevar a un lugar: es otra
       cosa que el repaso. Si nadie toca, la mano demuestra el toque.
       Cada foto es la tarjeta con escenario del tablero: dentro, en un lienzo de 616 × 536, el lugar de su escena (un
       exterior o un interior que la llena, o un suelo bajo el cielo) con sus dibujos y sus personajes de Rive, en la pose
       de sus valores, como en su escena. Las reglas, en `resumen.ts`. -->
  <div ref="layer" class="tb-layer tb-rs">
    <div
      v-for="photo in photos"
      :key="photo.id"
      :ref="(el) => { boxes[photo.id] = el as HTMLElement | null }"
      class="tb-rs-caja"
      :style="{ zIndex: photo.z }"
    >
      <button
        :ref="(el) => { photo.node = el as HTMLElement | null }"
        type="button"
        class="tb-pieza tb-tarjeta tb-rs-foto"
        :disabled="!isTop(photo)"
        :aria-label="str(photo.id)"
        :style="box(-BIG.w / 2, -BIG.h / 2, BIG.w, BIG.h)"
        v-bind="drag.bind(photo.id)"
      >
        <span class="tb-rs-vista" :style="box(LINE, LINE, BIG.w - LINE * 2, BIG.h - LINE * 2)">
          <span class="tb-rs-lienzo" :style="{ scale: K }">
            <img v-if="photo.spec.scenery" class="tb-rs-escenario" :src="librarySvg(photo.spec.scenery)" alt="" decoding="sync">
            <img v-if="photo.spec.floor" class="tb-rs-suelo" :src="librarySvg(photo.spec.floor.svg)" alt="" decoding="sync" :style="floorStyle(photo.spec.floor)">
            <img
              v-for="(drawing, k) in photo.spec.pieces ?? []"
              :key="k"
              class="tb-rs-pieza"
              :src="librarySvg(drawing.svg)"
              alt=""
              decoding="sync"
              :style="drawingStyle(drawing)"
            >
            <template v-for="(character, k) in photo.spec.characters ?? []" :key="`p-${k}`">
              <RiveCharacter
                v-if="libraryRive(character.rive)"
                :src="libraryRive(character.rive)!"
                :values="character.values"
                :flags="character.flags"
                :paused="blocked"
                :settle="character.settle"
                :delay="delayOf(photo.index, k)"
                :style="box(CANVAS.w / 2 + character.box[0] - character.box[2] / 2, character.box[1], character.box[2], character.box[2])"
              />
            </template>
          </span>
        </span>
      </button>
    </div>

    <!-- La foto del grupo, al final: la cocina, los niños y lo que el storyboard pone en la mesa. No se toca. -->
    <div
      v-if="celebrating"
      class="tb-pieza tb-tarjeta tb-rs-grupo"
      aria-hidden="true"
      :style="box(CENTER.x - GROUP.w / 2, CENTER.y - GROUP.h / 2, GROUP.w, GROUP.h)"
    >
      <span class="tb-rs-vista" :style="box(LINE, LINE, GROUP.w - LINE * 2, GROUP.h - LINE * 2)">
        <span class="tb-rs-lienzo" :style="{ scale: GROUP_K }">
          <img class="tb-rs-escenario" :src="librarySvg(GROUP_PHOTO.scenery)" alt="" decoding="sync">
          <img class="tb-rs-escenario" :src="librarySvg(GROUP_PHOTO.kids)" alt="" decoding="sync">
          <img
            v-for="(drawing, k) in group?.pieces ?? []"
            :key="k"
            class="tb-rs-pieza"
            :src="librarySvg(drawing.svg)"
            alt=""
            decoding="sync"
            :style="drawingStyle(drawing)"
          >
        </span>
      </span>
    </div>

    <!-- La demostración (useDemo): la mano sola, que pulsa la foto de arriba. -->
    <DemoHand :demo="demo.state" :size="NO_COPY" />
  </div>
</template>

<script setup lang="ts">
import { box, curve, easeInOut, prefersReducedMotion, useAnimation, useSceneText } from '../board'
import { libraryRive, librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { playSound } from '../engine/sound'
import { useWorld } from '../engine/world'
import RiveCharacter from '../RiveCharacter.vue'
import { useDemo } from '../useDemo'
import { useDrag } from '../useDrag'
import { replay } from '../useTimers'
import type { FeedbackPayload, TemplateProps } from '../types'
import { GROUP_PHOTO } from './library'
import { collageSpots, createAlbum, STACK_UNDER } from './resumen'
import type { Spot } from './resumen'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { str, raw, sheet } = useSceneText(props)

type Pair = [number, number]
/** Un dibujo de la foto, apoyado por el centro de su base en `at` (x desde el centro del lienzo, y desde arriba), a su `scale`; `drop`, el aire que trae bajo su base, en su lienzo. */
interface Drawing { svg: string, at: Pair, scale?: number, drop?: number }
/**
 * Un personaje de Rive en la foto, en la pose de sus valores: su lienzo cuadrado, `box` (x de su centro desde el
 * centro del lienzo, y de su borde de arriba, y su lado). Si llega a su pose con una transición (el niño que muestra los
 * músculos), `settle` es lo que tarda, en ms: hasta entonces retiene su escena.
 */
interface Character { rive: string, values?: Record<string, string>, flags?: Record<string, boolean>, box: [number, number, number], settle?: number }
/**
 * Lo que lleva una foto, en un lienzo de 616 × 536: el lugar de su escena (`scenery`, un exterior o un interior de la
 * librería que la llena; si su lienzo es otro, se recorta por los lados), o un suelo (`floor`, abajo y de lado a lado,
 * bajo el cielo de los exteriores); sus dibujos y sus personajes.
 */
interface PhotoSpec { id: string, scenery?: string, floor?: { svg: string, w: number, h: number }, pieces?: Drawing[], characters?: Character[] }
interface Photo {
  id: string
  spec: PhotoSpec
  /** Su lugar en la pila: los logros en orden y la invitación al final. */
  index: number
  /** Dónde está (su centro), su escala y su giro: los escribe el juego y se dibujan en su transformación. */
  x: number
  y: number
  s: number
  r: number
  z: number
  node: HTMLElement | null
}

// ---- Medidas (tablero 1280 × 600). La foto de arriba de la pila, en el centro, de 360 × 315: dentro del contorno y el
// margen blanco de la tarjeta (6), su lienzo de 616 × 536 a escala. Las que pasan se posan a 222 de ancho. ----
const CANVAS = { w: 616, h: 536 }
const LINE = 6
const BIG = { w: 360, h: Math.round((360 - LINE * 2) * CANVAS.h / CANVAS.w) + LINE * 2 }
const K = (BIG.w - LINE * 2) / CANVAS.w
const SMALL = 222 / BIG.w
const CENTER = { x: 640, y: 300 }
// La foto del grupo, en el centro al final: 420 de ancho, con su lienzo de 616 × 536 a escala.
const GROUP = { w: 420, h: Math.round((420 - LINE * 2) * CANVAS.h / CANVAS.w) + LINE * 2 }
const GROUP_K = (GROUP.w - LINE * 2) / CANVAS.w
// Lo que tarda en caer, y en sonar al posarse.
const DROP_MS = 520
// La foto de arriba va apenas girada; empujarla más allá de esto (desde el centro de la pila) la pasa.
const TOP_R = -1
const PUSH = 150
const NO_COPY = { w: 0, h: 0 }

function drawingStyle(drawing: Drawing) {
  const scale = drawing.scale ?? 1
  const [dx, y] = drawing.at
  return { left: `${CANVAS.w / 2 + dx}px`, top: `${y + (drawing.drop ?? 0) * scale}px`, scale: `${scale}` }
}
// El suelo, abajo y de lado a lado del lienzo.
function floorStyle(floor: { w: number, h: number }) {
  const h = floor.h * CANVAS.w / floor.w
  return box(0, CANVAS.h - h, CANVAS.w, h)
}

// Las aves y los personajes de las fotos se montan todos a la vez: cada uno empieza a moverse con su propia espera, para
// que no lo hagan al unísono (Luis: «evita que las aves corran la animación al mismo tiempo en las distintas
// tarjetas»). Esperas de 0 a 1,8 s, distintas en cada foto y en cada personaje de una foto.
const delayOf = (photo: number, k: number) => ((photo * 5 + k * 3) % 7) * 300

// ---- El juego: las reglas, en `resumen.ts`; aquí, lo que se ve. ----
const reduced = prefersReducedMotion()
const dur = (ms: number) => (reduced ? 0 : ms)
// El tiempo de juego de la escena: con el tablero en pausa, las fotos y las esperas se detienen y siguen al volver.
const world = useWorld(() => props.blocked)
const layer = ref<HTMLElement | null>(null)
const boxes: Record<string, HTMLElement | null> = {}

const specs = (props.scene.defaults.photos as PhotoSpec[] | undefined) ?? []
const invitation = props.scene.defaults.invitation as Omit<PhotoSpec, 'id'> | undefined
/** Lo que el storyboard pone en la mesa de la foto del grupo: sus dibujos, como los de una foto. */
const group = props.scene.defaults.group as { pieces?: Drawing[] } | undefined
const spots = collageSpots(specs.length + (invitation ? 1 : 0))
// Sin un sitio para cada logro (menos de tres o más de cinco), la pila trae solo la invitación.
const logros = spots.length ? specs : []
const album = createAlbum(logros.length)
const photos = reactive<Photo[]>([
  ...logros.map((spec, index) => ({ id: spec.id, spec, index })),
  ...(invitation ? [{ id: 'invitacion', spec: { ...invitation, id: 'invitacion' }, index: logros.length }] : []),
].map(photo => ({ ...photo, x: CENTER.x, y: CENTER.y, s: 1, r: TOP_R, z: 0, node: null })))
const photoOf = (id: string) => photos.find(photo => photo.id === id)!
const flight = useAnimation(world)
/** Una foto va volando a su sitio: mientras tanto, la siguiente todavía no se pasa. */
const flying = ref(false)
const isTop = (photo: Photo) => !album.done() && album.top() === photo.index && !flying.value
/** Ya cayó la foto del grupo. */
const celebrating = ref(false)

// La pila: la de arriba encima, apenas girada; debajo asoman las dos siguientes, corridas y giradas; las demás esperan
// detrás. Las que ya pasaron, en su sitio, por debajo de la pila; la que vuela, encima de todo.
function stack() {
  const top = album.top()
  photos.forEach((photo) => {
    if (photo.index < top) return
    const depth = photo.index - top
    const under = STACK_UNDER[Math.min(depth, STACK_UNDER.length) - 1]
    photo.x = CENTER.x + (depth ? under!.x : 0)
    photo.y = CENTER.y + (depth ? under!.y : 0)
    photo.r = depth ? under!.r : TOP_R
    photo.s = 1
    photo.z = 30 - Math.min(depth, STACK_UNDER.length + 1)
  })
}
stack()
emit('progress', 0)

// ---- Pasar la foto de arriba: vuela a su sitio del collage, encogiéndose y girando, sin hoja ni voz;
// la siguiente queda arriba. Con un toque suena al salir y al posarse; tras empujarla, ya sonó al soltarla y vuela
// desde donde se soltó. La invitación vuela igual y, al posarse, cae la foto del grupo y se completa la escena. ----
const FLY_MS = 700
const HOP_MS = 420

function pass(photo: Photo, dropped = false) {
  if (props.blocked || !isTop(photo)) return
  const step = album.pass()
  if (!step) return
  demo.stop()
  emit('progress', album.progress())
  fly(photo, spots[step.index]!, dropped, step.kind === 'invitacion' ? celebrate : undefined)
}

// Ya pasaron todas: cae en el centro la foto del grupo, como una foto que se deja sobre la mesa (su caída, en el CSS);
// al posarse suena, la escena se completa (el confeti del marco) y la invitación pasa al pie, en el lugar de la consigna
// (`closing`: sin hoja, Terminar se activa).
function celebrate() {
  celebrating.value = true
  world.after(dur(DROP_MS), () => {
    playSound('soltar')
    emit('complete')
    emit('feedback', sheet('closing', raw('invitacion'), props.scene.meta.completionFeedback))
  })
}

function fly(photo: Photo, spot: Spot, dropped: boolean, landed?: () => void) {
  const start = { x: photo.x, y: photo.y }
  const end = { x: spot.x, y: spot.y }
  const via = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - (dropped ? 40 : 90) }
  const from = { s: photo.s, r: photo.r }
  photo.z = 40
  flying.value = true
  if (!dropped) playSound('volar')
  // La siguiente sube a lo alto de la pila mientras esta vuela.
  stack()
  flight.run(dur(dropped ? HOP_MS : FLY_MS), (k) => {
    const e = easeInOut(k)
    Object.assign(photo, curve(start, via, end, e))
    photo.s = from.s + (SMALL - from.s) * e
    photo.r = from.r + (spot.r - from.r) * e
  }, () => {
    flying.value = false
    photo.z = 3 + photo.index
    if (!dropped) playSound('soltar')
    landed?.()
  })
}

// Empujar la foto de arriba (el gesto, en useDrag, con la física del motor), o tocarla. Soltada lejos de la pila
// (`PUSH`), pasa; cerca, vuelve. El toque llega por el clic (también con el teclado); el que sigue a un arrastre se
// descarta.
const drag = useDrag<string, 'fuera'>({
  layer,
  world,
  home: (id) => { const p = photoOf(id); return { x: p.x, y: p.y } },
  pieces: () => photos.filter(isTop).map(photo => photo.id),
  canStart: id => !props.blocked && isTop(photoOf(id)),
  targetAt: point => (Math.hypot(point.x - CENTER.x, point.y - CENTER.y) > PUSH ? 'fuera' : null),
  drop: (id, target, { offset }) => {
    if (target === null) return
    // Queda donde se soltó y desde ahí vuela a su sitio.
    const photo = photoOf(id)
    photo.x += offset.x
    photo.y += offset.y
    pass(photo, true)
  },
  tap: id => pass(photoOf(id)),
  lift: -16,
  reduced,
})
watch(() => props.blocked, (blocked) => { if (blocked) drag.cancel() })

// Dónde se dibuja cada foto: su centro más su desplazamiento (el del dedo), su giro y su escala. Se escribe en la
// transformación de su caja, fuera del render de la plantilla: nada del tablero se recalcula mientras se mueve.
function place(photo: Photo) {
  const node = boxes[photo.id]
  if (!node) return
  const o = drag.offsetOf(photo.id)
  node.style.transform = `translate3d(${photo.x + o.x}px, ${photo.y + o.y}px, 0) rotate(${photo.r}deg) scale(${photo.s})`
}
onMounted(() => photos.forEach(photo => watchEffect(() => place(photo))))

// ---- Demostrar lo que toca (la mano, en useDemo): un toque sobre la foto de arriba mientras la escena no termina. Lo
// que la mano pulsa salta un poco, sin sonar ni contar. La primera, al poco; después de pasar una, espera más. ----
const demo = useDemo<number>({
  ready: () => !props.blocked && !flying.value && !drag.busy(),
  step: () => `${album.top()}`,
  first: () => (album.top() === 0 ? 1500 : 4000),
  move: () => (album.done() || !photos.length ? null : { from: { x: CENTER.x + 40, y: CENTER.y + 40 }, to: CENTER, target: album.top(), tap: true }),
  reduced,
})
watch(() => demo.state.over, (over) => {
  if (over === null || reduced) return
  const photo = photos.find(p => p.index === over)
  replay(photo?.node ?? null, 'is-nudged')
})
</script>
