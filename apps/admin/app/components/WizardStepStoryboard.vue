<template>
  <div>
    <!-- Toolbar -->
    <div class="mb-5 flex flex-wrap items-center gap-3">
      <UiSearchInput v-model="search" placeholder="Buscar storyboard…" max-width="xs" />
      <UiSelect v-model="activeCategory" variant="toolbar" prefix="Categoría" :options="categoryOptions" />
      <span class="ui-caption ml-auto">{{ storyboards.length }} storyboards publicados</span>
    </div>

    <!-- Selección: la tarjeta elegida se marca en cielo (borde, marca y fondo); el símbolo, con su área -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <button
        v-for="sb in filteredStoryboards"
        :key="sb.id"
        type="button"
        data-tone="sky"
        class="select-card items-start justify-start gap-3 p-5 text-left"
        :aria-pressed="state.storyboardId === sb.id"
        @click="selectStoryboard(sb.id)"
      >
        <span class="selected-mark"><UiIcon name="check" /></span>
        <UiSymbol
          icon="book"
          size="md"
                    v-bind="uiAreaAttrs(sb.area)"
        />
        <span class="block">
          <span class="mb-1 block text-body font-extrabold leading-snug text-ink">{{ sb.title }}</span>
          <span class="ui-caption block">{{ sb.duration }} · {{ sb.scenesCount }} escenas · {{ sb.targetAge }}</span>
        </span>
      </button>
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-if="filteredStoryboards.length === 0"
      icon="search"
      title="Sin resultados"
      text="Intenta con otros términos de búsqueda"
    >
      <UiButton variant="outline" size="sm" @click="clearFilters">
        Limpiar filtros
      </UiButton>
    </UiEmptyState>
  </div>
</template>

<script setup lang="ts">
const { storyboards } = useStoryboards()
const { state, selectStoryboard } = useWorkshopWizard()

const search = ref('')
const activeCategory = ref('all')


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
