<template>
  <!-- Educadores y sus grupos: dos tablas, como las demás listas de la organización (Programas, Jornadas, Lugares,
       Colaboradores), una por pestaña. Arriba, las pestañas a la izquierda y el buscador y el estado a la derecha: la
       misma barra en las dos (no cambia al cambiar de pestaña). La fila de un educador abre su ficha; su acceso a Educators (el enlace o restablecer el PIN) es el botón de
       la fila. La fila de un grupo abre el grupo (miembros, edición y borrado). -->
  <div>
    <UiPageHeader :title="t('educators.title')" :description="t('educators.desc')">
      <template #actions>
        <UiButton variant="outline" icon="plus" @click="navigateTo('/organizacion/educators/grupo-nuevo')">
          {{ t('educators.newGroup') }}
        </UiButton>
        <UiButton icon="user-plus" @click="navigateTo('/organizacion/educators/nuevo')">
          {{ t('educators.add') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <UiTabs v-model="tabModel" :items="tabItems" fit />
      <!-- Ocupa lo que queda de la línea, a la derecha; si no le quedan 320 px, baja a la suya. El
           buscador se encoge (hasta 320) y el filtro conserva su ancho: nunca se sale de la pantalla. -->
      <div class="flex min-w-0 grow basis-80 items-center justify-end gap-3">
        <UiSearchInput v-model="searchQuery" :placeholder="t('educators.searchPh')" max-width="xs" class="min-w-0 flex-1" />
        <UiSelect v-model="filterEstado" variant="toolbar" :prefix="t('educators.state')" :options="estadoOptions" />
      </div>
    </div>

    <!-- EDUCADORES -->
    <UiDataTable
      v-if="activeTab === 'educadores'"
      :columns="columnasEducadores"
      :rows="filteredEducators"
      :row-key="(e) => e.id"
      :loading="loading"
      :empty-text="educators.length ? t('table.emptyFiltered') : t('educators.empty')"
      clickable
      @row-click="(e) => navigateTo(`/organizacion/educators/${e.id}/editar`)"
    >
      <template #cell-educador="{ row }">
        <div class="flex min-w-0 items-center gap-3">
          <UiAvatar :name="row.nombre" :initials="row.initials" />
          <div class="min-w-0">
            <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
            <p v-if="dato(row.profesion)" class="truncate text-caption font-semibold text-muted">{{ row.profesion }}</p>
          </div>
        </div>
      </template>
      <template #cell-contacto="{ row }">
        <div class="min-w-0">
          <p class="truncate text-body font-semibold text-muted" :title="row.email">{{ row.email || '—' }}</p>
          <p v-if="dato(row.telefono)" class="truncate text-caption font-semibold text-subtle">{{ row.telefono }}</p>
        </div>
      </template>
      <template #cell-grupos="{ row }">
        <span class="block truncate text-body font-semibold text-muted" :title="row.grupos.join(', ')">{{ row.grupos.join(', ') || '—' }}</span>
      </template>
      <template #cell-talleres="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ row.talleres }}</span>
      </template>
      <template #cell-acceso="{ row }">
        <!-- Solo avisa lo pendiente o lo que falta: sin PIN, con su enlace (sol) o sin él (coral); con PIN, un enlace
             para restablecerlo sin usar (sol). Con PIN y nada pendiente, en texto. -->
        <UiBadge v-if="row.acceso !== 'pin'" :tone="enlacePendiente(row) ? 'sun' : 'coral'" class="whitespace-nowrap">
          {{ enlacePendiente(row) ? t('educators.notActivated') : t('educators.noAccess') }}
        </UiBadge>
        <UiBadge v-else-if="enlacePendiente(row)" tone="sun" class="whitespace-nowrap">{{ t('educators.pinResetPending') }}</UiBadge>
        <span v-else class="text-body font-semibold text-muted">{{ t('educators.withPin') }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="row.estado === 'activo' ? 'lime' : 'neutral'" :dot="row.estado === 'activo'">
          {{ row.estado === 'activo' ? t('educators.active') : t('educators.inactive') }}
        </UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Acciones de tabla, neutras: su acceso a Educators (sin PIN, su enlace; con PIN, restablecerlo), editar y
             quitarlo (solo quien administra la organización: sin talleres dados se elimina; con talleres, se da de baja
             y la confirmación lo dice). -->
        <div class="flex items-center justify-end gap-2">
          <UiButton
            tone="neutral"
            size="sm"
            :icon="row.acceso === 'pin' ? 'key' : 'link'"
            icon-only
            :label="row.acceso === 'pin' ? t('educators.resetPin') : t('educators.accessLink')"
            :title="row.acceso === 'pin' ? t('educators.resetPin') : t('educators.accessLink')"
            @click.stop="educadorAcceso = row.id"
          />
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="navigateTo(`/organizacion/educators/${row.id}/editar`)" />
          <UiButton
            v-if="orgActiva?.esAdmin"
            tone="neutral"
            size="sm"
            icon="trash"
            icon-only
            :label="t('educators.delete')"
            :title="t('educators.delete')"
            @click.stop="pedirQuitar(row)"
          />
        </div>
      </template>
    </UiDataTable>

    <!-- GRUPOS -->
    <UiDataTable
      v-else
      :columns="columnasGrupos"
      :rows="filteredGroups"
      :row-key="(g) => g.id"
      :loading="loading"
      :empty-text="grupos.length ? t('table.emptyFiltered') : t('educators.noGroups')"
      clickable
      @row-click="(g) => navigateTo(`/organizacion/educators/grupos/${g.id}`)"
    >
      <template #cell-grupo="{ row }">
        <div class="min-w-0">
          <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
          <p v-if="row.descripcion" class="truncate text-caption font-semibold text-muted">{{ row.descripcion }}</p>
        </div>
      </template>
      <template #cell-miembros="{ row }">
        <span class="text-body font-semibold tabular-nums text-muted">{{ tCount(t, 'educators.members', row.miembros) }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="row.estado === 'activo' ? 'lime' : 'neutral'" :dot="row.estado === 'activo'">
          {{ row.estado === 'activo' ? t('educators.active') : t('educators.inactive') }}
        </UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="navigateTo(`/organizacion/educators/grupos/${row.id}`)" />
          <UiButton tone="neutral" size="sm" icon="trash" icon-only :label="t('educators.groupDelete')" :title="t('educators.groupDelete')" @click.stop="grupoEliminando = row" />
        </div>
      </template>
    </UiDataTable>

    <!-- Su acceso a Educators: el enlace de primer acceso o el de restablecer el PIN (0013) -->
    <EducadorAcceso :educador-id="educadorAcceso" @close="educadorAcceso = null" />

    <!-- Quitar a un educador: sin talleres dados se elimina; con talleres dados se da de baja (se conserva su historial).
         Si es el único educador de un taller publicado, no se puede (lo exige la base) y lo dice. -->
    <UiConfirmDialog
      :open="!!quitando"
      :title="quitandoConHistorial ? t('educators.deregisterConfirmTitle') : t('educators.deleteConfirmTitle')"
      :confirm-label="quitandoConHistorial ? t('educators.deregister') : t('educators.deleteConfirm')"
      :loading="enCurso"
      :disabled="!!unicoEn"
      @update:open="(v) => { if (!v) quitando = null }"
      @confirm="confirmarQuitar"
    >
      <p v-if="unicoEn">{{ t('educators.onlyEducatorOf', { nombre: quitando?.nombre ?? '', taller: unicoEn }) }}</p>
      <p v-else>{{ t(quitandoConHistorial ? 'educators.deregisterFromList' : 'educators.deleteConfirmText', { nombre: quitando?.nombre ?? '' }) }}</p>
    </UiConfirmDialog>

    <!-- Eliminar un grupo: sus educadores y sus talleres no cambian -->
    <UiConfirmDialog
      :open="!!grupoEliminando"
      :title="t('educators.groupDeleteConfirmTitle')"
      :confirm-label="t('educators.groupDelete')"
      :loading="enCurso"
      @update:open="(v) => { if (!v) grupoEliminando = null }"
      @confirm="confirmarEliminarGrupo"
    >
      <p>{{ t('educators.groupDeleteWarn', { nombre: grupoEliminando?.nombre ?? '' }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { sinAcentos } from '@playhub/ui/app/utils/texto'
import type { Educator, EducatorGroup } from '~/composables/useEducators'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const activeTab = ref<'educadores' | 'grupos'>('educadores')
// Puente tipado: UiTabs habla en string; la pestaña es una unión cerrada.
const tabModel = computed({
  get: () => activeTab.value as string,
  set: v => (activeTab.value = v as 'educadores' | 'grupos'),
})
const searchQuery = ref('')
const filterEstado = ref('')

const estadoOptions = computed(() => [
  { value: '', label: t('common.all') },
  { value: 'activo', label: t('educators.actives') },
  { value: 'inactivo', label: t('educators.inactives') },
])

const { educators, groups: grupos, loading, tieneHistorial, darDeBaja, eliminarEducador, deleteGrupo } = useEducators()
const { orgActiva } = useContexto()
const { toast } = useToast()

// ── Quitar a un educador o eliminar un grupo ─────────────────────────────────
const enCurso = ref(false)
const quitando = ref<Educator | null>(null)
const quitandoConHistorial = ref(false)
// El taller publicado del que es el único educador (la base no deja quitarlo: primero se asigna otro).
const { workshops } = useWorkshops()
const unicoEn = computed(() => {
  const e = quitando.value
  if (!e) return ''
  return workshops.value.find(w => w.estado === 'PUBLICADO' && w.asignados.length === 1 && w.asignados[0]!.id === e.id)?.title ?? ''
})
async function pedirQuitar(e: Educator) {
  quitandoConHistorial.value = await tieneHistorial(e.id)
  quitando.value = e
}
async function confirmarQuitar() {
  const e = quitando.value
  if (!e) return
  const conHistorial = quitandoConHistorial.value
  enCurso.value = true
  const { error } = conHistorial ? await darDeBaja(e.id) : await eliminarEducador(e.id)
  enCurso.value = false
  quitando.value = null
  if (error) { toast.error(error); return }
  toast.success(t(conHistorial ? 'educators.deregistered' : 'educators.deleted', { nombre: e.nombre }))
}
const grupoEliminando = ref<EducatorGroup | null>(null)
async function confirmarEliminarGrupo() {
  const g = grupoEliminando.value
  if (!g) return
  enCurso.value = true
  const { error } = await deleteGrupo(g.id)
  enCurso.value = false
  grupoEliminando.value = null
  if (error) { toast.error(error); return }
  toast.success(t('educators.groupDeleted'))
}

// ── Su acceso: el educador del diálogo ────────────────────────────────────────
const educadorAcceso = ref<number | null>(null)
const enlacePendiente = (e: Educator) => !!e.enlace && !e.enlace.vencido
// El puesto y el teléfono llegan como «—» si no se guardaron: en la tabla no se escribe nada.
const dato = (valor: string) => !!valor && valor !== '—'

const tabItems = computed(() => [
  { value: 'educadores', label: `${t('educators.title')} · ${educators.value.length}` },
  { value: 'grupos', label: `${t('educators.groups')} · ${grupos.value.length}` },
])

// Las columnas secundarias aparecen según hay sitio: en el teléfono, el educador, su estado y su botón de acceso; el
// acceso desde las pequeñas; el contacto desde las medianas; los grupos y los talleres, en las anchas. El contacto se
// queda con lo que sobra: el correo es lo más largo.
const DESDE_SM = 'hidden sm:table-cell'
const DESDE_LG = 'hidden lg:table-cell'
const DESDE_XL = 'hidden xl:table-cell'
const columnasEducadores = computed(() => [
  // El nombre nunca con menos de 240 px
  { key: 'educador', label: t('educators.colEducator'), width: 'sm:w-[max(24%,15rem)]' },
  { key: 'contacto', label: t('educators.colContact'), headerClass: DESDE_LG, cellClass: DESDE_LG },
  { key: 'grupos', label: t('educators.groups'), width: `w-[14%] ${DESDE_XL}` },
  { key: 'talleres', label: t('educators.colWorkshops'), width: `w-24 ${DESDE_XL}` },
  { key: 'acceso', label: t('educators.colAccess'), width: `w-40 ${DESDE_SM}` },
  { key: 'estado', label: t('educators.state'), width: 'w-28' },
  { key: 'acciones', label: '', width: 'w-36', align: 'right' as const },
])
const columnasGrupos = computed(() => [
  { key: 'grupo', label: t('educators.colGroup'), width: 'w-auto' },
  { key: 'miembros', label: t('educators.colMembers'), width: 'w-40' },
  { key: 'estado', label: t('educators.state'), width: 'w-32' },
  { key: 'acciones', label: '', width: 'w-28', align: 'right' as const },
])

// Busca sin acentos ni mayúsculas: el educador por nombre, puesto, correo o grupo; el grupo por nombre o descripción.
const consulta = computed(() => sinAcentos(searchQuery.value.trim()))
const coincide = (textos: (string | null | undefined)[]) =>
  !consulta.value || textos.some(x => sinAcentos(x ?? '').includes(consulta.value))

const filteredEducators = computed(() => educators.value.filter(e =>
  (filterEstado.value === '' || e.estado === filterEstado.value)
  && coincide([e.nombre, e.profesion, e.email, ...e.grupos])))

const filteredGroups = computed(() => grupos.value.filter(g =>
  (filterEstado.value === '' || g.estado === filterEstado.value)
  && coincide([g.nombre, g.descripcion])))
</script>
