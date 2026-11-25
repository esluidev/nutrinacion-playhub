<template>
  <!-- Audiencias de la organización (`grupos_audiencia`, tarea 021): a quién se dan los talleres.
       Solo el nombre es obligatorio; las edades, opcionales. Sin número de niños: lo da
       el cierre de cada taller. Una abierta (público general) cuenta asistencias y no alcance. Cada
       organización trae «Público general», fija: solo se edita su nombre. Las demás se editan (también su
       estado: inactiva no sale al programar) y se eliminan; con talleres, no se eliminan. -->
  <div>
    <UiPageHeader :title="t('audiences.title')" :description="t('audiences.desc')">
      <template #actions>
        <UiButton icon="plus" @click="abrirNueva">{{ t('audiences.new') }}</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="audiencias"
      :row-key="(a) => a.id"
      :loading="loading"
      :empty-text="t('audiences.empty')"
      searchable
      :search-keys="['nombre', 'descripcion']"
      :search-placeholder="t('audiences.searchPh')"
      :filters="filtros"
    >
      <template #cell-nombre="{ row }">
        <div class="min-w-0">
          <p class="flex items-center gap-2 text-body font-extrabold text-ink">
            <span class="truncate">{{ row.nombre }}</span>
            <!-- Público general, salvo en la que trae la organización, que ya se llama así -->
            <UiBadge v-if="row.abierto && !row.fija" tone="neutral" class="whitespace-nowrap">{{ t('audiences.open') }}</UiBadge>
          </p>
          <p v-if="row.descripcion" class="truncate text-caption font-semibold text-muted">{{ row.descripcion }}</p>
        </div>
      </template>
      <template #cell-edad="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ edad(row) }}</span>
      </template>
      <template #cell-talleres="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ row.talleres }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="row.activo ? 'lime' : 'neutral'" :dot="row.activo">{{ row.activo ? t('audiences.active') : t('audiences.retired') }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="editar(row)" />
          <!-- «Público general» es fija: solo se edita. Las demás se eliminan; la papelera siempre abre la confirmación,
               que, si tiene talleres, dice por qué no se puede (y se desactiva al editarla). -->
          <UiButton
            v-if="!row.fija"
            tone="neutral"
            size="sm"
            icon="trash"
            icon-only
            :label="t('audiences.delete')"
            :title="t('audiences.delete')"
            @click.stop="eliminando = row"
          />
        </div>
      </template>
    </UiDataTable>

    <AudienciaDialog v-model:open="dialogo" :audiencia="editada" />

    <UiConfirmDialog
      :open="!!eliminando"
      :title="t('audiences.deleteTitle', { nombre: eliminando?.nombre ?? '' })"
      :confirm-label="t('audiences.delete')"
      :loading="enCurso"
      :disabled="!!eliminando?.talleres"
      @update:open="(v) => { if (!v) eliminando = null }"
      @confirm="confirmarEliminar"
    >
      <p>{{ eliminando?.talleres ? t('audiences.deleteBlocked') : t('audiences.deleteText') }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { Audiencia } from '~/composables/useAudiencias'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { audiencias, loading, refresh, eliminar } = useAudiencias()

onMounted(() => refresh())

const columns = computed(() => [
  { key: 'nombre', label: t('audiences.colName'), grow: true },
  { key: 'edad', label: t('audiences.colAge') },
  { key: 'talleres', label: t('audiences.colWorkshops') },
  { key: 'estado', label: t('audiences.colState') },
  { key: 'acciones', label: t('audiences.colActions'), align: 'right' as const },
])

const filtros = computed(() => [
  {
    key: 'estado',
    label: t('audiences.colState'),
    options: [{ value: 'activa', label: t('audiences.actives') }, { value: 'retirada', label: t('audiences.retiredPlural') }],
    match: (row: Audiencia, v: string | number) => (v === 'activa' ? row.activo : !row.activo),
  },
])

// «5–6 años», «desde 5 años», «hasta 6 años» o «—».
function edad(a: Audiencia) {
  if (a.edadDesde !== null && a.edadHasta !== null) return t('audiences.ageRangeText', { desde: a.edadDesde, hasta: a.edadHasta })
  if (a.edadDesde !== null) return t('audiences.ageFrom', { desde: a.edadDesde })
  if (a.edadHasta !== null) return t('audiences.ageTo', { hasta: a.edadHasta })
  return '—'
}

const dialogo = ref(false)
const editada = ref<Audiencia | null>(null)
function abrirNueva() {
  editada.value = null
  dialogo.value = true
}
function editar(a: Audiencia) {
  editada.value = a
  dialogo.value = true
}

const eliminando = ref<Audiencia | null>(null)
const enCurso = ref(false)
async function confirmarEliminar() {
  const a = eliminando.value
  if (!a) return
  enCurso.value = true
  const { error } = await eliminar(a.id)
  enCurso.value = false
  eliminando.value = null
  if (error) { toast.error(error); return }
  toast.success(t('audiences.deleted'))
}
</script>
