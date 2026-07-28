<template>
  <div>
    <UiPageHeader :title="t('platform.lics.title')" :description="t('platform.lics.desc')">
      <template #actions>
        <UiButton @click="navigateTo('/platform/licencias/nueva')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {{ t('platform.lics.new') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="flex items-center gap-2.5 mb-[22px] flex-wrap">
      <UiSearchInput v-model="q" :placeholder="t('platform.lics.searchPh')" max-width="xs" class="!w-[280px]" />
      <UiSelect v-model="estadoFiltro" variant="toolbar" :prefix="t('platform.lics.colState')" :options="estadoOpciones" />
    </div>

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
      <template #cell-organizacion="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
            {{ (row.organizaciones?.nombre ?? '—').charAt(0).toUpperCase() }}
          </div>
          <p class="font-extrabold text-gray-800">{{ row.organizaciones?.nombre ?? '—' }}</p>
        </div>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :variant="licenciaVariant(row.estado)" dot>{{ t('state.' + row.estado) }}</UiBadge>
      </template>
      <template #cell-cupos="{ row }">
        <span class="text-[13px] text-gray-600 font-semibold">{{ row.max_comunidades }} · {{ row.max_educadores }} · {{ row.max_personalizados }}</span>
      </template>
      <template #cell-vigencia="{ row }">
        <span class="text-[13px] text-gray-600 font-semibold">{{ fechaCorta(row.fecha_inicio) }} — {{ row.fecha_fin ? fechaCorta(row.fecha_fin) : t('platform.lics.noExpiry') }}</span>
      </template>
      <template #cell-paises="{ row }">
        <span class="text-[13px] text-gray-600 font-semibold">{{ row.paises?.length ? row.paises.join(', ') : t('platform.orgDetail.global') }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            :title="t('common.edit')"
            @click.stop="navigateTo(`/platform/licencias/${row.id}`)"
          >
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-brand-primary-50 hover:text-brand-primary-700 transition-colors"
            :title="t('platform.orgDetail.renew')"
            @click.stop="navigateTo(`/platform/licencias/nueva?org=${row.organizaciones?.id ?? ''}`)"
          >
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            :title="t('common.delete')"
            @click.stop="eliminar(row)"
          >
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import type { LicenciaResumen } from '~/composables/usePlatform'
import { PAGE_SIZE } from '~/composables/usePlatform'

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
  { key: 'cupos', label: t('platform.lics.colQuota') },
  { key: 'vigencia', label: t('platform.lics.colValidity') },
  { key: 'paises', label: t('platform.lics.colCountries') },
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

async function eliminar(row: any) {
  if (!window.confirm(t('platform.lics.confirmDelete'))) return
  const { error } = await deleteLicencia(row.id)
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('platform.lics.deleted'))
  await load()
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

function licenciaVariant(estado?: string): 'green' | 'blue' | 'red' | 'gray' {
  const map: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
    ACTIVA: 'green', TRIAL: 'blue', VENCIDA: 'red', SUSPENDIDA: 'gray',
  }
  return map[estado ?? ''] ?? 'gray'
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
