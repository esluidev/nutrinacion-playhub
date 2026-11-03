<template>
  <!-- Tarjeta de un taller en Mis talleres, como en la app original: barra de color del área arriba,
       estado, título, hora, grupo y lugar. Sin botones: toda la tarjeta abre la ventana del taller,
       donde están sus acciones. Un taller cancelado sigue en su día, en coral y con el motivo. El
       estado que ya dice su lista (`obvio`) no se repite en cada tarjeta. -->
  <button
    type="button"
    class="ui-panel ui-panel-interactive relative w-full overflow-hidden rounded-control px-3 pb-3 pt-4 text-left"
    v-bind="cancelado ? { 'data-tone': 'coral' } : { 'data-area': taller.storyboard.eje }"
    @click="abrir(taller.id)"
  >
    <span class="absolute inset-x-0 top-0 h-1.5 bg-(--tone-fill)" aria-hidden="true" />
    <EstadoBadge v-if="estado !== obvio" :estado="estado" class="mb-1.5" />
    <p class="text-subtitle font-black leading-snug text-ink">{{ taller.storyboard.titulo }}</p>
    <ul class="mt-2 space-y-1 text-caption font-bold text-muted">
      <li class="flex items-center gap-1.5 text-(--tone-strong)">
        <UiIcon name="clock" class="size-3.5" />
        <span class="tabular-nums">{{ horario(taller) }}</span>
      </li>
      <li v-if="cancelado && taller.motivoCancelacion" class="flex min-w-0 items-center gap-1.5 text-(--tone-strong)">
        <UiIcon name="ban" class="size-3.5" /><span class="truncate">{{ taller.motivoCancelacion }}</span>
      </li>
      <li v-if="variasOrganizaciones" class="flex min-w-0 items-center gap-1.5"><UiIcon name="building" class="size-3.5 text-subtle" /><span class="truncate">{{ taller.organizacion.nombre }}</span></li>
      <!-- De qué jornada forma parte (neutra, el nombre en negrita); el educador solo la ve. La línea
           es larga para la tarjeta: hace salto (tres líneas como máximo, los días sin partir) en vez
           de truncarse, para que se vean los días. -->
      <li v-if="taller.jornada" class="flex min-w-0 items-start gap-1.5">
        <UiIcon name="layers" class="mt-0.5 size-3.5 shrink-0 text-subtle" />
        <span class="line-clamp-3">{{ t('taller.jornada') }} <strong class="text-ink">{{ t('taller.jornadaNombre', { nombre: taller.jornada.nombre }) }}</strong> · <span class="whitespace-nowrap">{{ rangoDeDias(taller.jornada.fechaInicio, taller.jornada.fechaFin, locale) }}</span></span>
      </li>
      <li v-if="taller.grupo" class="flex min-w-0 items-center gap-1.5"><UiIcon name="users" class="size-3.5 text-subtle" /><span class="truncate">{{ taller.grupo }}</span></li>
      <li v-if="taller.lugar" class="flex min-w-0 items-center gap-1.5"><UiIcon name="map-pin" class="size-3.5 text-subtle" /><span class="truncate">{{ taller.lugar }}</span></li>
    </ul>
  </button>
</template>

<script setup lang="ts">
import { rangoDeDias } from '~/utils/fechas'
import { estadoDe, horario } from '~/utils/talleres'
import type { EstadoTaller, Taller } from '~/utils/talleres'

const props = defineProps<{ taller: Taller, obvio?: EstadoTaller }>()

const { t, locale } = useT()
const { abrir } = useTallerAbierto()
const { educador } = useSesion()
const estado = computed(() => estadoDe(props.taller))
const cancelado = computed(() => estado.value === 'cancelado')
// Si trabaja en varias organizaciones, cada tarjeta dice de cuál es.
const variasOrganizaciones = computed(() => (educador.value?.organizaciones?.length ?? 0) > 1)
</script>
