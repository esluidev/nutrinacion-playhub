<template>
  <div>
    <UiPageHeader :title="t('platform.orgs.title')" :description="t('platform.orgs.desc')">
      <template #actions>
        <UiButton icon="plus" to="/platform/organizaciones/nueva">{{ t('platform.orgs.new') }}</UiButton>
      </template>
    </UiPageHeader>

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
      <!-- Búsqueda y filtros en servidor: viven en la barra integrada de la tabla -->
      <template #toolbar>
        <UiSearchInput v-model="q" :placeholder="t('platform.orgs.searchPh')" max-width="xs" />
        <UiSelect v-model="tipoFiltro" variant="toolbar" :prefix="t('platform.orgs.colType')" :options="tipoOpciones" />
        <UiSelect v-model="adminsFiltro" variant="toolbar" :prefix="t('platform.orgs.colAdmins')" :options="adminsOpciones" />
      </template>

      <template #cell-nombre="{ row }">
        <div class="flex items-center gap-3">
          <!-- La organización no significa nada por sí misma: tono estable según su nombre -->
          <UiSymbol size="md" :tone="uiToneFor(row.nombre)" class="font-black text-(--tone-strong)">
            {{ row.nombre.charAt(0).toUpperCase() }}
          </UiSymbol>
          <div class="min-w-0">
            <p class="truncate font-extrabold text-ink">{{ row.nombre }}</p>
            <p v-if="row.correo || row.telefono" class="ui-caption truncate">{{ [row.correo, row.telefono].filter(Boolean).join('  ·  ') }}</p>
          </div>
        </div>
      </template>
      <template #cell-tipo="{ row }">
        <UiBadge tone="neutral">{{ row.tipo?.nombre?.es ?? '—' }}</UiBadge>
      </template>
      <template #cell-admins="{ row }">
        <!-- con titular: su nombre (+N co-admins) · sin titular pero con admins: el conteo -->
        <span v-if="titularNombre(row)" class="font-semibold text-muted">
          {{ titularNombre(row) }}<span v-if="coadmins(row)" class="text-caption text-subtle"> +{{ coadmins(row) }}</span>
        </span>
        <span v-else-if="admins(row).length" class="font-semibold text-muted">
          {{ admins(row).length === 1 ? t('platform.orgs.adminsCountOne') : t('platform.orgs.adminsCount', { n: admins(row).length }) }}
        </span>
        <!-- Sin administradores: pendiente de invitar (sol), igual que en el resumen de Platform -->
        <UiBadge v-else tone="sun" dot>{{ t('platform.orgs.noAdmins') }}</UiBadge>
      </template>
      <template #cell-licencia="{ row }">
        <div v-if="row.lic" class="flex flex-wrap items-center gap-2">
          <UiBadge :tone="licenciaTone(row.lic.estado)" dot>{{ t('state.' + row.lic.estado) }}</UiBadge>
          <span
            v-if="row.lic.fecha_fin"
            :data-tone="finLicenciaTone(row.lic)"
            :class="['text-caption', finLicenciaTone(row.lic) ? 'font-extrabold text-(--tone-strong)' : 'font-semibold text-subtle']"
          >
            {{ t('platform.orgs.expires', { fecha: fechaCorta(row.lic.fecha_fin, locale) }) }}
          </span>
        </div>
        <!-- Sin licencia: le falta lo necesario para operar (coral) -->
        <UiBadge v-else tone="coral" dot>{{ t('platform.orgs.noLicense') }}</UiBadge>
      </template>
      <!-- Los países donde opera, con su bandera -->
      <template #cell-paises="{ row }">
        <span class="font-semibold text-muted">{{ (row.paises ?? []).map(etiquetaPais).join(' · ') || '—' }}</span>
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
            @click.stop="navigateTo(`/platform/organizaciones/${row.id}/editar`)"
          />
          <UiButton
            tone="neutral"
            size="sm"
            icon="trash"
            icon-only
            :label="t('common.delete')"
            :title="t('common.delete')"
            @click.stop="pedirEliminar(row)"
          />
        </div>
      </template>
    </UiDataTable>

    <!-- Dar de baja es PERMANENTE y se lleva todo: dice qué (conteos reales) y exige el nombre.
         Con storyboards personalizados la base lo impide: se explica y no se confirma. -->
    <UiConfirmDialog
      :open="!!borrando"
      :title="t('platform.orgs.deleteTitle')"
      :confirm-label="t('platform.orgs.deleteConfirm')"
      :require-text="bloqueada ? undefined : borrando?.nombre"
      :require-label="t('platform.orgs.deleteTypeName')"
      :disabled="!resumen || bloqueada"
      :loading="eliminando"
      @update:open="(v) => { if (!v) borrando = null }"
      @confirm="confirmarEliminar"
    >
      <p v-if="!resumen" class="text-subtle">{{ t('common.loading') }}</p>
      <template v-else-if="bloqueada">
        <p>{{ t('platform.orgs.deleteBlocked', { nombre: borrando?.nombre ?? '' }) }}</p>
        <ul class="mt-3 space-y-1 font-semibold text-muted">
          <li v-for="linea in lineasBloqueo" :key="linea" class="flex items-center gap-2">
            <!-- Lo que lo impide: coral -->
            <span class="size-1.5 shrink-0 rounded-full bg-(--tone-fill)" data-tone="coral" />{{ linea }}
          </li>
        </ul>
        <p class="mt-3">{{ t('platform.orgs.deleteBlockedHow') }}</p>
      </template>
      <template v-else>
        <p>{{ t('platform.orgs.deleteWarn', { nombre: borrando?.nombre ?? '' }) }}</p>
        <ul v-if="lineasResumen.length" class="mt-3 space-y-1 font-semibold text-muted">
          <li v-for="linea in lineasResumen" :key="linea" class="flex items-center gap-2">
            <!-- Lo que se pierde: coral -->
            <span class="size-1.5 shrink-0 rounded-full bg-(--tone-fill)" data-tone="coral" />{{ linea }}
          </li>
        </ul>
        <p v-else class="mt-3 text-subtle">{{ t('platform.orgs.deleteNoData') }}</p>
      </template>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { PAGE_SIZE } from '~/utils/paginacion'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgs.title', descKey: 'platform.orgs.desc' })

const { t, locale } = useT()
const { listOrganizaciones, listTiposOrganizacion, deleteOrganizacion, resumenBorradoOrganizacion } = usePlatform()
const { toast } = useToast()
const { etiqueta: etiquetaPais, cargar: cargarPaises } = usePaises()

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
  { key: 'paises', label: t('platform.orgs.colCountries') },
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
  cargarPaises()
  tipos.value = await listTiposOrganizacion()
  await load()
})

// ── Eliminar ─────────────────────────────────────────────────────────────────
// Se va entera: su operación (educadores, talleres y jornadas), licencias y administradores. Solo
// la impiden sus storyboards personalizados (se resuelven en Player).
const borrando = ref<{ id: number, nombre: string } | null>(null)
const resumen = ref<Awaited<ReturnType<typeof resumenBorradoOrganizacion>> | null>(null)
const eliminando = ref(false)
const bloqueada = computed(() => !!resumen.value && resumen.value.personalizados > 0)

const lineas = (pares: [number, string][]) => pares.filter(([n]) => n > 0).map(([n, k]) => tCount(t, k, n))
const lineasBloqueo = computed(() => {
  const r = resumen.value
  return r ? lineas([[r.personalizados, 'platform.orgs.personalizadosCount']]) : []
})
const lineasResumen = computed(() => {
  const r = resumen.value
  return r
    ? lineas([
        [r.educadores, 'orgHome.educadoresCount'],
        [r.talleres, 'orgHome.talleresCount'],
        [r.jornadas, 'orgHome.jornadasCount'],
        [r.licencias, 'platform.orgs.licenciasCount'],
        [r.administradores, 'platform.orgs.adminsLostCount'],
      ])
    : []
})

function pedirEliminar(row: { id: number, nombre: string }) {
  borrando.value = { id: row.id, nombre: row.nombre }
  resumen.value = null
  resumenBorradoOrganizacion(row.id).then((r) => { resumen.value = r })
}

async function confirmarEliminar() {
  if (!borrando.value) return
  eliminando.value = true
  const { error, bloqueada: rechazada } = await deleteOrganizacion(borrando.value.id)
  eliminando.value = false
  if (rechazada) {
    // Algo cambió desde que se abrió (p. ej., se le asignó un storyboard): se vuelve a contar.
    resumen.value = await resumenBorradoOrganizacion(borrando.value.id)
    return
  }
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('platform.orgs.deleted'))
  borrando.value = null
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

</script>
