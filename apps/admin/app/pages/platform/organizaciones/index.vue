<template>
  <div>
    <UiPageHeader :title="t('platform.orgs.title')" :description="t('platform.orgs.desc')">
      <template #actions>
        <UiButton @click="navigateTo('/platform/organizaciones/nueva')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {{ t('platform.orgs.new') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="flex items-center gap-2.5 mb-[22px] flex-wrap">
      <UiSearchInput v-model="q" :placeholder="t('platform.orgs.searchPh')" max-width="xs" class="!w-[280px]" />
      <UiSelect v-model="tipoFiltro" variant="toolbar" :prefix="t('platform.orgs.colType')" :options="tipoOpciones" />
      <UiSelect v-model="adminsFiltro" variant="toolbar" :prefix="t('platform.orgs.colAdmins')" :options="adminsOpciones" />
    </div>

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
        <div class="flex items-center gap-3">
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
            {{ row.nombre.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="font-extrabold text-gray-800">{{ row.nombre }}</p>
            <p v-if="row.correo || row.telefono" class="text-[12.5px] text-gray-500 truncate">{{ [row.correo, row.telefono].filter(Boolean).join('  ·  ') }}</p>
          </div>
        </div>
      </template>
      <template #cell-tipo="{ row }">
        <span class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-gray-100 text-gray-600">{{ row.tipo?.nombre?.es ?? '—' }}</span>
      </template>
      <template #cell-admins="{ row }">
        <!-- con titular: su nombre (+N co-admins) · sin titular pero con admins: el conteo -->
        <span v-if="titularNombre(row)" class="text-[13px] text-gray-600 font-semibold">
          {{ titularNombre(row) }}<span v-if="coadmins(row)" class="text-xs text-gray-400"> +{{ coadmins(row) }}</span>
        </span>
        <span v-else-if="admins(row).length" class="text-[13px] text-gray-600 font-semibold">
          {{ admins(row).length === 1 ? t('platform.orgs.adminsCountOne') : t('platform.orgs.adminsCount', { n: admins(row).length }) }}
        </span>
        <span v-else class="text-xs text-amber-600 font-bold">{{ t('platform.orgs.noAdmins') }}</span>
      </template>
      <template #cell-licencia="{ row }">
        <div v-if="row.lic" class="flex items-center gap-2">
          <UiBadge :variant="licenciaVariant(row.lic.estado)" dot>{{ t('state.' + row.lic.estado) }}</UiBadge>
          <span v-if="row.lic.fecha_fin" class="text-xs text-gray-400">{{ t('platform.orgs.expires', { fecha: fechaCorta(row.lic.fecha_fin) }) }}</span>
        </div>
        <UiBadge v-else variant="amber" dot>{{ t('platform.orgs.noLicense') }}</UiBadge>
      </template>
      <template #cell-comunidades="{ row }">
        <span class="text-gray-800 font-extrabold">{{ row.comunidades[0]?.count ?? 0 }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            :title="t('common.edit')"
            @click.stop="navigateTo(`/platform/organizaciones/${row.id}/editar`)"
          >
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            :title="t('common.delete')"
            @click.stop="eliminar(row)"
          >
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import { PAGE_SIZE } from '~/composables/usePlatform'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgs.title', descKey: 'platform.orgs.desc' })

const { t, locale } = useT()
const { listOrganizaciones, listTiposOrganizacion, deleteOrganizacion } = usePlatform()
const { toast } = useToast()

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
  { key: 'acciones', label: '', align: 'right' as const },
])

// Las opciones llevan etiquetas cortas: el prefijo del trigger ("Tipo: …") lo pone UiSelect.
const tipoOpciones = computed(() => [
  { value: '', label: t('common.all') },
  ...tipos.value.map(x => ({ value: x.id, label: x.nombre?.es ?? x.codigo })),
])
const adminsOpciones = computed(() => [
  { value: 'todos', label: t('common.all') },
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

// Las FK restrict protegen: si la org tiene comunidades/licencias/admins, Postgres
// rechaza el borrado y el error se muestra tal cual.
async function eliminar(row: any) {
  if (!window.confirm(t('platform.orgs.confirmDelete'))) return
  const { error } = await deleteOrganizacion(row.id)
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('platform.orgs.deleted'))
  await load()
}

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
