<template>
  <div>
    <UiPageToolbar>
      <template #tabs>
        <UiSearchInput v-model="q" :placeholder="t('platform.invs.searchPh')" max-width="xs" />
        <UiSelect v-model="estadoFiltro" :options="estadoOpciones" class="w-40" />
      </template>
      <template #actions>
        <UiButton size="sm" @click="navigateTo('/platform/invitaciones/nueva')">{{ t('platform.invs.new') }}</UiButton>
      </template>
    </UiPageToolbar>

    <UiDataTable
      :columns="columns"
      :rows="invitaciones"
      :row-key="(i) => i.id"
      :loading="loading"
      :page="page"
      :total="total"
      :page-size="PAGE_SIZE"
      :empty-text="hayFiltros ? t('platform.invs.emptyFiltered') : t('platform.invs.empty')"
      @update:page="page = $event"
    >
      <template #cell-organizacion="{ row }">
        <NuxtLink
          v-if="row.organizaciones"
          :to="`/platform/organizaciones/${row.organizaciones.id}`"
          class="font-semibold text-brand-dark hover:text-brand-primary-600"
        >
          {{ row.organizaciones.nombre }}
        </NuxtLink>
        <span v-else>—</span>
      </template>
      <template #cell-email="{ row }">
        <span class="text-gray-600">{{ row.email ?? t('platform.invs.openLink') }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :variant="invitacionVariant(row.estado)">{{ t('state.' + row.estado) }}</UiBadge>
      </template>
      <template #cell-vence="{ row }">
        <span class="text-gray-400 text-xs">{{ row.expira_en ? fechaCorta(row.expira_en) : '—' }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <button class="text-xs text-brand-primary-600 font-semibold hover:underline" @click="copiarLink(row.token)">
          {{ copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink') }}
        </button>
        <button
          v-if="row.estado === 'PENDIENTE'"
          class="text-xs text-red-500 font-semibold hover:underline ml-3"
          @click="revocar(row.id)"
        >
          {{ t('platform.invs.revoke') }}
        </button>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import type { InvitacionResumen } from '~/composables/usePlatform'
import { PAGE_SIZE } from '~/composables/usePlatform'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.invs.title', descKey: 'platform.invs.desc' })

const { t, locale } = useT()
const { listInvitacionesAdmin, revokeInvitacion } = usePlatform()

const invitaciones = ref<InvitacionResumen[]>([])
const total = ref(0)
const loading = ref(true)
const page = ref(1)
const q = ref('')
const estadoFiltro = ref('todas')
const copiado = ref<string | null>(null)

const columns = computed(() => [
  { key: 'organizacion', label: t('platform.invs.colOrg') },
  { key: 'email', label: t('platform.invs.colEmail') },
  { key: 'estado', label: t('platform.invs.colState') },
  { key: 'vence', label: t('platform.invs.colExpires') },
  { key: 'acciones', label: t('platform.invs.colActions'), align: 'right' as const },
])

const estadoOpciones = computed(() => [
  { value: 'todas', label: t('platform.invs.allStates') },
  { value: 'PENDIENTE', label: t('state.PENDIENTE') },
  { value: 'USADA', label: t('state.USADA') },
  { value: 'REVOCADA', label: t('state.REVOCADA') },
  { value: 'EXPIRADA', label: t('state.EXPIRADA') },
])

const hayFiltros = computed(() => !!q.value || estadoFiltro.value !== 'todas')

async function load() {
  loading.value = true
  const { data, total: tt } = await listInvitacionesAdmin({
    q: q.value.trim() || undefined,
    estado: estadoFiltro.value,
    page: page.value,
  })
  invitaciones.value = data
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

async function revocar(id: number) {
  await revokeInvitacion(id)
  await load()
}

async function copiarLink(token: string) {
  await navigator.clipboard.writeText(`${window.location.origin}/invitacion/${token}`)
  copiado.value = token
  setTimeout(() => (copiado.value = null), 1500)
}

function invitacionVariant(estado?: string): 'green' | 'blue' | 'red' | 'gray' {
  const map: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
    PENDIENTE: 'blue', USADA: 'green', EXPIRADA: 'gray', REVOCADA: 'red',
  }
  return map[estado ?? ''] ?? 'gray'
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
