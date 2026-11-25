<template>
  <!-- Elegir el storyboard de un taller nuevo (tarea 023). Funciona igual que elegir educadores: el diálogo ancho del kit,
       el filtro a la izquierda y el buscador a la derecha (como en Storyboards), tarjetas compactas en 3 columnas que se
       marcan en cielo (la portada en pequeño con el tono de su área, el título, la edad y la duración, la categoría y las
       escenas), de 9 en 9 con la paginación del kit, y abajo «Cancelar» y «Elegir Storyboard»: nada cambia en el taller
       hasta confirmar. Con cientos, se busca (sin acentos ni mayúsculas), se filtra y se pasa de página. -->
  <UiDialog :open="open" :title="t('wizard.pickStoryboard')" size="xl" @update:open="(v) => emit('update:open', v)">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UiSelect v-model="categoria" variant="toolbar" :prefix="t('wizard.category')" :options="categorias" />
      <div class="flex min-w-0 grow basis-72 justify-end">
        <UiSearchInput v-model="busqueda" :placeholder="t('wizard.searchSb')" max-width="xs" class="min-w-0 flex-1" />
      </div>
    </div>
    <div v-if="filtrados.length" class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="sb in pagina"
        :key="sb.id"
        type="button"
        data-tone="sky"
        class="select-card flex-row items-stretch justify-start gap-0 overflow-hidden p-0 text-left"
        :aria-pressed="elegidoId === sb.id"
        @click="elegidoId = sb.id"
      >
        <span class="selected-mark z-10"><UiIcon name="check" /></span>
        <span class="ui-cover flex w-16 shrink-0 items-center justify-center" v-bind="uiAreaAttrs(sb.area)">
          <UiSymbol icon="book" size="sm" class="bg-surface" />
        </span>
        <span class="min-w-0 flex-1 py-3 pl-3.5 pr-10">
          <span class="block truncate text-body font-extrabold text-ink">{{ sb.title }}</span>
          <span class="ui-caption mt-0.5 block truncate">{{ [sb.targetAge, sb.duration].join(' · ') }}</span>
          <span class="mt-2 flex min-w-0 items-center gap-2">
            <span class="badge shrink-0" v-bind="uiAreaAttrs(sb.area)">{{ sb.category }}</span>
            <span class="ui-caption truncate">{{ tCount(t, 'storyboards.scenes', sb.scenesCount) }}</span>
          </span>
        </span>
      </button>
    </div>
    <UiEmptyState v-else icon="search" :title="t('common.noResults')" :text="t('wizard.noResultsText')" />
    <UiPagination v-if="filtrados.length > POR_PAGINA" v-model:page="paginaActual" :total="filtrados.length" :page-size="POR_PAGINA" class="mt-5" />

    <!-- El pie, como el de una página: a la izquierda lo elegido; a la derecha, los botones del tamaño de su texto -->
    <template #actions>
      <p class="ui-caption mr-auto min-w-0 self-center truncate">{{ elegido ? t('wizard.chosenStoryboard', { titulo: elegido.title }) : t('wizard.noneChosen') }}</p>
      <UiButton tone="neutral" @click="emit('update:open', false)">{{ t('common.cancel') }}</UiButton>
      <UiButton icon="check" :disabled="!elegidoId" @click="confirmar">{{ t('wizard.confirmStoryboard') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { sinAcentos } from '@playhub/ui/app/utils/texto'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useT()
const { storyboards, getStoryboard } = useStoryboards()
const { state, selectStoryboard } = useWorkshopWizard()

// Lo marcado en el diálogo: pasa al taller solo al confirmar.
const elegidoId = ref<number | null>(null)
const elegido = computed(() => (elegidoId.value ? getStoryboard(elegidoId.value) : null))

const busqueda = ref('')
const categoria = ref('all')
const categorias = computed(() => [
  { value: 'all', label: t('common.all') },
  ...[...new Set(storyboards.value.map(sb => sb.category))].map(c => ({ value: c, label: c })),
])

// Por título, categoría o descripción, sin acentos ni mayúsculas.
const filtrados = computed(() => {
  const q = sinAcentos(busqueda.value.trim())
  return storyboards.value.filter(sb =>
    (!q || [sb.title, sb.category, sb.description].some(x => sinAcentos(x ?? '').includes(q)))
    && (categoria.value === 'all' || sb.category === categoria.value))
})

// De 9 en 9 (tres filas de tres): al buscar o filtrar, la primera.
const POR_PAGINA = 9
const paginaActual = ref(1)
const pagina = computed(() => filtrados.value.slice((paginaActual.value - 1) * POR_PAGINA, paginaActual.value * POR_PAGINA))
watch([busqueda, categoria], () => { paginaActual.value = 1 })

// Al abrirlo: lo que ya tiene el taller marcado y en su página, la búsqueda de cero.
watch(() => props.open, (abierto) => {
  if (!abierto) return
  busqueda.value = ''
  categoria.value = 'all'
  elegidoId.value = state.value.storyboardId
  const i = filtrados.value.findIndex(sb => sb.id === elegidoId.value)
  paginaActual.value = i >= 0 ? Math.floor(i / POR_PAGINA) + 1 : 1
})

function confirmar() {
  if (elegidoId.value) selectStoryboard(elegidoId.value)
  emit('update:open', false)
}
</script>
