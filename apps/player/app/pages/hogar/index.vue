<template>
  <!-- La app del hogar (tarea 022): lo que ven las familias. Arriba, las unidades de estudio (recorridos
       opcionales, en el orden de la app); abajo, todos los storyboards del hogar, que salen también
       sueltos. Un storyboard entra al hogar desde su Publicación; aquí solo se ve y se agrupa. -->
  <div class="space-y-6">
    <UiAlert v-if="errorCatalogo || errorUnidades" tone="danger">
      <p>{{ errorCatalogo || errorUnidades }}</p>
      <UiButton tone="neutral" size="sm" icon="retry" class="mt-3" @click="leer">Volver a leer</UiButton>
    </UiAlert>

    <UiCard :padding="false">
      <template #header>
        <div class="min-w-0">
          <h2 class="ui-title">Unidades de estudio <span class="text-body font-bold text-subtle">· {{ unidades.length }}</span></h2>
          <p class="ui-caption">Recorridos con storyboards del hogar, de cualquier categoría. Son opcionales: cada storyboard sale también suelto.</p>
        </div>
        <UiButton icon="plus" to="/hogar/unidades/nueva">Nueva Unidad</UiButton>
      </template>
      <UiEmptyState v-if="!unidades.length" icon="layers" title="Todavía no hay unidades" text="Crea una para agrupar storyboards del hogar en un recorrido, como «Ganando músculos»." />
      <ul v-else class="divide-y divide-line">
        <li v-for="(u, i) in unidades" :key="u.id" class="flex items-center gap-3 px-6 py-3">
          <div class="flex shrink-0 flex-col gap-1">
            <UiButton tone="neutral" size="sm" icon="chevron-up" icon-only :label="`Subir ${textoLocal(u.titulo)}`" :disabled="i === 0" @click="mover(u.id, -1)" />
            <UiButton tone="neutral" size="sm" icon="chevron-down" icon-only :label="`Bajar ${textoLocal(u.titulo)}`" :disabled="i === unidades.length - 1" @click="mover(u.id, 1)" />
          </div>
          <NuxtLink :to="`/hogar/unidades/${u.id}`" class="min-w-0 flex-1 rounded-control-sm px-2 py-1 transition-colors hover:bg-canvas">
            <p class="truncate text-body font-extrabold text-ink">{{ textoLocal(u.titulo) || 'Sin título' }}</p>
            <p class="ui-caption truncate">{{ [cuantos(u.storyboards.length), textoLocal(u.descripcion)].filter(Boolean).join(' · ') }}</p>
          </NuxtLink>
          <UiBadge :tone="u.publicada ? 'lime' : 'neutral'" dot class="shrink-0">{{ u.publicada ? 'Publicada' : 'Borrador' }}</UiBadge>
        </li>
      </ul>
    </UiCard>

    <UiCard :padding="false">
      <template #header>
        <div class="min-w-0">
          <h2 class="ui-title">Storyboards en el hogar <span class="text-body font-bold text-subtle">· {{ delHogar.length }}</span></h2>
          <p class="ui-caption">Cada uno entra desde su Publicación («También en la app del hogar»). Las familias ven los de su país, según la edad de cada perfil.</p>
        </div>
      </template>
      <UiEmptyState
        v-if="!delHogar.length"
        icon="home"
        title="Todavía no hay storyboards en el hogar"
        text="En el detalle de un storyboard publicado y estándar, marca «También en la app del hogar»."
      >
        <UiButton variant="outline" icon="book" to="/storyboards">Ir a Storyboards</UiButton>
      </UiEmptyState>
      <UiDataTable
        v-else
        :columns="columnas"
        :rows="filas"
        :row-key="(r) => r.id"
        :page-size="0"
        clickable
        @row-click="(r) => navigateTo(`/storyboards/${r.eje}/${r.slug}`)"
      >
        <template #cell-storyboard="{ row }">
          <p class="truncate font-extrabold text-ink">{{ row.titulo }}</p>
          <p class="truncate font-mono text-caption text-muted">{{ row.eje }}/{{ row.slug }}</p>
        </template>
        <template #cell-categoria="{ row }">
          <span class="badge" :data-area="row.eje">{{ TIPO_LABELS[row.eje as TipoStoryboard] ?? row.eje }}</span>
        </template>
        <template #cell-edicion="{ row }">
          <span class="text-body font-semibold text-muted">{{ audienceLabel(row.edicion) }}</span>
        </template>
        <template #cell-paises="{ row }">
          <PaisesStoryboard :paises="row.paises" />
        </template>
        <template #cell-unidades="{ row }">
          <span v-if="row.unidades.length" class="text-body font-semibold text-ink" :title="row.unidades.join(' · ')">{{ row.unidades.length }}</span>
          <span v-else class="ui-caption">Suelto</span>
        </template>
      </UiDataTable>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { TIPO_LABELS } from '~/composables/useStoryboards'
import type { TipoStoryboard } from '~/types/storyboard'
import { textoLocal } from '~/utils/unidadesEstudio'

const { delHogar, cargar: cargarCatalogo, error: errorCatalogo } = useCatalogoBase()
const { unidades, cargar: cargarUnidades, error: errorUnidades, moverUnidad } = useUnidadesEstudio()
const { audienceLabel } = useStoryboards()
const { toast } = useToast()

const leer = () => Promise.all([cargarCatalogo(), cargarUnidades()])
onMounted(leer)

const cuantos = (n: number) => (n === 1 ? '1 storyboard' : `${n} storyboards`)

async function mover(id: number, delta: -1 | 1) {
  const error = await moverUnidad(id, delta)
  if (error) toast.error(error)
}

const columnas = [
  { key: 'storyboard', label: 'Storyboard', grow: true, width: 'w-64' },
  { key: 'categoria', label: 'Categoría', width: 'w-36' },
  { key: 'edicion', label: 'Edición', width: 'w-40' },
  { key: 'paises', label: 'Países', width: 'w-36' },
  { key: 'unidades', label: 'Unidades', width: 'w-28' },
]

// En cuántas unidades está cada uno (con sus títulos, al pasar el puntero); sin ninguna, va suelto.
const filas = computed(() => delHogar.value.map(f => ({
  id: f.id,
  slug: f.slug,
  eje: f.categoria.toLowerCase().replace(/_/g, '-'),
  titulo: textoLocal(f.titulo) || f.slug,
  edicion: f.edicion,
  paises: f.paises_disponibles,
  unidades: unidades.value.filter(u => u.storyboards.includes(f.id)).map(u => textoLocal(u.titulo)),
})))
</script>
