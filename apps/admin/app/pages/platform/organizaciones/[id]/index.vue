<template>
  <div class="max-w-[1120px] mx-auto">
    <div v-if="loading" class="ui-panel p-10 text-center font-semibold text-subtle">{{ t('common.loading') }}</div>

    <div v-else-if="!org" class="ui-panel p-10 text-center font-semibold text-muted">
      {{ t('platform.orgDetail.notFound') }}
      <NuxtLink to="/platform/organizaciones" class="ui-link ml-1" data-tone="sky">{{ t('platform.orgDetail.back') }}</NuxtLink>
    </div>

    <template v-else>
      <!-- Hero: identidad + acciones -->
      <header class="ui-page-header items-start">
        <div class="flex min-w-0 items-center gap-4">
          <!-- La organización no significa nada por sí misma: tono estable según su nombre -->
          <UiSymbol :tone="uiToneFor(org.nombre)" class="text-title font-black text-(--tone-strong)">
            {{ org.nombre.charAt(0).toUpperCase() }}
          </UiSymbol>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="ui-heading">{{ org.nombre }}</h1>
              <UiBadge v-if="org.tipo?.nombre?.es" tone="neutral">{{ org.tipo.nombre.es }}</UiBadge>
              <UiBadge v-if="lic" :tone="licenciaTone(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
            </div>
            <p class="ui-text mt-1.5">
              {{ subtitulo }}<template v-if="org.telefono"> · {{ org.telefono }}</template><template v-if="org.website"> · <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="ui-link" data-tone="sky">{{ org.website }}</a></template>
            </p>
          </div>
        </div>
        <!-- Una sola acción principal: invitar al administrador; sin licencia, la principal es
             asignarla (en su tarjeta) y esta pasa a neutra -->
        <div class="ui-page-header-actions flex-wrap">
          <UiButton tone="neutral" icon="pencil" :to="`/platform/organizaciones/${org.id}/editar`">{{ t('platform.orgDetail.edit') }}</UiButton>
          <UiButton :tone="lic ? undefined : 'neutral'" icon="user-plus" :to="`/platform/invitaciones/nueva?org=${org.id}`">{{ t('platform.orgDetail.inviteAdmin') }}</UiButton>
        </div>
      </header>

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
        <!-- Columna principal -->
        <div class="flex min-w-0 flex-col gap-6">
          <!-- Licencia actual -->
          <section class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <div class="flex items-center gap-2.5">
                <h2 class="ui-title">{{ t('platform.orgDetail.currentLicense') }}</h2>
                <UiBadge v-if="lic" :tone="licenciaTone(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
              </div>
              <div v-if="lic" class="flex items-center gap-2">
                <UiButton tone="neutral" size="sm" icon="pencil" :to="`/platform/licencias/${lic.id}`">{{ t('platform.orgDetail.edit') }}</UiButton>
                <UiButton tone="neutral" size="sm" icon="retry" :to="`/platform/licencias/nueva?org=${org.id}`">{{ t('platform.orgDetail.renew') }}</UiButton>
              </div>
              <!-- Sin licencia: asignarla es la acción principal de la vista (lima) -->
              <UiButton v-else size="sm" icon="license" :to="`/platform/licencias/nueva?org=${org.id}`">{{ t('platform.orgDetail.assignLicense') }}</UiButton>
            </div>

            <template v-if="lic">
              <!-- La licencia es el contrato (decisión 011): vigencia y notas. Sin cupos ni países:
                   los países donde opera son de la organización (abajo). -->
              <div class="flex flex-wrap items-center gap-7 bg-canvas px-6 py-3.5">
                <div class="flex items-center gap-2 text-caption font-semibold text-muted">
                  <UiIcon name="calendar" class="size-3.5 text-subtle" />
                  {{ t('platform.orgDetail.validity') }}:
                  <span class="font-extrabold text-ink">
                    {{ fechaCorta(lic.fecha_inicio, locale) }} –
                    <span :data-tone="finLicenciaTone(lic)" :class="finLicenciaTone(lic) && 'text-(--tone-strong)'">{{ lic.fecha_fin ? fechaCorta(lic.fecha_fin, locale) : t('platform.orgDetail.noEnd') }}</span>
                  </span>
                </div>
              </div>

              <p v-if="lic.notas" class="ui-text border-t border-line px-6 py-3.5">{{ lic.notas }}</p>

              <div v-if="historial.length" class="border-t border-line px-6 py-3.5">
                <p class="eyebrow mb-2">{{ t('platform.orgDetail.history') }} ({{ historial.length }})</p>
                <NuxtLink
                  v-for="h in historial"
                  :key="h.id"
                  :to="`/platform/licencias/${h.id}`"
                  class="-mx-2 flex max-w-md items-center gap-3 rounded-chip px-2 py-1.5 transition-colors hover:bg-canvas"
                >
                  <UiBadge :tone="licenciaTone(h.estado)">{{ t('state.' + h.estado) }}</UiBadge>
                  <span class="text-caption font-semibold text-subtle">{{ fechaCorta(h.fecha_inicio, locale) }} — {{ h.fecha_fin ? fechaCorta(h.fecha_fin, locale) : t('platform.orgDetail.noEnd') }}</span>
                </NuxtLink>
              </div>
            </template>

            <!-- Sin licencia le falta lo necesario para operar: coral -->
            <div v-else class="px-6 py-5">
              <UiAlert tone="coral" icon="license" :title="t('platform.orgDetail.noLicenseAssigned')">
                {{ t('platform.orgDetail.noLicenseText') }}
              </UiAlert>
            </div>
          </section>

          <!-- Administradores -->
          <section class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <div class="flex items-center gap-2.5">
                <h2 class="ui-title">{{ t('platform.orgDetail.admins') }}</h2>
                <span class="filter-count">{{ administradores.length }}</span>
              </div>
              <!-- Ya la administras: entrar; si no, unirte (a la vista de sus administradores) -->
              <UiButton v-if="soyAdmin" tone="neutral" size="sm" icon="building" @click="irALaOrganizacion">
                {{ t('platform.orgDetail.goToOrg') }}
              </UiButton>
              <UiButton v-else tone="neutral" size="sm" icon="user-plus" @click="uniendo = true; comoTitular = !titular">
                {{ t('platform.orgDetail.joinAsAdmin') }}
              </UiButton>
            </div>
            <p v-if="!administradores.length" class="px-6 py-6 font-semibold text-subtle">{{ t('platform.orgDetail.noAdmins') }}</p>
            <div
              v-for="(a, i) in administradores"
              :key="a.id"
              :class="['flex items-center gap-3 px-6 py-3.5', i > 0 && 'border-t border-line']"
            >
              <UiAvatar :name="nombreAdmin(a)" :initials="inicialesAdmin(a)" />
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-center gap-1.5 font-extrabold text-ink">
                  {{ nombreAdmin(a) }}
                  <!-- Titular: el administrador elegido entre los demás (selección → cielo) -->
                  <UiBadge v-if="a.titular" tone="sky" icon="bookmark">{{ t('platform.orgDetail.titular') }}</UiBadge>
                  <UiBadge v-if="a.perfil?.id === miPerfilId" tone="neutral">{{ t('platform.orgDetail.you') }}</UiBadge>
                </p>
                <p class="ui-caption">{{ a.perfil?.email ?? '—' }}</p>
                <!-- Último acceso: si nunca entró, pendiente (sol) -->
                <p v-if="a.ultimo_acceso" class="ui-caption mt-0.5">{{ t('platform.orgDetail.lastAccess', { fecha: fechaCorta(a.ultimo_acceso, locale) }) }}</p>
                <p v-else data-tone="sun" class="mt-0.5 text-caption font-bold text-(--tone-strong)">{{ t('platform.orgDetail.neverAccessed') }}</p>
              </div>
              <!-- Acciones de soporte: neutras; quitar se confirma en coral -->
              <div class="flex shrink-0 items-center gap-2">
                <UiButton v-if="!a.titular" tone="neutral" size="sm" icon="bookmark" @click="marcarTitular(a)">
                  {{ t('platform.orgDetail.setTitular') }}
                </UiButton>
                <UiButton
                  v-if="a.perfil?.email && a.perfil?.id !== miPerfilId"
                  tone="neutral"
                  size="sm"
                  icon="key"
                  icon-only
                  :label="t('auth.recovery.action')"
                  :title="t('auth.recovery.action')"
                  @click="restableciendo = a"
                />
                <UiButton
                  tone="neutral"
                  size="sm"
                  icon="trash"
                  icon-only
                  :label="t('admins.removeTitle')"
                  :title="t('admins.removeTitle')"
                  @click="quitando = a"
                />
              </div>
            </div>
          </section>

          <!-- Invitaciones -->
          <section class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <div class="flex items-center gap-2.5">
                <h2 class="ui-title">{{ t('platform.orgDetail.invitations') }}</h2>
                <span class="filter-count">{{ org.invitaciones?.length ?? 0 }}</span>
              </div>
              <UiButton tone="neutral" size="sm" icon="plus" :to="`/platform/invitaciones/nueva?org=${org.id}`">{{ t('platform.invs.new') }}</UiButton>
            </div>
            <UiDataTable flat :columns="invCols" :rows="org.invitaciones" :row-key="(i) => i.id" :empty-text="t('platform.orgDetail.noInvitations')">
              <template #cell-email="{ row }">
                <!-- A quién se invitó y con qué rol (categoría, no estado: neutro; titular en cielo); debajo, su
                     correo y, si sigue pendiente, cómo quedó el envío. El rol va aquí para que quepan las acciones. -->
                <div class="mb-1">
                  <UiBadge v-if="row.titular" tone="sky" icon="bookmark">{{ t('platform.invs.titularBadge') }}</UiBadge>
                  <UiBadge v-else tone="neutral">{{ roleLabel(row.role) }}</UiBadge>
                </div>
                <p v-if="nombreInvitado(row)" class="truncate font-extrabold text-ink">{{ nombreInvitado(row) }}</p>
                <p v-if="row.email" :class="['truncate font-semibold text-muted', nombreInvitado(row) && 'text-caption']">{{ row.email }}</p>
                <p v-else class="font-semibold italic text-subtle">{{ t('platform.invs.openLink') }}</p>
                <InvitacionCorreo v-if="row.email && row.estado === 'PENDIENTE'" :enviado-en="row.correo_enviado_en" :error="row.correo_error" />
                <!-- El vencimiento va aquí y no en su columna: con cuatro acciones, la tabla no cabe en la columna principal -->
                <p v-if="row.estado === 'PENDIENTE' && row.expira_en" class="text-caption font-semibold text-muted">{{ t('platform.orgDetail.invExpires', { fecha: fechaCorta(row.expira_en, locale) }) }}</p>
              </template>
              <template #cell-estado="{ row }">
                <UiBadge :tone="invitacionTone(row.estado)" dot>{{ t('state.' + row.estado) }}</UiBadge>
              </template>
              <template #cell-acciones="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UiButton
                    tone="neutral"
                    size="sm"
                    :icon="copiado === row.token ? 'check' : 'link'"
                    icon-only
                    :label="copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink')"
                    :title="copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink')"
                    @click="copiarLink(row.token)"
                  />
                  <!-- Reenviar el correo, como revocarla: las que el superadmin ve aquí las puede gestionar
                       (las de administrador; las de colaborador, solo si administra la organización. RLS 0005) -->
                  <UiButton
                    v-if="row.email && row.estado === 'PENDIENTE'"
                    tone="neutral"
                    size="sm"
                    icon="send"
                    icon-only
                    :loading="reenviando === row.id"
                    :label="t('invMail.resend')"
                    :title="t('invMail.resend')"
                    @click="reenviar(row)"
                  />
                  <UiButton
                    v-if="row.estado === 'PENDIENTE'"
                    tone="neutral"
                    size="sm"
                    icon="ban"
                    icon-only
                    :label="t('platform.invs.revoke')"
                    :title="t('platform.invs.revoke')"
                    @click="revocar(row.id)"
                  />
                  <!-- Eliminar: las de administrador (las del superadmin), salvo las aceptadas -->
                  <UiButton
                    v-if="row.role === 'ADMIN' && row.estado !== 'USADA'"
                    tone="neutral"
                    size="sm"
                    icon="trash"
                    icon-only
                    :label="t('platform.invs.delete')"
                    :title="t('platform.invs.delete')"
                    @click="borrandoInv = row"
                  />
                </div>
              </template>
            </UiDataTable>
          </section>
        </div>

        <!-- Lateral -->
        <div class="flex flex-col gap-6">
          <!-- Estado: cifras para dar soporte (platform_uso); el tono dice si está bien (lima),
               pendiente (sol), falta (coral) o es lo próximo (cielo) -->
          <section class="ui-panel">
            <div class="ui-panel-header">
              <div class="min-w-0">
                <h2 class="ui-title">{{ t('platform.orgDetail.status') }}</h2>
                <p class="ui-caption mt-0.5">{{ t('platform.orgDetail.statusHelp') }}</p>
              </div>
            </div>
            <div class="flex flex-col gap-3 px-6 py-5">
              <div v-for="e in estado" :key="e.label" class="flex items-center gap-3">
                <UiSymbol size="sm" :icon="e.icon" :tone="e.tone" />
                <div class="min-w-0 flex-1">
                  <p class="text-caption font-semibold text-muted">{{ e.label }}</p>
                  <p class="truncate text-body font-extrabold text-ink">{{ e.valor }}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Información -->
          <section class="ui-panel">
            <div class="ui-panel-header">
              <h2 class="ui-title">{{ t('platform.orgDetail.information') }}</h2>
            </div>
            <div class="flex flex-col gap-3 px-6 py-5">
              <div v-if="org.correo" class="flex items-center gap-2.5 font-semibold text-muted">
                <UiIcon name="mail" class="size-4 shrink-0 text-subtle" />
                <span class="truncate">{{ org.correo }}</span>
              </div>
              <div v-if="org.telefono" class="flex items-center gap-2.5 font-semibold text-muted">
                <UiIcon name="phone" class="size-4 shrink-0 text-subtle" />
                {{ org.telefono }}
              </div>
              <div v-if="org.website" class="flex min-w-0 items-center gap-2.5 font-semibold">
                <UiIcon name="globe" class="size-4 shrink-0 text-subtle" />
                <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="ui-link min-w-0 truncate" data-tone="sky">{{ org.website }}</a>
              </div>
              <div class="my-0.5 h-px bg-line" />
              <div class="flex items-center justify-between gap-3 text-caption">
                <span class="font-semibold text-muted">{{ t('platform.orgs.colType') }}</span>
                <span class="font-extrabold text-ink">{{ org.tipo?.nombre?.es ?? t('platform.orgDetail.noType') }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-caption">
                <span class="font-semibold text-muted">{{ t('platform.orgDetail.created') }}</span>
                <span class="font-extrabold text-ink">{{ fechaCorta(org.created_at, locale) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-caption">
                <span class="font-semibold text-muted">{{ t('platform.orgDetail.owner') }}</span>
                <span v-if="titular" class="max-w-40 truncate font-extrabold text-ink">{{ nombreAdmin(titular) }}</span>
                <!-- Sin titular: pendiente de elegirlo (sol) -->
                <span v-else data-tone="sun" class="font-extrabold text-(--tone-strong)">{{ t('platform.orgDetail.noOwner') }}</span>
              </div>
            </div>
          </section>

          <!-- Los países donde opera: deciden su catálogo estándar (decisión 011); se editan con la organización -->
          <section class="ui-panel">
            <div class="ui-panel-header justify-start gap-2.5">
              <h2 class="ui-title">{{ t('platform.orgDetail.countries') }}</h2>
              <span class="filter-count">{{ org.paises?.length ?? 0 }}</span>
            </div>
            <div class="flex flex-wrap gap-2 px-6 py-4">
              <UiBadge v-for="p in org.paises ?? []" :key="p" tone="neutral">{{ etiquetaPais(p) }}</UiBadge>
              <p v-if="!org.paises?.length" class="font-semibold text-subtle">—</p>
            </div>
          </section>
        </div>
      </div>
    </template>

    <!-- Soporte: enlace para que un administrador elija otra contraseña (decisión 009) -->
    <EnlaceRecuperacion
      :open="!!restableciendo"
      :email="restableciendo?.perfil?.email"
      :nombre="restableciendo ? nombreAdmin(restableciendo) : null"
      @update:open="(v) => { if (!v) restableciendo = null }"
    />

    <!-- Unirse como administrador (o titular): queda a la vista de sus administradores -->
    <UiConfirmDialog
      :open="uniendo"
      tone="lime"
      :title="t('platform.orgDetail.joinTitle', { org: org?.nombre ?? '' })"
      :confirm-label="t('platform.orgDetail.joinConfirm')"
      :loading="enCurso"
      @update:open="(v) => uniendo = v"
      @confirm="confirmarUnirme"
    >
      <p>{{ t('platform.orgDetail.joinWarn') }}</p>
      <div class="mt-4">
        <UiCheckbox v-model="comoTitular" :label="t('platform.orgDetail.joinTitular')" />
        <p v-if="comoTitular && titular" class="field-help mt-1.5">{{ t('platform.orgDetail.joinTitularTransfer', { nombre: nombreAdmin(titular) }) }}</p>
      </div>
    </UiConfirmDialog>

    <!-- Soporte: quitar a un administrador (su cuenta sigue) -->
    <UiConfirmDialog
      :open="!!quitando"
      :title="t('admins.removeTitle')"
      :confirm-label="t('admins.removeConfirm')"
      :loading="enCurso"
      @update:open="(v) => { if (!v) quitando = null }"
      @confirm="confirmarQuitar"
    >
      <p>{{ t('admins.removeWarn', { nombre: quitando ? nombreAdmin(quitando) : '', org: org?.nombre ?? '' }) }}</p>
      <p v-if="quitando?.titular" class="mt-3">{{ t('platform.orgDetail.removeTitularWarn') }}</p>
    </UiConfirmDialog>

    <!-- Eliminar una invitación de administrador -->
    <UiConfirmDialog
      :open="!!borrandoInv"
      :title="t('platform.invs.deleteTitle')"
      :confirm-label="t('platform.invs.deleteConfirm')"
      symbol="trash"
      :loading="enCurso"
      @update:open="(v) => { if (!v) borrandoInv = null }"
      @confirm="eliminarInv"
    >
      <p>{{ t('platform.invs.deleteWarn', { nombre: borrandoInv ? (nombreInvitado(borrandoInv) || borrandoInv.email || '—') : '' }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgDetail.title' })

const { t, locale } = useT()
const route = useRoute()
const id = Number(route.params.id)
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { AdminPlatform } from '~/composables/usePlatform'
import type { LicenciaLigera } from '~/utils/platformResumen'

const { getOrganizacion, revokeInvitacion, eliminarInvitacion, setTitular, quitarAdministrador, unirmeComoAdmin } = usePlatform()
const { setOrg } = useContexto()
const { toast } = useToast()
const { etiqueta: etiquetaPais, cargar: cargarPaises } = usePaises()

const org = ref<any>(null)
const loading = ref(true)
const copiado = ref<string | null>(null)

// «Reenviar correo»: toast del resultado y el detalle se vuelve a leer con el estado nuevo.
const { reenviando, reenviar } = useReenvioInvitacion(() => cargar())

const invCols = computed(() => [
  // La más ancha: a quién se invitó y cómo quedó su correo
  { key: 'email', label: t('platform.invs.colInvitee'), grow: true },
  { key: 'estado', label: t('platform.invs.colState') },
  // Hasta cuatro acciones (copiar, reenviar, revocar, eliminar): el reparto fijo de la tabla no les basta
  { key: 'acciones', label: t('platform.invs.colActions'), align: 'right' as const, width: 'w-44' },
])

const administradores = computed(() => (org.value?.administradores ?? []) as any[])
// El titular es SOLO el marcado (titular=true); sin fallback al primero.
const titular = computed(() => administradores.value.find((a: any) => a.titular) ?? null)

// Subtítulo del header: el correo reemplaza al tipo (cae al tipo si no hay correo).
const subtitulo = computed(() => org.value?.correo || org.value?.tipo?.nombre?.es || t('platform.orgDetail.noType'))

async function marcarTitular(row: any) {
  await setTitular(id, row.id)
  await cargar()
}

function nombreAdmin(a: any) {
  const p = a?.perfil
  return p ? `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() : '—'
}

function inicialesAdmin(a: any) {
  const nombre = nombreAdmin(a)
  if (nombre === '—') return '?'
  return nombre.split(' ').slice(0, 2).map((x: string) => x.charAt(0)).join('').toUpperCase()
}


// Antepone https:// si el website viene sin esquema, para que el enlace abra bien.
function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

const licencias = computed(() => {
  const arr = [...(org.value?.licencias ?? [])] as any[]
  return arr.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
})
const lic = computed(() => licencias.value[0] ?? null)
const historial = computed(() => licencias.value.slice(1))

function roleLabel(role: string) {
  return role === 'ADMIN' ? t('auth.invite.roleAdmin') : t('auth.invite.roleCollab')
}

async function cargar() {
  const { data } = await getOrganizacion(id)
  org.value = data
  loading.value = false
}

onMounted(() => {
  cargarPaises()
  cargar()
})

async function revocar(invId: number) {
  await revokeInvitacion(invId)
  await cargar()
}

// La invitación de administrador que se va a eliminar (abre la confirmación).
const borrandoInv = ref<{ id: number, nombre: string | null, apellido: string | null, email: string | null } | null>(null)

async function eliminarInv() {
  if (!borrandoInv.value) return
  enCurso.value = true
  const { error } = await eliminarInvitacion(borrandoInv.value.id)
  enCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  borrandoInv.value = null
  toast.success(t('platform.invs.deleted'))
  await cargar()
}

// ── Estado: cifras para el soporte ───────────────────────────────────────────
interface EstadoItem { label: string, valor: string, icon: UiIconName, tone: UiTone }
const estado = computed<EstadoItem[]>(() => {
  const o = org.value
  if (!o) return []
  const uso = o.uso
  const items: EstadoItem[] = []

  const vigente = licenciaVigenteDe((o.licencias ?? []) as LicenciaLigera[], o.id, hoyLocal())
  const dias = vigente?.fecha_fin ? diasHasta(vigente.fecha_fin) : null
  items.push(!vigente
    ? { label: t('platform.orgDetail.stLicencia'), valor: t('platform.orgDetail.stSinLicencia'), icon: 'license', tone: 'coral' }
    : dias !== null && dias <= 30
      ? { label: t('platform.orgDetail.stLicencia'), valor: t('platform.orgDetail.stVence', { n: dias }), icon: 'clock', tone: 'sun' }
      : { label: t('platform.orgDetail.stLicencia'), valor: t('platform.orgDetail.stVigente'), icon: 'check-circle', tone: 'lime' })

  const admins = administradores.value as AdminPlatform[]
  const accesos = admins.map(a => a.ultimo_acceso).filter((x): x is string => !!x).sort()
  items.push(!admins.length
    ? { label: t('platform.orgDetail.stAdmins'), valor: t('platform.orgDetail.stSinAdmins'), icon: 'user-plus', tone: 'coral' }
    : !accesos.length
      ? { label: t('platform.orgDetail.stAdmins'), valor: t('platform.orgDetail.stNadieEntro'), icon: 'user-plus', tone: 'sun' }
      : { label: t('platform.orgDetail.stAdmins'), valor: t('platform.orgDetail.stUltimoAcceso', { fecha: fechaCorta(accesos.at(-1)!, locale.value) }), icon: 'users', tone: 'lime' })

  if (uso) {
    items.push(!uso.educadores
      ? { label: t('platform.orgDetail.stEducadores'), valor: t('platform.orgDetail.stSinEducadores'), icon: 'users', tone: 'neutral' }
      : uso.educadores_sin_acceso
        ? { label: t('platform.orgDetail.stEducadores'), valor: tCount(t, 'platform.orgDetail.stSinAcceso', uso.educadores_sin_acceso), icon: 'key', tone: 'sun' }
        : { label: t('platform.orgDetail.stEducadores'), valor: t('platform.orgDetail.stTodosAcceso'), icon: 'key', tone: 'lime' })
    items.push({
      label: t('platform.orgDetail.stTalleres'),
      valor: uso.talleres_proximos ? String(uso.talleres_proximos) : t('platform.orgDetail.stNingunTaller'),
      icon: 'calendar',
      tone: uso.talleres_proximos ? 'sky' : 'neutral',
    })
    items.push({
      label: t('platform.orgDetail.stJornadas'),
      valor: uso.jornadas ? String(uso.jornadas) : t('platform.orgDetail.stNinguna'),
      icon: 'layers',
      tone: 'neutral',
    })
    items.push({
      label: t('platform.orgDetail.stPersonalizados'),
      valor: uso.personalizados ? String(uso.personalizados) : t('platform.orgDetail.stNinguno'),
      icon: 'book',
      tone: 'neutral',
    })
    items.push({
      label: t('platform.orgDetail.stActividad'),
      valor: uso.ultima_actividad ? fechaCorta(uso.ultima_actividad, locale.value) : t('platform.orgDetail.stSinActividad'),
      icon: 'clock',
      tone: 'neutral',
    })
  }
  return items
})

// ── Soporte de administradores ───────────────────────────────────────────────
const restableciendo = ref<AdminPlatform | null>(null)
const quitando = ref<AdminPlatform | null>(null)
const enCurso = ref(false)

async function confirmarQuitar() {
  if (!quitando.value) return
  const eraYo = quitando.value.perfil?.id === miPerfilId.value
  enCurso.value = true
  const { error } = await quitarAdministrador(quitando.value.id)
  enCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  quitando.value = null
  toast.success(t('admins.removed'))
  // Si me quité a mí, la organización sale de mi selector de contexto.
  if (eraYo) await useAuth().fetchUser()
  await cargar()
}

// ── El superadmin como administrador de esta organización ────────────────────
const miPerfilId = computed(() => useAuth().user.value?.perfil.id ?? null)
const soyAdmin = computed(() => administradores.value.some((a: AdminPlatform) => a.perfil?.id === miPerfilId.value))
const uniendo = ref(false)
const comoTitular = ref(false)

async function confirmarUnirme() {
  if (!org.value) return
  enCurso.value = true
  const { error } = await unirmeComoAdmin(org.value.id, comoTitular.value)
  enCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  uniendo.value = false
  toast.success(t('platform.orgDetail.joined', { org: org.value.nombre }))
  await cargar()
}

function irALaOrganizacion() {
  if (!org.value) return
  setOrg(org.value.id)
  navigateTo('/organizacion')
}

async function copiarLink(token: string) {
  if (!(await copiarTexto(`${window.location.origin}/invitacion/${token}`))) {
    toast.error(t('invLink.copyFailed'))
    return
  }
  copiado.value = token
  setTimeout(() => (copiado.value = null), 1500)
}

</script>
