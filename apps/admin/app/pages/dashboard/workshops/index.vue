<template>
  <div>
    <UiPageHeader title="Talleres" description="Todos los talleres de tu comunidad">
      <template #actions>
        <UiButton icon="plus" @click="navigateTo('/dashboard/workshops/new')">
          Nuevo Taller
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Toolbar -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <UiChips v-model="activeTab" :items="statusTabs" />
      <UiSearchInput v-model="searchQuery" placeholder="Buscar taller…" max-width="xs" />
    </div>

    <!-- Tarjetas: cada una lleva el tono de su sesión (hoy en sol, próxima en cielo, completada en lima…) -->
    <div
      v-if="paginatedWorkshops.length > 0"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <article
        v-for="workshop in paginatedWorkshops"
        :key="workshop.id"
        :data-tone="workshop.tone"
        class="ui-panel ui-panel-interactive relative flex flex-col overflow-hidden"
        @click="goToWorkshop(workshop.id)"
      >
        <span class="absolute inset-y-0 left-0 w-1 bg-(--tone-fill)" aria-hidden="true" />
        <div class="ui-panel-body flex-1">
          <UiBadge :tone="workshop.tone" dot class="mb-3">{{ workshop.statusLabel }}</UiBadge>
          <h3 class="text-subtitle font-black leading-tight text-ink">{{ workshop.title }}</h3>
          <p class="ui-caption mb-4 mt-0.5">{{ workshop.storyboard }}</p>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2.5 text-body font-semibold text-muted">
              <UiIcon name="calendar" class="size-4 shrink-0 text-subtle" />
              <span>
                {{ formatShortDate(workshop.date) }} ·
                <span class="font-extrabold tabular-nums text-(--tone-strong)">{{ workshop.time || '—' }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2.5 text-body font-semibold text-muted">
              <UiIcon name="map-pin" class="size-4 shrink-0 text-subtle" />
              <span class="truncate">{{ workshop.location }}</span>
            </div>
          </div>
        </div>
        <div class="ui-panel-footer flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <UiAvatar :name="workshop.educator" :initials="workshop.initials" size="sm" />
            <span class="truncate text-caption font-bold text-muted">{{ workshop.educator }}</span>
          </div>
          <span v-if="workshop.capacity" class="ui-caption shrink-0">{{ workshop.capacity }} participantes</span>
        </div>
      </article>
    </div>

    <!-- Empty State -->
    <div v-else class="ui-panel">
      <UiEmptyState
        icon="search"
        title="Sin resultados"
        text="No se encontraron talleres con los filtros aplicados."
      >
        <UiButton variant="outline" size="sm" @click="resetFilters">
          Limpiar filtros
        </UiButton>
      </UiEmptyState>
    </div>

    <!-- Pagination -->
    <div v-if="paginatedWorkshops.length > 0" class="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p class="ui-caption">
        Página <span class="font-extrabold text-ink">{{ currentPage }}</span> de <span class="font-extrabold text-ink">{{ totalPages }}</span>
      </p>
      <nav class="ui-pagination">
        <button type="button" class="ui-page px-3" :disabled="currentPage === 1" @click="currentPage--">Anterior</button>
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="ui-page"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button type="button" class="ui-page px-3" :disabled="currentPage === totalPages" @click="currentPage++">Siguiente</button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { workshops } = useWorkshops()

const searchQuery = ref('')
const activeTab = ref('todos')
const currentPage = ref(1)
const perPage = 12

function resetFilters() {
  searchQuery.value = ''
  activeTab.value = 'todos'
  currentPage.value = 1
}

// «Todos» deja fuera los archivados (descartados): tienen su propia pestaña. Las que no tienen
// talleres no se muestran, salvo «Todos».
const cuenta = (status: string) => workshops.value.filter(w => w.status === status).length
const statusTabs = computed(() => [
  { label: 'Todos', value: 'todos', count: workshops.value.filter(w => w.status !== 'archivado').length },
  { label: 'Programados', value: 'programado', count: cuenta('programado') },
  { label: 'Realizados', value: 'completado', count: cuenta('completado') },
  { label: 'Sin realizar', value: 'sin_realizar', count: cuenta('sin_realizar') },
  { label: 'En revisión', value: 'revision', count: cuenta('revision') },
  { label: 'Borrador', value: 'borrador', count: cuenta('borrador') },
  { label: 'Cancelados', value: 'cancelado', count: cuenta('cancelado') },
  { label: 'Archivados', value: 'archivado', count: cuenta('archivado') },
].filter(t => t.value === 'todos' || t.count > 0))

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

  result = activeTab.value === 'todos'
    ? result.filter(w => w.status !== 'archivado')
    : result.filter(w => w.status === activeTab.value)

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
