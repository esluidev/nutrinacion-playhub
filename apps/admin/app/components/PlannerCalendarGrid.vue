<template>
  <div class="ui-panel overflow-hidden">
    <!-- Encabezados de día (la navegación del mes vive en el toolbar) -->
    <div class="grid grid-cols-7 border-b border-line">
      <div v-for="(d, i) in dayHeaders" :key="d" :class="['eyebrow py-2.5 text-center', i < 6 && 'border-r border-line']">
        {{ d }}
      </div>
    </div>

    <!-- Semanas -->
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
          <span v-if="cell.isToday" class="eyebrow text-(--tone-strong)">Hoy</span>
        </div>

        <div class="flex flex-col gap-0.5">
          <PlannerWorkshopCard v-for="ws in cell.workshops" :key="ws.id" :workshop="ws" compact />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { visibleWorkshops, todayStr, monthAnchor, formatDate } = usePlanner()

const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface CalendarCell {
  day: number
  fecha: string
  isCurrentMonth: boolean
  isToday: boolean
  workshops: typeof visibleWorkshops.value
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
    const day = prevMonthDays - i
    const d = new Date(year, month - 1, day)
    const fecha = formatDate(d)
    cells.push({
      day,
      fecha,
      isCurrentMonth: false,
      isToday: fecha === todayStr,
      workshops: visibleWorkshops.value.filter(ws => ws.fecha === fecha),
    })
  }

  // Mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      day,
      fecha,
      isCurrentMonth: true,
      isToday: fecha === todayStr,
      workshops: visibleWorkshops.value.filter(ws => ws.fecha === fecha),
    })
  }

  // Mes siguiente (completa la última fila)
  const remaining = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day)
    const fecha = formatDate(d)
    cells.push({
      day,
      fecha,
      isCurrentMonth: false,
      isToday: fecha === todayStr,
      workshops: visibleWorkshops.value.filter(ws => ws.fecha === fecha),
    })
  }

  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
})
</script>
