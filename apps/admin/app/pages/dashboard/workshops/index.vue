<template>
  <div>
    <!-- Toolbar -->
    <UiPageToolbar>
      <template #tabs>
        <UiChips v-model="activeTab" :items="statusTabs" />
      </template>

      <template #actions>
        <UiButton variant="primary" size="sm" @click="navigateTo('/dashboard/workshops/new')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Taller
        </UiButton>
      </template>

      <template #filters>
        <UiSearchInput v-model="searchQuery" placeholder="Buscar taller..." max-width="sm" />

        <div class="sm:ml-auto">
          <span class="text-xs text-gray-400">
            {{ paginatedWorkshops.length }} de {{ filteredWorkshops.length }} talleres
          </span>
        </div>
      </template>
    </UiPageToolbar>

    <!-- Workshop Card Grid -->
    <div
      v-if="paginatedWorkshops.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
    >
      <div
        v-for="workshop in paginatedWorkshops"
        :key="workshop.id"
        class="card card-hover overflow-hidden group cursor-pointer"
        @click="goToWorkshop(workshop.id)"
      >
        <!-- Colored top accent -->
        <div :class="['h-1.5', workshop.accentColor]" />

        <!-- Card Body -->
        <div class="p-5">
          <!-- Header: Title + Status -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-brand-dark truncate group-hover:text-brand-primary-600 transition-colors">
                {{ workshop.title }}
              </h3>
              <p class="text-xs text-gray-400 mt-0.5 truncate">{{ workshop.storyboard }}</p>
            </div>
            <UiBadge :variant="statusVariant(workshop.status)" class="shrink-0">
              {{ workshop.statusLabel }}
            </UiBadge>
          </div>

          <!-- Educator -->
          <div class="flex items-center gap-2.5 mb-4">
            <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0', workshop.avatarBg]">
              {{ workshop.initials }}
            </div>
            <span class="text-xs text-gray-500 truncate">{{ workshop.educator }}</span>
          </div>

          <!-- Meta rows -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span>{{ formatShortDate(workshop.date) }}</span>
              <span class="text-gray-200">·</span>
              <span>{{ workshop.time || '--' }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span class="truncate">{{ workshop.location }}</span>
            </div>
            <div v-if="workshop.capacity" class="flex items-center gap-2 text-xs text-gray-400">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <span>{{ workshop.capacity }} participantes</span>
            </div>
          </div>

        </div>

        <!-- Card Footer -->
        <div class="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <UiButton variant="outline" size="sm" @click.stop="goToWorkshop(workshop.id)">
            Ver Detalle
          </UiButton>
          <div class="flex items-center gap-0.5">
            <button
              class="p-2 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary-50 transition-colors"
              title="Editar"
              @click.stop="goToWorkshop(workshop.id)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button
              class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Eliminar"
              @click.stop
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
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
      <h3 class="font-display font-bold text-brand-dark text-lg mb-2">Sin resultados</h3>
      <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
        No se encontraron talleres con los filtros aplicados.
      </p>
      <UiButton variant="outline" size="sm" class="mt-5" @click="resetFilters">
        Limpiar filtros
      </UiButton>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      <p class="text-xs text-gray-400">
        Pagina <span class="font-semibold text-brand-dark">{{ currentPage }}</span> de <span class="font-semibold text-brand-dark">{{ totalPages }}</span>
      </p>
      <div class="flex items-center gap-1.5">
        <UiButton variant="outline" size="sm" :disabled="currentPage === 1" @click="currentPage--">Anterior</UiButton>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors',
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
