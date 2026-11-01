<template>
  <!-- La tarjeta lleva el tono de su sesión: hoy en sol, próxima en cielo, completada en lima… -->
  <article
    :draggable="!compact"
    :data-tone="workshop.tone"
    :class="[
      'cursor-pointer',
      compact
        ? 'flex items-center gap-2 rounded-chip px-2 py-1.5 hover:bg-sunken'
        : 'ui-panel ui-panel-interactive relative overflow-hidden rounded-control py-3 pl-4 pr-3',
      isDragging && 'scale-95 opacity-50',
    ]"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="onClick"
  >
    <template v-if="compact">
      <span class="size-2 shrink-0 rounded-full bg-(--tone-fill)" />
      <span class="truncate text-caption font-bold text-ink">{{ workshop.title }}</span>
      <span class="ml-auto shrink-0 text-micro font-bold text-muted">{{ workshop.time.split(' - ')[0] }}</span>
    </template>

    <template v-else>
      <span class="absolute inset-y-0 left-0 w-1 bg-(--tone-fill)" />
      <p class="text-body font-extrabold leading-snug text-ink">{{ workshop.title }}</p>
      <!-- Inicio y fin en piezas: en una columna estrecha, el fin baja de línea entero -->
      <p class="mt-1 flex flex-wrap items-center gap-x-1 text-caption font-extrabold tabular-nums text-(--tone-strong)">
        <UiIcon name="clock" class="size-3.5" />
        <template v-if="workshop.time">
          <span class="whitespace-nowrap">{{ workshop.time.split(' - ')[0] }}</span>
          <span class="whitespace-nowrap">– {{ workshop.time.split(' - ')[1] }}</span>
        </template>
        <span v-else>{{ t('planner.noTime') }}</span>
      </p>
      <div class="mt-2.5 flex items-center gap-1.5">
        <UiAvatar :name="workshop.educator" size="sm" />
        <span class="truncate text-caption font-semibold text-muted">{{ workshop.location }}</span>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import type { PlannerWorkshop } from '~/composables/usePlanner'

const props = defineProps<{
  workshop: PlannerWorkshop
  compact?: boolean
}>()

const { t } = useT()
const isDragging = ref(false)
const didDrag = ref(false)

function onDragStart(e: DragEvent) {
  isDragging.value = true
  didDrag.value = true
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', String(props.workshop.id))
}

function onDragEnd() {
  isDragging.value = false
}

function onClick() {
  if (didDrag.value) {
    didDrag.value = false
    return
  }
  navigateTo('/organizacion/workshops/' + props.workshop.id)
}
</script>
