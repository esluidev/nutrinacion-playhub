<template>
  <div class="card overflow-hidden">
    <!-- Month Header -->
    <div class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
      <button
        class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
        @click="navigateCalendarMonth(-1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <h3 class="text-sm font-display font-bold text-brand-dark">
        {{ monthLabel }}
      </h3>
      <button
        class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
        @click="navigateCalendarMonth(1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Day-of-week Headers -->
    <div class="grid grid-cols-7 border-b border-gray-100">
      <div
        v-for="(d, i) in dayHeaders"
        :key="d"
        :class="[
          'py-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400',
          i < 6 ? 'border-r border-gray-100' : '',
        ]"
      >
        {{ d }}
      </div>
    </div>

    <!-- Calendar Grid Rows -->
    <div
      v-for="(week, wIdx) in calendarWeeks"
      :key="wIdx"
      class="grid grid-cols-7 border-b border-gray-100 last:border-b-0"
    >
      <div
        v-for="(cell, cIdx) in week"
        :key="cell.fecha"
        :class="[
          'min-h-[100px] p-1.5 relative',
          cIdx < 6 ? 'border-r border-gray-100' : '',
          cell.isCurrentMonth ? '' : 'bg-gray-50/50',
          cell.isToday ? 'bg-brand-primary-50/40' : '',
        ]"
      >
        <!-- Day Number -->
        <div class="flex items-center justify-between mb-1">
          <span
            :class="[
              'text-xs font-semibold leading-none',
              cell.isToday ? 'text-white bg-brand-primary w-5 h-5 rounded-full flex items-center justify-center' : '',
              cell.isCurrentMonth ? (cell.isToday ? '' : 'text-brand-dark') : 'text-gray-300',
            ]"
          >
            {{ cell.day }}
          </span>
          <button
            v-if="cell.isCurrentMonth"
            class="w-4 h-4 rounded flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-brand-primary-100 transition-all group"
            @click="openAddModal(cell.fecha)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-300 group-hover:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        <!-- Workshop Pills -->
        <div class="space-y-0.5">
          <div
            v-for="ws in cell.workshops"
            :key="ws.id"
            class="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
            @click="navigateTo('/dashboard/workshops/' + ws.id)"
          >
            <div :class="['w-1.5 h-1.5 rounded-full shrink-0', ws.accentColor]" />
            <span class="text-[10px] font-medium text-gray-600 truncate group-hover:text-brand-dark">
              {{ ws.title }}
            </span>
          </div>

          <!-- Overflow indicator -->
          <span
            v-if="cell.workshops.length > 3"
            class="text-[9px] text-gray-400 font-medium pl-1"
          >
            +{{ cell.workshops.length - 3 }} mas
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { workshops, todayStr, openAddModal, currentMonday, formatDate } = usePlanner()

const MONTH_NAMES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const dayHeaders = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

const calendarMonth = ref(currentMonday.value.getMonth())
const calendarYear = ref(currentMonday.value.getFullYear())

watch(currentMonday, (mon) => {
  calendarMonth.value = mon.getMonth()
  calendarYear.value = mon.getFullYear()
})

const monthLabel = computed(() => `${MONTH_NAMES_FULL[calendarMonth.value]} ${calendarYear.value}`)

function navigateCalendarMonth(dir: number) {
  calendarMonth.value += dir
  if (calendarMonth.value > 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else if (calendarMonth.value < 0) {
    calendarMonth.value = 11
    calendarYear.value--
  }
}

interface CalendarCell {
  day: number
  fecha: string
  isCurrentMonth: boolean
  isToday: boolean
  workshops: typeof workshops.value
}

const calendarWeeks = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value

  const firstDay = new Date(year, month, 1)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells: CalendarCell[] = []

  // Previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const d = new Date(year, month - 1, day)
    const fecha = formatDate(d)
    cells.push({
      day,
      fecha,
      isCurrentMonth: false,
      isToday: fecha === todayStr,
      workshops: workshops.value.filter(ws => ws.fecha === fecha),
    })
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      day,
      fecha,
      isCurrentMonth: true,
      isToday: fecha === todayStr,
      workshops: workshops.value.filter(ws => ws.fecha === fecha),
    })
  }

  // Next month (fill to complete last row)
  const remaining = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day)
    const fecha = formatDate(d)
    cells.push({
      day,
      fecha,
      isCurrentMonth: false,
      isToday: fecha === todayStr,
      workshops: workshops.value.filter(ws => ws.fecha === fecha),
    })
  }

  // Split into weeks
  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
})
</script>
