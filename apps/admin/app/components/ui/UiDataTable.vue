<template>
  <div :class="flat ? '' : 'card overflow-hidden'">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50/60 border-b border-gray-200 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="['px-5 py-2.5', anchoClass(col), alignClass(col.align), col.headerClass]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-5 py-14 text-center text-sm text-gray-400">{{ t('table.loading') }}</td>
          </tr>
          <!-- Sin botón: la acción de crear vive en el toolbar de la página, que es donde el
               usuario la busca y donde está siempre. Aquí solo se explica por qué no hay nada. -->
          <tr v-else-if="!pageRows.length">
            <td :colspan="columns.length" class="px-5 py-14 text-center">
              <p class="text-sm text-gray-400">{{ emptyText || t('table.empty') }}</p>
            </td>
          </tr>
          <tr
            v-for="(row, i) in pageRows"
            v-else
            :key="rowKey ? rowKey(row) : i"
            :class="['transition-colors', clickable ? 'hover:bg-brand-primary/[0.03] cursor-pointer' : '']"
            @click="clickable && emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="['px-5 py-3', anchoClass(col), alignClass(col.align), col.cellClass]"
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
</template>

<script setup lang="ts">
const { t } = useT()

interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  // La columna que absorbe el ancho sobrante. Si ninguna lo pide, es la primera.
  grow?: boolean
  headerClass?: string
  cellClass?: string
}

const props = withDefaults(defineProps<{
  columns: DataTableColumn[]
  rows: any[]
  rowKey?: (row: any) => string | number
  loading?: boolean
  emptyText?: string
  clickable?: boolean
  flat?: boolean
  pageSize?: number
  // Modo SERVIDOR: pasa `page` + `total` (rows = la página actual, ya paginada afuera).
  // Sin `total`: modo CLIENTE (pagina internamente los `rows` recibidos).
  page?: number
  total?: number
}>(), {
  loading: false,
  emptyText: 'Sin datos.',
  clickable: false,
})

const emit = defineEmits<{
  'row-click': [row: any]
  'update:page': [page: number]
}>()

const isServer = computed(() => props.total !== undefined)
const internalPage = ref(1)

const curPage = computed(() => (isServer.value ? (props.page ?? 1) : internalPage.value))
const totalCount = computed(() => (isServer.value ? (props.total ?? 0) : props.rows.length))

const pageRows = computed(() => {
  if (!props.pageSize || isServer.value) return props.rows
  const start = (internalPage.value - 1) * props.pageSize
  return props.rows.slice(start, start + props.pageSize)
})

// En modo cliente, si cambian los datos, vuelve a la página 1.
watch(() => props.rows, () => { if (!isServer.value) internalPage.value = 1 })

function onPage(p: number) {
  if (isServer.value) emit('update:page', p)
  else internalPage.value = p
}

function alignClass(a?: string) {
  return a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : ''
}

// Sin control de anchos, una tabla de 3 columnas se dispersa por toda la pantalla y deja de
// leerse (se nota en monitores anchos). Solución estándar: UNA columna absorbe el sobrante
// (`w-full`) y el resto se encoge a su contenido (`w-px` + `whitespace-nowrap`), que es lo que
// quieres para estados, fechas, contadores y acciones.
const columnaGrow = computed(() => props.columns.find(c => c.grow)?.key ?? props.columns[0]?.key)

function anchoClass(col: DataTableColumn) {
  return col.key === columnaGrow.value ? 'w-full' : 'w-px whitespace-nowrap'
}
</script>
