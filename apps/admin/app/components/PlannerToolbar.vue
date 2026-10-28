<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap items-center gap-3">
      <!-- Rango: mueve semanas o meses según la vista activa -->
      <div class="ui-group">
        <button type="button" class="ui-group-item" aria-label="Anterior" @click="navigateRange(-1)">
          <UiIcon name="chevron-left" />
        </button>
        <span class="ui-group-label">{{ rangeLabel }}</span>
        <button type="button" class="ui-group-item" aria-label="Siguiente" @click="navigateRange(1)">
          <UiIcon name="chevron-right" />
        </button>
      </div>
      <UiButton variant="outline" @click="goToToday">Hoy</UiButton>
      <UiChips v-model="statusModel" :items="statusChips" class="hidden sm:flex" />
    </div>

    <div class="flex items-center gap-3">
      <UiTabs v-model="viewModel" :items="viewTabs" label="Vista" fit />
      <UiButton icon="plus" to="/dashboard/workshops/new">Nuevo taller</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlannerStatus } from '~/composables/usePlanner'

const { rangeLabel, activeView, statusFilter, navigateRange, goToToday } = usePlanner()

// Puentes tipados: UiChips y UiTabs hablan en string; filtro y vista son uniones cerradas.
const statusModel = computed({
  get: () => statusFilter.value as string,
  set: v => (statusFilter.value = v as 'todos' | PlannerStatus),
})
const viewModel = computed({
  get: () => activeView.value as string,
  set: v => (activeView.value = v as 'kanban' | 'calendar'),
})

const statusChips = [
  { value: 'todos', label: 'Todos' },
  { value: 'programado', label: 'Programados' },
  { value: 'completado', label: 'Realizados' },
  { value: 'sin_realizar', label: 'Sin realizar' },
  { value: 'borrador', label: 'Sin publicar' },
]
const viewTabs = [
  { value: 'kanban', label: 'Semana' },
  { value: 'calendar', label: 'Mes' },
]
</script>
