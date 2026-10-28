<template>
  <div>
    <UiPageHeader title="Storyboards" description="Biblioteca de contenido para tus talleres" />

    <!-- Toolbar -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <UiChips v-model="activeCategory" :items="categoryChips">
        <!-- Cada tipo es un área educativa: su punto lleva el tono del área -->
        <template #icon="{ item }">
          <span v-if="areaDe(item.value)" class="size-2 shrink-0 rounded-full bg-(--tone-fill)" :data-area="areaDe(item.value)" />
        </template>
      </UiChips>
      <div class="flex items-center gap-3">
        <UiSearchInput v-model="searchQuery" placeholder="Buscar storyboard…" max-width="xs" />
        <UiSelect v-model="activePertenencia" variant="toolbar" prefix="Pertenencia" :options="pertenenciaOptions" />
      </div>
    </div>

    <!-- Storyboard Grid -->
    <div
      v-if="paginatedStoryboards.length > 0"
      class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      <!-- La tarjeta lleva el tono del área de su tipo (data-area): portada, símbolo y etiqueta -->
      <article
        v-for="sb in paginatedStoryboards"
        :key="sb.id"
        class="ui-panel flex flex-col overflow-hidden"
        v-bind="uiAreaAttrs(sb.area)"
      >
        <!-- Cover -->
        <div class="ui-cover relative flex h-36 items-center justify-center">
          <UiSymbol icon="book" class="bg-surface" />
          <!-- Pertenencia: público o personalizado de la organización -->
          <UiBadge :tone="TONO_PERTENENCIA[sb.pertenencia]" class="absolute right-3 top-3 bg-surface">
            {{ sb.pertenencia }}
          </UiBadge>
          <!-- Scenes count -->
          <UiBadge tone="neutral" class="absolute bottom-3 left-3 bg-surface">
            {{ sb.scenesCount }} escenas
          </UiBadge>
        </div>

        <!-- Body -->
        <div class="flex-1 p-6">
          <h3 class="ui-title mb-2">{{ sb.title }}</h3>
          <p class="ui-text mb-5 line-clamp-2">{{ sb.description }}</p>
          <div class="flex items-center gap-3 text-caption font-semibold text-muted">
            <div class="flex items-center gap-1">
              <UiIcon name="user" class="size-3.5" />
              {{ sb.targetAge }}
            </div>
            <div class="flex items-center gap-1">
              <UiIcon name="clock" class="size-3.5" />
              {{ sb.duration }}
            </div>
            <span class="badge ml-auto" v-bind="uiAreaAttrs(sb.area)">{{ sb.category }}</span>
          </div>
        </div>

        <!-- Footer: dos acciones, mitad y mitad. Neutras: en una rejilla, un lima por tarjeta
             sería el lima repetido que el kit evita -->
        <div class="ui-panel-footer flex items-center gap-2">
          <UiButton variant="outline" class="flex-1" @click="navigateTo(`/dashboard/storyboards/${sb.id}`)">
            Ver Detalle
          </UiButton>
          <UiButton variant="outline" icon="calendar" class="flex-1" @click="navigateTo(`/dashboard/workshops/new?storyboard=${sb.id}`)">
            Usar en Taller
          </UiButton>
        </div>
      </article>
    </div>

    <!-- Empty state -->
    <div v-else class="ui-panel">
      <UiEmptyState
        icon="search"
        title="Sin resultados"
        text="No se encontraron storyboards con los filtros seleccionados. Intenta cambiar la categoría o el término de búsqueda."
      >
        <UiButton variant="outline" size="sm" @click="resetFilters">
          Limpiar filtros
        </UiButton>
      </UiEmptyState>
    </div>

    <!-- Pagination -->
    <div v-if="paginatedStoryboards.length > 0" class="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p class="ui-caption">
        Página <span class="font-bold text-ink">{{ currentPage }}</span> de <span class="font-bold text-ink">{{ totalPages }}</span>
      </p>
      <div class="flex items-center gap-1.5">
        <UiButton variant="outline" size="sm" :disabled="currentPage === 1" @click="currentPage--">Anterior</UiButton>
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

// Pertenencia sin estado: público es el catálogo base (neutro); personalizado es un dato
// informativo, hecho para tu organización (cielo).
const TONO_PERTENENCIA = { 'Público': 'neutral', 'Personalizado': 'sky' } as const

// La categoría del storyboard (ALIMENTACION, ACTIVIDAD_FISICA…).
// El composable solo trae el nombre traducido, así que el área se reconoce por nombre (es/en);
// un tipo desconocido queda neutro.
// Área de cada tipo (nombre traducido → área), para el punto de color de los filtros.
const areaDeCategoria = computed(() => new Map(storyboards.value.map(sb => [sb.category, sb.area])))
function areaDe(categoria: string) {
  return areaDeCategoria.value.get(categoria)
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
