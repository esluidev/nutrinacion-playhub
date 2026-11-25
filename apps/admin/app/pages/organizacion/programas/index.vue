<template>
  <!-- Programas de la organización (tarea 021): para qué y cuándo. Cada uno junta talleres sueltos
       y jornadas, que caen en sus fechas. Su estado sale de las fechas: por venir (cielo), en curso
       (sol) o terminado (lima). Se abre su ficha al pulsar la fila; en la fila, editar (su diálogo) y eliminar, que con
       talleres o jornadas no se puede y la confirmación lo dice. -->
  <div>
    <UiPageHeader :title="t('programs.title')" :description="t('programs.desc')">
      <template #actions>
        <UiButton icon="plus" @click="dialogo = true">{{ t('programs.new') }}</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="programas"
      :row-key="(p) => p.id"
      :loading="loading"
      :empty-text="t('programs.empty')"
      searchable
      :search-keys="['nombre', 'descripcion']"
      :search-placeholder="t('programs.searchPh')"
      :filters="filtros"
      clickable
      @row-click="(p) => navigateTo(`/organizacion/programas/${p.id}`)"
    >
      <template #cell-nombre="{ row }">
        <div class="min-w-0">
          <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
          <p v-if="row.descripcion" class="truncate text-caption font-semibold text-muted">{{ row.descripcion }}</p>
        </div>
      </template>
      <template #cell-fechas="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ rangoJornada(row, locale) }}</span>
      </template>
      <template #cell-talleres="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ row.talleres }}</span>
      </template>
      <template #cell-jornadas="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ row.jornadas }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="TONO_PROGRAMA[estadoPrograma(row, hoy)]" dot>{{ t(`programs.state.${estadoPrograma(row, hoy)}`) }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="editado = row" />
          <UiButton tone="neutral" size="sm" icon="trash" icon-only :label="t('programs.delete')" :title="t('programs.delete')" @click.stop="eliminando = row" />
        </div>
      </template>
    </UiDataTable>

    <ProgramaDialog v-model:open="dialogo" @saved="(id) => navigateTo(`/organizacion/programas/${id}`)" />
    <ProgramaDialog :open="!!editado" :programa="editado" @update:open="(v) => { if (!v) editado = null }" @saved="refresh" />

    <!-- Eliminar: con talleres o jornadas no se puede (lo exige la base) y la confirmación lo dice -->
    <UiConfirmDialog
      :open="!!eliminando"
      :title="t('programs.deleteTitle', { nombre: eliminando?.nombre ?? '' })"
      :confirm-label="t('programs.delete')"
      :loading="enCurso"
      :disabled="!!(eliminando?.talleres || eliminando?.jornadas)"
      @update:open="(v) => { if (!v) eliminando = null }"
      @confirm="confirmarEliminar"
    >
      <p>{{ eliminando?.talleres || eliminando?.jornadas ? t('programs.deleteBlocked') : t('programs.deleteText') }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { EstadoPrograma, Programa } from '~/composables/useProgramas'
import { TONO_PROGRAMA, estadoPrograma } from '~/composables/useProgramas'
import { rangoJornada } from '~/utils/jornadas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const { programas, loading, refresh, eliminar } = useProgramas()
const { toast } = useToast()
const hoy = hoyLocal()

onMounted(() => refresh())

const columns = computed(() => [
  { key: 'nombre', label: t('programs.colName'), grow: true },
  { key: 'fechas', label: t('programs.colDates') },
  { key: 'talleres', label: t('programs.colWorkshops') },
  { key: 'jornadas', label: t('programs.colJornadas') },
  { key: 'estado', label: t('programs.colState') },
  { key: 'acciones', label: '', width: 'w-28', align: 'right' as const },
])

const ESTADOS: EstadoPrograma[] = ['en_curso', 'por_venir', 'terminado']
const filtros = computed(() => [{
  key: 'estado',
  label: t('programs.colState'),
  options: ESTADOS.map(e => ({ value: e, label: t(`programs.state.${e}`) })),
  match: (row: Programa, v: string | number) => estadoPrograma(row, hoy) === v,
}])

const dialogo = ref(false)
const editado = ref<Programa | null>(null)
const eliminando = ref<Programa | null>(null)
const enCurso = ref(false)
async function confirmarEliminar() {
  const p = eliminando.value
  if (!p) return
  enCurso.value = true
  const { error } = await eliminar(p.id)
  enCurso.value = false
  eliminando.value = null
  if (error) { toast.error(error); return }
  toast.success(t('programs.deleted'))
}
</script>
