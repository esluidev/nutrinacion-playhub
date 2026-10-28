<template>
  <div>
    <!-- Los storyboards los registra Player desde su JSON: aquí no hay alta. -->
    <UiPageHeader :title="t('platform.sbs.title')" :description="t('platform.sbs.desc')" />

    <div class="mb-6 flex flex-wrap items-center gap-2.5">
      <UiSearchInput v-model="q" :placeholder="t('platform.sbs.searchPh')" max-width="xs" />
      <UiSelect v-model="estadoFiltro" variant="toolbar" :prefix="t('platform.sbs.colState')" :options="estadoOpciones" />
      <UiSelect v-model="tipoFiltro" variant="toolbar" :prefix="t('platform.sbs.colType')" :options="tipoOpciones" />
      <UiSelect v-model="idiomaFiltro" variant="toolbar" :prefix="t('platform.sbs.colLanguage')" :options="idiomaOpciones" />
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
          <!-- La portada lleva el tono del área del storyboard (alimentación en sol, actividad física en cielo…). -->
          <span class="ui-symbol ui-symbol-md text-body font-black text-(--tone-strong)" v-bind="tinte(row)" aria-hidden="true">
            {{ loc(row.titulo).charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="truncate font-extrabold text-ink">{{ loc(row.titulo) }}</p>
            <p class="truncate font-mono text-caption text-muted">{{ row.slug }}</p>
          </div>
        </div>
      </template>
      <template #cell-tipo="{ row }">
        <span class="text-body font-semibold text-muted">{{ t('catalogo.categoria.' + row.categoria) }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="uiPublicationTone(row.estado_publicacion)" dot>{{ t('sbState.' + row.estado_publicacion) }}</UiBadge>
      </template>
      <template #cell-propiedad="{ row }">
        <UiBadge v-if="row.organizaciones" :tone="uiToneFor(row.organizaciones.nombre)">{{ row.organizaciones.nombre }}</UiBadge>
        <span v-else class="text-body font-semibold text-muted">{{ t('platform.sbs.standard') }}</span>
      </template>
      <template #cell-contenido="{ row }">
        <span class="text-body font-semibold text-muted">
          {{ tCount(t, 'platform.sbs.scenesCount', row.numero_escenas) }}
          <span class="text-subtle"> · </span>
          <span class="uppercase">{{ (row.idiomas ?? []).join('·') }}</span>
        </span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1.5">
          <UiButton
            tone="neutral"
            size="sm"
            icon="pencil"
            icon-only
            :label="t('common.edit')"
            :title="t('common.edit')"
            @click.stop="navigateTo(`/platform/storyboards/${row.id}/editar`)"
          />
          <UiButton
            tone="neutral"
            size="sm"
            icon="trash"
            icon-only
            :label="t('common.delete')"
            :title="t('common.delete')"
            @click.stop="pedirEliminar(row)"
          />
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
import { PAGE_SIZE } from '~/utils/paginacion'
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
const idiomaFiltro = ref('todos')

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
  { value: 'REGISTRADO', label: t('sbState.REGISTRADO') },
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

const idiomaOpciones = computed(() => [
  { value: 'todos', label: t('common.all') },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
])

const hayFiltros = computed(() => !!q.value || estadoFiltro.value !== 'todos' || tipoFiltro.value !== 'todos' || idiomaFiltro.value !== 'todos')


// El área educativa del storyboard (ALIMENTACION → alimentacion): `data-area` la tiñe; sin área, neutro.
function tinte(sb: StoryboardFila): Record<string, string> {
  return uiAreaAttrs(uiAreaOf(sb.categoria))
}

async function cargar() {
  loading.value = true
  const { data, total: n } = await listStoryboards({
    q: q.value,
    estado: estadoFiltro.value,
    categoria: tipoFiltro.value,
    idioma: idiomaFiltro.value,
    page: page.value,
  })
  storyboards.value = data
  total.value = n
  loading.value = false
}

// Cambiar un filtro vuelve a la página 1: quedarse en la 3 de un resultado de 2 filas
// muestra una tabla vacía sin explicación.
watch([q, estadoFiltro, tipoFiltro, idiomaFiltro], () => {
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
