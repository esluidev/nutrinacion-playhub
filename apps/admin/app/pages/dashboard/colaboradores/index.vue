<template>
  <div>
    <UiPageHeader title="Colaboradores" description="Personas con acceso a operar tu comunidad">
      <template #actions>
        <!-- Invitar colaboradores es del admin de la org (la RLS lo exige igual) -->
        <UiButton v-if="puedeInvitar" icon="user-plus" @click="navigateTo('/dashboard/colaboradores/nuevo')">
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
        <div class="flex min-w-0 items-center gap-3">
          <UiAvatar :name="row.nombre" :initials="row.initials" />
          <div class="min-w-0">
            <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
            <p class="truncate text-caption font-semibold text-muted">{{ row.email }}</p>
          </div>
        </div>
      </template>
      <template #cell-desde="{ row }">
        <span class="text-body font-semibold text-muted">{{ fechaCorta(row.created_at, 'es') }}</span>
      </template>
      <template #cell-estado="{ row }">
        <!-- Activo en lima con punto (vigente); inactivo, neutro -->
        <UiBadge :tone="row.activo ? 'lime' : 'neutral'" :dot="row.activo">{{ row.activo ? 'Activo' : 'Inactivo' }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Acciones de tabla: neutras, como en el kit -->
        <div v-if="puedeInvitar" class="flex items-center justify-end">
          <UiButton v-if="row.activo" variant="outline" size="sm" @click.stop="cambiarActivo(row, false)">
            Desactivar
          </UiButton>
          <UiButton v-else variant="outline" size="sm" @click.stop="cambiarActivo(row, true)">
            Reactivar
          </UiButton>
        </div>
      </template>
    </UiDataTable>

    <!-- Invitaciones pendientes: cierran el ciclo "invité → ¿ya entró?" -->
    <section v-if="pendientes.length" class="mt-6">
      <p class="eyebrow mb-2">Invitaciones pendientes</p>
      <div class="ui-panel divide-y divide-line">
        <div v-for="inv in pendientes" :key="inv.id" class="flex items-center gap-3 px-5 py-3">
          <!-- Invitación pendiente: uva -->
          <UiSymbol icon="mail" size="sm" tone="grape" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-body font-bold text-ink">{{ nombreInvitado(inv) ?? inv.email ?? '— (link abierto)' }}</p>
            <p class="ui-caption">{{ [nombreInvitado(inv) && inv.email, inv.expira_en ? `Vence el ${fechaCorta(inv.expira_en, 'es')}` : 'Sin vencimiento'].filter(Boolean).join(' · ') }}</p>
          </div>
        </div>
      </div>
    </section>
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
