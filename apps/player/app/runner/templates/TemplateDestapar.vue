<template>
  <!-- Destapar · Revelar. Plano fila, una columna por ítem: arriba su tarjeta (una tarjeta con escenario si el ítem trae
       su suelo, `backdrop`) y, debajo, lo que se ve (su dibujo en el nido), todos a una sola escala para que se
       comparen. Mientras esconde algo, la tarjeta lleva un «?» en su blanco. El grupo dice qué cree que esconde y un
       niño toca lo que se ve (o su tarjeta): el «?» se va, lo que escondía (el personaje de Rive) aparece en la
       tarjeta, apoyado en su suelo, y la tarjeta rebota. Las piezas siguen el patrón del tablero (runner.css): la
       tarjeta, blanca y plana con el contorno suave; lo que se ve, sin caja. -->
  <div ref="layer" class="tb-layer">
    <template v-for="(card, i) in cards" :key="card.item.id">
      <button
        :ref="(el) => { cardNodes[i] = el as HTMLElement | null }"
        type="button"
        class="tb-pieza tb-tarjeta"
        :aria-label="card.open ? t(card.item.name) : text('uncover')"
        :style="box(columnX(i), CARD_Y, CARD.w, CARD.h)"
        @click="touch(i)"
      >
        <img v-if="card.item.backdrop" class="tb-suelo" :src="librarySvg(card.item.backdrop)" alt="" :style="box(SCENERY.strip.x, SCENERY.strip.y, SCENERY.strip.w, SCENERY.strip.h)">
        <span class="tb-incognita" :class="{ 'is-gone': card.open }" aria-hidden="true" :style="box(0, SCENERY.line, CARD.w, MARK_H)">?</span>
        <RiveCharacter
          v-if="card.open && riveOf(card.item)"
          :ref="(el) => { characters[i] = el as InstanceType<typeof RiveCharacter> | null }"
          class="tb-ave"
          :src="riveOf(card.item)!"
          :values="card.item.character?.enum"
          :style="characterBox(card.item)"
        />
      </button>
      <span v-if="card.open && profile.labels" class="tb-etiqueta" :style="{ left: `${columnX(i) + CARD.w / 2}px`, top: `${CARD_Y + CARD.h}px` }">{{ t(card.item.name) }}</span>

      <button
        :ref="(el) => { objectNodes[i] = el as HTMLElement | null }"
        type="button"
        class="tb-objeto"
        :aria-label="t(card.item.description) || text('uncover')"
        :style="box(columnX(i) + (CARD.w - OBJECT.w) / 2, OBJECT.y, OBJECT.w, OBJECT.h)"
        @click="touch(i)"
      >
        <img class="tb-nido" :src="librarySvg('nido')" alt="" :style="nestBox()">
        <img class="tb-huevo" :src="librarySvg(card.item.svg)" alt="" :style="eggBox(card.item)">
        <img class="tb-nido" :src="librarySvg('nido-frente')" alt="" :style="nestBox()">
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { box, sceneryCard, useSceneText } from '../board'
import { libraryRive, librarySvg } from '../content'
import { useRunnerText } from '../i18n'
import RiveCharacter from '../RiveCharacter.vue'
import { replay, useTimers } from '../useTimers'
import type { DatosItem, FeedbackPayload, TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
const emit = defineEmits<{ feedback: [payload: FeedbackPayload], progress: [value: number], complete: [] }>()

const { t } = useSceneText(props)
const text = useRunnerText(() => props.locale)

// ---- Medidas (tablero 1280 × 600, columna 120–1160). Una columna por ítem, de 320 y con 40 entre ellas: arriba la
// tarjeta con escenario, de 320 × 280; debajo, a 24 del dibujo más alto, lo que se ve, en su nido. El conjunto va
// centrado en el alto del tablero. ----
const CARD = { w: 320, h: 280 }
const GAP = 40
const SCENERY = sceneryCard(CARD.w, CARD.h)
const columnX = (i: number) => 640 - (props.items.length * CARD.w + (props.items.length - 1) * GAP) / 2 + i * (CARD.w + GAP)
// El personaje (el lienzo de Rive de las aves: las patas al 85 % de su alto) grande y apoyado en el suelo de la
// tarjeta; sin suelo, apoyado cerca del borde de abajo.
const CHARACTER = { size: 250, feet: 0.85 }
const groundOf = (item: DatosItem) => (item.backdrop ? SCENERY.ground : CARD.h - 30)
const characterBox = (item: DatosItem) =>
  box((CARD.w - CHARACTER.size) / 2, groundOf(item) - CHARACTER.size * CHARACTER.feet, CHARACTER.size, CHARACTER.size)

// El «?» de la tarjeta que esconde algo: pequeño y discreto, centrado en su blanco, encima del suelo.
const MARK_H = SCENERY.strip.y - SCENERY.line

// Lo que se ve: el dibujo (lienzo de 164 × 192; la cáscara va de y 16 a 176) a una sola escala para todos, 170 por
// `sizeScale`: los tamaños relativos son contenido, nunca se igualan. Va metido en su nido (lienzo de 1200 × 660, a
// 210 de ancho, para que el huevo se note más que el nido): la base de la cáscara al 60 % del alto del nido y, delante, el borde anterior del nido
// (`nido-frente`), que la tapa.
const EGG_H = 170
const SHELL = { top: 16 / 192, base: 176 / 192 }
const NEST = { w: 210, h: 210 * 660 / 1200 }
const SEAT = NEST.h * 0.6
const eggH = (item: DatosItem) => (item.sizeScale ?? 0.68) * EGG_H
// Lo que asoma por encima del nido la cáscara más alta.
const rise = Math.max(0, ...props.items.map(item => eggH(item) * (SHELL.base - SHELL.top) - SEAT))
const OBJECT_TOP_GAP = 24
const block = CARD.h + OBJECT_TOP_GAP + rise + NEST.h
const CARD_Y = (600 - block) / 2
// La zona que se toca: de lo más alto del huevo al pie del nido, de 280 de ancho.
const OBJECT = { w: 280, y: CARD_Y + CARD.h + OBJECT_TOP_GAP - 12, h: rise + 12 + NEST.h }
const nestTop = OBJECT.h - NEST.h
const nestBox = () => box((OBJECT.w - NEST.w) / 2, nestTop, NEST.w, NEST.h)
function eggBox(item: DatosItem) {
  const h = eggH(item)
  const w = h * 164 / 192
  return box((OBJECT.w - w) / 2, nestTop + SEAT - h * SHELL.base, w, h)
}
const riveOf = (item: DatosItem) => libraryRive(item.character?.rive)

// ---- El juego. ----
const time = useTimers()
const layer = ref<HTMLElement | null>(null)
const cardNodes: (HTMLElement | null)[] = []
const objectNodes: (HTMLElement | null)[] = []
const characters = ref<(InstanceType<typeof RiveCharacter> | null)[]>([])
const cards = reactive(props.items.map(item => ({ item, open: false })))
let opened = 0
let idleSince = performance.now()

emit('progress', 0)

// Guiado: tras un rato quieto, lo que se ve del primero por destapar respira, para indicar qué se puede tocar.
if (props.profile.scaffolding === 'guiado') {
  time.every(() => {
    if (props.blocked) { idleSince = performance.now(); return }
    if (performance.now() - idleSince < 6000) return
    idleSince = performance.now()
    const i = cards.findIndex(c => !c.open)
    if (i >= 0) replay(objectNodes[i], 'is-inviting')
  }, 1000)
}

function touch(i: number) {
  const card = cards[i]
  if (!card || props.blocked) return
  idleSince = performance.now()
  replay(objectNodes[i], 'is-hopping')
  if (card.open) {
    // Mirar otra vez: el mismo descubrimiento, nada nuevo que ganar.
    characters.value[i]?.say('aceptar')
    emit('feedback', { kind: 'info', title: t(card.item.fact), body: t(card.item.description) })
    return
  }
  card.open = true
  replay(cardNodes[i], 'is-landing')
  time.later(() => characters.value[i]?.say('aceptar'), 380)
  opened += 1
  const all = opened === cards.length
  emit('progress', opened / cards.length)
  if (all) emit('complete')
  // La hoja: de qué ave es (`fact`) y cómo es el huevo (`description`); al último, el cierre de la escena.
  const body = [t(card.item.description), all ? t(props.scene.meta.completionFeedback) : ''].filter(Boolean).join(' ')
  emit('feedback', { kind: 'success', title: t(card.item.fact), body })
}

defineExpose({ fit: () => characters.value.forEach(c => c?.fit()) })
</script>
