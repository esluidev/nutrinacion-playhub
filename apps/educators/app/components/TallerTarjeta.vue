<template>
  <!-- Un taller en una columna de la semana, donde no cabe la fila: la tarjeta de los talleres por día de Admin, con la
       franja y la hora en el tono de su sesión (UI_SESSION_TONES), el título y el lugar. Se pulsa: abre su ficha, donde
       están sus botones. El estado solo se escribe si pide algo o ya pasó (falta reportar, reportado, cancelado). -->
  <NuxtLink
    :to="`/workshops/${taller.id}`"
    :data-tone="UI_SESSION_TONES[estado]"
    class="ui-panel ui-panel-interactive relative block overflow-hidden rounded-control py-2.5 pl-4 pr-3"
  >
    <span class="absolute inset-y-0 left-0 w-1 bg-(--tone-fill)" aria-hidden="true" />
    <p class="text-caption font-extrabold tabular-nums text-(--tone-strong)">{{ horario(taller) }}</p>
    <p class="mt-0.5 line-clamp-2 text-body font-extrabold leading-snug text-ink">{{ taller.titulo }}</p>
    <p v-if="taller.lugar" class="ui-caption mt-0.5 truncate">{{ taller.lugar }}</p>
    <EstadoBadge v-if="estado !== 'hoy' && estado !== 'proximo'" :estado="estado" class="mt-1.5" />
  </NuxtLink>
</template>

<script setup lang="ts">
import { UI_SESSION_TONES } from '@playhub/ui/app/utils/ui-tones'
import { estadoDe, horario } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

const props = defineProps<{ taller: Taller }>()
const estado = computed(() => estadoDe(props.taller))
</script>
