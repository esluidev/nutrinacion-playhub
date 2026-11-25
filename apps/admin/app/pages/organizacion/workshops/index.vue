<template>
  <!-- Los talleres de la organización (tarea 023): una tabla, como Programas, Jornadas y Lugares, que aguanta cientos.
       Primero los próximos, del más cercano al más lejano; luego los que aún no tienen fecha; al final los pasados, el
       más reciente arriba (utils/listaTalleres). La fila abre el taller. -->
  <div>
    <UiPageHeader :title="t('workshops.title')" :description="t('workshops.desc')">
      <template #actions>
        <UiButton icon="plus" @click="navigateTo('/organizacion/workshops/new')">
          {{ t('workshops.new') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Los filtros a la izquierda y el buscador a la derecha. Siempre están, haya o no talleres: dicen qué se puede
         filtrar. La fecha, por periodos o entre dos días (FiltroDeFechas). «Pertenece a» es la misma pregunta que al
         programar: una jornada, un programa (también sus jornadas) o nada. -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <UiSelect v-model="estado" variant="toolbar" :prefix="t('workshops.filterState')" :options="opcionesEstado" />
        <FiltroDeFechas v-model="fechas" />
        <UiSelect v-model="pertenencia" variant="toolbar" :prefix="t('wizard.belongs')" :options="opcionesPertenencia" />
      </div>
      <!-- Ocupa lo que queda de la línea, a la derecha; si no le quedan 320 px, baja a la suya. -->
      <div class="flex min-w-0 grow basis-80 justify-end">
        <UiSearchInput v-model="busqueda" :placeholder="t('workshops.searchPh')" max-width="xs" class="min-w-0 flex-1" />
      </div>
    </div>

    <UiDataTable
      :columns="columns"
      :rows="filasDeLaPagina"
      :row-key="(w) => w.id"
      :loading="loading"
      :empty-text="hayTalleres ? t('table.emptyFiltered') : t('workshops.noneTitle')"
      :page="pagina"
      :total="filtrados.length"
      clickable
      @update:page="(p) => (pagina = p)"
      @row-click="(w) => navigateTo(`/organizacion/workshops/${w.id}`)"
    >
      <template #cell-taller="{ row }">
        <div class="min-w-0">
          <p class="truncate text-body font-extrabold text-ink" :title="row.title">{{ row.title }}</p>
          <p v-if="row.storyboard !== row.title" class="truncate text-caption font-semibold text-muted">{{ row.storyboard }}</p>
        </div>
      </template>
      <template #cell-fecha="{ row }">
        <template v-if="row.date">
          <p class="whitespace-nowrap text-body font-semibold text-muted">{{ fechaConDia(row.date) }}</p>
          <p v-if="row.time" class="whitespace-nowrap text-caption font-semibold tabular-nums text-subtle">{{ row.time.replace(' - ', ' – ') }}</p>
        </template>
        <span v-else class="text-body font-semibold text-subtle">{{ t('workshops.noDate') }}</span>
      </template>
      <template #cell-lugar="{ row }">
        <div class="min-w-0">
          <p class="truncate text-body font-semibold text-muted">{{ row.editable.lugar || '—' }}</p>
          <p v-if="row.editable.espacio" class="truncate text-caption font-semibold text-subtle">{{ row.editable.espacio }}</p>
        </div>
      </template>
      <template #cell-pertenece="{ row }">
        <!-- Los nombres de las jornadas son largos: hasta dos líneas, como la fecha y el lugar. -->
        <span v-if="row.jornada || row.programa" class="flex min-w-0 items-start gap-2 text-body font-semibold text-muted">
          <UiIcon :name="row.jornada ? 'layers' : 'bookmark'" class="mt-0.5 size-4 shrink-0 text-subtle" />
          <span class="line-clamp-2" :title="row.jornada?.nombre ?? row.programa?.nombre">{{ row.jornada?.nombre ?? row.programa?.nombre }}</span>
        </span>
        <span v-else class="text-body font-semibold text-subtle">—</span>
      </template>
      <template #cell-educador="{ row }">
        <div v-if="row.asignados.length" class="flex min-w-0 items-center gap-2.5">
          <UiAvatar :name="row.educator" :initials="row.initials" size="sm" />
          <span class="truncate text-body font-semibold text-muted">{{ row.educator }}</span>
        </div>
        <span v-else class="text-body font-semibold text-subtle">{{ t('workshops.unassigned') }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="row.tone" dot class="whitespace-nowrap">{{ row.statusLabel }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Editar (su detalle, donde se edita) y eliminar: solo uno que no se ha dado; si no, la confirmación dice por qué -->
        <div class="flex items-center justify-end gap-2">
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="navigateTo(`/organizacion/workshops/${row.id}`)" />
          <UiButton tone="neutral" size="sm" icon="trash" icon-only :label="t('workshops.delete')" :title="t('workshops.delete')" @click.stop="eliminando = row" />
        </div>
      </template>
    </UiDataTable>

    <UiConfirmDialog
      :open="!!eliminando"
      :title="t('workshops.deleteTitle')"
      :confirm-label="t('workshops.deleteConfirm')"
      :loading="enCurso"
      :disabled="!!eliminando && !sePuedeEliminar(eliminando)"
      @update:open="(v) => { if (!v) eliminando = null }"
      @confirm="confirmarEliminar"
    >
      <p>{{ eliminando && !sePuedeEliminar(eliminando) ? t('workshops.deleteBlocked') : t('workshops.deleteWarn', { titulo: eliminando?.title ?? '' }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { sinAcentos } from '@playhub/ui/app/utils/texto'
import type { Workshop } from '~/composables/useWorkshops'
import type { FiltroFechas } from '~/utils/listaTalleres'
import { fechaEnRango, ordenarTalleres, perteneceA, rangoDelFiltro } from '~/utils/listaTalleres'
import { ordenarJornadas } from '~/utils/jornadas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const { workshops, loading, eliminarTaller } = useWorkshops()
const { toast } = useToast()
const { programas } = useProgramas()
const { jornadas } = useJornadas()
const route = useRoute()
const hoy = hoyLocal()

const busqueda = ref('')
const estado = ref('todos')
const fechas = ref<FiltroFechas>({ periodo: 'todas', desde: '', hasta: '' })
// `?programa=<id>` llega desde la ficha del programa («Ver todos»).
const pertenencia = ref<string | number>(route.query.programa ? `p:${route.query.programa}` : 'todos')
const pagina = ref(1)
const PAGINA = 20

// Todos los estados, siempre: no dependen de los talleres que haya. «Todos» deja fuera los
// archivados (descartados): tienen su propia opción.
const ESTADOS = ['programado', 'completado', 'sin_realizar', 'revision', 'borrador', 'cancelado', 'archivado'] as const
const opcionesEstado = computed(() => [
  { value: 'todos', label: t('common.all') },
  ...ESTADOS.map(e => ({ value: e, label: t(`workshops.tabs.${e}`) })),
])
// Como al programar: los sueltos, los programas y las jornadas, cada grupo bajo su leyenda. Todos, también los que
// ya terminaron (primero los que siguen, luego el más reciente).
const opcionesPertenencia = computed(() => [
  { value: 'todos', label: t('common.all'), pinned: true },
  { value: 'suelto', label: t('workshops.sueltos'), pinned: true },
  ...ordenarJornadas(programas.value, hoy).map(p => ({ value: `p:${p.id}`, label: p.nombre, group: t('wizard.belongsPrograms') })),
  ...ordenarJornadas(jornadas.value, hoy).map(j => ({ value: `j:${j.id}`, label: j.nombre, group: t('wizard.belongsJornadas') })),
])

const hayTalleres = computed(() => workshops.value.length > 0)

// El taller, la fecha, el educador y el estado tienen su ancho; el lugar y «Pertenece a» se reparten el resto. En
// pantallas estrechas se quedan el taller, la fecha y el estado, y las demás aparecen según hay sitio: el lugar, el
// educador y, en las más anchas, a qué pertenece (que también es un filtro).
const DESDE_LG = 'hidden lg:table-cell'
const DESDE_XL = 'hidden xl:table-cell'
const DESDE_2XL = 'hidden 2xl:table-cell'
const columns = computed(() => [
  { key: 'taller', label: t('workshops.colWorkshop'), width: 'w-[30%]' },
  { key: 'fecha', label: t('workshops.colDate'), width: 'w-40' },
  { key: 'lugar', label: t('workshops.colPlace'), headerClass: DESDE_LG, cellClass: DESDE_LG },
  { key: 'pertenece', label: t('wizard.belongs'), headerClass: DESDE_2XL, cellClass: DESDE_2XL },
  { key: 'educador', label: t('workshops.colEducator'), width: 'w-44', headerClass: DESDE_XL, cellClass: DESDE_XL },
  { key: 'estado', label: t('workshops.colState'), width: 'w-40' },
  { key: 'acciones', label: '', width: 'w-28', align: 'right' as const },
])

// Eliminar: solo un taller que no se ha dado (borrador, en revisión o publicado que ningún educador empezó); lo exige
// la base. Los demás se archivan desde su detalle.
const eliminando = ref<Workshop | null>(null)
const enCurso = ref(false)
function sePuedeEliminar(w: Workshop) {
  return w.estado === 'BORRADOR' || w.estado === 'EN_REVISION'
    || (w.estado === 'PUBLICADO' && !w.asignados.some(a => a.iniciadoEn))
}
async function confirmarEliminar() {
  const w = eliminando.value
  if (!w) return
  enCurso.value = true
  const { error } = await eliminarTaller(w.id)
  enCurso.value = false
  eliminando.value = null
  if (error) { toast.error(error); return }
  toast.success(t('workshops.deleted'))
}

// «Jue 26 nov 2026»
function fechaConDia(fecha: string): string {
  const dia = aFecha(fecha).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'short' }).replace('.', '')
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fechaCorta(fecha, locale.value)}`
}

function coincideConBusqueda(w: Workshop, q: string): boolean {
  return [w.title, w.storyboard, w.location, w.jornada?.nombre, w.programa?.nombre, ...w.asignados.map(a => a.nombre)]
    .some(x => sinAcentos(x ?? '').includes(q))
}

const filtrados = computed(() => {
  const rango = rangoDelFiltro(fechas.value, hoy)
  const q = sinAcentos(busqueda.value.trim())
  const lista = workshops.value.filter(w =>
    (estado.value === 'todos' ? w.status !== 'archivado' : w.status === estado.value)
    && fechaEnRango(w.date, rango)
    && perteneceA(w, pertenencia.value)
    && (!q || coincideConBusqueda(w, q)))
  return ordenarTalleres(lista, hoy)
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / PAGINA)))
const filasDeLaPagina = computed(() => filtrados.value.slice((pagina.value - 1) * PAGINA, pagina.value * PAGINA))

// Al cambiar un filtro se vuelve a la primera página. Al refrescarse los talleres (volver a la pestaña), no: solo si la
// página ya no existe.
watch([estado, fechas, pertenencia, busqueda], () => {
  pagina.value = 1
})
watch(totalPaginas, (n) => {
  if (pagina.value > n) pagina.value = n
})
</script>
