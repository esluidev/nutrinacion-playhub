<template>
  <!-- Ventana de un taller: sus datos y siempre las mismas dos acciones, iniciar el taller y ver la
       guía. El feedback no es un botón: llega al terminar el taller en el runner. Un taller
       cancelado muestra el motivo y no se inicia. -->
  <UiDialog :open="Boolean(taller)" :title="taller?.storyboard.titulo" @update:open="(v) => { if (!v) $emit('close') }">
    <div v-if="taller" :data-area="taller.storyboard.eje">
      <EstadoBadge :estado="estado" />
      <ul class="mt-4 space-y-2 text-body font-bold text-muted">
        <li class="flex items-center gap-2.5"><UiIcon name="calendar" class="size-4 text-subtle" /><span class="first-letter:uppercase">{{ fechaLarga(taller.fecha, locale) }}</span></li>
        <li class="flex items-center gap-2.5 text-(--tone-strong)"><UiIcon name="clock" class="size-4" /><span class="tabular-nums">{{ horario(taller) }}</span></li>
        <li class="flex items-center gap-2.5"><UiIcon name="building" class="size-4 text-subtle" />{{ taller.organizacion.nombre }}</li>
        <li v-if="grupo" class="flex items-center gap-2.5"><UiIcon name="users" class="size-4 text-subtle" />{{ grupo }}</li>
        <li v-if="taller.lugar" class="flex items-center gap-2.5"><UiIcon name="map-pin" class="size-4 text-subtle" />{{ taller.lugar }}</li>
      </ul>
      <UiAlert v-if="estado === 'cancelado'" tone="coral" icon="ban" :title="t('taller.cancelado')" class="mt-4">
        {{ taller.motivoCancelacion ?? t('taller.canceladoSinMotivo') }}
      </UiAlert>
    </div>

    <template #actions>
      <template v-if="taller">
        <UiButton v-if="puedeIniciarse(taller)" :to="`/workshops/${taller.id}/jugar`" icon="play" size="lg" block>{{ t('taller.abrir') }}</UiButton>
        <UiButton :to="`/workshops/${taller.id}`" variant="outline" icon="book" block>{{ t('taller.guia') }}</UiButton>
      </template>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { estadoDe, grupoYAsistentes, horario, puedeIniciarse } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

const props = defineProps<{ taller?: Taller }>()
defineEmits<{ close: [] }>()

const { t, locale } = useT()
const estado = computed(() => (props.taller ? estadoDe(props.taller) : 'proximo'))
const grupo = computed(() => (props.taller ? grupoYAsistentes(props.taller, n => t('taller.asistentes', { n })) : ''))
</script>
