<template>
  <div>
    <UiPageHeader :title="t('coms.title')" :description="t('coms.desc')">
      <template #actions>
        <!-- El cupo lo exige la base (trigger 0007); el botón solo se apaga y el motivo
             vive en su tooltip — sin aritmética en pantalla. -->
        <div :title="puedeCrear ? undefined : motivoSinAlta">
          <UiButton icon="plus" :disabled="!puedeCrear" @click="navigateTo('/organizacion/comunidades/nueva')">
            {{ t('coms.new') }}
          </UiButton>
        </div>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="comunidades"
      :row-key="(c) => c.id"
      :loading="loading"
      :empty-text="t('coms.empty')"
      searchable
      :search-keys="['nombre', 'correo', 'telefono']"
      :search-placeholder="t('coms.searchPh')"
      :filters="filtros"
      clickable
      @row-click="entrar"
    >
      <template #cell-nombre="{ row }">
        <div class="flex items-center gap-3">
          <!-- La comunidad no significa nada por sí misma: tono estable según su nombre -->
          <UiSymbol size="md" :tone="uiToneFor(row.nombre)" class="font-black text-(--tone-strong)">
            {{ row.nombre.charAt(0).toUpperCase() }}
          </UiSymbol>
          <div class="min-w-0">
            <p class="font-extrabold text-ink">{{ row.nombre }}</p>
            <p v-if="row.descripcion" class="ui-caption max-w-md truncate">{{ row.descripcion }}</p>
          </div>
        </div>
      </template>
      <template #cell-correo="{ row }">
        <span v-if="row.correo" class="block truncate text-body font-semibold text-muted">{{ row.correo }}</span>
        <span v-else class="font-semibold text-disabled">—</span>
      </template>
      <template #cell-telefono="{ row }">
        <span v-if="row.telefono" class="text-body font-semibold text-muted">{{ row.telefono }}</span>
        <span v-else class="font-semibold text-disabled">—</span>
      </template>
      <template #cell-pais="{ row }">
        <span v-if="row.pais" class="text-body font-semibold text-muted">{{ paisLabel(row.pais) }}</span>
        <span v-else class="font-semibold text-disabled">—</span>
      </template>
      <template #cell-educadores="{ row }">
        <span class="font-extrabold tabular-nums text-ink">{{ row.educadores?.[0]?.count ?? 0 }}</span>
      </template>
      <template #cell-colaboradores="{ row }">
        <span class="font-extrabold tabular-nums text-ink">{{ row.colaboradores?.[0]?.count ?? 0 }}</span>
      </template>
      <template #cell-participantes="{ row }">
        <span class="font-extrabold tabular-nums text-ink">{{ row.participantes?.[0]?.count ?? 0 }}</span>
      </template>
      <!-- Entrar no es una acción de tabla: la FILA entera es la puerta (clickable).
           Acciones de tabla: neutras; el borrado se confirma en coral (UiConfirmDialog). -->
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <UiButton
            tone="neutral"
            size="sm"
            icon="pencil"
            icon-only
            :label="t('coms.edit')"
            :title="t('coms.edit')"
            @click.stop="navigateTo(`/organizacion/comunidades/${row.id}/editar`)"
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

    <!-- Borrar es PERMANENTE y cascadea: el modal dice exactamente qué se lleva (conteos
         reales) y exige escribir el nombre de la comunidad para desbloquear el botón. -->
    <UiConfirmDialog
      :open="!!borrando"
      :title="t('coms.deleteTitle')"
      :confirm-label="t('coms.deleteConfirm')"
      :require-text="borrando?.nombre"
      :require-label="t('coms.deleteTypeName')"
      :loading="eliminando"
      @update:open="(v) => { if (!v) borrando = null }"
      @confirm="confirmarEliminar"
    >
      <p>{{ t('coms.deleteWarn', { nombre: borrando?.nombre ?? '' }) }}</p>
      <ul v-if="resumen && lineasResumen.length" class="mt-3 space-y-1 font-semibold text-muted">
        <li v-for="linea in lineasResumen" :key="linea" class="flex items-center gap-2">
          <!-- Lo que se pierde: coral -->
          <span class="size-1.5 shrink-0 rounded-full bg-(--tone-fill)" data-tone="coral" />{{ linea }}
        </li>
      </ul>
      <p v-else-if="resumen" class="mt-3 text-subtle">{{ t('coms.deleteNoData') }}</p>
      <p v-else class="mt-3 text-subtle">{{ t('common.loading') }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { ComunidadFila } from '~/composables/useComunidades'

definePageMeta({ layout: 'dashboard', titleKey: 'coms.title', descKey: 'coms.desc' })

const { t, locale } = useT()
const { orgActiva, setContexto } = useContexto()
// En dev sin Supabase estos composables no pueden crear el cliente: la página monta
// con la tabla vacía (misma guarda que usa el header con useInvitaciones).
const comus = isSupabaseConfigured() ? useComunidades() : null
const platform = isSupabaseConfigured() ? usePlatform() : null
const { getCupoComunidades } = useOrganizacion()
const { fetchUser } = useAuth()
const { toast } = useToast()

const comunidades = ref<ComunidadFila[]>([])
const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const loading = ref(true)

const columns = computed(() => [
  { key: 'nombre', label: t('coms.colName') },
  // El contacto cede su sitio a las cifras en pantallas estrechas (se ve al editar la comunidad).
  { key: 'correo', label: t('coms.colEmail'), headerClass: 'hidden xl:table-cell', cellClass: 'hidden xl:table-cell' },
  { key: 'telefono', label: t('coms.colPhone'), headerClass: 'hidden xl:table-cell', cellClass: 'hidden xl:table-cell' },
  { key: 'pais', label: t('coms.colCountry') },
  { key: 'educadores', label: t('coms.colEducators'), align: 'center' as const },
  { key: 'colaboradores', label: t('coms.colCollaborators'), align: 'center' as const },
  { key: 'participantes', label: t('coms.colParticipants'), align: 'center' as const },
  { key: 'acciones', label: t('coms.colActions'), align: 'right' as const },
])

function paisLabel(codigo: string) {
  const p = paises.value.find(x => x.codigo === codigo)
  const nombre = p?.nombre?.[locale.value] ?? p?.nombre?.es ?? codigo
  return p ? `${p.bandera ?? ''} ${nombre}`.trim() : codigo
}

// Filtro de país construido con los países PRESENTES en la lista (declarativo: lo pinta
// y aplica UiDataTable).
const filtros = computed(() => {
  const codigos = [...new Set(comunidades.value.map(c => c.pais).filter((p): p is string => !!p))]
  if (!codigos.length) return []
  return [{
    key: 'pais',
    label: t('coms.colCountry'),
    options: codigos.map(c => ({ value: c, label: paisLabel(c) })),
  }]
})

// Entrar a una comunidad = cambiar el contexto y bajar a su operación. Por eso el detalle de
// una comunidad no es una página aparte: su "detalle" es su dashboard.
function entrar(c: ComunidadFila) {
  setContexto(c.organizacion_id, c.id)
  navigateTo('/dashboard')
}

// El cupo lo decide la licencia vigente (y lo exige el trigger 0007 en la base).
const cupo = ref<{ max: number | null, usadas: number }>({ max: null, usadas: 0 })
const puedeCrear = computed(() => cupo.value.max !== null && cupo.value.usadas < cupo.value.max)
const motivoSinAlta = computed(() =>
  cupo.value.max === null ? t('coms.sinLicencia') : t('coms.cupoLleno'))

// Borrar una comunidad CASCADEA. El modal muestra los conteos reales de lo que se va
// y exige escribir el nombre; solo entonces se ejecuta.
const borrando = ref<ComunidadFila | null>(null)
const resumen = ref<{ educadores: number, grupos: number, talleres: number, colaboradores: number, participantes: number } | null>(null)
const eliminando = ref(false)

const lineasResumen = computed(() => {
  const r = resumen.value
  if (!r) return []
  return [
    [r.educadores, tCount(t, 'orgHome.educadoresCount', r.educadores)],
    [r.grupos, tCount(t, 'coms.gruposCount', r.grupos)],
    [r.talleres, tCount(t, 'orgHome.talleresCount', r.talleres)],
    [r.colaboradores, tCount(t, 'coms.colaboradoresCount', r.colaboradores)],
    [r.participantes, tCount(t, 'coms.participantesCount', r.participantes)],
  ].filter(([n]) => (n as number) > 0).map(([, linea]) => linea as string)
})

function pedirEliminar(c: ComunidadFila) {
  borrando.value = c
  resumen.value = null
  if (!comus) {
    // Demo: conteos de muestra para ver el modal completo.
    resumen.value = { educadores: 6, grupos: 2, talleres: 6, colaboradores: 1, participantes: 12 }
    return
  }
  comus.resumenBorrado(c.id).then((r) => { resumen.value = r })
}

async function confirmarEliminar() {
  if (!borrando.value) return
  if (!comus) {
    toast.success(t('coms.deleted'))
    borrando.value = null
    return
  }
  eliminando.value = true
  const { error } = await comus.remove(borrando.value.id)
  eliminando.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('coms.deleted'))
  borrando.value = null
  await cargar()
  // La superficie de acceso cambió (una comunidad menos): el switcher debe reflejarlo.
  await fetchUser()
}

// Filas demo (dev sin Supabase): dejan ver columnas, acciones y el modal de borrado.
const DEMO_COMUNIDADES: ComunidadFila[] = [
  { id: 1, nombre: 'Comunidad Centro', descripcion: 'Centro comunitario', correo: 'centro@nutrinacion.com', telefono: '+52 55 1234 5678', pais: 'MX', organizacion_id: 1, created_at: '', educadores: [{ count: 6 }], colaboradores: [{ count: 2 }], participantes: [{ count: 12 }] },
  { id: 2, nombre: 'Comunidad Norte', descripcion: 'Programa escolar', correo: null, telefono: null, pais: 'MX', organizacion_id: 1, created_at: '', educadores: [{ count: 2 }], colaboradores: [{ count: 0 }], participantes: [{ count: 0 }] },
]

async function cargar() {
  // El cupo se resuelve siempre (getCupoComunidades es demo-safe por sí mismo).
  cupo.value = await getCupoComunidades()
  if (!orgActiva.value || !comus || !platform) {
    comunidades.value = DEMO_COMUNIDADES
    loading.value = false
    return
  }
  paises.value = await platform.listPaises()
  comunidades.value = await comus.listPorOrg(orgActiva.value.id)
  loading.value = false
}

onMounted(cargar)

// Al volver de crear/editar, la superficie de acceso cambió (hay una comunidad nueva).
onActivated(async () => {
  await fetchUser()
})
</script>
