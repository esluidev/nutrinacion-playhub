<template>
  <div>
    <PlannerToolbar />
    <PlannerKanban v-if="activeView === 'kanban'" />
    <PlannerCalendarGrid v-else />
    <PlannerAddWorkshopModal />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { activeView } = usePlanner()
</script>
