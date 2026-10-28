<template>
  <!-- Tarjeta de un taller en el calendario, como en la app original: barra de color del área arriba,
       estado, título, hora, grupo y lugar. Sin botones: toda la tarjeta abre la ventana del taller,
       donde están sus acciones. Un taller cancelado sigue en su día, en coral y con el motivo. -->
  <button
    type="button"
    class="ui-panel ui-panel-interactive relative w-full overflow-hidden rounded-control px-3 pb-3 pt-4 text-left"
    v-bind="cancelado ? { 'data-tone': 'coral' } : { 'data-area': taller.storyboard.eje }"
    @click="abrir(taller.id)"
  >
    <span class="absolute inset-x-0 top-0 h-1.5 bg-(--tone-fill)" aria-hidden="true" />
    <EstadoBadge :estado="estado" class="mb-1.5" />
    <p class="text-subtitle font-black leading-snug text-ink">{{ taller.storyboard.titulo }}</p>
    <ul class="mt-2 space-y-1 text-caption font-bold text-muted">
      <li class="flex items-center gap-1.5 text-(--tone-strong)">
        <UiIcon name="clock" class="size-3.5" />
        <span class="tabular-nums">{{ horario(taller) }}</span>
      </li>
      <li v-if="cancelado && taller.motivoCancelacion" class="flex min-w-0 items-center gap-1.5 text-(--tone-strong)">
        <UiIcon name="ban" class="size-3.5" /><span class="truncate">{{ taller.motivoCancelacion }}</span>
      </li>
      <li v-if="variasComunidades" class="flex min-w-0 items-center gap-1.5"><UiIcon name="building" class="size-3.5 text-subtle" /><span class="truncate">{{ taller.comunidad.nombre }}</span></li>
      <li v-if="taller.grupo" class="flex min-w-0 items-center gap-1.5"><UiIcon name="users" class="size-3.5 text-subtle" /><span class="truncate">{{ taller.grupo }}</span></li>
      <li v-if="taller.lugar" class="flex min-w-0 items-center gap-1.5"><UiIcon name="map-pin" class="size-3.5 text-subtle" /><span class="truncate">{{ taller.lugar }}</span></li>
    </ul>
  </button>
</template>

<script setup lang="ts">
import { comunidadesDe } from '~/utils/sesion'
import { estadoDe, horario } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

const props = defineProps<{ taller: Taller }>()

const { abrir } = useTallerAbierto()
const { educador } = useSesion()
const estado = computed(() => estadoDe(props.taller))
const cancelado = computed(() => estado.value === 'cancelado')
// Si trabaja en varias comunidades, cada tarjeta dice de cuál es.
const variasComunidades = computed(() => (educador.value ? comunidadesDe(educador.value).length > 1 : false))
</script>
