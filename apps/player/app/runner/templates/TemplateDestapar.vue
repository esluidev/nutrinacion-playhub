<template>
  <!-- Destapar · Revelar. Plano fila, una columna por ítem: arriba su tarjeta (una tarjeta con escenario si el ítem trae
       la isla de su lugar, `ground`) y, debajo, lo que se ve (su dibujo, asentado en el apoyo de la escena, `defaults.support`:
       un nido), todos a una sola escala para que se comparen. Mientras esconde algo, la tarjeta lleva un «?» en su
       blanco. El grupo dice qué cree que esconde y un niño toca lo que se ve (o su tarjeta): el «?» se va, lo que
       escondía (el personaje de Rive) aparece en la tarjeta, apoyado en su suelo, y la tarjeta rebota. Si nadie toca,
       la mano demuestra un toque sobre el primero por destapar. Las piezas siguen el patrón del tablero (runner.css):
       la tarjeta, blanca y plana con el contorno suave; lo que se ve, sin caja. -->
  <div ref="layer" class="tb-layer">
    <!-- La base de la fila: la isla larga del lugar donde están los nidos. -->
    <img v-if="ground" class="tb-base" decoding="sync" :src="librarySvg(ground)" alt="" :style="{ left: `${BASE.x}px`, top: `${BASE.y}px`, width: `${BASE.w}px` }">
    <template v-for="(card, i) in cards" :key="card.item.id">
      <button
        :ref="(el) => { cardNodes[i] = el as HTMLElement | null }"
        type="button"
        class="tb-pieza tb-tarjeta"
        :aria-label="card.open ? t(card.item.name) : text('uncover')"
        :style="box(columnX(i), CARD_Y, CARD.w, CARD.h)"
        @click="touch(i)"
      >
        <img decoding="sync" v-if="card.item.ground" class="tb-isla" :src="librarySvg(card.item.ground)" alt="" :style="box(SCENERY.island.x, SCENERY.island.y, SCENERY.island.w, SCENERY.island.h)">
        <span class="tb-incognita" :class="{ 'is-gone': card.open }" aria-hidden="true" :style="box(0, SCENERY.line, CARD.w, MARK_H)">?</span>
        <RiveCharacter
          v-if="card.open && riveOf(card.item)"
          :ref="(el) => { characters[i] = el as InstanceType<typeof RiveCharacter> | null }"
          class="tb-ave"
          :src="riveOf(card.item)!"
          :values="card.item.character?.enum"
          :paused="blocked"
          :style="characterBox(card.item)"
        />
      </button>
      <span v-if="card.open && profile.labels" class="tb-etiqueta" :style="{ left: `${columnX(i) + CARD.w / 2}px`, top: `${CARD_Y + CARD.h}px` }">{{ t(card.item.name) }}</span>

      <button
        :ref="(el) => { objectNodes[i] = el as HTMLElement | null }"
        type="button"
        class="tb-objeto"
        :aria-label="t(card.item.description) || text('uncover')"
        :style="box(objectX(i), OBJECT.y, OBJECT.w, OBJECT.h)"
        @click="touch(i)"
      >
        <img v-if="support" decoding="sync" class="tb-nido" :src="librarySvg(support.svg)" alt="" :style="nestBox()">
        <img decoding="sync" class="tb-huevo" :src="librarySvg(card.item.svg)" alt="" :style="eggBox(card.item)">
        <img v-if="support?.front" decoding="sync" class="tb-nido" :src="librarySvg(support.front)" alt="" :style="nestBox()">
      </button>
    </template>

    <!-- La demostración (useDemo): la mano sola, que pulsa lo que se ve del primero por destapar. -->
    <DemoHand :demo="demo.state" :size="NO_COPY" />
  </div>
</template>

<script setup lang="ts">
import { box, ISLAND_ROW, prefersReducedMotion, sceneryCard, useSceneText } from '../board'
import type { Point } from '../board'
import { libraryRive, librarySvg } from '../content'
import DemoHand from '../DemoHand.vue'
import { playSound } from '../engine/sound'
import { useWorld } from '../engine/world'
import { useRunnerText } from '../i18n'
import RiveCharacter from '../RiveCharacter.vue'
import { useDemo } from '../useDemo'
import { replay } from '../useTimers'
import type { DatosItem, FeedbackPayload, SupportSpec, TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t } = useSceneText(props)
const text = useRunnerText(() => props.locale)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). Una columna por ítem, de 320 y con 40 entre ellas: arriba la
// tarjeta con escenario, de 320 × 280; debajo, a 24 del dibujo más alto, lo que se ve, en su nido. Si la escena trae
// una base (`defaults.ground`), los nidos se apoyan en ella. El conjunto, con la base, va centrado en el alto del
// tablero. ----
const CARD = { w: 320, h: 280 }
const GAP = 40
const SCENERY = sceneryCard(CARD.w, CARD.h)
const columnX = (i: number) => 640 - (props.items.length * CARD.w + (props.items.length - 1) * GAP) / 2 + i * (CARD.w + GAP)
// El personaje (el lienzo de Rive de las aves: las patas al 85 % de su alto) grande y apoyado en el suelo de la
// tarjeta; sin suelo, apoyado cerca del borde de abajo.
const CHARACTER = { size: 250, feet: 0.85 }
const groundOf = (item: DatosItem) => (item.ground ? SCENERY.stand : CARD.h - 30)
const characterBox = (item: DatosItem) =>
  box((CARD.w - CHARACTER.size) / 2, groundOf(item) - CHARACTER.size * CHARACTER.feet, CHARACTER.size, CHARACTER.size)

// El «?» de la tarjeta que esconde algo: pequeño y discreto, centrado en su blanco, encima del suelo.
const MARK_H = SCENERY.island.y - SCENERY.line

// Lo que se ve: el dibujo (lienzo de 164 × 192; lo dibujado va de y 16 a 176) a una sola escala para todos, 170 por
// `sizeScale`: los tamaños relativos son contenido, nunca se igualan. Va asentado en el apoyo de la escena
// (`defaults.support`: su dibujo y sus medidas los trae la escena), a 210 de ancho, para que lo que se ve se note más
// que su apoyo: la base de lo dibujado descansa en el asiento del apoyo y, delante, va su capa de delante, que la
// tapa. Sin apoyo, lo que se ve descansa en la línea de abajo.
const EGG_H = 170
const SHELL = { top: 16 / 192, base: 176 / 192 }
const support = props.scene.defaults.support as SupportSpec | undefined
const NEST_W = 210
const NEST = support ? { w: NEST_W, h: NEST_W * support.h / support.w, k: NEST_W / support.w } : { w: 0, h: 0, k: 0 }
const SEAT = support ? { x: (support.seats[0]?.[0] ?? support.w / 2) * NEST.k, y: (support.seats[0]?.[1] ?? support.h) * NEST.k } : { x: 0, y: 0 }
const eggH = (item: DatosItem) => (item.sizeScale ?? 0.68) * EGG_H
// Lo que asoma por encima de su apoyo el dibujo más alto.
const rise = Math.max(0, ...props.items.map(item => eggH(item) * (SHELL.base - SHELL.top) - SEAT.y))
const OBJECT_TOP_GAP = 24
// La base de la fila (`defaults.ground`): la isla larga del lugar donde están los nidos (`ISLAND_ROW`, board.ts), del
// ancho de la columna del juego y centrada en el tablero. Los nidos se apoyan en ella y la isla asoma por delante de
// ellos: eso cuenta para centrar el conjunto.
const ground = props.scene.defaults.ground as string | undefined
const block = CARD.h + OBJECT_TOP_GAP + rise + NEST.h + (ground ? ISLAND_ROW.front : 0)
const CARD_Y = (600 - block) / 2
// La zona que se toca: de lo más alto de lo que se ve al pie de su apoyo, de 280 de ancho.
const OBJECT = { w: 280, y: CARD_Y + CARD.h + OBJECT_TOP_GAP - 12, h: rise + 12 + NEST.h }
const nestTop = OBJECT.h - NEST.h
const nestLeft = (OBJECT.w - NEST.w) / 2
const BASE = { w: ISLAND_ROW.w, x: 640 - ISLAND_ROW.w / 2, y: OBJECT.y + OBJECT.h - ISLAND_ROW.rest }
const nestBox = () => box(nestLeft, nestTop, NEST.w, NEST.h)
/** Lo que se ve, en su zona: centrado en su asiento y con la base de lo dibujado sobre él. */
function eggRect(item: DatosItem) {
  const h = eggH(item)
  const w = h * 164 / 192
  return { x: (support ? nestLeft + SEAT.x : OBJECT.w / 2) - w / 2, y: nestTop + SEAT.y - h * SHELL.base, w, h }
}
function eggBox(item: DatosItem) {
  const rect = eggRect(item)
  return box(rect.x, rect.y, rect.w, rect.h)
}
const objectX = (i: number) => columnX(i) + (CARD.w - OBJECT.w) / 2
const riveOf = (item: DatosItem) => libraryRive(item.character?.rive)

// ---- El juego. ----
// El tiempo de juego de la escena: con el tablero en pausa no corre, así que nada vence mientras tanto.
const world = useWorld(() => props.blocked)
const reduced = prefersReducedMotion()
const layer = ref<HTMLElement | null>(null)
const cardNodes: (HTMLElement | null)[] = []
const objectNodes: (HTMLElement | null)[] = []
const characters = ref<(InstanceType<typeof RiveCharacter> | null)[]>([])
const cards = reactive(props.items.map(item => ({ item, open: false })))
let opened = 0

emit('progress', 0)

// El personaje responde con su trigger (`character.accept` del ítem), si lo trae.
function cheer(i: number) {
  const trigger = cards[i]?.item.character?.accept
  if (trigger) characters.value[i]?.say(trigger)
}

function touch(i: number) {
  const card = cards[i]
  if (!card || props.blocked) return
  demo.stop()
  playSound(card.open ? 'tocar' : 'destapar')
  replay(objectNodes[i], 'is-hopping')
  if (card.open) {
    // Mirar otra vez: el mismo descubrimiento, nada nuevo que ganar.
    cheer(i)
    emit('feedback', { kind: 'info', title: t(card.item.fact), body: t(card.item.description) })
    return
  }
  card.open = true
  replay(cardNodes[i], 'is-landing')
  world.after(380, () => cheer(i))
  opened += 1
  const all = opened === cards.length
  emit('progress', opened / cards.length)
  if (all) emit('complete')
  // La hoja: de qué ave es (`fact`) y cómo es el huevo (`description`); al último, el cierre de la escena.
  const body = [t(card.item.description), all ? t(props.scene.meta.completionFeedback) : ''].filter(Boolean).join(' ')
  emit('feedback', { kind: 'success', title: t(card.item.fact), body })
}

// ---- Demostrar lo que toca (la mano, en useDemo): un toque sobre lo que se ve del primero por destapar. Lo que la
// mano pulsa da su saltito, sin sonar ni contar. La primera, al poco; después de destapar uno, espera más (la hoja se
// está leyendo). Con todos destapados, no hay nada que demostrar. ----
const NO_COPY = { w: 0, h: 0 }
function objectCenter(i: number): Point {
  const rect = eggRect(cards[i]!.item)
  return { x: objectX(i) + rect.x + rect.w / 2, y: OBJECT.y + rect.y + rect.h / 2 }
}
const demo = useDemo<number>({
  ready: () => !props.blocked,
  step: () => `${opened}`,
  first: () => (opened ? 3200 : 1500),
  move: () => {
    const i = cards.findIndex(card => !card.open)
    if (i < 0) return null
    const at = objectCenter(i)
    return { from: at, to: at, target: i, tap: true }
  },
  reduced,
})
watch(() => demo.state.over, (over) => {
  if (over !== null && !reduced) replay(objectNodes[over], 'is-hopping')
})

defineExpose({ fit: () => characters.value.forEach(c => c?.fit()) })
</script>
