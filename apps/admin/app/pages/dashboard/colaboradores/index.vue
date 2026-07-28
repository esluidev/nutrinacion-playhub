<template>
  <div>
    <UiPageHeader title="Colaboradores" description="Personas con acceso a operar tu comunidad">
      <template #actions>
        <!-- Invitar colaboradores es del admin de la org (la RLS lo exige igual) -->
        <UiButton v-if="puedeInvitar" @click="navigateTo('/dashboard/colaboradores/nuevo')">
          <UiIcon name="invite" class="w-4 h-4" stroke-width="2.25" />
          Invitar Colaborador
        </UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="colaboradores"
      :row-key="(c) => c.id"
      :loading="loading"
      empty-text="Aún no hay colaboradores. Invita al primero para compartir la operación."
      searchable
      :search-keys="['nombre', 'email']"
      search-placeholder="Buscar colaborador…"
      :filters="filtros"
    >
      <template #cell-nombre="{ row }">
        <div class="flex items-center gap-3 min-w-0">
          <div :class="['w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 text-white font-extrabold text-[12px]', row.avatarBg]">
            {{ row.initials }}
          </div>
          <div class="min-w-0">
            <p class="font-extrabold text-gray-800 text-[13.5px] truncate">{{ row.nombre }}</p>
            <p class="text-[12px] font-semibold text-gray-500 truncate">{{ row.email }}</p>
          </div>
        </div>
      </template>
      <template #cell-desde="{ row }">
        <span class="text-[13px] text-gray-700 font-semibold">{{ fechaCorta(row.created_at) }}</span>
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :variant="row.activo ? 'green' : 'gray'" dot>{{ row.activo ? 'Activo' : 'Inactivo' }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <div v-if="puedeInvitar" class="flex items-center justify-end">
          <button
            v-if="row.activo"
            class="inline-flex items-center gap-1.5 h-[30px] px-[11px] rounded-[8px] text-[12px] font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            @click.stop="cambiarActivo(row, false)"
          >
            Desactivar
          </button>
          <button
            v-else
            class="inline-flex items-center gap-1.5 h-[30px] px-[11px] rounded-[8px] text-[12px] font-bold text-gray-400 hover:bg-brand-primary-50 hover:text-brand-primary-700 transition-colors"
            @click.stop="cambiarActivo(row, true)"
          >
            Reactivar
          </button>
        </div>
      </template>
    </UiDataTable>

    <!-- Invitaciones pendientes: cierran el ciclo "invité → ¿ya entró?" -->
    <div v-if="pendientes.length" class="mt-6">
      <p class="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase mb-2">Invitaciones pendientes</p>
      <div class="card divide-y divide-gray-100">
        <div v-for="inv in pendientes" :key="inv.id" class="flex items-center gap-3 px-4 py-3">
          <div class="w-[30px] h-[30px] rounded-[9px] bg-[#fff8e6] text-[#a16207] flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-800 truncate">{{ inv.email ?? '— (link abierto)' }}</p>
            <p class="text-xs text-gray-400">{{ inv.expira_en ? `Vence el ${fechaCorta(inv.expira_en)}` : 'Sin vencimiento' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColaboradorFila, InvitacionColabPendiente } from '~/composables/useColaboradores'

definePageMeta({ layout: 'dashboard' })

const { colaboradores, loading, setActivo, listInvitacionesPendientes } = useColaboradores()
const { administraOrgActiva, esSuperadmin } = useContexto()
const { toast } = useToast()

const puedeInvitar = computed(() => administraOrgActiva.value || esSuperadmin.value)

const columns = [
  { key: 'nombre', label: 'Colaborador', grow: true },
  { key: 'desde', label: 'Se unió' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
]

const filtros = [{
  key: 'estado',
  label: 'Estado',
  options: [
    { value: 'activo', label: 'Activos' },
    { value: 'inactivo', label: 'Inactivos' },
  ],
  match: (row: ColaboradorFila, v: string | number) => (v === 'activo' ? row.activo : !row.activo),
}]

const pendientes = ref<InvitacionColabPendiente[]>([])

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function cambiarActivo(c: ColaboradorFila, activo: boolean) {
  const { error } = await setActivo(c.id, activo)
  if (error) {
    toast.error(error)
    return
  }
  toast.success(activo ? 'Colaborador reactivado.' : 'Colaborador desactivado.')
}

onMounted(async () => {
  pendientes.value = await listInvitacionesPendientes()
})
</script>
