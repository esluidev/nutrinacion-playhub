<template>
  <!-- Anuncio (Situar): la Bienvenida como portada del taller, la misma en todos los storyboards. Una columna centrada
       en el tablero por su alto real: arriba, los protagonistas del tema sobre su suelo, con unas chispas; debajo, el
       título en grande y, si la hay, una línea que lo presenta. Al tocarlos, saltan y suena la frase de la escena. -->
  <div class="tb-an">
    <div class="tb-an-protagonistas" :style="{ height: `${ART_H}px` }">
      <span class="tb-an-suelo" aria-hidden="true" :style="box(CX - layout.floor / 2, FLOOR_Y - FLOOR_H / 2, layout.floor, FLOOR_H)" />
      <span
        v-for="(figure, i) in figures"
        :key="i"
        class="tb-an-figura"
        aria-hidden="true"
        :style="{ ...box(CX + figure.dx - figure.size / 2, BASE_Y - figure.size, figure.size, figure.size), rotate: `${figure.r}deg`, '--delay': `${i * 110}ms` }"
      >
        <img :src="librarySvg(figure.svg)" alt="" :class="{ 'is-hopping': hopping }" :style="{ animationDelay: `${i * 90}ms` }">
      </span>
      <i
        v-for="(spark, i) in sparks"
        :key="`chispa-${i}`"
        class="tb-an-chispa"
        :class="{ 'is-mid': spark.mid }"
        aria-hidden="true"
        :style="{ ...box(spark.x, spark.y, spark.size, spark.size), '--delay': `${380 + i * 140}ms` }"
      />
      <button
        v-if="figures.length"
        type="button"
        class="tb-an-toque"
        :aria-label="voice"
        :style="box(CX - layout.spread - 24, BASE_Y - MAIN - 16, (layout.spread + 24) * 2, MAIN + 40)"
        @click="tap"
      />
    </div>
    <h2 ref="titleEl" class="tb-an-titulo" :style="{ width: `${TEXT_W}px`, '--title-fit': titleFit }">{{ title }}</h2>
    <p v-if="subtitle" class="tb-an-linea" :style="{ width: `${TEXT_W - 80}px` }">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import { NARRATOR_KEY } from '../audio/narration'
import { box, useSceneText } from '../board'
import { librarySvg } from '../content'
import type { TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
defineEmits<{ feedback: [], progress: [], complete: [] }>()

const narrate = inject(NARRATOR_KEY, null)
const { t } = useSceneText(props)

const title = computed(() => t(props.scene.strings?.title))
const subtitle = computed(() => t(props.scene.strings?.subtitle))
// Lo que suena al tocar a los protagonistas: la frase de la escena («Hoy vamos a conocer el huevo»), o el título.
const voice = computed(() => t(props.scene.meta.instruction) || title.value)

// ---- Medidas (tablero 1280 × 600). Todo centrado en x 640, en una columna que se centra en el alto del tablero según
// lo que mide: la franja de los protagonistas (285, de la chispa más alta al título), el título (una línea de 120) y la
// línea que lo presenta (28, 20 por debajo; una línea, o dos si no cabe). Sin línea, el grupo se centra igual. En la
// franja, los protagonistas se apoyan en un suelo plano del tono del área (su centro en 242). El principal ocupa un
// cuadro de 248 apoyado 20 por debajo del centro del suelo (los dibujos guardan un margen abajo); los demás, más
// pequeños, van delante y recostados. Del ítem solo se usa su dibujo. ----
const CX = 640
const ART_H = 285
const FLOOR_Y = 242
const FLOOR_H = 40
const BASE_Y = FLOOR_Y + 20
const MAIN = 248
const TEXT_W = 1040

// Cómo se reparten de uno a tres protagonistas: desplazamiento desde el centro, escala e inclinación de cada uno (en el
// orden de `defaults.items`; el primero es el principal), el ancho del suelo y hasta dónde llegan a cada lado.
interface Slot { dx: number, s: number, r: number }
const LAYOUTS: { slots: Slot[], floor: number, spread: number }[] = [
  { slots: [{ dx: 0, s: 1, r: 0 }], floor: 240, spread: 130 },
  { slots: [{ dx: 51, s: 1, r: 0 }, { dx: -82, s: 0.82, r: -16 }], floor: 330, spread: 192 },
  { slots: [{ dx: 0, s: 1, r: 0 }, { dx: -150, s: 0.8, r: -14 }, { dx: 150, s: 0.8, r: 14 }], floor: 440, spread: 250 },
]
const shown = props.items.filter(item => item.svg).slice(0, 3)
const layout = LAYOUTS[Math.max(shown.length - 1, 0)]!
const figures = shown.map((item, i) => ({ svg: item.svg!, dx: layout.slots[i]!.dx, size: MAIN * layout.slots[i]!.s, r: layout.slots[i]!.r }))
// Tres chispas a los lados del grupo, en el tono del área: una arriba a la izquierda y dos a la derecha.
const sparks = [
  { x: CX - layout.spread, y: 22, size: 30, mid: false },
  { x: CX + layout.spread - 18, y: 0, size: 22, mid: true },
  { x: CX + layout.spread, y: 119, size: 18, mid: false },
]

// Al tocarlos, saltan uno tras otro y suena la frase. Se reinicia el salto si se vuelve a tocar.
const hopping = ref(false)
let hopTimer: ReturnType<typeof setTimeout> | undefined
function tap() {
  if (props.blocked) return
  hopping.value = false
  clearTimeout(hopTimer)
  requestAnimationFrame(() => {
    hopping.value = true
    hopTimer = setTimeout(() => (hopping.value = false), 700 + figures.length * 90)
  })
  if (voice.value) void narrate?.(voice.value)
}
onBeforeUnmount(() => clearTimeout(hopTimer))

// El título va en una sola línea a 120; si el del tema no cabe en el ancho, se reduce hasta caber.
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
  void fitTitle()
  void document.fonts?.ready.then(fitTitle)
})
watch(title, fitTitle)

defineExpose({ fit: fitTitle })
</script>
