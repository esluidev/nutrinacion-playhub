<template>
  <!-- Anuncio (Situar): la Bienvenida como portada del taller, la misma en todos los storyboards. Una columna centrada
       en el tablero por su alto real: arriba, una tarjeta con su escenario y, dentro, los protagonistas del tema;
       debajo, el título en grande y, si la hay, una línea que lo presenta. Al tocar la tarjeta, los protagonistas
       saltan y suena la frase de la escena. -->
  <div class="tb-an">
    <div class="tb-an-protagonistas" :style="{ height: `${card.h}px` }">
      <button type="button" class="tb-pieza tb-tarjeta tb-an-carta" :aria-label="voice" :style="box(CX - card.w / 2, 0, card.w, card.h)" @click="tap">
        <span class="tb-an-escena">
          <img v-if="view" ref="viewEl" class="tb-an-vista" decoding="sync" :src="librarySvg(view)" alt="" @load="measure">
          <span v-else class="tb-an-suelo" aria-hidden="true" :style="box(spot.x - layout.floor / 2, spot.y - FLOOR_H / 2, layout.floor, FLOOR_H)" />
          <span
            v-for="(figure, i) in figures"
            :key="i"
            class="tb-an-figura"
            aria-hidden="true"
            :style="{ ...box(figure.x, figure.y, figure.size, figure.size), rotate: `${figure.r}deg`, '--delay': `${i * 110}ms` }"
          >
            <img decoding="sync" :src="librarySvg(figure.svg)" alt="" :class="{ 'is-hopping': hopping }" :style="{ animationDelay: `${i * 90}ms` }">
          </span>
        </span>
      </button>
    </div>
    <h2 ref="titleEl" class="tb-an-titulo" :style="{ width: `${TEXT_W}px`, '--title-fit': titleFit }">{{ title }}</h2>
    <p v-if="subtitle" class="tb-an-linea" :style="{ width: `${TEXT_W - 80}px` }">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import { NARRATOR_KEY } from '../audio/narration'
import { vozDe } from '../audio/voz'
import { box, EXTERIOR, useSceneText } from '../board'
import { librarySvg } from '../content'
import { playSound } from '../engine/sound'
import { useWorld } from '../engine/world'
import type { TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
defineEmits<{ feedback: [], progress: [], complete: [] }>()

const narrate = inject(NARRATOR_KEY, null)
const { t, raw } = useSceneText(props)

const title = computed(() => t(props.scene.strings?.title))
const subtitle = computed(() => t(props.scene.strings?.subtitle))
// Lo que suena al tocar la tarjeta: la frase de la escena («Hoy vamos a conocer el huevo»), con su voz si la trae,
// o el título.
const intro = computed(() => (t(props.scene.meta.instruction) ? props.scene.meta.instruction : raw('title')))
const voice = computed(() => t(intro.value))

// ---- El escenario de la portada, de `defaults`: la vista de un lugar, que llena la tarjeta, `interior` (bajo techo)
// o `exterior` (al aire libre: el cielo arriba y el suelo del lugar abajo), o ninguna (el suelo plano del área). Con
// una vista, `stand` dice dónde se apoyan los protagonistas en las unidades del dibujo: el centro del grupo y la línea
// de la mesa o del suelo; si falta, al centro y abajo (en un exterior, donde se está de pie: `EXTERIOR`, board.ts). ----
const interior = props.scene.defaults.interior as string | undefined
const exterior = interior ? undefined : props.scene.defaults.exterior as string | undefined
const view = interior ?? exterior
const stand = (() => {
  const value = props.scene.defaults.stand
  return Array.isArray(value) && value.length === 2 && value.every(n => typeof n === 'number' && Number.isFinite(n)) ? value as [number, number] : null
})()

// ---- Medidas (tablero 1280 × 600). Todo centrado en x 640, en una columna que se centra en el alto del tablero según
// lo que mide: la tarjeta (414), el título (una línea de 96, 14 por debajo) y la línea que lo presenta (28, 6 por
// debajo; una línea, o dos si no cabe). Sin línea, el grupo se centra igual. La tarjeta lleva el contorno y el margen
// blanco del kit (6) y, dentro, el escenario, de 402 de alto y con la proporción de su dibujo (un interior de 616 × 536
// da 462 de ancho; uno más ancho que la columna se reduce hasta caber). El protagonista principal ocupa un cuadro de
// 260 y los demás, más pequeños, van delante y recostados. Del ítem solo se usa su dibujo. ----
const CX = 640
const LINE = 6
const STAGE_H = 402
const STAGE_MAX_W = 1040 - LINE * 2
const MAIN = 260
// Los dibujos guardan un margen abajo, un doceavo de su alto: el cuadro baja eso para que el dibujo toque el apoyo.
const FOOT = MAIN / 12
const FLOOR_H = 40
const TEXT_W = 1040

// El tamaño del dibujo del escenario: el de una vista se lee del propio dibujo; sin ella, el de las tarjetas con
// escenario del tablero (616 × 536).
const art = reactive({ w: 616, h: 536 })
const viewEl = ref<HTMLImageElement | null>(null)
function measure() {
  const el = viewEl.value
  if (el?.naturalWidth && el.naturalHeight) Object.assign(art, { w: el.naturalWidth, h: el.naturalHeight })
}
const scale = computed(() => Math.min(STAGE_H / art.h, STAGE_MAX_W / art.w))
const stage = computed(() => ({ w: art.w * scale.value, h: art.h * scale.value }))
const card = computed(() => ({ w: stage.value.w + LINE * 2, h: stage.value.h + LINE * 2 }))
// Dónde se apoya el grupo, en el escenario: lo que dice la escena; si no lo dice, abajo (en un exterior, donde se está
// de pie) o, sin lugar, algo por debajo del centro.
const spot = computed(() => {
  if (view) {
    const y = stand?.[1] ?? (exterior ? art.h - EXTERIOR.stand : art.h * 0.94)
    return { x: (stand?.[0] ?? art.w / 2) * scale.value, y: y * scale.value }
  }
  return { x: stage.value.w / 2, y: stage.value.h * 0.78 }
})

// Cómo se reparten de uno a tres protagonistas: desplazamiento desde el centro del grupo, escala e inclinación de cada
// uno (en el orden de `defaults.items`; el primero es el principal), y el ancho del suelo del área cuando no hay lugar.
interface Slot { dx: number, s: number, r: number }
const LAYOUTS: { slots: Slot[], floor: number }[] = [
  { slots: [{ dx: 0, s: 1, r: 0 }], floor: 240 },
  { slots: [{ dx: 45, s: 1, r: 0 }, { dx: -58, s: 0.77, r: -13 }], floor: 320 },
  { slots: [{ dx: 0, s: 1, r: 0 }, { dx: -112, s: 0.74, r: -13 }, { dx: 112, s: 0.74, r: 13 }], floor: 400 },
]
const shown = props.items.filter(item => item.svg).slice(0, 3)
const layout = LAYOUTS[Math.max(shown.length - 1, 0)]!
const figures = computed(() => shown.map((item, i) => {
  const slot = layout.slots[i]!
  const size = MAIN * slot.s
  return { svg: item.svg!, size, r: slot.r, x: spot.value.x + slot.dx - size / 2, y: spot.value.y + FOOT - size }
}))

// Al tocar la tarjeta, saltan uno tras otro y suena la frase. Se reinicia el salto si se vuelve a tocar. Sus esperas
// van en el tiempo de juego de la escena (con el tablero en pausa no corren).
const world = useWorld(() => props.blocked)
const hopping = ref(false)
let stopHop = () => {}
function tap() {
  if (props.blocked) return
  playSound('tocar')
  hopping.value = false
  stopHop()
  // En el cuadro siguiente, para que el salto empiece de nuevo.
  stopHop = world.after(0, () => {
    hopping.value = true
    stopHop = world.after(700 + shown.length * 90, () => (hopping.value = false))
  })
  if (voice.value) void narrate?.(vozDe([intro.value], props.locale))
}

// El título va en una sola línea a 96; si el del tema no cabe en el ancho, se reduce hasta caber.
const titleEl = ref<HTMLElement | null>(null)
const titleFit = ref(1)
async function fitTitle() {
  const el = titleEl.value
  if (!el) return
  titleFit.value = 1
  await nextTick()
  if (!el.scrollWidth) return
  titleFit.value = Math.min(1, el.clientWidth / el.scrollWidth)
}
onMounted(() => {
  measure()
  void fitTitle()
  void document.fonts?.ready.then(fitTitle)
})
watch(title, fitTitle)

defineExpose({ fit: fitTitle })
</script>
