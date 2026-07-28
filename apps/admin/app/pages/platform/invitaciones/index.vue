<template>
  <div>
    <UiPageHeader :title="t('platform.invs.title')" :description="t('platform.invs.desc')">
      <template #actions>
        <UiButton @click="navigateTo('/platform/invitaciones/nueva')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {{ t('platform.invs.new') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="flex items-center gap-2.5 mb-[22px] flex-wrap">
      <UiSearchInput v-model="q" :placeholder="t('platform.invs.searchPh')" max-width="xs" class="!w-[280px]" />
      <UiSelect v-model="estadoFiltro" variant="toolbar" :prefix="t('platform.invs.colState')" :options="estadoOpciones" />
    </div>

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
          class="flex items-center gap-3 group"
        >
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
            {{ row.organizaciones.nombre.charAt(0).toUpperCase() }}
          </div>
          <p class="font-extrabold text-gray-800 group-hover:text-brand-primary-700 transition-colors">{{ row.organizaciones.nombre }}</p>
        </NuxtLink>
        <span v-else>—</span>
      </template>
      <template #cell-email="{ row }">
        <span v-if="row.email" class="text-[13px] text-gray-700 font-semibold">{{ row.email }}</span>
        <span v-else class="text-[13px] text-gray-500 font-semibold italic">{{ t('platform.invs.openLink') }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :variant="invitacionVariant(row.estado)" dot>{{ t('state.' + row.estado) }}</UiBadge>
      </template>
      <template #cell-vence="{ row }">
        <span class="text-gray-500 text-xs font-semibold">{{ row.expira_en ? fechaCorta(row.expira_en) : '—' }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            :class="[
              'w-[30px] h-[30px] rounded-[8px] flex items-center justify-center transition-colors',
              copiado === row.token ? 'bg-brand-primary-50 text-brand-primary-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
            ]"
            :title="copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink')"
            @click="copiarLink(row.token)"
          >
            <svg v-if="copiado === row.token" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <svg v-else class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </button>
          <button
            v-if="row.estado === 'PENDIENTE'"
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            :title="t('platform.invs.revoke')"
            @click="revocar(row.id)"
          >
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
  { value: 'todas', label: t('common.all') },
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
