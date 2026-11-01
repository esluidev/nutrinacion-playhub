<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap items-center gap-3">
      <!-- Rango: mueve semanas o meses según la vista activa -->
      <div class="ui-group">
        <button type="button" class="ui-group-item" :aria-label="t('common.previous')" @click="navigateRange(-1)">
          <UiIcon name="chevron-left" />
        </button>
        <span class="ui-group-label">{{ rangeLabel }}</span>
        <button type="button" class="ui-group-item" :aria-label="t('common.next')" @click="navigateRange(1)">
          <UiIcon name="chevron-right" />
        </button>
      </div>
      <UiButton variant="outline" @click="goToToday">{{ t('common.today') }}</UiButton>
      <!-- Qué talleres se ven: un filtro, no una navegación, así que va en el select de barra del kit -->
      <UiSelect v-model="statusModel" variant="toolbar" :prefix="t('planner.view')" :options="statusOptions" />
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <UiTabs v-model="viewModel" :items="viewTabs" :label="t('planner.viewLabel')" fit />
      <!-- La jornada se crea o se elige al programar un taller: aquí no hay botón para ella -->
      <UiButton icon="plus" to="/organizacion/workshops/new">{{ t('planner.newWorkshop') }}</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlannerFiltro } from '~/composables/usePlanner'

const { t } = useT()
const { rangeLabel, activeView, statusFilter, navigateRange, goToToday } = usePlanner()

// Puentes tipados: UiSelect y UiTabs hablan en string; filtro y vista son uniones cerradas.
const statusModel = computed({
  get: () => statusFilter.value as string,
  set: v => (statusFilter.value = v as PlannerFiltro),
})
const viewModel = computed({
  get: () => activeView.value as string,
  set: v => (activeView.value = v as 'kanban' | 'calendar'),
})

const statusOptions = computed(() => [
  { value: 'todos', label: t('planner.fAll') },
  { value: 'programado', label: t('planner.fScheduled') },
  { value: 'completado', label: t('planner.fDone') },
  { value: 'sin_realizar', label: t('planner.fNotDone') },
  { value: 'borrador', label: t('planner.fUnpublished') },
])
const viewTabs = computed(() => [
  { value: 'kanban', label: t('planner.week') },
  { value: 'calendar', label: t('planner.month') },
])
</script>
