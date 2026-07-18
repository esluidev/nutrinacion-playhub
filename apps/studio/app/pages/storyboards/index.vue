<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-display font-bold text-brand-dark">Storyboards</h2>
      <p class="text-sm text-gray-500 mt-1">Talleres completos con sus escenas (juegos). Los juegos se crean con Claude Code y se gestionan aqui.</p>
    </div>

    <!-- Toolbar: search left, filter dropdowns right -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <UiSearchInput v-model="search" placeholder="Buscar storyboard..." max-width="xs" />
      <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
        <UiSelect v-model="activeStatus" :options="statusOptions" />
        <UiSelect v-model="activePillar" :options="pillarOptions" />
        <UiSelect v-model="activePropiedad" :options="propiedadOptions" />
      </div>
    </div>

    <!-- Grid -->
    <div v-if="filtered.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <UiCard v-for="sb in filtered" :key="sb.id" :padding="false" class="flex flex-col overflow-hidden">
        <!-- Cover band -->
        <div :class="['h-2 shrink-0', sb.coverColor]" />

        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <UiBadge variant="gray">{{ tipoLabel(sb.tipo) }}</UiBadge>
            <UiBadge :variant="statusBadgeVariant(sb.status)" dot>{{ statusLabel(sb.status) }}</UiBadge>
            <UiBadge :variant="propiedadBadgeVariant(sb.propiedad)">{{ propiedadLabel(sb.propiedad) }}</UiBadge>
          </div>

          <h3 class="font-display font-semibold text-brand-dark leading-snug">{{ sb.title }}</h3>
          <p class="text-sm text-gray-500 mt-1.5 line-clamp-2">{{ sb.description }}</p>

          <div class="flex items-center gap-4 text-xs text-gray-400 mt-4">
            <span class="inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 7.5h16.5M3.75 12h16.5m-16.5 4.5h16.5" />
              </svg>
              {{ sb.sceneCount }} escenas
            </span>
            <span>{{ audienceLabel(sb.audience) }}</span>
            <span>{{ sb.duration }}</span>
            <span class="uppercase">{{ sb.languages.join(' · ') }}</span>
          </div>

          <div class="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
            <UiButton variant="outline" size="sm" class="flex-1" @click="navigateTo(`/storyboards/${sb.tipo}/${sb.id}`)">
              Ver Detalle
            </UiButton>
            <NuxtLink :to="playUrl(sb)" class="btn btn-primary btn-sm flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 3 20 12 6 21V3z" />
              </svg>
              Probar
            </NuxtLink>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Empty state -->
    <UiCard v-else class="text-center py-12">
      <p class="text-gray-400 text-sm">No hay storyboards que coincidan con la busqueda.</p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import type { Storyboard, PublicationStatus, Propiedad, TipoStoryboard } from '~/types/storyboard'

const {
  storyboards,
  statusLabel,
  statusBadgeVariant,
  propiedadLabel,
  propiedadBadgeVariant,
  tipoLabel,
  audienceLabel,
} = useStoryboards()

const search = ref('')
const activeStatus = ref('todos')
const activePillar = ref('todos')
const activePropiedad = ref('todos')

const statusOptions = computed(() => {
  const all = storyboards.value
  const count = (status: PublicationStatus) => all.filter(sb => sb.status === status).length
  return [
    { value: 'todos', label: 'Todos los estados', count: all.length },
    { value: 'borrador', label: 'Borrador', count: count('borrador') },
    { value: 'en_revision', label: 'En Revision', count: count('en_revision') },
    { value: 'publicado', label: 'Publicado', count: count('publicado') },
    { value: 'archivado', label: 'Archivado', count: count('archivado') },
  ]
})

const pillarOptions = computed(() => {
  const tipos: TipoStoryboard[] = ['alimentacion', 'actividad-fisica', 'cuidado-personal', 'salud-emocional']
  return [
    { value: 'todos', label: 'Todos los tipos', count: storyboards.value.length },
    ...tipos.map(t => ({
      value: t,
      label: tipoLabel(t),
      count: storyboards.value.filter(sb => sb.tipo === t).length,
    })),
  ]
})

const propiedadOptions = computed(() => {
  const propiedades: Propiedad[] = ['estandar', 'personalizado']
  return [
    { value: 'todos', label: 'Toda la propiedad', count: storyboards.value.length },
    ...propiedades.map(p => ({
      value: p,
      label: propiedadLabel(p),
      count: storyboards.value.filter(sb => sb.propiedad === p).length,
    })),
  ]
})

const filtered = computed(() => {
  let list = storyboards.value
  if (activeStatus.value !== 'todos') {
    list = list.filter(sb => sb.status === activeStatus.value)
  }
  if (activePillar.value !== 'todos') {
    list = list.filter(sb => sb.tipo === activePillar.value)
  }
  if (activePropiedad.value !== 'todos') {
    list = list.filter(sb => sb.propiedad === activePropiedad.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(sb =>
      sb.title.toLowerCase().includes(q) || sb.description.toLowerCase().includes(q))
  }
  return list
})

function playUrl(sb: Storyboard) {
  return `/play/${sb.tipo}/${sb.id}?lang=es`
}
</script>
