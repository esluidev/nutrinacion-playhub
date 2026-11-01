<template>
  <div class="ui-panel overflow-hidden">
    <!-- Encabezados de día (la navegación del mes vive en el toolbar) -->
    <div class="grid grid-cols-7 border-b border-line">
      <div v-for="(d, i) in dayHeaders" :key="d" :class="['eyebrow py-2.5 text-center', i < 6 && 'border-r border-line']">
        {{ d }}
      </div>
    </div>

    <!-- Semanas. En cada día de una jornada, su marca con su nombre y su lugar (tinte lima, como la
         navegación actual): al pulsarla se abre el panel de la jornada. -->
    <div v-for="(week, wIdx) in calendarWeeks" :key="wIdx" class="grid grid-cols-7 border-b border-line last:border-b-0">
      <div
        v-for="(cell, cIdx) in week"
        :key="cell.fecha"
        :data-tone="cell.isToday ? 'sun' : undefined"
        :class="[
          'min-h-[104px] min-w-0 overflow-hidden p-2',
          cIdx < 6 && 'border-r border-line',
          cell.isToday ? 'bg-(--tone-wash)' : !cell.isCurrentMonth && 'bg-canvas',
        ]"
      >
        <div class="mb-1.5 flex items-center justify-between">
          <span :class="['ui-day ui-day-sm', !cell.isCurrentMonth && 'is-outside']" :aria-current="cell.isToday ? 'date' : undefined">{{ cell.day }}</span>
          <span v-if="cell.isToday" class="eyebrow text-(--tone-strong)">{{ t('common.today') }}</span>
        </div>

        <div class="flex flex-col gap-0.5">
          <button
            v-for="j in cell.jornadas"
            :key="'j-' + j.id"
            type="button"
            data-tone="lime"
            class="flex w-full items-center gap-1 truncate rounded-chip bg-(--nav-current) px-1.5 py-0.5 text-left text-micro font-extrabold text-ink transition-colors hover:bg-(--tone-tint-edge)"
            :title="`${j.nombre} · ${j.ubicacion}`"
            @click="emit('abrirJornada', j.id)"
          >
            <UiIcon name="calendar" class="size-3 shrink-0 text-(--tone-icon)" />
            <span class="truncate">{{ j.nombre }} · {{ j.ubicacion }}</span>
          </button>
          <PlannerWorkshopCard v-for="ws in cell.workshops" :key="ws.id" :workshop="ws" compact />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JornadaFila } from '~/composables/useJornadas'

const emit = defineEmits<{ abrirJornada: [id: number] }>()

const { t, locale } = useT()
const { visibleWorkshops, todayStr, monthAnchor, formatDate, jornadasDe } = usePlanner()

// Lunes a domingo, abreviados en el idioma de la UI.
const dayHeaders = computed(() => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(2024, 0, 1 + i) // el 1 de enero de 2024 fue lunes
  const s = d.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'short' }).replace('.', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}))

interface CalendarCell {
  day: number
  fecha: string
  isCurrentMonth: boolean
  isToday: boolean
  workshops: typeof visibleWorkshops.value
  jornadas: JornadaFila[]
}

function celda(d: Date, isCurrentMonth: boolean): CalendarCell {
  const fecha = formatDate(d)
  return {
    day: d.getDate(),
    fecha,
    isCurrentMonth,
    isToday: fecha === todayStr,
    workshops: visibleWorkshops.value.filter(ws => ws.fecha === fecha),
    jornadas: jornadasDe(fecha),
  }
}

const calendarWeeks = computed(() => {
  const year = monthAnchor.value.y
  const month = monthAnchor.value.m

  const firstDay = new Date(year, month, 1)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells: CalendarCell[] = []

  // Mes anterior
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push(celda(new Date(year, month - 1, prevMonthDays - i), false))
  }

  // Mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(celda(new Date(year, month, day), true))
  }

  // Mes siguiente (completa la última fila)
  const remaining = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    cells.push(celda(new Date(year, month + 1, day), false))
  }

  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
})
</script>
