<template>
  <div>
    <UiPageHeader :title="t('collabs.title')" :description="t('collabs.desc')">
      <template #actions>
        <UiButton icon="user-plus" @click="navigateTo('/organizacion/colaboradores/nuevo')">
          {{ t('collabs.invite') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="colaboradores"
      :row-key="(c) => c.id"
      :loading="loading"
      :empty-text="t('collabs.empty')"
      searchable
      :search-keys="['nombre', 'email']"
      :search-placeholder="t('collabs.searchPh')"
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
        <span class="text-body font-semibold text-muted">{{ fechaCorta(row.created_at, locale) }}</span>
      </template>
      <template #cell-estado="{ row }">
        <!-- Activo en lima con punto (vigente); inactivo, neutro -->
        <UiBadge :tone="row.activo ? 'lime' : 'neutral'" :dot="row.activo">{{ row.activo ? t('collabs.active') : t('collabs.inactive') }}</UiBadge>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Acciones de tabla, neutras: restablecer su contraseña, editar (su estado) y quitarlo de la organización -->
        <div class="flex items-center justify-end gap-2">
          <!-- Olvidó su contraseña: el titular o soporte le genera un enlace (decisión 009) -->
          <UiButton
            v-if="puedeRestablecer && row.email && row.email !== miCorreo"
            tone="neutral"
            size="sm"
            icon="key"
            icon-only
            :label="t('auth.recovery.action')"
            :title="t('auth.recovery.action')"
            @click.stop="restableciendo = row"
          />
          <UiButton tone="neutral" size="sm" icon="pencil" icon-only :label="t('common.edit')" :title="t('common.edit')" @click.stop="abrirEdicion(row)" />
          <UiButton tone="neutral" size="sm" icon="trash" icon-only :label="t('collabs.remove')" :title="t('collabs.remove')" @click.stop="quitando = row" />
        </div>
      </template>
    </UiDataTable>

    <!-- Invitaciones pendientes: cierran el ciclo «invité → ¿ya entró?». Dicen cómo quedó su correo
         (decisión 012); el enlace se copia otra vez, el correo se reenvía y se pueden revocar. -->
    <section v-if="pendientes.length" class="mt-6">
      <p class="eyebrow mb-2">{{ t('invLink.pending') }}</p>
      <div class="ui-panel divide-y divide-line">
        <div v-for="inv in pendientes" :key="inv.id" class="flex items-center gap-3 px-5 py-3">
          <!-- Invitación pendiente: uva -->
          <UiSymbol icon="mail" size="sm" tone="grape" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-body font-bold text-ink">{{ nombreInvitado(inv) ?? inv.email ?? t('invLink.openLink') }}</p>
            <p class="ui-caption">{{ [nombreInvitado(inv) && inv.email, inv.expira_en ? t('invLink.expires', { fecha: fechaCorta(inv.expira_en, locale) }) : t('invLink.noExpiry')].filter(Boolean).join(' · ') }}</p>
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
              v-if="inv.email"
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
    </section>

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

    <!-- Editar: su estado (los datos de la persona son de su perfil) -->
    <UiDialog :open="!!editando" :title="t('collabs.editTitle')" @update:open="(v) => { if (!v) editando = null }">
      <template v-if="editando">
        <div class="flex items-center gap-3">
          <UiAvatar :name="editando.nombre" :initials="editando.initials" />
          <div class="min-w-0">
            <p class="truncate text-body font-extrabold text-ink">{{ editando.nombre }}</p>
            <p class="truncate text-caption font-semibold text-muted">{{ editando.email }}</p>
          </div>
        </div>
        <div class="mt-5">
          <UiSwitch v-model="activoEditado" :label="t('collabs.activeLabel')" />
          <p class="field-help">{{ t('collabs.activeHelp') }}</p>
        </div>
      </template>
      <template #actions>
        <UiButton :loading="enCurso" icon="check" @click="guardarEdicion">{{ t('common.save') }}</UiButton>
      </template>
    </UiDialog>

    <!-- Quitarlo de la organización: en coral, con confirmación -->
    <UiConfirmDialog
      :open="!!quitando"
      :title="t('collabs.removeTitle', { nombre: quitando?.nombre ?? '' })"
      :confirm-label="t('collabs.remove')"
      :loading="enCurso"
      @update:open="(v) => { if (!v) quitando = null }"
      @confirm="confirmarQuitar"
    >
      <p>{{ t('collabs.removeText') }}</p>
    </UiConfirmDialog>

    <EnlaceRecuperacion
      :open="!!restableciendo"
      :email="restableciendo?.email"
      :nombre="restableciendo?.nombre"
      @update:open="(v) => { if (!v) restableciendo = null }"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColaboradorFila, InvitacionPendiente } from '~/composables/useColaboradores'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const { colaboradores, loading, setActivo, quitar, listInvitacionesPendientes, revocarInvitacion } = useColaboradores()
const { esTitularOrgActiva, esSuperadmin } = useContexto()
const { toast } = useToast()

// El enlace para elegir otra contraseña es del titular o de soporte; la base lo vuelve a comprobar.
const puedeRestablecer = computed(() => esTitularOrgActiva.value || esSuperadmin.value)
const miCorreo = computed(() => useAuth().user.value?.email ?? '')
const restableciendo = ref<ColaboradorFila | null>(null)

const columns = computed(() => [
  { key: 'nombre', label: t('collabs.colName'), grow: true },
  { key: 'desde', label: t('collabs.colJoined') },
  { key: 'estado', label: t('collabs.colState') },
  { key: 'acciones', label: t('collabs.colActions'), align: 'right' as const },
])

const filtros = computed(() => [{
  key: 'estado',
  label: t('collabs.colState'),
  options: [
    { value: 'activo', label: t('collabs.actives') },
    { value: 'inactivo', label: t('collabs.inactives') },
  ],
  match: (row: ColaboradorFila, v: string | number) => (v === 'activo' ? row.activo : !row.activo),
}])

const pendientes = ref<InvitacionPendiente[]>([])
const copiado = ref<string | null>(null)
const revocando = ref<InvitacionPendiente | null>(null)
const enCurso = ref(false)

async function cargarPendientes() {
  pendientes.value = await listInvitacionesPendientes()
}

// «Reenviar correo»: toast del resultado y la lista se vuelve a leer con el estado nuevo.
const { reenviando, reenviar } = useReenvioInvitacion(cargarPendientes)

// Editar: su estado, con el interruptor (nunca un botón «Desactivar» en la fila)
const editando = ref<ColaboradorFila | null>(null)
const activoEditado = ref(true)
function abrirEdicion(c: ColaboradorFila) {
  editando.value = c
  activoEditado.value = c.activo
}
async function guardarEdicion() {
  const c = editando.value
  if (!c) return
  if (activoEditado.value !== c.activo) {
    enCurso.value = true
    const { error } = await setActivo(c.id, activoEditado.value)
    enCurso.value = false
    if (error) { toast.error(error); return }
  }
  toast.success(t('collabs.saved'))
  editando.value = null
}

const quitando = ref<ColaboradorFila | null>(null)
async function confirmarQuitar() {
  const c = quitando.value
  if (!c) return
  enCurso.value = true
  const { error } = await quitar(c.id)
  enCurso.value = false
  quitando.value = null
  if (error) { toast.error(error); return }
  toast.success(t('collabs.removed'))
}

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
  await cargarPendientes()
}

onMounted(cargarPendientes)
</script>
