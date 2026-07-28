<template>
  <div class="card overflow-hidden">
    <!-- Encabezados de día (la navegación del mes vive en el toolbar) -->
    <div class="grid grid-cols-7 border-b border-gray-100">
      <div
        v-for="(d, i) in dayHeaders"
        :key="d"
        :class="[
          'py-2.5 text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400',
          i < 6 ? 'border-r border-gray-100' : '',
        ]"
      >
        {{ d }}
      </div>
    </div>

    <!-- Semanas -->
    <div
      v-for="(week, wIdx) in calendarWeeks"
      :key="wIdx"
      class="grid grid-cols-7 border-b border-gray-100 last:border-b-0"
    >
      <div
        v-for="(cell, cIdx) in week"
        :key="cell.fecha"
        :class="[
          'min-h-[104px] px-[9px] py-2 min-w-0 overflow-hidden',
          cIdx < 6 ? 'border-r border-gray-100' : '',
          !cell.isCurrentMonth ? 'bg-gray-50/60' : '',
          cell.isToday ? 'bg-brand-primary-50' : '',
        ]"
      >
        <!-- Número de día -->
        <div class="flex items-center justify-between mb-1.5">
          <span
            v-if="cell.isToday"
            class="w-[22px] h-[22px] rounded-full bg-brand-primary text-white inline-flex items-center justify-center text-[11px] font-extrabold"
          >
            {{ cell.day }}
          </span>
          <span
            v-else
            :class="['text-xs font-extrabold', cell.isCurrentMonth ? 'text-gray-800' : 'text-gray-300']"
          >
            {{ cell.day }}
          </span>
          <span v-if="cell.isToday" class="text-[9px] font-extrabold text-brand-primary-700 tracking-[0.06em]">HOY</span>
        </div>

        <!-- Talleres del día -->
        <div class="flex flex-col gap-[3px]">
          <div
            v-for="ws in cell.workshops"
            :key="ws.id"
            class="flex items-center gap-1.5 px-[7px] py-1 rounded-[7px] bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            @click="navigateTo('/dashboard/workshops/' + ws.id)"
          >
            <span :class="['w-[7px] h-[7px] rounded-full shrink-0', ws.accentColor]" />
            <span class="text-[10.5px] font-bold text-gray-700 truncate">{{ ws.title }}</span>
          </div>
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
