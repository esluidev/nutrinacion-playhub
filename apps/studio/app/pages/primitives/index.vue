<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-display font-bold text-brand-dark">Primitivas</h2>
      <p class="text-sm text-gray-500 mt-1">Componentes de juego del design system StoryPlay. Las portadas tienen playground para probarlas.</p>
    </div>

    <!-- Métricas útiles: qué consume realmente el contenido -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div class="card p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-primary-50 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-brand-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 1.48Z" /></svg>
        </div>
        <div class="min-w-0">
          <p class="text-lg font-display font-bold text-brand-dark leading-tight truncate">{{ topUsage?.name ?? '—' }}</p>
          <p class="text-xs text-gray-500">Más usada · {{ topUsage?.scenes ?? 0 }} escenas</p>
        </div>
      </div>

      <div class="card p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-secondary-50 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-brand-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </div>
        <div class="min-w-0">
          <p class="text-lg font-display font-bold text-brand-dark leading-tight">{{ usedCount }} en uso</p>
          <p class="text-xs text-gray-500">Consumidas por escenas del contenido</p>
        </div>
      </div>

      <div class="card p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </div>
        <div class="min-w-0">
          <p class="text-lg font-display font-bold text-brand-dark leading-tight">{{ unusedCount }} sin uso</p>
          <p class="text-xs text-gray-500 truncate" :title="unusedNames.join(', ')">{{ unusedNames.slice(0, 3).join(', ') || 'Todo el catálogo se usa' }}</p>
        </div>
      </div>

      <NuxtLink to="/sprites" class="card card-interactive p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-purple-50 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-brand-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0 0 21.75 19.5V4.5A1.5 1.5 0 0 0 20.25 3H3.75A1.5 1.5 0 0 0 2.25 4.5v15A1.5 1.5 0 0 0 3.75 21Z" /></svg>
        </div>
        <div class="min-w-0">
          <p class="text-lg font-display font-bold text-brand-dark leading-tight">{{ spritesCount }} sprites</p>
          <p class="text-xs text-brand-purple-600 font-semibold">Ver galería →</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Toolbar: search left, filter dropdowns right -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <UiSearchInput v-model="search" placeholder="Buscar primitiva..." max-width="xs" />
      <div class="flex items-center gap-2 sm:ml-auto">
        <UiSelect v-model="statusFilter" :options="statusOptions" />
        <UiSelect v-model="categoryFilter" :options="categoryOptions" />
      </div>
    </div>

    <!-- Groups -->
    <div v-for="group in visibleGroups" :key="group.category" class="mb-8">
      <h3 class="section-title mb-3">{{ group.label }}</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <component
          :is="p.status === 'portada' ? NuxtLink : 'div'"
          v-for="p in group.primitives"
          :key="p.slug"
          :to="p.status === 'portada' ? `/primitives/${p.slug}` : undefined"
          :class="[
            'card overflow-hidden flex flex-col',
            p.status === 'portada' ? 'card-interactive' : 'border-dashed bg-gray-50/40',
          ]"
        >
          <!-- Preview VIVA sobre el canvas StoryPlay -->
          <div class="relative h-44 shrink-0" style="background: #f5f0e8">
            <PrimitivePreview v-if="p.status === 'portada'" :slug="p.slug" />
            <div v-else class="absolute inset-0 flex items-center justify-center">
              <PrimitiveIcon :name="p.slug" class="w-10 h-10 text-gray-300" />
            </div>
            <UiBadge class="absolute top-3 right-3" :variant="p.status === 'portada' ? 'green' : 'gray'" dot>
              {{ p.status === 'portada' ? 'Portada' : 'Pendiente' }}
            </UiBadge>
          </div>

          <div class="p-4 flex flex-col flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h4 class="font-display font-semibold text-brand-dark leading-tight truncate">{{ p.label }}</h4>
                <p class="text-[11px] text-gray-400 font-mono mt-0.5 truncate">{{ p.name }} · {{ p.cssClass }}</p>
              </div>
              <span
                v-if="usageFor(p.name).scenes"
                class="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary-50 text-brand-primary-600"
                :title="`Usada por ${usageFor(p.name).scenes} escenas en ${usageFor(p.name).storyboards} storyboards`"
              >
                {{ usageFor(p.name).scenes }} escenas
              </span>
              <span v-else class="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                sin uso
              </span>
            </div>

            <p class="text-sm text-gray-500 line-clamp-2 mt-2 flex-1">{{ p.description }}</p>

            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span class="text-xs text-gray-400">{{ categoryLabel(p.category) }}</span>
              <span v-if="p.status === 'portada'" class="inline-flex items-center gap-1 text-xs font-semibold text-brand-purple-600">
                Abrir playground
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </span>
              <span v-else class="text-xs text-gray-400 italic">Se portara en una proxima tarea</span>
            </div>
          </div>
        </component>
      </div>
    </div>

    <!-- Empty state -->
    <UiCard v-if="!visibleGroups.length" class="text-center py-12" :hover="false">
      <p class="text-gray-400 text-sm">No hay primitivas que coincidan con los filtros.</p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import {
  PRIMITIVE_CATEGORY_LABELS,
  type PrimitiveCategory,
} from '~/composables/usePrimitivesCatalog'

const { catalog, groupedByCategory } = usePrimitivesCatalog()
const { usageFor, topUsage, spritesCount } = usePrimitivesUsage()

const search = ref('')
const statusFilter = ref('todas')
const categoryFilter = ref('todas')

// Sin conteos en los labels: los números útiles viven en las tarjetas de métricas
const statusOptions = [
  { value: 'todas', label: 'Todos los estados' },
  { value: 'portada', label: 'Portadas' },
  { value: 'pendiente', label: 'Pendientes' },
]

const categoryOptions = computed(() => {
  const categories: PrimitiveCategory[] = ['interactions', 'manipulation', 'measurement']
  return [
    { value: 'todas', label: 'Todas las categorias' },
    ...categories.map(c => ({ value: c, label: PRIMITIVE_CATEGORY_LABELS[c] })),
  ]
})

const usedCount = computed(() => catalog.value.filter(p => usageFor(p.name).scenes > 0).length)
const unusedNames = computed(() => catalog.value.filter(p => usageFor(p.name).scenes === 0).map(p => p.label))
const unusedCount = computed(() => unusedNames.value.length)

const visibleGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  return groupedByCategory.value
    .filter(g => categoryFilter.value === 'todas' || g.category === categoryFilter.value)
    .map(g => ({
      ...g,
      primitives: g.primitives.filter((p) => {
        if (statusFilter.value !== 'todas' && p.status !== statusFilter.value) return false
        if (!q) return true
        return (
          p.label.toLowerCase().includes(q)
          || p.name.toLowerCase().includes(q)
          || p.description.toLowerCase().includes(q)
        )
      }),
    }))
    .filter(g => g.primitives.length > 0)
})

function categoryLabel(category: PrimitiveCategory) {
  return PRIMITIVE_CATEGORY_LABELS[category]
}
</script>
