<template>
  <div>
    <UiPageToolbar>
      <template #tabs>
        <UiSearchInput v-model="q" :placeholder="t('platform.lics.searchPh')" max-width="xs" />
        <UiSelect v-model="estadoFiltro" :options="estadoOpciones" class="w-44" />
      </template>
      <template #actions>
        <UiButton size="sm" @click="navigateTo('/platform/licencias/nueva')">{{ t('platform.lics.new') }}</UiButton>
      </template>
    </UiPageToolbar>

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
        <span class="font-semibold text-brand-dark">{{ row.organizaciones?.nombre ?? '—' }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :variant="licenciaVariant(row.estado)" dot>{{ t('state.' + row.estado) }}</UiBadge>
      </template>
      <template #cell-cupos="{ row }">
        <span class="text-gray-500 text-xs">{{ row.max_comunidades }} · {{ row.max_educadores }} · {{ row.max_personalizados }}</span>
      </template>
      <template #cell-vigencia="{ row }">
        <span class="text-gray-500 text-xs">{{ fechaCorta(row.fecha_inicio) }} — {{ row.fecha_fin ? fechaCorta(row.fecha_fin) : t('platform.lics.noExpiry') }}</span>
      </template>
      <template #cell-paises="{ row }">
        <span class="text-gray-500 text-xs">{{ row.paises?.length ? row.paises.join(', ') : t('platform.orgDetail.global') }}</span>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import type { LicenciaResumen } from '~/composables/usePlatform'
import { PAGE_SIZE } from '~/composables/usePlatform'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.lics.title', descKey: 'platform.lics.desc' })

const { t, locale } = useT()
const { listLicencias } = usePlatform()

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
])

const estadoOpciones = computed(() => [
  { value: 'todas', label: t('platform.lics.allStates') },
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
