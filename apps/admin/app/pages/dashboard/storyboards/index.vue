<template>
  <div>
    <UiPageHeader title="Storyboards" description="Biblioteca de contenido para tus talleres" />

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3.5 mb-[22px] flex-wrap">
      <UiChips v-model="activeCategory" :items="categoryChips" />
      <div class="flex items-center gap-2.5">
        <UiSearchInput v-model="searchQuery" placeholder="Buscar storyboard…" max-width="xs" class="!w-[240px]" />
        <UiSelect v-model="activePertenencia" variant="toolbar" prefix="Pertenencia" :options="pertenenciaOptions" />
      </div>
    </div>

    <!-- Storyboard Grid -->
    <div
      v-if="paginatedStoryboards.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[22px]"
    >
      <div
        v-for="sb in paginatedStoryboards"
        :key="sb.id"
        class="card card-interactive overflow-hidden"
      >
        <!-- Cover -->
        <div :class="['relative h-[150px] flex items-center justify-center', sb.coverBg]">
          <div class="w-[60px] h-[60px] rounded-[18px] bg-white shadow-card flex items-center justify-center text-white">
            <svg class="w-[30px] h-[30px] text-brand-dark/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <!-- Pertenencia: público o personalizado de la organización -->
          <span :class="['absolute top-[13px] right-[13px] inline-flex items-center text-[11px] font-extrabold px-[11px] py-1 rounded-full backdrop-blur-sm', pertenenciaPill(sb.pertenencia)]">
            {{ sb.pertenencia }}
          </span>
          <!-- Scenes count -->
          <span class="absolute bottom-[13px] left-[13px] inline-flex items-center text-[11px] font-extrabold px-[11px] py-1 rounded-full bg-white/85 text-brand-dark/70 backdrop-blur-sm">
            {{ sb.scenesCount }} escenas
          </span>
        </div>

        <!-- Body -->
        <div class="px-[22px] pt-[22px] pb-[18px]">
          <h3 class="font-display font-semibold text-brand-dark text-[16.5px] leading-[1.35] mb-2">{{ sb.title }}</h3>
          <p class="text-[13.5px] text-gray-500 leading-[1.6] line-clamp-2 mb-[18px]">{{ sb.description }}</p>
          <div class="flex items-center gap-3.5 text-[12.5px] font-semibold text-gray-500">
            <div class="flex items-center gap-[5px]">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {{ sb.targetAge }}
            </div>
            <div class="flex items-center gap-[5px]">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {{ sb.duration }}
            </div>
            <span class="ml-auto text-gray-400">{{ sb.category }}</span>
          </div>
        </div>

        <!-- Footer: dos acciones, mitad y mitad -->
        <div class="px-[22px] py-[15px] border-t border-gray-100 flex items-center gap-[9px]">
          <button
            class="flex-1 inline-flex items-center justify-center font-bold rounded-[10px] border-[1.5px] border-gray-200 text-gray-700 bg-white text-[13px] h-[38px] hover:bg-gray-50 transition-colors"
            @click="navigateTo(`/dashboard/storyboards/${sb.id}`)"
          >
            Ver Detalle
          </button>
          <button
            class="flex-1 inline-flex items-center justify-center font-bold rounded-[10px] bg-brand-primary text-white text-[13px] h-[38px] hover:bg-brand-primary-700 transition-colors"
            @click="navigateTo(`/dashboard/workshops/new?storyboard=${sb.id}`)"
          >
            Usar en Taller
          </button>
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
      <h3 class="font-display font-semibold text-brand-dark text-lg mb-2">Sin resultados</h3>
      <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
        No se encontraron storyboards con los filtros seleccionados. Intenta cambiar la categoría o el término de búsqueda.
      </p>
      <UiButton variant="outline" size="sm" class="mt-5" @click="resetFilters">
        Limpiar filtros
      </UiButton>
    </div>

    <!-- Pagination -->
    <div v-if="paginatedStoryboards.length > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-7">
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

const { storyboards } = useStoryboards()

const searchQuery = ref('')
const activeCategory = ref('all')
const activePertenencia = ref('all')
const currentPage = ref(1)
const perPage = 12

const categoryChips = computed(() => [
  { value: 'all', label: 'Todos' },
  ...dynamicCategories.value.map(cat => ({ value: cat, label: cat })),
])

// El catálogo real distingue estándar (de la plataforma) vs personalizado (de tu org).
const pertenenciaOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'Público', label: 'Público' },
  { value: 'Personalizado', label: 'Personalizado' },
]

const PILL_PERTENENCIA: Record<string, string> = {
  'Público': 'bg-white/85 text-brand-primary-800',
  'Personalizado': 'bg-white/85 text-brand-purple-700',
}
function pertenenciaPill(pertenencia: string) {
  return PILL_PERTENENCIA[pertenencia] ?? PILL_PERTENENCIA['Público']
}

const dynamicCategories = computed(() => {
  const cats = new Set(storyboards.value.map(sb => sb.category))
  return [...cats].sort()
})

const filteredStoryboards = computed(() => {
  let result = storyboards.value

  if (activeCategory.value !== 'all') {
    result = result.filter(sb => sb.category === activeCategory.value)
  }

  if (activePertenencia.value !== 'all') {
    result = result.filter(sb => sb.pertenencia === activePertenencia.value)
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

  return result
})

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

function resetFilters() {
  searchQuery.value = ''
  activeCategory.value = 'all'
  activePertenencia.value = 'all'
  currentPage.value = 1
}

watch([activeCategory, searchQuery, activePertenencia], () => {
  currentPage.value = 1
})
</script>
