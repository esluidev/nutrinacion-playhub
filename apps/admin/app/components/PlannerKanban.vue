<template>
  <div>
    <!-- Escritorio: una bandeja por día; hoy, en sol (el mismo color que «Hoy» en Educators).
         Bajo las fechas, una banda por jornada que abarca sus columnas (tinte lima, como el lugar
         actual de la navegación) con su nombre y su lugar: al pulsarla se abre su panel. -->
    <div class="hidden lg:block">
      <div class="grid grid-cols-7 gap-3">
        <header v-for="day in weekDays" :key="'h-' + day.key" class="flex items-center gap-2 px-1" :aria-label="day.fullName">
          <span class="ui-day" :aria-current="day.isToday ? 'date' : undefined">{{ day.date }}</span>
          <span class="eyebrow">{{ day.shortName }}</span>
          <UiBadge v-if="day.isToday" tone="sun" class="ml-auto">{{ t('common.today') }}</UiBadge>
        </header>
      </div>

      <div v-if="weekBands.length" class="mt-2.5 grid grid-cols-7 gap-x-3 gap-y-1.5">
        <button
          v-for="b in weekBands"
          :key="b.jornada.id"
          type="button"
          data-tone="lime"
          class="flex min-h-8 items-center gap-1.5 truncate rounded-control-sm border border-(--tone-tint-edge) bg-(--nav-current) px-2.5 text-caption font-extrabold text-ink transition-colors hover:bg-(--tone-tint-edge)"
          :style="{ gridColumn: `${b.desde} / ${b.hasta + 1}` }"
          :title="nombreYLugar(b.jornada)"
          @click="emit('abrirJornada', b.jornada.id)"
        >
          <UiIcon v-if="b.empiezaAntes" name="chevron-left" class="size-3.5 shrink-0 text-(--tone-icon)" />
          <UiIcon v-else name="calendar" class="size-3.5 shrink-0 text-(--tone-icon)" />
          <span class="truncate">{{ nombreYLugar(b.jornada) }}</span>
          <UiIcon v-if="b.sigueDespues" name="chevron-right" class="ml-auto size-3.5 shrink-0 text-(--tone-icon)" />
        </button>
      </div>

      <div class="mt-2.5 grid grid-cols-7 gap-3">
        <section v-for="day in weekDays" :key="day.key" class="flex min-h-[420px] flex-col" :aria-label="day.fullName">
          <div
            :class="['ui-tray flex-1', dragOverDate === day.fecha && 'is-target']"
            :data-tone="day.isToday ? 'sun' : undefined"
            @dragover.prevent="onDragOver(day.fecha)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, day.fecha)"
          >
            <PlannerWorkshopCard v-for="ws in day.workshops" :key="ws.id" :workshop="ws" />
            <button type="button" class="ui-slot" @click="navigateTo('/organizacion/workshops/new?fecha=' + day.fecha)">
              <UiIcon name="plus" />
              {{ t('planner.add') }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- Móvil: lista vertical; las jornadas del día, como etiquetas bajo su cabecera -->
    <div class="space-y-5 lg:hidden">
      <section v-for="day in weekDays" :key="'m-' + day.key" :aria-label="day.fullName">
        <header class="mb-2 flex flex-wrap items-center gap-2.5 px-1">
          <span class="ui-day" :aria-current="day.isToday ? 'date' : undefined">{{ day.date }}</span>
          <span class="eyebrow">{{ day.fullName }}</span>
          <UiBadge v-if="day.isToday" tone="sun">{{ t('common.today') }}</UiBadge>
          <span v-if="day.workshops.length > 0" class="filter-count ml-auto">{{ day.workshops.length }}</span>
          <button
            v-for="j in jornadasDe(day.fecha)"
            :key="j.id"
            type="button"
            data-tone="lime"
            class="badge w-full justify-start bg-(--nav-current) text-ink"
            @click="emit('abrirJornada', j.id)"
          >
            <UiIcon name="calendar" class="size-3.5 text-(--tone-icon)" />
            <span class="truncate">{{ nombreYLugar(j) }}</span>
          </button>
        </header>

        <div class="ui-tray" :data-tone="day.isToday ? 'sun' : undefined">
          <PlannerWorkshopCard v-for="ws in day.workshops" :key="'m-' + ws.id" :workshop="ws" />
          <button type="button" class="ui-slot" @click="navigateTo('/organizacion/workshops/new?fecha=' + day.fecha)">
            <UiIcon name="plus" />
            {{ t('planner.add') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JornadaResumen } from '~/utils/jornadas'

const emit = defineEmits<{ abrirJornada: [id: number] }>()

const { t } = useT()
const { weekDays, weekBands, jornadasDe, moveWorkshop } = usePlanner()

// «Semana de la nutrición · Sede central»: la banda dice qué jornada es y dónde.
const nombreYLugar = (j: JornadaResumen) => `${j.nombre} · ${j.ubicacion}`

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
