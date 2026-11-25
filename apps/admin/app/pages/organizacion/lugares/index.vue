<template>
  <!-- Lugares de la organización (tareas 021 y 023): dos tablas en pestañas, como Educadores y sus grupos. Los lugares
       son los sitios donde se dan los talleres; se dan de alta aquí o al programar un taller, y uno con talleres no se
       borra (la papelera dice por qué); se desactiva al editarlo y deja de salir al programar. Las comunidades agrupan los lugares de un mismo territorio para el
       reporte; se crean, se editan (su nombre y sus lugares) y se eliminan en su pestaña. Arriba, las pestañas a la
       izquierda y el buscador a la derecha: el mismo en las dos pestañas (la barra no cambia al cambiar de pestaña) y
       encuentra por el nombre del lugar o de la comunidad. -->
  <div>
    <UiPageHeader :title="t('places.title')" :description="t('places.desc')">
      <template #actions>
        <UiButton variant="outline" icon="plus" @click="abrirComunidad(null)">{{ t('places.communityNew') }}</UiButton>
        <UiButton icon="plus" @click="abrirLugar(null)">{{ t('places.new') }}</UiButton>
      </template>
    </UiPageHeader>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <UiTabs v-model="tabModel" :items="tabItems" fit />
      <!-- Ocupa lo que queda de la línea, a la derecha; si no le quedan 320 px, baja a la suya -->
      <div class="flex min-w-0 grow basis-80 flex-wrap items-center justify-end gap-3">
        <UiSearchInput v-model="busqueda" :placeholder="t('places.searchPh')" max-width="xs" class="min-w-0 flex-1" />
      </div>
    </div>

    <!-- LUGARES -->
    <UiDataTable
      v-if="pestana === 'lugares'"
      :columns="columnasLugares"
      :rows="lugaresFiltrados"
      :row-key="(l) => l.id"
      :loading="loading"
      :empty-text="lugares.length ? t('table.emptyFiltered') : t('places.empty')"
      clickable
      @row-click="abrirLugar"
    >
      <template #cell-nombre="{ row }">
        <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
      </template>
      <template #cell-comunidad="{ row }">
        <span class="block truncate text-body font-semibold text-muted">{{ row.comunidad || '—' }}</span>
      </template>
      <template #cell-talleres="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ row.talleres }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="row.activo ? 'lime' : 'neutral'" :dot="row.activo">{{ row.activo ? t('places.active') : t('places.retired') }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Editar (también su estado) y eliminar, neutros como toda acción de tabla. La papelera siempre abre la
             confirmación, que, si tiene talleres, dice por qué no se puede eliminar. -->
        <div class="flex items-center justify-end gap-2">
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="abrirLugar(row)" />
          <UiButton
            tone="neutral"
            size="sm"
            icon="trash"
            icon-only
            :label="t('places.delete')"
            :title="t('places.delete')"
            @click.stop="eliminandoLugar = row"
          />
        </div>
      </template>
    </UiDataTable>

    <!-- COMUNIDADES -->
    <template v-else>
      <UiDataTable
        :columns="columnasComunidades"
        :rows="comunidadesFiltradas"
        :row-key="(c) => c.id"
        :loading="loading"
        :empty-text="comunidades.length ? t('table.emptyFiltered') : t('places.communitiesEmpty')"
        clickable
        @row-click="abrirComunidad"
      >
        <template #cell-nombre="{ row }">
          <div class="min-w-0">
            <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
            <p v-if="row.lugares.length" class="truncate text-caption font-semibold text-muted" :title="row.lugares.join(', ')">{{ row.lugares.join(', ') }}</p>
          </div>
        </template>
        <template #cell-lugares="{ row }">
          <span class="text-body font-semibold tabular-nums text-muted">{{ row.lugares.length ? tCount(t, 'places.placesCount', row.lugares.length) : '—' }}</span>
        </template>
        <template #cell-talleres="{ row }">
          <span class="text-body font-semibold tabular-nums text-muted">{{ row.talleres }}</span>
        </template>
        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="abrirComunidad(row)" />
            <UiButton
              tone="neutral"
              size="sm"
              icon="trash"
              icon-only
              :label="t('places.communityDelete')"
              :title="t('places.communityDelete')"
              @click.stop="eliminandoComunidad = row"
            />
          </div>
        </template>
      </UiDataTable>
    </template>

    <LugarDialog v-model:open="dialogoLugar" :lugar="lugarEditado" />
    <ComunidadDialog v-model:open="dialogoComunidad" :comunidad="comunidadEditada" />

    <UiConfirmDialog
      :open="!!eliminandoLugar"
      :title="t('places.deleteTitle', { nombre: eliminandoLugar?.nombre ?? '' })"
      :confirm-label="t('places.delete')"
      :loading="enCurso"
      :disabled="!!eliminandoLugar?.talleres"
      @update:open="(v) => { if (!v) eliminandoLugar = null }"
      @confirm="confirmarEliminarLugar"
    >
      <p>{{ eliminandoLugar?.talleres ? t('places.deleteBlocked') : t('places.deleteText') }}</p>
    </UiConfirmDialog>

    <!-- Eliminar una comunidad: sus lugares quedan sin comunidad; los talleres no cambian -->
    <UiConfirmDialog
      :open="!!eliminandoComunidad"
      :title="t('places.deleteTitle', { nombre: eliminandoComunidad?.nombre ?? '' })"
      :confirm-label="t('places.communityDelete')"
      :loading="enCurso"
      @update:open="(v) => { if (!v) eliminandoComunidad = null }"
      @confirm="confirmarEliminarComunidad"
    >
      <p>{{ avisoEliminarComunidad }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { sinAcentos } from '@playhub/ui/app/utils/texto'
import type { Comunidad, Lugar } from '~/composables/useLugares'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { lugares, comunidades, loading, refresh, eliminar, eliminarComunidad } = useLugares()

onMounted(() => refresh())

type Pestana = 'lugares' | 'comunidades'
const pestana = ref<Pestana>('lugares')
// Puente tipado: UiTabs habla en string; la pestaña es una unión cerrada.
const tabModel = computed({
  get: () => pestana.value as string,
  set: v => (pestana.value = v as Pestana),
})
const tabItems = computed(() => [
  { value: 'lugares', label: `${t('places.title')} · ${lugares.value.length}` },
  { value: 'comunidades', label: `${t('places.communities')} · ${comunidades.value.length}` },
])

// ── El buscador, el mismo en las dos pestañas: por el nombre del lugar o de la comunidad ──
const busqueda = ref('')
const consulta = computed(() => sinAcentos(busqueda.value.trim()))

const lugaresFiltrados = computed(() => lugares.value.filter(l =>
  !consulta.value || [l.nombre, l.comunidad].some(x => sinAcentos(x).includes(consulta.value))))

// Cada comunidad con sus lugares (por nombre) y los talleres que suman.
const comunidadesConLugares = computed(() => comunidades.value.map((c) => {
  const suyos = lugares.value.filter(l => l.comunidadId === c.id)
  return { ...c, lugares: suyos.map(l => l.nombre), talleres: suyos.reduce((n, l) => n + l.talleres, 0) }
}))
const comunidadesFiltradas = computed(() => comunidadesConLugares.value.filter(c =>
  !consulta.value || [c.nombre, ...c.lugares].some(x => sinAcentos(x).includes(consulta.value))))

const columnasLugares = computed(() => [
  { key: 'nombre', label: t('places.colName'), grow: true },
  { key: 'comunidad', label: t('places.colCommunity') },
  { key: 'talleres', label: t('places.colWorkshops'), width: 'w-28' },
  { key: 'estado', label: t('places.colState'), width: 'w-32' },
  { key: 'acciones', label: t('places.colActions'), width: 'w-28', align: 'right' as const },
])
const columnasComunidades = computed(() => [
  { key: 'nombre', label: t('places.colCommunity'), width: 'w-auto' },
  { key: 'lugares', label: t('places.colPlaces'), width: 'w-36' },
  { key: 'talleres', label: t('places.colWorkshops'), width: 'w-28' },
  { key: 'acciones', label: '', width: 'w-28', align: 'right' as const },
])

// ── Diálogos ─────────────────────────────────────────────────────────────────
const dialogoLugar = ref(false)
const lugarEditado = ref<Lugar | null>(null)
function abrirLugar(l: Lugar | null) {
  lugarEditado.value = l
  dialogoLugar.value = true
}
const dialogoComunidad = ref(false)
const comunidadEditada = ref<Comunidad | null>(null)
function abrirComunidad(c: Comunidad | null) {
  comunidadEditada.value = c ? { id: c.id, nombre: c.nombre } : null
  dialogoComunidad.value = true
}

const enCurso = ref(false)
const eliminandoLugar = ref<Lugar | null>(null)
async function confirmarEliminarLugar() {
  const l = eliminandoLugar.value
  if (!l) return
  enCurso.value = true
  const { error } = await eliminar(l.id)
  enCurso.value = false
  eliminandoLugar.value = null
  if (error) { toast.error(error); return }
  toast.success(t('places.deleted'))
}

const eliminandoComunidad = ref<(Comunidad & { lugares: string[] }) | null>(null)
// «Sus 3 lugares quedan sin comunidad» (o «Su lugar…», o «No agrupa ningún lugar»)
const avisoEliminarComunidad = computed(() => {
  const n = eliminandoComunidad.value?.lugares.length ?? 0
  if (!n) return t('places.communityDeleteEmpty')
  return n === 1 ? t('places.communityDeleteTextOne') : t('places.communityDeleteText', { n })
})
async function confirmarEliminarComunidad() {
  const c = eliminandoComunidad.value
  if (!c) return
  enCurso.value = true
  const { error } = await eliminarComunidad(c.id)
  enCurso.value = false
  eliminandoComunidad.value = null
  if (error) { toast.error(error); return }
  toast.success(t('places.communityDeleted'))
}
</script>
