<template>
  <!-- La mano que demuestra la acción (useDemo): la copia translúcida de lo que lleva y, encima, la mano puntero de la
       librería con la punta del índice donde está la demostración. La escena lista `mano-apunta` en `library.svg`. -->
  <template v-if="demo.on">
    <!-- Las dos tienen caja fija y se mueven solo con su transformación y su opacidad: nada se recalcula ni se repinta. -->
    <img
      v-if="copy"
      class="tb-mano-copia"
      :src="librarySvg(copy)"
      alt=""
      decoding="sync"
      :style="{ ...box(-size.w / 2, -size.h / 2, size.w, size.h), transform: `translate3d(${demo.copy.x}px, ${demo.copy.y}px, 0) scale(${demo.copy.s})`, opacity: demo.copy.o }"
    >
    <img
      class="tb-mano"
      :src="librarySvg('mano-apunta')"
      alt=""
      decoding="sync"
      :style="{ ...box(-HAND.tipX, -HAND.tipY, HAND.w, HAND.h), transform: `translate3d(${demo.hand.x}px, ${demo.hand.y}px, 0) scale(${demo.hand.s})`, transformOrigin: `${HAND.tipX}px ${HAND.tipY}px`, opacity: demo.hand.o }"
    >
  </template>
</template>

<script setup lang="ts">
import { box } from './board'
import { librarySvg } from './content'
import type { DemoState } from './useDemo'

defineProps<{
  /** El estado de la demostración (`useDemo(...).state`). */
  demo: Readonly<DemoState>
  /** El dibujo de lo que lleva la mano (su id en la librería); sin él, la mano sola. */
  copy?: string
  /** El tamaño de ese dibujo a escala 1, en el tablero. */
  size: { w: number, h: number }
}>()

// La mano puntero de la librería (`mano-apunta`: lienzo de 206 × 212, la yema del índice en 20, 11.5) a 120 de ancho.
const HAND = { w: 120, h: 212 * 120 / 206, tipX: 20 * 120 / 206, tipY: 11.5 * 120 / 206 }
</script>
