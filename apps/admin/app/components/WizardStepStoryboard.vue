<template>
  <div>
    <h2 class="text-lg font-display font-bold text-brand-dark mb-1">Seleccionar Storyboard</h2>
    <p class="text-sm text-gray-500 mb-5">Elige el contenido educativo que se usara en este taller</p>

    <!-- Pre-selected storyboard card -->
    <div
      v-if="hasPreselectedStoryboard && selectedStoryboard && !showingAll"
      class="card !border-brand-primary overflow-hidden ring-1 ring-brand-primary/30 mb-5"
    >
      <div class="flex flex-col sm:flex-row">
        <!-- Cover -->
        <div :class="['relative w-full sm:w-44 h-28 sm:h-auto shrink-0', selectedStoryboard.coverBg]">
          <div class="absolute inset-0 opacity-10">
            <svg class="w-full h-full" viewBox="0 0 200 100" fill="none">
              <circle cx="150" cy="15" r="40" fill="currentColor" />
              <circle cx="25" cy="80" r="30" fill="currentColor" />
            </svg>
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg class="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          </div>
          <!-- Plan badge -->
          <div class="absolute top-2.5 left-2.5">
            <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', planBadgeClass(selectedStoryboard.plan)]">
              {{ selectedStoryboard.plan }}
            </span>
          </div>
          <!-- Scenes badge -->
          <div class="absolute bottom-2.5 right-2.5">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm">
              {{ selectedStoryboard.scenes.length }} escenas
            </span>
          </div>
          <!-- Selected checkmark -->
          <div class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shadow-sm">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>

        <!-- Details -->
        <div class="flex-1 bg-white p-5 flex flex-col justify-between gap-3">
          <div>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{{ selectedStoryboard.category }}</span>
                <h3 class="text-sm font-bold text-brand-dark mt-0.5">{{ selectedStoryboard.title }}</h3>
              </div>
              <button
                class="text-xs font-semibold text-brand-primary hover:text-brand-primary-800 transition-colors shrink-0 mt-1"
                @click="showingAll = true"
              >
                Cambiar
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-1.5 line-clamp-2">{{ selectedStoryboard.description }}</p>
          </div>
          <div class="flex items-center gap-3 text-[11px] text-gray-400">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {{ selectedStoryboard.targetAge }}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {{ selectedStoryboard.duration }}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              {{ selectedStoryboard.scenes.length }} escenas
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search + Filters -->
    <template v-if="!hasPreselectedStoryboard || showingAll">
      <UiSearchInput v-model="search" placeholder="Buscar por titulo, categoria..." max-width="full" class="mb-4" />

      <!-- Category chips -->
      <UiChips v-model="activeCategory" :items="categoryChips" class="mb-5" />

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="sb in filteredStoryboards"
          :key="sb.id"
          :class="[
            'text-left card overflow-hidden group relative',
            state.storyboardId === sb.id
              ? '!border-brand-primary ring-1 ring-brand-primary/30'
              : 'card-interactive',
          ]"
          @click="selectStoryboard(sb.id)"
        >
          <!-- Selected checkmark -->
          <div
            v-if="state.storyboardId === sb.id"
            class="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shadow-sm"
          >
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>

          <!-- Cover -->
          <div :class="['h-28 relative overflow-hidden', sb.coverBg]">
            <div class="absolute inset-0 opacity-10">
              <svg class="w-full h-full" viewBox="0 0 200 100" fill="none">
                <circle cx="150" cy="15" r="40" fill="currentColor" />
                <circle cx="25" cy="80" r="30" fill="currentColor" />
              </svg>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            </div>

            <!-- Plan badge -->
            <div class="absolute top-2.5 left-2.5">
              <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', planBadgeClass(sb.plan)]">
                {{ sb.plan }}
              </span>
            </div>

            <!-- Scenes badge -->
            <div class="absolute bottom-2.5 right-2.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm">
                {{ sb.scenes.length }} escenas
              </span>
            </div>
          </div>

          <!-- Body -->
          <div class="bg-white p-5">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{{ sb.category }}</span>
            <h3 class="text-sm font-bold text-brand-dark mt-1 line-clamp-1">{{ sb.title }}</h3>
            <p class="text-xs text-gray-400 mt-1 line-clamp-1">{{ sb.description }}</p>
            <div class="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {{ sb.targetAge }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {{ sb.duration }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="filteredStoryboards.length === 0" class="text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-600">Sin resultados</p>
        <p class="text-xs text-gray-400 mt-1">Intenta con otros terminos de busqueda</p>
        <button class="text-xs font-semibold text-brand-primary hover:text-brand-primary-800 mt-3" @click="clearFilters">
          Limpiar filtros
        </button>
      </div>

      <!-- Counter -->
      <p v-if="filteredStoryboards.length > 0" class="text-xs text-gray-400 mt-5">
        Mostrando <span class="font-semibold text-brand-dark">{{ filteredStoryboards.length }}</span> de <span class="font-semibold text-brand-dark">{{ storyboards.length }}</span> storyboards
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
const { storyboards, planBadgeClass } = useStoryboards()
const { state, selectedStoryboard, hasPreselectedStoryboard, selectStoryboard } = useWorkshopWizard()

const search = ref('')
const activeCategory = ref('all')
const showingAll = ref(false)

const categories = computed(() => {
  const cats = new Set(storyboards.value.map(sb => sb.category))
  return Array.from(cats)
})

const categoryChips = computed(() => [
  { value: 'all', label: 'Todos' },
  ...categories.value.map(c => ({ value: c, label: c })),
])

const filteredStoryboards = computed(() => {
  return storyboards.value.filter((sb) => {
    const q = search.value.toLowerCase()
    const matchesSearch = !q
      || sb.title.toLowerCase().includes(q)
      || sb.category.toLowerCase().includes(q)
      || sb.description.toLowerCase().includes(q)

    const matchesCategory = activeCategory.value === 'all'
      || sb.category === activeCategory.value

    return matchesSearch && matchesCategory
  })
})

function clearFilters() {
  search.value = ''
  activeCategory.value = 'all'
}
</script>
