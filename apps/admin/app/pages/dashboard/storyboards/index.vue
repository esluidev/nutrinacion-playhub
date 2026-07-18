<template>
  <div>
    <!-- Toolbar -->
    <UiPageToolbar>
      <template #tabs>
        <UiChips v-model="activeCategory" :items="categoryChips" />
      </template>

      <template #filters>
        <UiSearchInput v-model="searchQuery" placeholder="Buscar storyboard..." max-width="sm" />

        <div class="hidden sm:block w-px h-5 bg-gray-200" />

        <!-- Plan filters -->
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Plan</span>
          <UiChips v-model="activePlan" :items="planFilters" />
        </div>

        <div class="hidden sm:block w-px h-5 bg-gray-200" />

        <!-- Sort -->
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ordenar</span>
          <select v-model="sortBy" class="input-sm !w-auto">
            <option value="recent">Mas recientes</option>
            <option value="popular">Mas populares</option>
            <option value="name">Nombre A-Z</option>
            <option value="duration">Duracion</option>
          </select>
        </div>

        <!-- Results count -->
        <div class="sm:ml-auto">
          <span class="text-xs text-gray-400">
            {{ paginatedStoryboards.length }} de {{ filteredStoryboards.length }} storyboards
          </span>
        </div>
      </template>
    </UiPageToolbar>

    <!-- Storyboard Grid -->
    <div
      v-if="paginatedStoryboards.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <div
        v-for="sb in paginatedStoryboards"
        :key="sb.id"
        class="card card-interactive group overflow-hidden"
      >
        <!-- Thumbnail area -->
        <div class="relative h-44 overflow-hidden" :class="sb.coverBg">
          <!-- Decorative pattern -->
          <div class="absolute inset-0 opacity-10">
            <svg class="w-full h-full" viewBox="0 0 200 200" fill="none">
              <circle cx="150" cy="30" r="60" fill="currentColor" />
              <circle cx="30" cy="160" r="45" fill="currentColor" />
              <circle cx="180" cy="170" r="30" fill="currentColor" />
            </svg>
          </div>

          <!-- Icon -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg class="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          </div>

          <!-- Plan badge (top right) -->
          <div class="absolute top-3 right-3">
            <span :class="['badge', planBadgeClass(sb.plan)]">
              <svg
                v-if="sb.plan === 'Premium'"
                class="w-3 h-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
              <svg
                v-if="sb.plan === 'Personalizado'"
                class="w-3 h-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
              {{ sb.plan }}
            </span>
          </div>

          <!-- Scenes count (bottom left) -->
          <div class="absolute bottom-3 left-3">
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold bg-black/30 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125M18 12V7.125m0 4.875v4.125M6 12V7.125m0 4.875v4.125m0-4.875c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125m-12 0v1.5c0 .621.504 1.125 1.125 1.125m10.5-2.625v1.5c0 .621-.504 1.125-1.125 1.125M6 16.125v1.5c0 .621.504 1.125 1.125 1.125m10.5 0h-10.5" />
              </svg>
              {{ sb.scenes.length }} escenas
            </span>
          </div>
        </div>

        <!-- Card body -->
        <div class="p-5">
          <!-- Category badge -->
          <span class="badge badge-gray mb-3">{{ sb.category }}</span>

          <!-- Title -->
          <h3 class="font-display font-bold text-brand-dark text-[15px] leading-snug mb-2 group-hover:text-brand-primary-600 transition-colors">
            {{ sb.title }}
          </h3>

          <!-- Description -->
          <p class="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">
            {{ sb.description }}
          </p>

          <!-- Meta row -->
          <div class="flex items-center gap-4 text-xs text-gray-400">
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span>{{ sb.targetAge }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>{{ sb.duration }}</span>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="px-5 py-3.5 border-t border-gray-100 flex items-center gap-2">
          <UiButton variant="outline" size="sm" @click.stop="navigateTo(`/dashboard/storyboards/${sb.id}`)">
            Ver Detalle
          </UiButton>
          <UiButton variant="primary" size="sm" @click.stop="navigateTo(`/dashboard/workshops/new?storyboard=${sb.id}`)">
            Usar en Taller
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Empty state -->
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
        No se encontraron storyboards con los filtros seleccionados. Intenta cambiar la categoria o el termino de busqueda.
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

const { storyboards, planBadgeClass } = useStoryboards()

const searchQuery = ref('')
const activeCategory = ref('all')
const activePlan = ref('all')
const sortBy = ref('recent')
const currentPage = ref(1)
const perPage = 12

const categoryChips = computed(() => [
  { value: 'all', label: 'Todos' },
  ...dynamicCategories.value.map(cat => ({ value: cat, label: cat })),
])

const planFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'free', label: 'Gratuito', activeClass: 'bg-brand-primary-50 text-brand-primary-700 ring-1 ring-brand-primary-200' },
  { value: 'premium', label: 'Premium', activeClass: 'bg-brand-coral-50 text-brand-coral-700 ring-1 ring-brand-coral-200' },
  { value: 'custom', label: 'Personalizado', activeClass: 'bg-brand-purple-50 text-brand-purple-700 ring-1 ring-brand-purple-200' },
]

const dynamicCategories = computed(() => {
  const cats = new Set(storyboards.value.map(sb => sb.category))
  return [...cats].sort()
})

const filteredStoryboards = computed(() => {
  let result = storyboards.value

  if (activeCategory.value !== 'all') {
    result = result.filter(sb => sb.category === activeCategory.value)
  }

  if (activePlan.value === 'free') {
    result = result.filter(sb => sb.plan === 'Gratuito')
  }
  else if (activePlan.value === 'premium') {
    result = result.filter(sb => sb.plan === 'Premium')
  }
  else if (activePlan.value === 'custom') {
    result = result.filter(sb => sb.plan === 'Personalizado')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(
      sb =>
        sb.title.toLowerCase().includes(q)
        || sb.description.toLowerCase().includes(q)
        || sb.category.toLowerCase().includes(q),
    )
  }

  if (sortBy.value === 'name') {
    result = [...result].sort((a, b) => a.title.localeCompare(b.title))
  }
  else if (sortBy.value === 'duration') {
    result = [...result].sort((a, b) => parseInt(a.duration) - parseInt(b.duration))
  }
  else if (sortBy.value === 'popular') {
    result = [...result].sort((a, b) => b.scenes - a.scenes)
  }

  return result
})

function resetFilters() {
  searchQuery.value = ''
  activeCategory.value = 'all'
  activePlan.value = 'all'
  sortBy.value = 'recent'
  currentPage.value = 1
}

const totalPages = computed(() => Math.max(1, Math.ceil(filteredStoryboards.value.length / perPage)))

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const paginatedStoryboards = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredStoryboards.value.slice(start, start + perPage)
})

watch([activeCategory, activePlan, searchQuery, sortBy], () => {
  currentPage.value = 1
})
</script>
