<template>
  <!-- La portada de un storyboard: la que registra el catálogo (`storyboards.portada`, servida por Player desde la
       `portada.svg` de su carpeta) llenando su caja. Si todavía no tiene una, el dibujo de su tema sobre el tinte de su
       área. -->
  <span class="portada-juego" v-bind="uiAreaAttrs(tema.area)">
    <img v-if="src && !sinPortada" :src="src" alt="" class="portada-juego-imagen" decoding="async" @error="sinPortada = true">
    <img v-else :src="tema.dibujo" alt="" class="portada-juego-tema" :data-tema="tema.area">
  </span>
</template>

<script setup lang="ts">
import { useUrlDePlayer } from '~/composables/useUrlDePlayer'
import type { StoryboardHogar } from '~/utils/catalogo'
import { temaDe } from '~/utils/temas'

const props = defineProps<{ storyboard: StoryboardHogar }>()
const player = useUrlDePlayer()
const tema = computed(() => temaDe(props.storyboard.categoria))
const src = computed(() => (player.value && props.storyboard.portada ? `${player.value.replace(/\/+$/, '')}/${props.storyboard.portada}` : null))
const sinPortada = ref(false)
watch(src, () => { sinPortada.value = false })
</script>
