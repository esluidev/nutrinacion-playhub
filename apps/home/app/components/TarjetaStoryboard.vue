<template>
  <!-- Un storyboard para jugar: su portada grande con su tema (en el color de su área), «Terminado» si ese perfil ya lo
       terminó y el botón de jugar; debajo, el título, cuántas escenas tiene y cuánto dura. Se pulsa entera. -->
  <NuxtLink :to="`/jugar/${storyboard.clave}`" class="tarjeta-juego" v-bind="uiAreaAttrs(temaDe(storyboard.categoria).area)">
    <span class="tarjeta-juego-portada">
      <PortadaJuego :storyboard="storyboard" />
      <span class="tarjeta-juego-tema">{{ t(`categoria.${storyboard.categoria}`) }}</span>
      <UiBadge v-if="terminado(storyboard.clave)" tone="lime" icon="check" class="tarjeta-juego-hecho">{{ t('tarjeta.terminado') }}</UiBadge>
      <span class="tarjeta-juego-jugar" aria-hidden="true"><UiIcon name="play" /></span>
    </span>
    <span class="tarjeta-juego-cuerpo">
      <span class="tarjeta-juego-titulo">{{ textoEn(storyboard.titulo, locale) }}</span>
      <span class="ui-caption">{{ storyboard.duracion_min ? t('tarjeta.datos', { n: storyboard.numero_escenas, min: storyboard.duracion_min }) : t('tarjeta.escenas', { n: storyboard.numero_escenas }) }}</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { textoEn } from '~/utils/catalogo'
import type { StoryboardHogar } from '~/utils/catalogo'
import { temaDe } from '~/utils/temas'

defineProps<{ storyboard: StoryboardHogar }>()
const { t, locale } = useT()
const { terminado } = useHogar()
</script>
