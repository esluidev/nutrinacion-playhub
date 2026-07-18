<template>
  <div>
    <UiPageToolbar>
      <template #tabs>
        <UiSearchInput v-model="q" :placeholder="t('platform.orgs.searchPh')" max-width="xs" />
        <UiSelect v-model="tipoFiltro" :options="tipoOpciones" class="w-40" />
        <UiSelect v-model="adminsFiltro" :options="adminsOpciones" class="w-52" />
      </template>
      <template #actions>
        <UiButton size="sm" @click="navigateTo('/platform/organizaciones/nueva')">{{ t('platform.orgs.new') }}</UiButton>
      </template>
    </UiPageToolbar>

    <UiDataTable
      :columns="columns"
      :rows="orgs"
      :row-key="(o) => o.id"
      :loading="loading"
      :page="page"
      :total="total"
      :page-size="PAGE_SIZE"
      :empty-text="hayFiltros ? t('platform.orgs.emptyFiltered') : t('platform.orgs.empty')"
      clickable
      @row-click="(o) => navigateTo(`/platform/organizaciones/${o.id}`)"
      @update:page="page = $event"
    >
      <template #cell-nombre="{ row }">
        <p class="font-semibold text-brand-dark">{{ row.nombre }}</p>
        <p v-if="row.correo || row.telefono" class="text-xs text-gray-400">{{ [row.correo, row.telefono].filter(Boolean).join('  ·  ') }}</p>
      </template>
      <template #cell-tipo="{ row }">
        <span class="text-gray-500">{{ row.tipo?.nombre?.es ?? '—' }}</span>
      </template>
      <template #cell-admins="{ row }">
        <!-- con titular: su nombre (+N co-admins) · sin titular pero con admins: el conteo -->
        <span v-if="titularNombre(row)" class="text-gray-600">
          {{ titularNombre(row) }}<span v-if="coadmins(row)" class="text-xs text-gray-400"> +{{ coadmins(row) }}</span>
        </span>
        <span v-else-if="admins(row).length" class="text-xs text-gray-500">
          {{ t('platform.orgs.adminsCount', { n: admins(row).length }) }}
        </span>
        <span v-else class="text-xs text-amber-600">{{ t('platform.orgs.noAdmins') }}</span>
      </template>
      <template #cell-licencia="{ row }">
        <div v-if="row.lic" class="flex items-center gap-2">
          <UiBadge :variant="licenciaVariant(row.lic.estado)" dot>{{ t('state.' + row.lic.estado) }}</UiBadge>
          <span v-if="row.lic.fecha_fin" class="text-xs text-gray-400">{{ t('platform.orgs.expires', { fecha: fechaCorta(row.lic.fecha_fin) }) }}</span>
        </div>
        <span v-else class="text-xs text-gray-400">{{ t('platform.orgs.noLicense') }}</span>
      </template>
      <template #cell-comunidades="{ row }">
        <span class="text-gray-600">{{ row.comunidades[0]?.count ?? 0 }}</span>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import { PAGE_SIZE } from '~/composables/usePlatform'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgs.title', descKey: 'platform.orgs.desc' })

const { t, locale } = useT()
const { listOrganizaciones, listTiposOrganizacion } = usePlatform()

const orgs = ref<any[]>([])
const total = ref(0)
const loading = ref(true)
const page = ref(1)

const q = ref('')
const tipoFiltro = ref<number | ''>('')
const adminsFiltro = ref<'todos' | 'con' | 'sin'>('todos')
const tipos = ref<{ id: number, codigo: string, nombre: Record<string, string> }[]>([])

const columns = computed(() => [
  { key: 'nombre', label: t('platform.orgs.colOrg') },
  { key: 'tipo', label: t('platform.orgs.colType') },
  { key: 'admins', label: t('platform.orgs.colAdmins') },
  { key: 'licencia', label: t('platform.orgs.colLicense') },
  { key: 'comunidades', label: t('platform.orgs.colCommunities'), align: 'center' as const },
])

const tipoOpciones = computed(() => [
  { value: '', label: t('platform.orgs.allTypes') },
  ...tipos.value.map(x => ({ value: x.id, label: x.nombre?.es ?? x.codigo })),
])
const adminsOpciones = computed(() => [
  { value: 'todos', label: t('platform.orgs.withWithoutAdmins') },
  { value: 'con', label: t('platform.orgs.withAdmins') },
  { value: 'sin', label: t('platform.orgs.withoutAdmins') },
])

const hayFiltros = computed(() => !!q.value || !!tipoFiltro.value || adminsFiltro.value !== 'todos')

function masReciente(arr: { created_at: string }[]) {
  return arr.reduce<any>((a, l) => (!a || l.created_at > a.created_at ? l : a), null)
}

type AdminRow = { titular: boolean, perfil: { nombre: string | null, apellido: string | null } | null }
function admins(row: any): AdminRow[] {
  return (row.administradores ?? []) as AdminRow[]
}
function titularNombre(row: any) {
  const tit = admins(row).find(a => a.titular)   // solo el titular real, sin fallback
  if (!tit?.perfil) return ''
  return `${tit.perfil.nombre ?? ''} ${tit.perfil.apellido ?? ''}`.trim()
}
// Co-admins = admins que NO son el titular (si no hay titular, son todos).
function coadmins(row: any) {
  const list = admins(row)
  return list.some(a => a.titular) ? list.length - 1 : list.length
}

async function load() {
  loading.value = true
  const { data, total: tt } = await listOrganizaciones({
    q: q.value.trim() || undefined,
    tipo_id: tipoFiltro.value || null,
    admins: adminsFiltro.value,
    page: page.value,
  })
  orgs.value = data.map(o => ({ ...o, lic: masReciente(o.licencias) }))
  total.value = tt
  loading.value = false
}

onMounted(async () => {
  tipos.value = await listTiposOrganizacion()
  await load()
})

function resetYCargar() {
  if (page.value !== 1) page.value = 1
  else load()
}

watch([tipoFiltro, adminsFiltro], resetYCargar)
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
