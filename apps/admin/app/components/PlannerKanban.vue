<template>
  <div>
    <!-- Escritorio: una bandeja por día; hoy, en sol (el mismo color que «Hoy» en Educators) -->
    <div class="hidden gap-3 lg:grid lg:grid-cols-7">
      <section v-for="day in weekDays" :key="day.key" class="flex min-h-[460px] flex-col" :aria-label="day.fullName">
        <header class="mb-2.5 flex items-center gap-2 px-1">
          <span class="ui-day" :aria-current="day.isToday ? 'date' : undefined">{{ day.date }}</span>
          <span class="eyebrow">{{ day.shortName }}</span>
          <UiBadge v-if="day.isToday" tone="sun" class="ml-auto">Hoy</UiBadge>
        </header>

        <div
          :class="['ui-tray flex-1', dragOverDate === day.fecha && 'is-target']"
          :data-tone="day.isToday ? 'sun' : undefined"
          @dragover.prevent="onDragOver(day.fecha)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, day.fecha)"
        >
          <PlannerWorkshopCard v-for="ws in day.workshops" :key="ws.id" :workshop="ws" />
          <button type="button" class="ui-slot" @click="navigateTo('/dashboard/workshops/new?date=' + day.fecha)">
            <UiIcon name="plus" />
            Agregar
          </button>
        </div>
      </section>
    </div>

    <!-- Móvil: lista vertical -->
    <div class="space-y-5 lg:hidden">
      <section v-for="day in weekDays" :key="'m-' + day.key" :aria-label="day.fullName">
        <header class="mb-2 flex items-center gap-2.5 px-1">
          <span class="ui-day" :aria-current="day.isToday ? 'date' : undefined">{{ day.date }}</span>
          <span class="eyebrow">{{ day.fullName }}</span>
          <UiBadge v-if="day.isToday" tone="sun">Hoy</UiBadge>
          <span v-if="day.workshops.length > 0" class="filter-count ml-auto">{{ day.workshops.length }}</span>
        </header>

        <div class="ui-tray" :data-tone="day.isToday ? 'sun' : undefined">
          <PlannerWorkshopCard v-for="ws in day.workshops" :key="'m-' + ws.id" :workshop="ws" />
          <button type="button" class="ui-slot" @click="navigateTo('/dashboard/workshops/new?date=' + day.fecha)">
            <UiIcon name="plus" />
            Agregar
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { weekDays, moveWorkshop } = usePlanner()

const dragOverDate = ref<string | null>(null)

function onDragOver(fecha: string) {
  dragOverDate.value = fecha
}

function onDragLeave() {
  dragOverDate.value = null
}

function onDrop(e: DragEvent, fecha: string) {
  dragOverDate.value = null
  const workshopId = Number(e.dataTransfer?.getData('text/plain'))
  if (workshopId) {
    moveWorkshop(workshopId, fecha)
  }
}
</script>
