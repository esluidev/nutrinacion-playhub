<template>
  <!-- Un taller en la agenda de la vista Día, como las filas de «Próximos talleres» en Admin: a la
       izquierda el bloque de la hora (o del día, si es de otro día: «Falta el cierre») en el tono de
       la sesión (UI_SESSION_TONES); en medio el título del taller, su contenido y dónde; a la derecha
       sus dos acciones, las mismas de su ventana: «Iniciar taller» y «Ver guía». «Iniciar taller» va
       en lima solo en el taller que toca (`principal`: el primero de hoy), una acción principal por
       vista. Tocar la fila abre la ficha. Las acciones bajan debajo de los datos cuando la fila es
       estrecha: por su ancho, no por el de la pantalla (en tableta horizontal, la columna lo es). Un
       cancelado muestra el motivo en coral y no se inicia. -->
  <div class="@container">
    <div
      :data-tone="UI_SESSION_TONES[estado]"
      class="flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-4 transition-colors hover:bg-canvas @2xl:flex-nowrap"
    >
      <NuxtLink :to="`/workshops/${taller.id}`" class="flex min-w-0 flex-1 basis-full items-start gap-4 @2xl:basis-auto">
        <span class="ui-time w-20">
          <template v-if="conFecha">
            <span>{{ diaCorto(taller.fecha, locale) }}</span>
            <strong>{{ Number(taller.fecha.slice(8)) }}</strong>
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
      </NuxtLink>
      <div class="grid w-full grid-cols-2 gap-2 @2xl:flex @2xl:w-auto @2xl:shrink-0">
        <UiButton
          v-if="puedeIniciarse(taller)"
          :to="`/workshops/${taller.id}/jugar`"
          :variant="principal ? 'primary' : 'outline'"
          icon="play"
        >{{ t('taller.abrir') }}</UiButton>
        <UiButton :to="`/workshops/${taller.id}`" variant="outline" icon="book" :class="!puedeIniciarse(taller) && 'col-span-2'">{{ t('taller.guia') }}</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UI_SESSION_TONES } from '@playhub/ui/app/utils/ui-tones'
import { diaCorto } from '~/utils/calendario'
import { rangoDeDias } from '~/utils/fechas'
import { escenasYDuracion, estadoDe, horario, puedeIniciarse } from '~/utils/talleres'
import type { EstadoTaller, Taller } from '~/utils/talleres'

// `obvio`: el estado que ya dice su sección, que no se repite. `conFecha`: el bloque dice el día y
// la hora pasa al texto (los que faltan cerrar son de otros días). `principal`: el taller que toca.
const props = defineProps<{ taller: Taller, obvio?: EstadoTaller, conFecha?: boolean, principal?: boolean }>()

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
