<template>
  <div>
    <!-- Toolbar -->
    <div class="flex items-center gap-2.5 mb-[18px] flex-wrap">
      <UiSearchInput v-model="search" placeholder="Buscar storyboard…" max-width="xs" class="!w-[280px]" />
      <UiSelect v-model="activeCategory" variant="toolbar" prefix="Tipo" :options="categoryOptions" />
      <span class="ml-auto text-xs text-gray-400 font-semibold">{{ storyboards.length }} storyboards publicados</span>
    </div>

    <!-- Grid de selección -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <button
        v-for="sb in filteredStoryboards"
        :key="sb.id"
        :class="[
          'text-left rounded-2xl p-[18px] border-[1.5px] transition-all duration-150',
          state.storyboardId === sb.id
            ? 'bg-brand-primary-50 border-brand-primary'
            : 'bg-white border-gray-200 hover:border-brand-primary-200',
        ]"
        @click="selectStoryboard(sb.id)"
      >
        <div class="flex items-center justify-between mb-3">
          <div :class="['w-10 h-10 rounded-[12px] flex items-center justify-center', tintFor(sb.coverBg)]">
            <svg class="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <!-- Radio -->
          <div
            :class="[
              'w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors',
              state.storyboardId === sb.id ? 'border-brand-primary' : 'border-[#dfe3e0]',
            ]"
          >
            <div :class="['w-2.5 h-2.5 rounded-full', state.storyboardId === sb.id ? 'bg-brand-primary' : 'bg-transparent']" />
          </div>
        </div>
        <p class="text-[14.5px] font-extrabold text-gray-800 leading-[1.3] mb-1">{{ sb.title }}</p>
        <p class="text-[12px] font-semibold text-gray-500">{{ sb.duration }} · {{ sb.scenesCount }} escenas · {{ sb.targetAge }}</p>
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="filteredStoryboards.length === 0" class="text-center py-12">
      <p class="text-sm font-bold text-gray-600">Sin resultados</p>
      <p class="text-xs text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>
      <button class="text-xs font-bold text-brand-primary-700 hover:text-brand-primary-800 mt-3" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { storyboards } = useStoryboards()
const { state, selectStoryboard } = useWorkshopWizard()

const search = ref('')
const activeCategory = ref('all')

// Tinte del icono según el color de portada del storyboard. Mapa literal para que
// Tailwind genere las clases (no se pueden interpolar).
const TINT_MAP: Record<string, string> = {
  'bg-emerald-500': 'bg-emerald-50 text-emerald-600',
  'bg-sky-500': 'bg-sky-50 text-sky-600',
  'bg-violet-500': 'bg-violet-50 text-violet-600',
  'bg-amber-500': 'bg-amber-50 text-amber-600',
  'bg-rose-400': 'bg-rose-50 text-rose-500',
  'bg-teal-500': 'bg-teal-50 text-teal-600',
  'bg-indigo-500': 'bg-indigo-50 text-indigo-600',
  'bg-orange-500': 'bg-orange-50 text-orange-600',
}
function tintFor(coverBg: string) {
  return TINT_MAP[coverBg] ?? 'bg-brand-primary-50 text-brand-primary-800'
}

const categoryOptions = computed(() => {
  const cats = new Set(storyboards.value.map(sb => sb.category))
  return [
    { value: 'all', label: 'Todos' },
    ...Array.from(cats).map(c => ({ value: c, label: c })),
  ]
})

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
