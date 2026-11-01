<template>
  <div>
    <UiPageHeader :title="t('admins.title')" :description="t('admins.desc')">
      <template #actions>
        <!-- Invitar co-admins es del TITULAR (designarlo sigue siendo de Platform) -->
        <UiButton v-if="esTitularOrgActiva" icon="user-plus" @click="navigateTo('/organizacion/administradores/nuevo')">
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
        <div class="flex min-w-0 items-center gap-3">
          <UiAvatar :name="row.nombreCompleto" />
          <div class="min-w-0">
            <p class="truncate font-extrabold text-ink">{{ row.nombreCompleto }}</p>
            <p v-if="row.correo" class="ui-caption truncate">{{ row.correo }}</p>
          </div>
        </div>
      </template>
      <template #cell-desde="{ row }">
        <span class="text-body font-semibold text-muted">{{ fechaCorta(row.created_at, locale) }}</span>
      </template>
      <template #cell-rol="{ row }">
        <!-- El rol no es un estado: titular es información (cielo); co-admin, neutro -->
        <UiBadge v-if="row.titular" tone="sky">{{ t('admins.titular') }}</UiBadge>
        <UiBadge v-else tone="neutral">{{ t('admins.coadmin') }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Acciones de tabla: neutras; quitar el acceso se confirma en coral (UiConfirmDialog) -->
        <div v-if="puedeGestionar" class="flex items-center justify-end gap-2">
          <UiButton
            tone="neutral"
            size="sm"
            icon="pencil"
            icon-only
            :label="t('common.edit')"
            :title="t('common.edit')"
            @click.stop="navigateTo(`/organizacion/administradores/${row.id}/editar`)"
          />
          <!-- Olvidó su contraseña: enlace para elegir otra (decisión 009); la base decide si se puede -->
          <UiButton
            v-if="row.correo && row.perfil?.id !== miPerfilId"
            tone="neutral"
            size="sm"
            icon="key"
            icon-only
            :label="t('auth.recovery.action')"
            :title="t('auth.recovery.action')"
            @click.stop="restableciendo = row"
          />
          <!-- Al titular no se le quita el acceso desde aquí: primero se designa otro en Platform -->
          <UiButton
            v-if="!row.titular"
            tone="neutral"
            size="sm"
            icon="trash"
            icon-only
            :label="t('admins.remove')"
            :title="t('admins.remove')"
            @click.stop="pedirQuitar(row)"
          />
        </div>
      </template>
    </UiDataTable>

    <!-- Invitaciones que aún no se aceptan: cierran el ciclo «invité → ¿ya entró?» (pendiente = uva).
         Dicen cómo quedó su correo (decisión 012) y el enlace se copia otra vez; reenviar el correo y
         revocarla es del titular (o soporte), como crearla: la RLS lo exige igual. -->
    <div v-if="pendientes.length" class="mt-6">
      <p class="eyebrow mb-3">{{ t('invLink.pending') }}</p>
      <div class="ui-panel divide-y divide-line">
        <div v-for="inv in pendientes" :key="inv.id" class="flex items-center gap-3 px-5 py-3">
          <UiSymbol size="sm" icon="mail" tone="grape" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-body font-bold text-ink">{{ nombreInvitado(inv) ?? inv.email ?? t('invLink.openLink') }}</p>
            <p class="text-caption font-semibold text-subtle">{{ [nombreInvitado(inv) && inv.email, inv.expira_en ? t('invLink.expires', { fecha: fechaCorta(inv.expira_en, locale) }) : t('invLink.noExpiry')].filter(Boolean).join(' · ') }}</p>
            <InvitacionCorreo v-if="inv.email" :enviado-en="inv.correo_enviado_en" :error="inv.correo_error" />
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <UiButton
              tone="neutral"
              size="sm"
              :icon="copiado === inv.token ? 'check' : 'link'"
              icon-only
              :label="t('invLink.copy')"
              :title="t('invLink.copy')"
              @click="copiarEnlace(inv.token)"
            />
            <UiButton
              v-if="inv.email && (esTitularOrgActiva || esSuperadmin)"
              tone="neutral"
              size="sm"
              icon="send"
              icon-only
              :loading="reenviando === inv.id"
              :label="t('invMail.resend')"
              :title="t('invMail.resend')"
              @click="reenviar(inv)"
            />
            <UiButton
              v-if="esTitularOrgActiva || esSuperadmin"
              tone="neutral"
              size="sm"
              icon="ban"
              icon-only
              :label="t('invLink.revoke')"
              :title="t('invLink.revoke')"
              @click="revocando = inv"
            />
          </div>
        </div>
      </div>
    </div>

    <UiConfirmDialog
      :open="!!revocando"
      :title="t('invLink.revokeTitle')"
      :confirm-label="t('invLink.revoke')"
      :loading="enCurso"
      @update:open="(v) => { if (!v) revocando = null }"
      @confirm="confirmarRevocar"
    >
      <p>{{ t('invLink.revokeWarn', { nombre: revocando ? (nombreInvitado(revocando) ?? revocando.email ?? '') : '' }) }}</p>
    </UiConfirmDialog>

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

    <EnlaceRecuperacion
      :open="!!restableciendo"
      :email="restableciendo?.correo"
      :nombre="restableciendo?.nombreCompleto"
      @update:open="(v) => { if (!v) restableciendo = null }"
    />
  </div>
</template>

<script setup lang="ts">
import type { AdminDeOrg, InvitacionAdminPendiente } from '~/composables/useOrganizacion'

definePageMeta({ layout: 'dashboard', titleKey: 'admins.title', descKey: 'admins.desc' })

const { t, locale } = useT()
const { orgActiva, esSuperadmin, esTitularOrgActiva } = useContexto()
const { listAdministradores, listInvitacionesPendientes, removeAdministrador, revocarInvitacion } = useOrganizacion()
const { toast } = useToast()

const admins = ref<AdminDeOrg[]>([])
const pendientes = ref<InvitacionAdminPendiente[]>([])
const loading = ref(true)

// Gestionar admins (editar/quitar) es del titular o del superadmin; el co-admin solo ve.
const puedeGestionar = computed(() => esSuperadmin.value || esTitularOrgActiva.value)
const miPerfilId = computed(() => useAuth().user.value?.perfil.id ?? null)

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
  { key: 'acciones', label: puedeGestionar.value ? t('collabs.colActions') : '', align: 'right' as const },
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

// ── Invitaciones pendientes: copiar el enlace, reenviar el correo y revocar ──
const copiado = ref<string | null>(null)
const { reenviando, reenviar } = useReenvioInvitacion(async () => {
  pendientes.value = await listInvitacionesPendientes()
})
const revocando = ref<InvitacionAdminPendiente | null>(null)
const enCurso = ref(false)

async function copiarEnlace(token: string) {
  if (!(await copiarTexto(enlaceInvitacion(token)))) {
    toast.error(t('invLink.copyFailed'))
    return
  }
  copiado.value = token
  toast.success(t('invLink.copied'))
  setTimeout(() => (copiado.value = null), 1500)
}

async function confirmarRevocar() {
  if (!revocando.value) return
  enCurso.value = true
  const { error } = await revocarInvitacion(revocando.value.id)
  enCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  revocando.value = null
  toast.success(t('invLink.revoked'))
  pendientes.value = await listInvitacionesPendientes()
}

// Quitar acceso (nunca al titular: el botón ni se muestra en esa fila).
const quitando = ref<FilaAdmin | null>(null)
const restableciendo = ref<FilaAdmin | null>(null)
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
