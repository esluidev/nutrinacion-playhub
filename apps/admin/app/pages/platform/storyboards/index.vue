<template>
  <div>
    <UiPageHeader :title="t('platform.sbs.title')" :description="t('platform.sbs.desc')">
      <template #actions>
        <UiButton @click="navigateTo('/platform/storyboards/nuevo')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {{ t('platform.sbs.new') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="flex items-center gap-2.5 mb-[22px] flex-wrap">
      <UiSearchInput v-model="q" :placeholder="t('platform.sbs.searchPh')" max-width="xs" class="!w-[280px]" />
      <UiSelect v-model="estadoFiltro" variant="toolbar" :prefix="t('platform.sbs.colState')" :options="estadoOpciones" />
      <UiSelect v-model="tipoFiltro" variant="toolbar" :prefix="t('platform.sbs.colType')" :options="tipoOpciones" />
    </div>

    <UiDataTable
      :columns="columns"
      :rows="storyboards"
      :row-key="(s) => s.id"
      :loading="loading"
      :page="page"
      :total="total"
      :page-size="PAGE_SIZE"
      :empty-text="hayFiltros ? t('platform.sbs.emptyFiltered') : t('platform.sbs.empty')"
      clickable
      @row-click="(s) => navigateTo(`/platform/storyboards/${s.id}`)"
      @update:page="page = $event"
    >
      <template #cell-storyboard="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
            {{ loc(row.titulo).charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="font-extrabold text-gray-800 truncate">{{ loc(row.titulo) }}</p>
            <p class="text-[12.5px] text-gray-400 font-mono truncate">{{ row.slug }}</p>
          </div>
        </div>
      </template>
      <template #cell-tipo="{ row }">
        <span class="text-[13px] text-gray-600 font-semibold">{{ loc(row.tipo?.nombre) || '—' }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :variant="estadoVariant(row.estado)" dot>{{ t('sbState.' + row.estado) }}</UiBadge>
      </template>
      <template #cell-propiedad="{ row }">
        <UiBadge v-if="row.organizaciones" variant="purple">{{ row.organizaciones.nombre }}</UiBadge>
        <span v-else class="text-[13px] text-gray-500 font-semibold">{{ t('platform.sbs.standard') }}</span>
      </template>
      <template #cell-contenido="{ row }">
        <span class="text-[13px] text-gray-600 font-semibold">
          {{ tCount(t, 'platform.sbs.scenesCount', row.numero_escenas) }}
          <span class="text-gray-300"> · </span>
          <span class="uppercase">{{ (row.idiomas ?? []).join('·') }}</span>
        </span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            :title="t('common.edit')"
            @click.stop="navigateTo(`/platform/storyboards/${row.id}/editar`)"
          >
            <UiIcon name="edit" class="w-[15px] h-[15px]" />
          </button>
          <button
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            :title="t('common.delete')"
            @click.stop="pedirEliminar(row)"
          >
            <UiIcon name="delete" class="w-[15px] h-[15px]" />
          </button>
        </div>
      </template>
    </UiDataTable>

    <!-- La base frena el borrado si el storyboard ya se usó en un taller
         (`talleres.storyboard_id` es ON DELETE RESTRICT). -->
    <UiConfirmDialog
      :open="!!borrando"
      :title="t('platform.sbs.deleteTitle')"
      :confirm-label="t('platform.sbs.deleteConfirm')"
      :loading="eliminando"
      @update:open="(v) => { if (!v) borrando = null }"
      @confirm="confirmarEliminar"
    >
      <p>{{ t('platform.sbs.deleteWarn', { nombre: borrando ? loc(borrando.titulo) : '' }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { StoryboardFila } from '~/composables/usePlatformStoryboards'
import { PAGE_SIZE } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.title', descKey: 'platform.sbs.desc' })

const { t, locale } = useT()
const { listStoryboards, eliminar } = usePlatformStoryboards()
const { toast } = useToast()

const storyboards = ref<StoryboardFila[]>([])
const total = ref(0)
const loading = ref(true)
const page = ref(1)
const q = ref('')
const estadoFiltro = ref('todos')
const tipoFiltro = ref('todos')

function loc(valor: Localized | null | undefined): string {
  if (!valor) return ''
  return valor[locale.value] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

const columns = computed(() => [
  { key: 'storyboard', label: t('platform.sbs.colStoryboard') },
  { key: 'tipo', label: t('platform.sbs.colType') },
  { key: 'estado', label: t('platform.sbs.colState') },
  { key: 'propiedad', label: t('platform.sbs.colOwnership') },
  { key: 'contenido', label: t('platform.sbs.colContent') },
  { key: 'acciones', label: '', align: 'right' as const },
])

const estadoOpciones = computed(() => [
  { value: 'todos', label: t('common.all') },
  { value: 'BORRADOR', label: t('sbState.BORRADOR') },
  { value: 'EN_REVISION', label: t('sbState.EN_REVISION') },
  { value: 'PUBLICADO', label: t('sbState.PUBLICADO') },
  { value: 'ARCHIVADO', label: t('sbState.ARCHIVADO') },
])

const tipoOpciones = computed(() => [
  { value: 'todos', label: t('common.all') },
  { value: 'ALIMENTACION', label: t('sbType.ALIMENTACION') },
  { value: 'ACTIVIDAD_FISICA', label: t('sbType.ACTIVIDAD_FISICA') },
  { value: 'CUIDADO_PERSONAL', label: t('sbType.CUIDADO_PERSONAL') },
  { value: 'SALUD_EMOCIONAL', label: t('sbType.SALUD_EMOCIONAL') },
])

const hayFiltros = computed(() => !!q.value || estadoFiltro.value !== 'todos' || tipoFiltro.value !== 'todos')

function estadoVariant(estado: string) {
  switch (estado) {
    case 'PUBLICADO': return 'green' as const
    case 'EN_REVISION': return 'amber' as const
    case 'ARCHIVADO': return 'coral' as const
    default: return 'gray' as const
  }
}

async function cargar() {
  loading.value = true
  const { data, total: n } = await listStoryboards({
    q: q.value,
    estado: estadoFiltro.value,
    tipo: tipoFiltro.value,
    page: page.value,
  })
  storyboards.value = data
  total.value = n
  loading.value = false
}

// Cambiar un filtro vuelve a la página 1: quedarse en la 3 de un resultado de 2 filas
// muestra una tabla vacía sin explicación.
watch([q, estadoFiltro, tipoFiltro], () => {
  if (page.value !== 1) page.value = 1
  else cargar()
})
watch(page, cargar)
onMounted(cargar)

const borrando = ref<StoryboardFila | null>(null)
const eliminando = ref(false)

function pedirEliminar(row: StoryboardFila) {
  borrando.value = row
}

async function confirmarEliminar() {
  if (!borrando.value) return
  eliminando.value = true
  const { error } = await eliminar(borrando.value.id)
  eliminando.value = false
  if (error) {
    // El caso típico: ya hay talleres usándolo y la FK lo impide.
    toast.error(t('platform.sbs.deleteBlocked'))
    return
  }
  toast.success(t('platform.sbs.deleted'))
  borrando.value = null
  await cargar()
}
</script>
