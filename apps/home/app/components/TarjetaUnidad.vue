<template>
  <!-- Una unidad de estudio: un collage con las portadas de sus primeros juegos, su título y cuántos juegos tiene para
       este perfil. Abre la unidad con sus juegos en orden. -->
  <NuxtLink :to="`/unidades/${unidad.id}`" class="tarjeta-unidad">
    <span class="collage" aria-hidden="true">
      <span v-for="(juego, i) in juegos.slice(0, 2)" :key="juego.clave" class="collage-pieza" :data-i="i">
        <PortadaJuego :storyboard="juego" />
      </span>
    </span>
    <span class="min-w-0">
      <span class="tarjeta-juego-titulo line-clamp-2 block">{{ textoEn(unidad.titulo, locale) }}</span>
      <span class="ui-caption mt-1 block font-bold">{{ unidad.storyboards.length === 1 ? t('unidad.juego') : t('unidad.juegos', { n: unidad.storyboards.length }) }}</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { textoEn } from '~/utils/catalogo'
import type { StoryboardHogar, UnidadHogar } from '~/utils/catalogo'

const props = defineProps<{ unidad: UnidadHogar, storyboards: StoryboardHogar[] }>()
const { t, locale } = useT()
const juegos = computed(() => props.unidad.storyboards
  .map(clave => props.storyboards.find(s => s.clave === clave))
  .filter((s): s is StoryboardHogar => Boolean(s)))
</script>
