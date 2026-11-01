<template>
  <div>
    <UiPageHeader :title="t('platform.lics.title')" :description="t('platform.lics.desc')">
      <template #actions>
        <UiButton icon="plus" to="/platform/licencias/nueva">{{ t('platform.lics.new') }}</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="licencias"
      :row-key="(l) => l.id"
      :loading="loading"
      :page="page"
      :total="total"
      :page-size="PAGE_SIZE"
      :empty-text="hayFiltros ? t('platform.lics.emptyFiltered') : t('platform.lics.empty')"
      clickable
      @row-click="(l) => navigateTo(`/platform/licencias/${l.id}`)"
      @update:page="page = $event"
    >
      <!-- Búsqueda y filtro en servidor: viven en la barra integrada de la tabla -->
      <template #toolbar>
        <UiSearchInput v-model="q" :placeholder="t('platform.lics.searchPh')" max-width="xs" />
        <UiSelect v-model="estadoFiltro" variant="toolbar" :prefix="t('platform.lics.colState')" :options="estadoOpciones" />
      </template>

      <template #cell-organizacion="{ row }">
        <div class="flex items-center gap-3">
          <!-- La organización no significa nada por sí misma: tono estable según su nombre -->
          <UiSymbol size="md" :tone="uiToneFor(row.organizaciones?.nombre ?? '—')" class="font-black text-(--tone-strong)">
            {{ (row.organizaciones?.nombre ?? '—').charAt(0).toUpperCase() }}
          </UiSymbol>
          <p class="truncate font-extrabold text-ink">{{ row.organizaciones?.nombre ?? '—' }}</p>
        </div>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="licenciaTone(row.estado)" dot>{{ t('state.' + row.estado) }}</UiBadge>
      </template>
      <template #cell-vigencia="{ row }">
        <span class="font-semibold text-muted">
          {{ fechaCorta(row.fecha_inicio, locale) }} —
          <span :data-tone="finLicenciaTone(row)" :class="finLicenciaTone(row) && 'font-extrabold text-(--tone-strong)'">{{ row.fecha_fin ? fechaCorta(row.fecha_fin, locale) : t('platform.lics.noExpiry') }}</span>
        </span>
      </template>
      <template #cell-notas="{ row }">
        <span class="line-clamp-1 font-semibold text-muted">{{ row.notas || '—' }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Acciones de tabla: neutras; el borrado se confirma en coral (UiConfirmDialog) -->
        <div class="flex items-center justify-end gap-2">
          <UiButton
            tone="neutral"
            size="sm"
            icon="pencil"
            icon-only
            :label="t('common.edit')"
            :title="t('common.edit')"
            @click.stop="navigateTo(`/platform/licencias/${row.id}`)"
          />
          <UiButton
            tone="neutral"
            size="sm"
            icon="retry"
            icon-only
            :label="t('platform.orgDetail.renew')"
            :title="t('platform.orgDetail.renew')"
            @click.stop="navigateTo(`/platform/licencias/nueva?org=${row.organizaciones?.id ?? ''}`)"
          />
          <UiButton
            tone="neutral"
            size="sm"
            icon="trash"
            icon-only
            :label="t('common.delete')"
            :title="t('common.delete')"
            @click.stop="borrando = row"
          />
        </div>
      </template>
    </UiDataTable>

    <UiConfirmDialog
      :open="!!borrando"
      :title="t('platform.lics.deleteTitle')"
      :confirm-label="t('common.delete')"
      :loading="eliminando"
      @update:open="(v) => { if (!v) borrando = null }"
      @confirm="confirmarEliminar"
    >
      <p>{{ t('platform.lics.deleteWarn', { org: borrando?.organizaciones?.nombre ?? '—', vigencia: borrando ? vigencia(borrando) : '' }) }}</p>
      <p class="mt-3">{{ t('platform.lics.deleteEffect') }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { LicenciaResumen } from '~/composables/usePlatform'
import { PAGE_SIZE } from '~/utils/paginacion'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.lics.title', descKey: 'platform.lics.desc' })

const { t, locale } = useT()
const { listLicencias, deleteLicencia } = usePlatform()
const { toast } = useToast()

const licencias = ref<LicenciaResumen[]>([])
const total = ref(0)
const loading = ref(true)
const page = ref(1)
const q = ref('')
const estadoFiltro = ref('todas')

const columns = computed(() => [
  { key: 'organizacion', label: t('platform.lics.colOrg') },
  { key: 'estado', label: t('platform.lics.colState') },
  { key: 'vigencia', label: t('platform.lics.colValidity') },
  { key: 'notas', label: t('platform.lics.notes') },
  { key: 'acciones', label: '', align: 'right' as const },
])

const estadoOpciones = computed(() => [
  { value: 'todas', label: t('common.all') },
  { value: 'ACTIVA', label: t('state.ACTIVA') },
  { value: 'TRIAL', label: t('state.TRIAL') },
  { value: 'SUSPENDIDA', label: t('state.SUSPENDIDA') },
  { value: 'VENCIDA', label: t('state.VENCIDA') },
])

const hayFiltros = computed(() => !!q.value || estadoFiltro.value !== 'todas')

async function load() {
  loading.value = true
  const { data, total: tt } = await listLicencias({
    q: q.value.trim() || undefined,
    estado: estadoFiltro.value,
    page: page.value,
  })
  licencias.value = data
  total.value = tt
  loading.value = false
}

onMounted(load)

const borrando = ref<LicenciaResumen | null>(null)
const eliminando = ref(false)

async function confirmarEliminar() {
  if (!borrando.value) return
  eliminando.value = true
  const { error } = await deleteLicencia(borrando.value.id)
  eliminando.value = false
  if (error) {
    toast.error(error)
    return
  }
  borrando.value = null
  toast.success(t('platform.lics.deleted'))
  await load()
}

function vigencia(l: LicenciaResumen) {
  return `${fechaCorta(l.fecha_inicio, locale.value)} — ${l.fecha_fin ? fechaCorta(l.fecha_fin, locale.value) : t('platform.lics.noExpiry')}`
}

function resetYCargar() {
  if (page.value !== 1) page.value = 1
  else load()
}

watch(estadoFiltro, resetYCargar)
watch(page, load)

let searchTimer: ReturnType<typeof setTimeout>
watch(q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(resetYCargar, 300)
})

</script>
