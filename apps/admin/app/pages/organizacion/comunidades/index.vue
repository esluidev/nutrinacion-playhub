<template>
  <div>
    <UiPageToolbar>
      <template #tabs>
        <p class="text-sm text-gray-500 px-1">{{ orgActiva?.nombre }}</p>
      </template>
      <template #actions>
        <UiButton size="sm" @click="navigateTo('/organizacion/comunidades/nueva')">{{ t('coms.new') }}</UiButton>
      </template>
    </UiPageToolbar>

    <UiDataTable
      :columns="columns"
      :rows="comunidades"
      :row-key="(c) => c.id"
      :loading="loading"
      :empty-text="t('coms.empty')"
      clickable
      @row-click="entrar"
    >
      <template #cell-nombre="{ row }">
        <p class="font-semibold text-brand-dark">{{ row.nombre }}</p>
        <p v-if="row.descripcion" class="text-xs text-gray-400 truncate max-w-md">{{ row.descripcion }}</p>
      </template>
      <template #cell-pais="{ row }">
        <span class="text-gray-500 text-sm">{{ paisLabel(row.pais) }}</span>
      </template>
      <template #cell-educadores="{ row }">
        <span class="text-gray-600">{{ row.educadores?.[0]?.count ?? 0 }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <button class="text-xs text-brand-primary-600 font-semibold hover:underline" @click.stop="entrar(row)">
          {{ t('coms.enter') }}
        </button>
        <NuxtLink
          :to="`/organizacion/comunidades/${row.id}/editar`"
          class="text-xs text-gray-500 font-semibold hover:underline ml-3"
          @click.stop
        >
          {{ t('coms.edit') }}
        </NuxtLink>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import type { ComunidadFila } from '~/composables/useComunidades'

definePageMeta({ layout: 'dashboard', titleKey: 'coms.title', descKey: 'coms.desc' })

const { t } = useT()
const { orgActiva, setContexto } = useContexto()
const { listPorOrg } = useComunidades()
const { listPaises } = usePlatform()
const { fetchUser } = useAuth()

const comunidades = ref<ComunidadFila[]>([])
const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const loading = ref(true)

const columns = computed(() => [
  { key: 'nombre', label: t('coms.colName') },
  { key: 'pais', label: t('coms.colCountry') },
  { key: 'educadores', label: t('coms.colEducators'), align: 'center' as const },
  { key: 'acciones', label: '', align: 'right' as const },
])

function paisLabel(codigo: string | null) {
  if (!codigo) return t('coms.noCountry')
  const p = paises.value.find(x => x.codigo === codigo)
  return p ? `${p.bandera ?? ''} ${p.nombre?.es ?? p.codigo}`.trim() : codigo
}

// Entrar a una comunidad = cambiar el contexto y bajar a su operación. Por eso el detalle de
// una comunidad no es una página aparte: su "detalle" es su dashboard.
function entrar(c: ComunidadFila) {
  setContexto(c.organizacion_id, c.id)
  navigateTo('/dashboard')
}

onMounted(async () => {
  if (!orgActiva.value) {
    loading.value = false
    return
  }
  paises.value = await listPaises()
  comunidades.value = await listPorOrg(orgActiva.value.id)
  loading.value = false
})

// Al volver de crear/editar, la superficie de acceso cambió (hay una comunidad nueva).
onActivated(async () => {
  await fetchUser()
})
</script>
