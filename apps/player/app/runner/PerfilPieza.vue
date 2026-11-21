<template>
  <!-- Quién juega, arriba a la izquierda: una pieza blanca de la consola, del largo de las de arriba, con el avatar
       dentro (la cabeza de un animal en un círculo con el tinte de su tono: los avatares se dibujan para un círculo) y el apodo al
       lado. No se pulsa. La misma en casa y en un dispositivo del taller: con dos perfiles en un mismo aparato, o con
       varios dispositivos en el taller, dice quién es. Un apodo largo se corta y se lee entero al pasar el cursor. -->
  <div class="hud-piece profile-piece" :title="nombre">
    <span class="profile-avatar" :data-tone="tono" aria-hidden="true">
      <img v-if="avatar" :src="librarySvg(`avatar-${avatar}`)" alt="" decoding="sync">
      <UiIcon v-else name="user" />
    </span>
    <span class="profile-name">{{ nombre }}</span>
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import { librarySvg } from './content'

defineProps<{
  /** El animal del avatar (`avatar-<animal>` en la librería). Sin él, el icono de persona. */
  avatar?: string | null
  nombre: string
  tono: UiTone
}>()
</script>
