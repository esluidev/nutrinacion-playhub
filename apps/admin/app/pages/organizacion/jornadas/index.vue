<template>
  <!-- Jornadas de la organización (tarea 023): dónde y cuándo se va, un lugar y unos días con varios talleres (una
       feria, la semana de la nutrición). Se crean aquí, antes de sus talleres, y existen aunque todavía no tengan
       ninguno. Su estado sale de las fechas, como el de los programas: por venir (cielo), en curso (sol) o terminada
       (lima). Primero las que no han terminado; la fila abre su ficha. Se ve igual que Programas, Lugares y
       Audiencias, también vacía: la tabla con su buscador y sus filtros, y «Nueva Jornada» arriba. En la fila, editar (su
       diálogo) y eliminar (sus talleres quedan independientes). -->
  <div>
    <UiPageHeader :title="t('jornadas.title')" :description="t('jornadas.desc')">
      <template #actions>
        <UiButton icon="plus" @click="dialogo = true">{{ t('jornadas.new') }}</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="filas"
      :row-key="(j) => j.id"
      :loading="loading"
      :empty-text="t('jornadas.empty')"
      searchable
      :search-keys="['nombre', 'ubicacion', 'descripcion']"
      :search-placeholder="t('jornadas.searchPh')"
      :filters="filtros"
      clickable
      @row-click="(j) => navigateTo(`/organizacion/jornadas/${j.id}`)"
    >
      <template #cell-nombre="{ row }">
        <div class="min-w-0">
          <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
          <p v-if="row.descripcion" class="truncate text-caption font-semibold text-muted">{{ row.descripcion }}</p>
        </div>
      </template>
      <template #cell-lugar="{ row }">
        <span class="text-body font-semibold text-muted">{{ row.ubicacion }}</span>
      </template>
      <template #cell-dias="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ rangoJornada(row, locale) }}</span>
      </template>
      <template #cell-programa="{ row }">
        <span class="text-body font-semibold text-muted">{{ getPrograma(row.programa_id)?.nombre ?? '—' }}</span>
      </template>
      <template #cell-talleres="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ talleresDeJornada(row) }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Editar (su diálogo) y eliminar: sus talleres quedan independientes, con su lugar y su espacio -->
        <div class="flex items-center justify-end gap-2">
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="editada = row" />
          <UiButton tone="neutral" size="sm" icon="trash" icon-only :label="t('planner.jDelete')" :title="t('planner.jDelete')" @click.stop="eliminando = row" />
        </div>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="TONO_PROGRAMA[estadoPrograma(row, hoy)]" dot>{{ t(`jornadas.state.${estadoPrograma(row, hoy)}`) }}</UiBadge>
      </template>
    </UiDataTable>

    <JornadaDialog v-model:open="dialogo" @saved="(id) => navigateTo(`/organizacion/jornadas/${id}`)" />
    <JornadaDialog :open="!!editada" :jornada="editada" @update:open="(v) => { if (!v) editada = null }" />

    <UiConfirmDialog
      :open="!!eliminando"
      :title="t('planner.jDeleteTitle')"
      :confirm-label="t('planner.jDelete')"
      :loading="enCurso"
      @update:open="(v) => { if (!v) eliminando = null }"
      @confirm="confirmarEliminar"
    >
      <p>{{ avisoEliminar }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { EstadoPrograma } from '~/composables/useProgramas'
import { TONO_PROGRAMA, estadoPrograma } from '~/composables/useProgramas'
import type { JornadaFila } from '~/composables/useJornadas'
import { talleresDeJornada } from '~/composables/useJornadas'
import { ordenarJornadas, rangoJornada } from '~/utils/jornadas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const { jornadas, loading, eliminar } = useJornadas()
const { refresh: refreshWorkshops } = useWorkshops()
const { toast } = useToast()
const { getPrograma } = useProgramas()
const hoy = hoyLocal()

// Las que no han terminado primero, por su inicio; las terminadas al final, la más reciente arriba.
const filas = computed(() => ordenarJornadas(jornadas.value, hoy))

const columns = computed(() => [
  { key: 'nombre', label: t('jornadas.colName'), grow: true },
  { key: 'lugar', label: t('jornadas.colPlace') },
  { key: 'dias', label: t('jornadas.colDays') },
  { key: 'programa', label: t('jornadas.colProgram') },
  { key: 'talleres', label: t('jornadas.colWorkshops') },
  { key: 'estado', label: t('jornadas.colState') },
  { key: 'acciones', label: '', width: 'w-28', align: 'right' as const },
])

const ESTADOS: EstadoPrograma[] = ['en_curso', 'por_venir', 'terminado']
const filtros = computed(() => [{
  key: 'estado',
  label: t('jornadas.colState'),
  options: ESTADOS.map(e => ({ value: e, label: t(`jornadas.state.${e}`) })),
  match: (row: JornadaFila, v: string | number) => estadoPrograma(row, hoy) === v,
}])

const dialogo = ref(false)
const editada = ref<JornadaFila | null>(null)

// Eliminar: «Sus 3 talleres quedan independientes» (o «Su taller…», o sin talleres), como en su ficha.
const eliminando = ref<JornadaFila | null>(null)
const enCurso = ref(false)
const avisoEliminar = computed(() => {
  const j = eliminando.value
  if (!j) return ''
  const vars = { nombre: j.nombre, n: talleresDeJornada(j) }
  if (!vars.n) return t('jornadas.deleteEmpty', vars)
  return vars.n === 1 ? t('planner.jDeleteWarnOne', vars) : t('planner.jDeleteWarn', vars)
})
async function confirmarEliminar() {
  const j = eliminando.value
  if (!j) return
  enCurso.value = true
  const { error } = await eliminar(j.id)
  enCurso.value = false
  eliminando.value = null
  if (error) { toast.error(error); return }
  await refreshWorkshops()
  toast.success(t('planner.jDeleted'))
}
</script>
