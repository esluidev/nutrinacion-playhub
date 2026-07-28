<template>
  <div>
    <UiPageHeader :title="t('admins.title')" :description="t('admins.desc')">
      <template #actions>
        <!-- Invitar co-admins es del TITULAR (designarlo sigue siendo de Platform) -->
        <UiButton v-if="esTitularOrgActiva" @click="navigateTo('/organizacion/administradores/nuevo')">
          <UiIcon name="add" class="w-4 h-4" stroke-width="2.25" />
          {{ t('admins.invite') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Búsqueda y filtros: integrados en UiDataTable, no reconstruidos aquí -->
    <UiDataTable
      :columns="columns"
      :rows="filas"
      :row-key="(a) => a.id"
      :loading="loading"
      :empty-text="t('admins.empty')"
      searchable
      :search-keys="['nombreCompleto', 'correo']"
      :search-placeholder="t('admins.searchPh')"
      :filters="filtros"
    >
      <template #cell-nombre="{ row }">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
            {{ row.nombreCompleto.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="font-extrabold text-gray-800 truncate">{{ row.nombreCompleto }}</p>
            <p v-if="row.correo" class="text-[12.5px] text-gray-500 truncate">{{ row.correo }}</p>
          </div>
        </div>
      </template>
      <template #cell-desde="{ row }">
        <span class="text-[13px] text-gray-700 font-semibold">{{ fechaCorta(row.created_at) }}</span>
      </template>
      <template #cell-rol="{ row }">
        <span
          v-if="row.titular"
          class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-brand-primary-50 text-brand-primary-800"
        >{{ t('admins.titular') }}</span>
        <span
          v-else
          class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-gray-100 text-gray-600"
        >{{ t('admins.coadmin') }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <div v-if="puedeGestionar" class="flex items-center justify-end gap-1">
          <NuxtLink
            :to="`/organizacion/administradores/${row.id}/editar`"
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            :title="t('common.edit')"
            @click.stop
          >
            <UiIcon name="edit" class="w-[15px] h-[15px]" />
          </NuxtLink>
          <!-- Al titular no se le quita el acceso desde aquí: primero se designa otro en Platform -->
          <button
            v-if="!row.titular"
            class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            :title="t('admins.remove')"
            @click.stop="pedirQuitar(row)"
          >
            <UiIcon name="delete" class="w-[15px] h-[15px]" />
          </button>
        </div>
      </template>
    </UiDataTable>

    <!-- Invitaciones que aún no se aceptan: cierran el ciclo "invité → ¿ya entró?" -->
    <div v-if="pendientes.length" class="mt-6">
      <p class="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase mb-2">{{ t('admins.pending') }}</p>
      <div class="card divide-y divide-gray-100">
        <div v-for="inv in pendientes" :key="inv.id" class="flex items-center gap-3 px-4 py-3">
          <div class="w-[30px] h-[30px] rounded-[9px] bg-[#fff8e6] text-[#a16207] flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-800 truncate">{{ inv.email ?? t('admins.openLink') }}</p>
            <p class="text-xs text-gray-400">{{ venceLabel(inv) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quitar acceso: no borra la cuenta y es reversible por invitación, pero se confirma -->
    <UiConfirmDialog
      :open="!!quitando"
      :title="t('admins.removeTitle')"
      :confirm-label="t('admins.removeConfirm')"
      :loading="quitandoEnCurso"
      @update:open="(v) => { if (!v) quitando = null }"
      @confirm="confirmarQuitar"
    >
      <p>{{ t('admins.removeWarn', { nombre: quitando?.nombreCompleto ?? '', org: orgActiva?.nombre ?? '' }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { AdminDeOrg, InvitacionAdminPendiente } from '~/composables/useOrganizacion'

definePageMeta({ layout: 'dashboard', titleKey: 'admins.title', descKey: 'admins.desc' })

const { t, locale } = useT()
const { orgActiva, esSuperadmin, esTitularOrgActiva } = useContexto()
const { listAdministradores, listInvitacionesPendientes, removeAdministrador } = useOrganizacion()
const { toast } = useToast()

const admins = ref<AdminDeOrg[]>([])
const pendientes = ref<InvitacionAdminPendiente[]>([])
const loading = ref(true)

// Gestionar admins (editar/quitar) es del titular o del superadmin; el co-admin solo ve.
const puedeGestionar = computed(() => esSuperadmin.value || esTitularOrgActiva.value)

// Filas aplanadas: la búsqueda del componente opera sobre campos planos.
type FilaAdmin = AdminDeOrg & { nombreCompleto: string, correo: string }
const filas = computed<FilaAdmin[]>(() => admins.value.map(a => ({
  ...a,
  nombreCompleto: nombreDe(a),
  correo: a.perfil?.email ?? '',
})))

const columns = computed(() => [
  { key: 'nombre', label: t('admins.colAdmin'), grow: true },
  { key: 'desde', label: t('admins.colJoined') },
  { key: 'rol', label: t('admins.colRole') },
  { key: 'acciones', label: puedeGestionar.value ? t('coms.colActions') : '', align: 'right' as const },
])

const filtros = computed(() => [{
  key: 'rol',
  label: t('admins.colRole'),
  options: [
    { value: 'titular', label: t('admins.titular') },
    { value: 'admin', label: t('admins.coadmin') },
  ],
  match: (row: FilaAdmin, v: string | number) => (v === 'titular' ? row.titular : !row.titular),
}])

function nombreDe(a: AdminDeOrg) {
  const nombre = [a.perfil?.nombre, a.perfil?.apellido].filter(Boolean).join(' ').trim()
  return nombre || a.perfil?.email || '—'
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

function venceLabel(inv: InvitacionAdminPendiente) {
  if (!inv.expira_en) return t('admins.noExpiry')
  const fecha = new Date(inv.expira_en).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return `${t('admins.expires')} ${fecha}`
}

// Quitar acceso (nunca al titular: el botón ni se muestra en esa fila).
const quitando = ref<FilaAdmin | null>(null)
const quitandoEnCurso = ref(false)

function pedirQuitar(a: FilaAdmin) {
  quitando.value = a
}

async function confirmarQuitar() {
  if (!quitando.value) return
  quitandoEnCurso.value = true
  const { error } = await removeAdministrador(quitando.value.id)
  quitandoEnCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('admins.removed'))
  quitando.value = null
  await cargar()
}

async function cargar() {
  if (!orgActiva.value && isSupabaseConfigured()) {
    loading.value = false
    return
  }
  const [a, p] = await Promise.all([listAdministradores(), listInvitacionesPendientes()])
  admins.value = a
  pendientes.value = p
  loading.value = false
}

onMounted(cargar)
</script>
