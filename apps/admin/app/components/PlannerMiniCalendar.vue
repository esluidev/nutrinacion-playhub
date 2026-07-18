<template>
  <div
    ref="calendarRef"
    class="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl ring-1 ring-gray-200 p-4 w-72"
  >
    <!-- Month Nav -->
    <div class="flex items-center justify-between mb-3">
      <button
        class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
        @click="navigateMonth(-1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span class="text-sm font-bold text-brand-dark font-display">
        {{ monthNames[viewMonth] }} {{ viewYear }}
      </span>
      <button
        class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
        @click="navigateMonth(1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Day Headers -->
    <div class="grid grid-cols-7 mb-1">
      <div
        v-for="d in dayHeaders"
        :key="d"
        class="text-center text-[10px] font-bold text-gray-400 uppercase py-1"
      >
        {{ d }}
      </div>
    </div>

    <!-- Day Grid -->
    <div class="grid grid-cols-7">
      <button
        v-for="cell in calendarCells"
        :key="cell.key"
        :class="[
          'h-8 w-full rounded-lg text-xs font-medium transition-colors relative',
          cell.isCurrentMonth ? 'text-brand-dark' : 'text-gray-300',
          cell.isInCurrentWeek ? 'bg-brand-primary-100' : '',
          cell.isToday ? 'font-bold' : '',
          cell.isCurrentMonth ? 'hover:bg-brand-primary-50' : '',
        ]"
        :disabled="!cell.isCurrentMonth"
        @click="selectDate(cell.date)"
      >
        {{ cell.day }}
        <span
          v-if="cell.isToday"
          class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-primary"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { goToDate, showMiniCalendar, currentMonday, todayStr } = usePlanner()

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const dayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const viewMonth = ref(currentMonday.value.getMonth())
const viewYear = ref(currentMonday.value.getFullYear())

watch(currentMonday, (mon) => {
  viewMonth.value = mon.getMonth()
  viewYear.value = mon.getFullYear()
})

function navigateMonth(dir: number) {
  viewMonth.value += dir
  if (viewMonth.value > 11) {
    viewMonth.value = 0
    viewYear.value++
  } else if (viewMonth.value < 0) {
    viewMonth.value = 11
    viewYear.value--
  }
}

// Compute the Monday of the current planner week as YYYY-MM-DD for comparison
const currentWeekDates = computed(() => {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentMonday.value)
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
  }
  return new Set(dates)
})

const calendarCells = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  // Monday = 0 in our system
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const prevMonthDays = new Date(viewYear.value, viewMonth.value, 0).getDate()

  const cells: { key: string; day: number; date: Date; isCurrentMonth: boolean; isToday: boolean; isInCurrentWeek: boolean }[] = []

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const d = new Date(viewYear.value, viewMonth.value - 1, day)
    cells.push({ key: `prev-${day}`, day, date: d, isCurrentMonth: false, isToday: false, isInCurrentWeek: false })
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear.value, viewMonth.value, day)
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      key: dateStr,
      day,
      date: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isInCurrentWeek: currentWeekDates.value.has(dateStr),
    })
  }

  // Next month padding (fill to 42 cells = 6 rows)
  const remaining = 42 - cells.length
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(viewYear.value, viewMonth.value + 1, day)
    cells.push({ key: `next-${day}`, day, date: d, isCurrentMonth: false, isToday: false, isInCurrentWeek: false })
  }

  return cells
})

function selectDate(date: Date) {
  goToDate(date)
  showMiniCalendar.value = false
}

// Click outside to close
const calendarRef = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
  if (calendarRef.value && !calendarRef.value.contains(e.target as Node)) {
    showMiniCalendar.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', onClickOutside)
  }, 10)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
