<template>
  <div>
    <UiPageHeader :title="t('jornadas.title')" :description="t('jornadas.desc')">
      <template #actions>
        <UiButton icon="plus" @click="abrir(null)">{{ t('jornadas.new') }}</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="jornadas"
      :row-key="(j) => j.id"
      :loading="loading"
      :empty-text="t('jornadas.empty')"
    >
      <template #cell-nombre="{ row }">
        <p class="truncate font-extrabold text-ink">{{ row.nombre }}</p>
        <p v-if="row.descripcion" class="ui-caption truncate">{{ row.descripcion }}</p>
      </template>
      <template #cell-enfoque="{ row }">
        <UiBadge v-if="row.enfoque_salud" tone="neutral">{{ t(`catalogo.enfoque.${row.enfoque_salud}`) }}</UiBadge>
        <span v-else class="font-semibold text-disabled">—</span>
      </template>
      <template #cell-fechas="{ row }">
        <span class="text-body font-semibold text-muted">{{ rango(row.fecha_inicio, row.fecha_fin) }}</span>
      </template>
      <template #cell-talleres="{ row }">
        <span class="font-extrabold tabular-nums text-ink">{{ row.workshops?.[0]?.count ?? 0 }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Acciones de tabla: neutras; el borrado se confirma en coral -->
        <div class="flex items-center justify-end gap-2">
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" @click.stop="abrir(row)" />
          <UiButton tone="neutral" size="sm" icon="trash" icon-only :label="t('common.delete')" @click.stop="borrando = row" />
        </div>
      </template>
    </UiDataTable>

    <UiDialog :open="editorAbierto" :title="editando ? t('jornadas.edit') : t('jornadas.new')" @update:open="(v) => editorAbierto = v">
      <div class="space-y-4">
        <UiInput v-model="form.nombre" :label="t('jornadas.fName')" :placeholder="t('jornadas.fNamePh')" />
        <UiTextarea v-model="form.descripcion" :label="t('jornadas.fDescription')" optional :rows="2" />
        <UiSelect v-model="form.enfoque" :options="enfoqueOpciones" :label="t('jornadas.fFocus')" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UiInput v-model="form.inicio" type="date" :label="t('jornadas.fStart')" />
          <UiInput v-model="form.fin" type="date" :label="t('jornadas.fEnd')" />
        </div>
        <p v-if="error" class="field-error">{{ error }}</p>
      </div>
      <template #actions>
        <UiButton :loading="guardando" icon="check" @click="guardar">{{ t('common.save') }}</UiButton>
      </template>
    </UiDialog>

    <UiConfirmDialog
      :open="!!borrando"
      :title="t('jornadas.deleteTitle')"
      :confirm-label="t('common.delete')"
      :loading="guardando"
      @update:open="(v) => { if (!v) borrando = null }"
      @confirm="confirmarBorrar"
    >
      <p>{{ t('jornadas.deleteWarn', { nombre: borrando?.nombre ?? '' }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
// Jornadas de la organización: talleres de sus comunidades alrededor de un enfoque de salud.
// Solo sus administradores (el middleware de /organizacion lo exige y la RLS también).
import { Constants } from '../../../../../supabase/database.types'
import type { EnfoqueSalud, JornadaFila } from '~/composables/useJornadas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const { toast } = useToast()
const { orgActiva } = useContexto()
const { listar, crear, actualizar, eliminar } = useJornadas()

const jornadas = ref<JornadaFila[]>([])
const loading = ref(true)
const guardando = ref(false)

const columns = computed(() => [
  { key: 'nombre', label: t('jornadas.colName'), grow: true },
  { key: 'enfoque', label: t('jornadas.colFocus') },
  { key: 'fechas', label: t('jornadas.colDates') },
  { key: 'talleres', label: t('jornadas.colWorkshops'), align: 'center' as const },
  { key: 'acciones', label: '', align: 'right' as const },
])

// Los enfoques salen del enum de la base (una sola fuente).
const enfoqueOpciones = computed(() => [
  { value: '', label: t('jornadas.fFocusNone') },
  ...Constants.public.Enums.enfoque_salud.map(e => ({ value: e, label: t(`catalogo.enfoque.${e}`) })),
])

const fecha = (d: string) => fechaCorta(d, locale.value)
function rango(inicio: string | null, fin: string | null) {
  if (!inicio && !fin) return '—'
  if (inicio && fin) return `${fecha(inicio)} – ${fecha(fin)}`
  return fecha((inicio ?? fin)!)
}

async function cargar() {
  if (!orgActiva.value) return
  loading.value = true
  jornadas.value = await listar(orgActiva.value.id)
  loading.value = false
}
watch(() => orgActiva.value?.id, cargar, { immediate: true })

const editorAbierto = ref(false)
const editando = ref<JornadaFila | null>(null)
const error = ref('')
const form = reactive<{ nombre: string, descripcion: string, enfoque: EnfoqueSalud | '', inicio: string, fin: string }>({
  nombre: '', descripcion: '', enfoque: '', inicio: '', fin: '',
})

function abrir(j: JornadaFila | null) {
  editando.value = j
  error.value = ''
  form.nombre = j?.nombre ?? ''
  form.descripcion = j?.descripcion ?? ''
  form.enfoque = j?.enfoque_salud ?? ''
  form.inicio = j?.fecha_inicio ?? ''
  form.fin = j?.fecha_fin ?? ''
  editorAbierto.value = true
}

async function guardar() {
  error.value = ''
  if (!form.nombre.trim()) { error.value = t('jornadas.nameRequired'); return }
  if (form.inicio && form.fin && form.fin < form.inicio) { error.value = t('jornadas.datesOrder'); return }
  if (!orgActiva.value) return
  const datos = { nombre: form.nombre, descripcion: form.descripcion, enfoque_salud: form.enfoque || null, fecha_inicio: form.inicio, fecha_fin: form.fin }
  guardando.value = true
  const { error: e } = editando.value ? await actualizar(editando.value.id, datos) : await crear(orgActiva.value.id, datos)
  guardando.value = false
  if (e) { error.value = e; return }
  editorAbierto.value = false
  toast.success(t('jornadas.saved'))
  await cargar()
}

const borrando = ref<JornadaFila | null>(null)
async function confirmarBorrar() {
  if (!borrando.value) return
  guardando.value = true
  const { error: e } = await eliminar(borrando.value.id)
  guardando.value = false
  if (e) { toast.error(e); return }
  borrando.value = null
  toast.success(t('jornadas.deleted'))
  await cargar()
}
</script>
