<template>
  <!-- Un taller en las listas de «Mis talleres», la misma fila en todas: a la izquierda la ficha de la hora (o del día,
       con `conFecha`: «Falta reportar» y «Anteriores») en el tono de su sesión (UI_SESSION_TONES); en medio el título,
       el contenido, la audiencia y el lugar; a la derecha, la flecha. Toda la fila se pulsa y abre su ficha, igual que
       la tarjeta de la semana y los talleres del día elegido en el mes: ahí están la guía y sus botones (Ensayar,
       Ejecutar, Reportar). Un cancelado muestra el motivo en coral. -->
  <NuxtLink
    :to="`/workshops/${taller.id}`"
    :data-tone="UI_SESSION_TONES[estado]"
    class="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-canvas"
  >
    <span class="ui-time w-20 self-start">
      <template v-if="conFecha">
        <span>{{ diaCorto(taller.fecha, locale) }}</span>
        <strong>{{ Number(taller.fecha.slice(8)) }}</strong>
        <span>{{ mesCorto(taller.fecha, locale) }}</span>
      </template>
      <template v-else>
        <strong>{{ taller.horaInicio }}</strong>
        <span v-if="taller.horaFin">{{ taller.horaFin }}</span>
      </template>
    </span>
    <div class="min-w-0 flex-1 pt-0.5">
      <EstadoBadge v-if="estado !== obvio" :estado="estado" class="mb-1.5" />
      <p class="text-subtitle font-black leading-snug text-ink">{{ taller.titulo }}</p>
      <p class="ui-caption mt-0.5">
        <span v-if="conFecha" class="font-extrabold tabular-nums text-(--tone-strong)">{{ horario(taller) }} · </span>{{ contenido }}
      </p>
      <ul class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-caption font-bold text-muted">
        <li v-if="taller.grupo" class="flex min-w-0 items-center gap-1.5"><UiIcon name="users" class="size-3.5 shrink-0 text-subtle" />{{ taller.grupo }}</li>
        <li v-if="taller.lugar" class="flex min-w-0 items-center gap-1.5"><UiIcon name="map-pin" class="size-3.5 shrink-0 text-subtle" />{{ taller.lugar }}</li>
        <li v-if="taller.jornada" class="flex min-w-0 items-center gap-1.5">
          <UiIcon name="layers" class="size-3.5 shrink-0 text-subtle" />
          <span>{{ t('taller.jornadaNombre', { nombre: taller.jornada.nombre }) }} · <span class="whitespace-nowrap">{{ rangoDeDias(taller.jornada.fechaInicio, taller.jornada.fechaFin, locale) }}</span></span>
        </li>
        <li v-if="variasOrganizaciones" class="flex min-w-0 items-center gap-1.5"><UiIcon name="building" class="size-3.5 shrink-0 text-subtle" />{{ taller.organizacion.nombre }}</li>
      </ul>
      <p v-if="cancelado" class="mt-1.5 flex items-center gap-1.5 text-caption font-bold text-(--tone-strong)">
        <UiIcon name="ban" class="size-3.5 shrink-0" />{{ taller.motivoCancelacion ?? t('taller.canceladoSinMotivo') }}
      </p>
    </div>
    <UiIcon name="chevron-right" class="size-5 shrink-0 text-subtle" />
  </NuxtLink>
</template>

<script setup lang="ts">
import { UI_SESSION_TONES } from '@playhub/ui/app/utils/ui-tones'
import { diaCorto, mesCorto, rangoDeDias } from '~/utils/fechas'
import { escenasYDuracion, estadoDe, horario } from '~/utils/talleres'
import type { EstadoTaller, Taller } from '~/utils/talleres'

// `obvio`: el estado que ya dice su lista, que no se repite. `conFecha`: la ficha dice el día y la hora pasa al texto.
const props = defineProps<{ taller: Taller, obvio?: EstadoTaller, conFecha?: boolean }>()

const { t, locale } = useT()
const { educador } = useSesion()
const estado = computed(() => estadoDe(props.taller))
const cancelado = computed(() => estado.value === 'cancelado')
// Si trabaja en varias organizaciones, cada fila dice de cuál es.
const variasOrganizaciones = computed(() => (educador.value?.organizaciones?.length ?? 0) > 1)
// «El huevo · 4 escenas · 30 min»: el storyboard solo si el taller se llama distinto.
const contenido = computed(() => [
  props.taller.titulo !== props.taller.storyboard.titulo ? props.taller.storyboard.titulo : '',
  escenasYDuracion(props.taller, n => t('taller.escenas', { n }), n => t('taller.minutos', { n })),
].filter(Boolean).join(' · '))
</script>
