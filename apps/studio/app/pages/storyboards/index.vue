<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-display font-bold text-brand-dark">Storyboards</h2>
      <p class="text-sm text-gray-500 mt-1">
        Talleres compilados con sus escenas. El registro y la publicación se administran en admin.
      </p>
    </div>

    <!-- No se puede leer el catálogo: hay que decirlo, no mostrar todo como "sin registrar". -->
    <div v-if="registro.error.value" class="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
      <p class="text-sm text-red-800">
        <span class="font-semibold">{{ registro.error.value }}</span>
        No se puede mostrar el estado de registro.
      </p>
    </div>

    <!-- Toolbar: búsqueda a la izquierda, filtros a la derecha -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <UiSearchInput v-model="search" placeholder="Buscar storyboard..." max-width="xs" />
      <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
        <UiSelect v-model="filtroRegistro" :options="opcionesRegistro" />
        <UiSelect v-model="filtroTipo" :options="opcionesTipo" />
      </div>
    </div>

    <!-- Grid -->
    <div v-if="filtered.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <UiCard v-for="sb in filtered" :key="sb.id" :padding="false" class="flex flex-col overflow-hidden">
        <div :class="['h-2 shrink-0', sb.coverColor]" />

        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <UiBadge variant="gray">{{ tipoLabel(sb.tipo) }}</UiBadge>

            <!-- Estado REAL, leído de Supabase por `clave`. Sin fila no hay estado de
                 publicación que mostrar: está compilado pero nadie lo dio de alta. -->
            <UiBadge v-if="estadoDe(sb).estado === 'sin_registrar'" variant="gray" dot>Sin registrar</UiBadge>
            <UiBadge v-else :variant="varianteBadgePublicacion(filaDe(sb.clave)?.estado)" dot>
              {{ etiquetaPublicacion(filaDe(sb.clave)?.estado) }}
            </UiBadge>
            <UiBadge v-if="estadoDe(sb).estado === 'desactualizado'" variant="coral">Desactualizado</UiBadge>
          </div>

          <h3 class="font-display font-semibold text-brand-dark leading-snug">{{ sb.title }}</h3>
          <p v-if="descripcionDe(sb)" class="text-sm text-gray-500 mt-1.5 line-clamp-2">{{ descripcionDe(sb) }}</p>
          <p v-else class="text-sm text-gray-300 mt-1.5">Sin descripción — se escribe en admin.</p>

          <div class="flex items-center gap-4 text-xs text-gray-400 mt-4">
            <span class="inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 7.5h16.5M3.75 12h16.5m-16.5 4.5h16.5" />
              </svg>
              {{ sb.sceneCount }} escenas
            </span>
            <span>{{ audienceLabel(sb.audience) }}</span>
            <span v-if="filaDe(sb.clave)?.duracion_min">{{ filaDe(sb.clave)?.duracion_min }} min</span>
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

    <UiCard v-else class="text-center py-12">
      <p class="text-gray-400 text-sm">No hay storyboards que coincidan con la busqueda.</p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { etiquetaPublicacion, varianteBadgePublicacion } from '~/utils/registroEstado'
import type { EstadoRegistro } from '~/utils/registroEstado'
import type { StoryboardBuild, TipoStoryboard } from '~/types/storyboard'
import { tr } from '~/types/i18n'

const { storyboards, tipoLabel, audienceLabel } = useStoryboards()
const { metadataDe } = useStoryboardMetadata()

// Una sola consulta al catálogo, compartida con el detalle.
const registro = useRegistroRemoto()
const { filaDe } = registro
onMounted(() => registro.cargar())

function estadoDe(sb: StoryboardBuild) {
  const meta = metadataDe(sb.id)
  return meta ? registro.estadoDe(meta) : { estado: 'sin_registrar' as EstadoRegistro, diferencias: [] }
}

// La descripción es editorial: vive en la base, no en el build.
function descripcionDe(sb: StoryboardBuild): string {
  const desc = filaDe(sb.clave)?.descripcion
  return desc ? tr(desc, 'es') : ''
}

const search = ref('')
const filtroRegistro = ref('todos')
const filtroTipo = ref('todos')

const opcionesRegistro = computed(() => {
  const todos = storyboards.value
  const cuenta = (e: EstadoRegistro) => todos.filter(sb => estadoDe(sb).estado === e).length
  return [
    { value: 'todos', label: 'Todo el registro', count: todos.length },
    { value: 'sin_registrar', label: 'Sin registrar', count: cuenta('sin_registrar') },
    { value: 'al_dia', label: 'Registrado', count: cuenta('al_dia') },
    { value: 'desactualizado', label: 'Desactualizado', count: cuenta('desactualizado') },
  ]
})

const opcionesTipo = computed(() => {
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

const filtered = computed(() => {
  let list = storyboards.value
  if (filtroRegistro.value !== 'todos') {
    list = list.filter(sb => estadoDe(sb).estado === filtroRegistro.value)
  }
  if (filtroTipo.value !== 'todos') {
    list = list.filter(sb => sb.tipo === filtroTipo.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(sb =>
      sb.title.toLowerCase().includes(q) || descripcionDe(sb).toLowerCase().includes(q))
  }
  return list
})

function playUrl(sb: StoryboardBuild) {
  return `/play/${sb.tipo}/${sb.id}?lang=es`
}
</script>
