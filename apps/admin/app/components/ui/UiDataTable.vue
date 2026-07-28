<template>
  <div>
    <!-- Toolbar INTEGRADO: búsqueda + filtros declarativos viven en el componente, no se
         reconstruyen en cada página (mismo lenguaje visual que los toolbars del mock). -->
    <div v-if="searchable || filtros.length" class="flex items-center gap-2.5 mb-[18px] flex-wrap">
      <UiSearchInput
        v-if="searchable"
        v-model="q"
        :placeholder="searchPlaceholder || t('table.searchPh')"
        class="!w-[280px]"
      />
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

    <div :class="flat ? '' : 'card overflow-hidden'">
      <div class="overflow-x-auto">
        <table class="w-full table-fixed text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.08em]">
              <th
                v-for="col in columns"
                :key="col.key"
                :class="['px-6 py-3.5', anchoClass(col), alignClass(col.align), col.headerClass]"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td :colspan="columns.length" class="px-6 py-14 text-center text-sm text-gray-400">{{ t('table.loading') }}</td>
            </tr>
            <!-- Sin botón: la acción de crear vive en el toolbar de la página, que es donde el
                 usuario la busca y donde está siempre. Aquí solo se explica por qué no hay nada. -->
            <tr v-else-if="!pageRows.length">
              <td :colspan="columns.length" class="px-6 py-14 text-center">
                <p class="text-sm text-gray-400">{{ hayCriterios ? t('table.emptyFiltered') : (emptyText || t('table.empty')) }}</p>
              </td>
            </tr>
            <tr
              v-for="(row, i) in pageRows"
              v-else
              :key="rowKey ? rowKey(row) : i"
              :class="['transition-colors', clickable ? 'hover:bg-gray-50 cursor-pointer' : '']"
              @click="clickable && emit('row-click', row)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                :class="['px-6 py-4', anchoClass(col), alignClass(col.align), col.cellClass]"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pie de tabla: paginación -->
      <div v-if="pageSize && !loading && pageRows.length" class="px-5 py-3 border-t border-gray-100">
        <UiPagination :page="curPage" :total="totalCount" :page-size="pageSize" @update:page="onPage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()

interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  // La columna principal (más ancha). Si ninguna lo pide, es la primera.
  grow?: boolean
  // Ancho explícito (clase, p. ej. 'w-[110px]' o 'w-[20%]') cuando el reparto no basta.
  width?: string
  headerClass?: string
  cellClass?: string
}

// Filtro declarativo: el componente pinta el control ("Rol: Todos") y aplica el criterio.
// `match` cubre los casos donde el valor no es una igualdad simple con row[key]
// (derivados, booleanos, rangos); sin `match`, se compara row[key] === value.
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
  // Paginación INTEGRADA por defecto (20, como Platform). `:page-size="0"` la apaga.
  pageSize?: number
  // Búsqueda integrada. En modo cliente filtra sobre `searchKeys`; en modo servidor
  // solo emite `update:search` y la página consulta.
  searchable?: boolean
  searchKeys?: string[]
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  // Modo SERVIDOR: pasa `page` + `total` (rows = la página actual, ya paginada afuera).
  // Sin `total`: modo CLIENTE (pagina internamente los `rows` recibidos).
  page?: number
  total?: number
}>(), {
  loading: false,
  emptyText: 'Sin datos.',
  clickable: false,
  searchable: false,
  pageSize: 20,
})

const emit = defineEmits<{
  'row-click': [row: any]
  'update:page': [page: number]
  'update:search': [q: string]
  'update:filters': [values: Record<string, string | number>]
}>()

const isServer = computed(() => props.total !== undefined)
const internalPage = ref(1)

// ── Búsqueda + filtros ────────────────────────────────────────────────────────
const q = ref('')
const filtroValores = ref<Record<string, string | number>>({})
const filtros = computed(() => props.filters ?? [])

const hayCriterios = computed(() =>
  !!q.value.trim() || Object.values(filtroValores.value).some(v => v !== ''))

function opcionesDe(f: DataTableFilter) {
  return [{ value: '', label: t('common.all') }, ...f.options]
}

function setFiltro(key: string, v: string | number | null) {
  filtroValores.value = { ...filtroValores.value, [key]: v ?? '' }
  emit('update:filters', filtroValores.value)
}

watch(q, (v) => {
  emit('update:search', v)
  if (!isServer.value) internalPage.value = 1
})

// En modo cliente el componente filtra solo; en servidor la página escucha los emits.
const filteredRows = computed(() => {
  if (isServer.value) return props.rows
  let lista = props.rows

  const texto = q.value.trim().toLowerCase()
  if (texto && props.searchKeys?.length) {
    lista = lista.filter(row =>
      props.searchKeys!.some(k => String(row[k] ?? '').toLowerCase().includes(texto)))
  }

  for (const f of filtros.value) {
    const v = filtroValores.value[f.key]
    if (v === undefined || v === '') continue
    lista = lista.filter(row => (f.match ? f.match(row, v) : row[f.key] === v))
  }

  return lista
})

// ── Paginación ────────────────────────────────────────────────────────────────
const curPage = computed(() => (isServer.value ? (props.page ?? 1) : internalPage.value))
const totalCount = computed(() => (isServer.value ? (props.total ?? 0) : filteredRows.value.length))

const pageRows = computed(() => {
  if (!props.pageSize || isServer.value) return filteredRows.value
  const start = (internalPage.value - 1) * props.pageSize
  return filteredRows.value.slice(start, start + props.pageSize)
})

// En modo cliente, si cambian los datos o el criterio, vuelve a la página 1.
watch([() => props.rows, filtroValores], () => {
  if (!isServer.value) internalPage.value = 1
})

function onPage(p: number) {
  if (isServer.value) emit('update:page', p)
  else internalPage.value = p
}

// ── Layout ────────────────────────────────────────────────────────────────────
function alignClass(a?: string) {
  return a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : ''
}

// `table-fixed` reparte el ancho de forma ARMÓNICA: la columna principal (grow, o la
// primera) recibe más aire y el resto comparte lo demás en partes iguales. El modelo
// anterior (una columna con w-full y el resto encogido a su contenido) hacía gigante a
// la primera y apretujaba todo lo demás contra el borde derecho.
const columnaGrow = computed(() => props.columns.find(c => c.grow)?.key ?? props.columns[0]?.key)

function anchoClass(col: DataTableColumn) {
  if (col.width) return col.width
  return col.key === columnaGrow.value ? 'w-[36%]' : ''
}
</script>
