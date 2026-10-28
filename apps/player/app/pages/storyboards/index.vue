<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <UiSearchInput v-model="search" placeholder="Buscar por título…" max-width="xs" />
      <UiSelect v-model="filtroTipo" variant="toolbar" prefix="Eje" :options="opcionesTipo" />
    </div>

    <div v-if="filtered.length" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="sb in filtered" :key="sb.id" class="ui-panel flex flex-col p-6">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <span class="badge" :data-area="sb.tipo">{{ tipoLabel(sb.tipo) }}</span>
          <span class="badge">{{ audienceLabel(sb.audience) }}</span>
          <UiBadge v-if="estadoDe(sb.id)" :tone="ESTADO_CATALOGO[estadoDe(sb.id)!.estado].tone" dot class="ml-auto">
            {{ ESTADO_CATALOGO[estadoDe(sb.id)!.estado].label }}
          </UiBadge>
          <UiBadge v-if="publicacionDe(sb.id)" :tone="uiPublicationTone(publicacionDe(sb.id)!.estado)">
            {{ ESTADO_PUBLICACION[publicacionDe(sb.id)!.estado].label }}
          </UiBadge>
        </div>
        <h2 class="ui-title">{{ sb.title }}</h2>
        <p class="ui-caption mt-3">
          {{ sb.sceneCount }} escenas · {{ sb.languages.join(' · ').toUpperCase() }}<template v-if="sb.estimatedDuration"> · {{ sb.estimatedDuration }} min</template>
        </p>
        <div class="mt-auto flex gap-2 pt-5">
          <UiButton :to="playUrl(sb)" icon="play" size="sm">Probar</UiButton>
          <UiButton :to="`/storyboards/${sb.tipo}/${sb.id}`" variant="outline" size="sm">Detalle</UiButton>
        </div>
      </article>
    </div>
    <div v-else class="ui-panel">
      <UiEmptyState
        icon="search"
        title="Nada que mostrar"
        :text="storyboards.length ? 'Ningún storyboard coincide con la búsqueda o los filtros.' : 'Todavía no hay storyboards en content/storyboards.'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Catálogo del build, con su estado en la base (sin registrar, desactualizado o al día) y su
// publicación. Se registra, actualiza y publica desde el detalle; la guía se escribe en Admin.
import { uiPublicationTone } from '@playhub/ui/app/utils/ui-tones'
import { ESTADO_CATALOGO, ESTADO_PUBLICACION } from '~/composables/useCatalogoBase'
import type { StoryboardBuild, TipoStoryboard } from '~/types/storyboard'

const { storyboards, tipoLabel, audienceLabel } = useStoryboards()
const { estadoDe, publicacionDe } = useCatalogoBase()

const search = ref('')
const filtroTipo = ref<string | number | null>('todos')

const opcionesTipo = computed(() => {
  const tipos: TipoStoryboard[] = ['alimentacion', 'actividad-fisica', 'cuidado-personal', 'salud-emocional']
  return [{ value: 'todos', label: 'Todos' }, ...tipos.map(t => ({ value: t, label: tipoLabel(t) }))]
})

const filtered = computed(() => {
  let list = storyboards.value
  if (filtroTipo.value !== 'todos') list = list.filter(sb => sb.tipo === filtroTipo.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(sb => sb.title.toLowerCase().includes(q))
  return list
})

const playUrl = (sb: StoryboardBuild) => `/play/${sb.tipo}/${sb.id}?mode=educator`
</script>
