<template>
  <div>
    <UiPageHeader :title="t('workshops.title')" :description="t('workshops.desc')">
      <template #actions>
        <UiButton icon="plus" @click="navigateTo('/organizacion/workshops/new')">
          {{ t('workshops.new') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Toolbar -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <UiChips v-model="activeTab" :items="statusTabs" />
      <UiSearchInput v-model="searchQuery" :placeholder="t('workshops.searchPh')" max-width="xs" />
    </div>

    <!-- Agrupados por jornada cuando la hay (cabecera con su nombre, su lugar y sus días); los sueltos al final.
         Cada tarjeta lleva el tono de su sesión (hoy en sol, próxima en cielo, completada en lima…) -->
    <div v-if="paginatedWorkshops.length > 0" class="space-y-8">
      <section v-for="g in grupos" :key="g.jornada?.id ?? 'sueltos'">
        <header v-if="grupos.length > 1 || g.jornada" class="mb-3 flex flex-wrap items-center gap-2.5">
          <UiSymbol v-if="g.jornada" size="sm" icon="calendar" tone="lime" />
          <h2 class="ui-title">{{ g.jornada?.nombre ?? t('workshops.noJornada') }}</h2>
          <span v-if="g.jornada" class="text-body font-bold text-muted">· {{ g.jornada.ubicacion }} · {{ rangoJornada(g.jornada, locale) }}</span>
          <span class="filter-count">{{ g.workshops.length }}</span>
        </header>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="workshop in g.workshops"
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
              <span v-if="workshop.capacity" class="ui-caption shrink-0">{{ t('workshops.participants', { n: workshop.capacity }) }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Empty State -->
    <div v-else class="ui-panel">
      <UiEmptyState
        icon="search"
        :title="t('common.noResults')"
        :text="t('workshops.noResultsText')"
      >
        <UiButton variant="outline" size="sm" @click="resetFilters">
          {{ t('common.clearFilters') }}
        </UiButton>
      </UiEmptyState>
    </div>

    <!-- Pagination -->
    <div v-if="paginatedWorkshops.length > 0 && totalPages > 1" class="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p class="ui-caption">{{ t('common.pageOf', { n: currentPage, total: totalPages }) }}</p>
      <nav class="ui-pagination">
        <button type="button" class="ui-page px-3" :disabled="currentPage === 1" @click="currentPage--">{{ t('common.previous') }}</button>
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
        <button type="button" class="ui-page px-3" :disabled="currentPage === totalPages" @click="currentPage++">{{ t('common.next') }}</button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { agruparPorJornada, rangoJornada } from '~/utils/jornadas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
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
  { label: t('common.all'), value: 'todos', count: workshops.value.filter(w => w.status !== 'archivado').length },
  { label: t('workshops.tabs.programado'), value: 'programado', count: cuenta('programado') },
  { label: t('workshops.tabs.completado'), value: 'completado', count: cuenta('completado') },
  { label: t('workshops.tabs.sin_realizar'), value: 'sin_realizar', count: cuenta('sin_realizar') },
  { label: t('workshops.tabs.revision'), value: 'revision', count: cuenta('revision') },
  { label: t('workshops.tabs.borrador'), value: 'borrador', count: cuenta('borrador') },
  { label: t('workshops.tabs.cancelado'), value: 'cancelado', count: cuenta('cancelado') },
  { label: t('workshops.tabs.archivado'), value: 'archivado', count: cuenta('archivado') },
].filter(x => x.value === 'todos' || x.count > 0))

function goToWorkshop(id: number) {
  navigateTo('/organizacion/workshops/' + id)
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '--'
  const s = aFecha(dateStr).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
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
        w.title.toLowerCase().includes(q)
        || w.educator.toLowerCase().includes(q)
        || w.location.toLowerCase().includes(q)
        || w.storyboard.toLowerCase().includes(q)
        || (w.jornada?.nombre.toLowerCase().includes(q) ?? false),
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

// El agrupado es de la página que se ve (utils/jornadas).
const grupos = computed(() => agruparPorJornada(paginatedWorkshops.value))

watch([activeTab, searchQuery], () => {
  currentPage.value = 1
})
</script>
