<template>
  <!-- El siguiente taller de hoy, en grande: lo que el educador viene a hacer. Lleva el tono de su
       área (portada y hora) y, a la vista, las dos acciones de la ventana del taller. -->
  <article class="ui-panel overflow-hidden" :data-area="taller.storyboard.eje">
    <div class="ui-cover flex items-center gap-4 px-5 py-5 sm:px-6">
      <UiSymbol icon="book" class="bg-surface" />
      <div class="min-w-0">
        <p class="flex items-center gap-1.5 text-body font-black tabular-nums text-(--tone-strong)">
          <UiIcon name="clock" class="size-4" />{{ horario(taller) }}
        </p>
        <h3 class="ui-heading mt-1">{{ taller.storyboard.titulo }}</h3>
      </div>
    </div>
    <ul class="ui-panel-body flex flex-wrap gap-x-6 gap-y-2 text-body font-bold text-muted">
      <li v-if="grupo" class="flex items-center gap-2"><UiIcon name="users" class="size-4 text-subtle" />{{ grupo }}</li>
      <li v-if="taller.lugar" class="flex min-w-0 items-center gap-2"><UiIcon name="map-pin" class="size-4 shrink-0 text-subtle" />{{ taller.lugar }}</li>
      <li v-if="variasOrganizaciones" class="flex items-center gap-2"><UiIcon name="building" class="size-4 text-subtle" />{{ taller.organizacion.nombre }}</li>
      <li v-if="taller.jornada" class="flex items-center gap-2">
        <UiIcon name="layers" class="size-4 text-subtle" />
        <span>{{ t('taller.jornada') }} <strong class="text-ink">{{ t('taller.jornadaNombre', { nombre: taller.jornada.nombre }) }}</strong></span>
      </li>
    </ul>
    <div class="ui-panel-footer flex flex-col gap-3 sm:flex-row">
      <UiButton :to="`/workshops/${taller.id}/jugar`" icon="play" size="lg" class="sm:flex-1">{{ t('taller.abrir') }}</UiButton>
      <UiButton :to="`/workshops/${taller.id}`" variant="outline" icon="book" size="lg" class="sm:flex-1">{{ t('taller.guia') }}</UiButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { grupoYAsistentes, horario } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

const props = defineProps<{ taller: Taller }>()

const { t } = useT()
const { educador } = useSesion()
const grupo = computed(() => grupoYAsistentes(props.taller, n => t('taller.asistentes', { n })))
// Si trabaja en varias organizaciones, dice de cuál es.
const variasOrganizaciones = computed(() => (educador.value?.organizaciones?.length ?? 0) > 1)
</script>
