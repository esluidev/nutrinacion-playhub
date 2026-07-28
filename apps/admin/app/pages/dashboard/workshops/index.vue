<template>
  <div>
    <UiPageHeader title="Talleres" description="Todos los talleres de tu comunidad">
      <template #actions>
        <UiButton @click="navigateTo('/dashboard/workshops/new')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Taller
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3.5 mb-[22px] flex-wrap">
      <UiChips v-model="activeTab" :items="statusTabs" />
      <UiSearchInput v-model="searchQuery" placeholder="Buscar taller…" max-width="xs" class="!w-[240px]" />
    </div>

    <!-- Workshop Card Grid -->
    <div
      v-if="paginatedWorkshops.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[22px]"
    >
      <div
        v-for="workshop in paginatedWorkshops"
        :key="workshop.id"
        class="card card-interactive overflow-hidden"
        @click="goToWorkshop(workshop.id)"
      >
        <div class="p-[22px] pb-[18px]">
          <div class="flex items-center justify-between gap-2.5 mb-3.5">
            <span :class="['w-2.5 h-2.5 rounded-[4px]', workshop.accentColor]" />
            <UiBadge :variant="statusVariant(workshop.status)" dot>{{ workshop.statusLabel }}</UiBadge>
          </div>
          <h3 class="text-base font-display font-semibold text-brand-dark leading-tight">{{ workshop.title }}</h3>
          <p class="text-[12.5px] text-gray-500 mt-0.5 mb-[18px]">{{ workshop.storyboard }}</p>
          <div class="flex flex-col gap-[9px]">
            <div class="flex items-center gap-2.5 text-[13px] font-semibold text-gray-600">
              <svg class="w-[15px] h-[15px] text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {{ formatShortDate(workshop.date) }} · {{ workshop.time || '—' }}
            </div>
            <div class="flex items-center gap-2.5 text-[13px] font-semibold text-gray-600">
              <svg class="w-[15px] h-[15px] text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span class="truncate">{{ workshop.location }}</span>
            </div>
          </div>
        </div>
        <div class="px-[22px] py-3.5 border-t border-gray-100 flex items-center justify-between bg-brand-tint">
          <div class="flex items-center gap-2.5">
            <div :class="['w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0', workshop.avatarBg]">
              {{ workshop.initials }}
            </div>
            <span class="text-[12.5px] font-bold text-gray-600">{{ workshop.educator }}</span>
          </div>
          <span v-if="workshop.capacity" class="text-[12px] font-semibold text-gray-500">{{ workshop.capacity }} participantes</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="card p-16 flex flex-col items-center justify-center text-center"
    >
      <div class="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
        <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <h3 class="font-display font-semibold text-brand-dark text-lg mb-2">Sin resultados</h3>
      <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
        No se encontraron talleres con los filtros aplicados.
      </p>
      <UiButton variant="outline" size="sm" class="mt-5" @click="resetFilters">
        Limpiar filtros
      </UiButton>
    </div>

    <!-- Pagination -->
    <div v-if="paginatedWorkshops.length > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-7">
      <p class="text-xs text-gray-400">
        Página <span class="font-bold text-gray-800">{{ currentPage }}</span> de <span class="font-bold text-gray-800">{{ totalPages }}</span>
      </p>
      <div class="flex items-center gap-1.5">
        <UiButton variant="outline" size="sm" :disabled="currentPage === 1" @click="currentPage--">Anterior</UiButton>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'w-8 h-8 rounded-[9px] text-xs font-bold flex items-center justify-center transition-colors',
            page === currentPage
              ? 'bg-brand-dark text-white'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
          ]"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <UiButton variant="outline" size="sm" :disabled="currentPage === totalPages" @click="currentPage++">Siguiente</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { workshops, statusVariant } = useWorkshops()

const searchQuery = ref('')
const activeTab = ref('todos')
const currentPage = ref(1)
const perPage = 12

function resetFilters() {
  searchQuery.value = ''
  activeTab.value = 'todos'
  currentPage.value = 1
}

const statusTabs = computed(() => [
  { label: 'Todos', value: 'todos', count: workshops.value.length },
  { label: 'Programados', value: 'programado', count: workshops.value.filter(w => w.status === 'programado').length },
  { label: 'Completados', value: 'completado', count: workshops.value.filter(w => w.status === 'completado').length },
  { label: 'Cancelados', value: 'cancelado', count: workshops.value.filter(w => w.status === 'cancelado').length },
  { label: 'Borrador', value: 'borrador', count: workshops.value.filter(w => w.status === 'borrador').length },
])

function goToWorkshop(id: number) {
  navigateTo('/dashboard/workshops/' + id)
}

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

const filteredWorkshops = computed(() => {
  let result = [...workshops.value]

  if (activeTab.value !== 'todos') {
    result = result.filter(w => w.status === activeTab.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      w =>
        w.title.toLowerCase().includes(q) ||
        w.educator.toLowerCase().includes(q) ||
        w.location.toLowerCase().includes(q) ||
        w.storyboard.toLowerCase().includes(q),
    )
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredWorkshops.value.length / perPage)))

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const paginatedWorkshops = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredWorkshops.value.slice(start, start + perPage)
})

watch([activeTab, searchQuery], () => {
  currentPage.value = 1
})
</script>
