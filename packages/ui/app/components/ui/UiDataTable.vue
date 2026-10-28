<template>
  <div>
    <!-- Barra integrada: búsqueda y filtros declarativos viven aquí, no en cada página. -->
    <div v-if="searchable || filtros.length || $slots.toolbar" class="mb-4 flex flex-wrap items-center gap-2.5">
      <UiSearchInput v-if="searchable" v-model="q" :placeholder="searchPlaceholder" max-width="xs" />
      <UiSelect
        v-for="f in filtros"
        :key="f.key"
        :model-value="filtroValores[f.key] ?? ''"
        variant="toolbar"
        :prefix="f.label"
        :options="opcionesDe(f)"
        @update:model-value="(v) => setFiltro(f.key, v)"
      />
      <slot name="toolbar" />
    </div>

    <div :class="!flat && 'ui-table-wrap'">
      <div class="overflow-x-auto">
        <table class="ui-table">
          <thead>
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                scope="col"
                :class="[anchoClass(col), alignClass(col.align), col.headerClass]"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="columns.length" class="ui-table-empty"><UiSpinner class="mx-auto" /></td>
            </tr>
            <tr v-else-if="!pageRows.length">
              <td :colspan="columns.length" class="ui-table-empty">
                {{ hayCriterios ? labels.emptyFiltered : (emptyText ?? labels.empty) }}
              </td>
            </tr>
            <tr
              v-for="(row, i) in pageRows"
              v-else
              :key="rowKey ? rowKey(row) : i"
              :data-clickable="clickable || undefined"
              @click="clickable && emit('row-click', row)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                :class="[anchoClass(col), alignClass(col.align), col.cellClass]"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pageSize && !loading && pageRows.length" class="ui-table-footer">
        <UiPagination :page="curPage" :total="totalCount" :page-size="pageSize" @update:page="onPage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  // Columna principal (más ancha). Si ninguna lo pide, es la primera.
  grow?: boolean
  // Ancho explícito como clase ('w-28', 'w-[20%]') cuando el reparto no basta.
  width?: string
  headerClass?: string
  cellClass?: string
}

// Filtro declarativo: el componente pinta el control («Rol: Todos») y aplica el criterio.
// Sin `match`, compara row[key] === value.
export interface DataTableFilter {
  key: string
  label: string
  options: { value: string | number, label: string }[]
  match?: (row: any, value: string | number) => boolean
}

const props = withDefaults(defineProps<{
  columns: DataTableColumn[]
  rows: any[]
  rowKey?: (row: any) => string | number
  loading?: boolean
  emptyText?: string
  clickable?: boolean
  flat?: boolean
  // Paginación integrada (20 por defecto). `:page-size="0"` la apaga.
  pageSize?: number
  // Búsqueda: en modo cliente filtra por `searchKeys`; en modo servidor solo emite.
  searchable?: boolean
  searchKeys?: string[]
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  // Modo servidor: `page` + `total` (rows ya es la página actual).
  page?: number
  total?: number
}>(), {
  pageSize: 20,
})

const emit = defineEmits<{
  'row-click': [row: any]
  'update:page': [page: number]
  'update:search': [q: string]
  'update:filters': [values: Record<string, string | number>]
}>()

const labels = useUiLabels()
const isServer = computed(() => props.total !== undefined)
const internalPage = ref(1)

const q = ref('')
const filtroValores = ref<Record<string, string | number>>({})
const filtros = computed(() => props.filters ?? [])

const hayCriterios = computed(() =>
  !!q.value.trim() || Object.values(filtroValores.value).some(v => v !== ''))

function opcionesDe(f: DataTableFilter) {
  return [{ value: '', label: labels.value.all }, ...f.options]
}

function setFiltro(key: string, v: string | number | null) {
  filtroValores.value = { ...filtroValores.value, [key]: v ?? '' }
  emit('update:filters', filtroValores.value)
}

watch(q, (v) => {
  emit('update:search', v)
  if (!isServer.value) internalPage.value = 1
})

const filteredRows = computed(() => {
  if (isServer.value) return props.rows
  let lista = props.rows
  const texto = q.value.trim().toLowerCase()
  if (texto && props.searchKeys?.length) {
    lista = lista.filter(row => props.searchKeys!.some(k => String(row[k] ?? '').toLowerCase().includes(texto)))
  }
  for (const f of filtros.value) {
    const v = filtroValores.value[f.key]
    if (v === undefined || v === '') continue
    lista = lista.filter(row => (f.match ? f.match(row, v) : row[f.key] === v))
  }
  return lista
})

const curPage = computed(() => (isServer.value ? (props.page ?? 1) : internalPage.value))
const totalCount = computed(() => (isServer.value ? (props.total ?? 0) : filteredRows.value.length))

const pageRows = computed(() => {
  if (!props.pageSize || isServer.value) return filteredRows.value
  const start = (internalPage.value - 1) * props.pageSize
  return filteredRows.value.slice(start, start + props.pageSize)
})

watch([() => props.rows, filtroValores], () => {
  if (!isServer.value) internalPage.value = 1
})

function onPage(p: number) {
  if (isServer.value) emit('update:page', p)
  else internalPage.value = p
}

function alignClass(a?: string) {
  return a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : ''
}

// table-fixed: la columna principal recibe más aire y el resto comparte lo demás.
const columnaGrow = computed(() => props.columns.find(c => c.grow)?.key ?? props.columns[0]?.key)

function anchoClass(col: DataTableColumn) {
  if (col.width) return col.width
  return col.key === columnaGrow.value ? 'w-[36%]' : ''
}
</script>
