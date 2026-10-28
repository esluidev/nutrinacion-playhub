<template>
  <!-- Dashboard del operador: la administración de las organizaciones. En qué punto está cada
       una, el parque de licencias, lo que NECESITA ATENCIÓN (reglas en utils/platformResumen), la
       actividad de las organizaciones y las invitaciones de administrador. La operación de cada
       organización (comunidades, educadores, talleres) es asunto suyo, no de Platform. -->
  <div>
    <UiPageHeader title="Platform" :description="t('platformHome.desc')">
      <template #actions>
        <!-- Soporte: alguien que olvidó su contraseña, también un colaborador que Platform no ve -->
        <UiButton tone="neutral" icon="key" @click="restableciendo = true">{{ t('auth.recovery.action') }}</UiButton>
      </template>
    </UiPageHeader>

    <div v-if="loading" class="ui-panel p-10 text-center text-body font-semibold text-subtle">{{ t('common.loading') }}</div>

    <template v-else-if="resumen">
      <!-- Organizaciones: el total va neutro; operando en lima, en alta en sol, sin licencia en coral -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.to"
          class="ui-panel ui-panel-interactive ui-stat"
        >
          <UiSymbol size="md" :icon="stat.icon" :tone="stat.tone" />
          <div class="min-w-0">
            <p class="ui-stat-value">{{ stat.value }}</p>
            <p class="ui-stat-label truncate">{{ stat.label }}</p>
            <p v-if="stat.sub" class="mt-0.5 truncate text-micro font-bold text-subtle">{{ stat.sub }}</p>
          </div>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <!-- Columna principal -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Parque de licencias: vigentes en lima, en prueba en cielo, por vencer en sol y vencidas en coral -->
          <div class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <h2 class="ui-title">{{ t('nav.licenses') }}</h2>
              <NuxtLink to="/platform/licencias" class="ui-link text-body" data-tone="sky">
                {{ t('common.viewAll') }}
                <UiIcon name="chevron-right" class="size-3.5" />
              </NuxtLink>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4">
              <div v-for="m in miniLicencias" :key="m.label" class="ui-stat">
                <UiSymbol size="md" :icon="m.icon" :tone="m.tone" />
                <div class="min-w-0">
                  <p class="ui-stat-value">{{ m.value }}</p>
                  <p class="ui-stat-label">{{ m.label }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Necesita atención: el símbolo dice qué pasa (coral = falta o venció; sol = pendiente; cielo = información) -->
          <div class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <h2 class="ui-title">
                {{ t('platformHome.atencion') }}
                <span v-if="resumen.atencion.length" class="text-body font-bold text-subtle">· {{ resumen.atencion.length }}</span>
              </h2>
            </div>
            <p v-if="!resumen.atencion.length" class="px-6 py-5 text-body font-semibold text-subtle">
              {{ t('platformHome.atencionEmpty') }}
            </p>
            <div v-else class="divide-y divide-line">
              <NuxtLink
                v-for="item in resumen.atencion"
                :key="`${item.tipo}-${item.orgId}`"
                :to="destinoAtencion(item)"
                class="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-canvas"
              >
                <UiSymbol size="sm" :icon="ATENCION[item.tipo].icon" :tone="ATENCION[item.tipo].tone" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-body font-extrabold text-ink">{{ item.orgNombre }}</p>
                  <p class="mt-px text-caption font-semibold text-muted">{{ labelAtencion(item) }}</p>
                </div>
                <UiIcon name="chevron-right" class="size-3.5 shrink-0 text-disabled" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Columna derecha -->
        <div class="space-y-6">
          <!-- Actividad de las organizaciones: cada una con su tono estable (según su nombre) -->
          <div class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <h2 class="ui-title">{{ t('platformHome.actividad') }}</h2>
            </div>
            <p v-if="!resumen.actividad.length" class="px-6 py-5 text-body font-semibold text-subtle">—</p>
            <div v-else class="divide-y divide-line">
              <NuxtLink
                v-for="a in resumen.actividad"
                :key="`${a.tipo}-${a.orgId}-${a.fecha}-${a.persona ?? ''}`"
                :to="a.licenciaId ? `/platform/licencias/${a.licenciaId}` : `/platform/organizaciones/${a.orgId}`"
                class="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-canvas"
              >
                <UiSymbol size="sm" :icon="ACTIVIDAD_ICONO[a.tipo]" :tone="uiToneFor(a.orgNombre)" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-body font-extrabold text-ink">{{ a.orgNombre }}</p>
                  <p class="mt-px truncate text-caption font-semibold text-muted">
                    {{ labelActividad(a) }} · {{ fechaCorta(a.fecha, locale) }}
                  </p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Invitaciones ADMIN pendientes: invitación pendiente = uva -->
          <div class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <h2 class="ui-title">
                {{ t('platformHome.pendingInvites') }}
                <span v-if="resumen.invitacionesPendientes" class="text-body font-bold text-subtle">· {{ resumen.invitacionesPendientes }}</span>
              </h2>
              <NuxtLink to="/platform/invitaciones" class="ui-link shrink-0 text-body" data-tone="sky">
                {{ t('common.viewAll') }}
              </NuxtLink>
            </div>
            <p v-if="!resumen.invitacionesRecientes.length" class="px-6 py-5 text-body font-semibold text-subtle">
              {{ t('platformHome.invitesEmpty') }}
            </p>
            <div v-else class="divide-y divide-line">
              <div
                v-for="inv in resumen.invitacionesRecientes"
                :key="inv.id"
                class="flex items-center gap-3 px-6 py-3"
              >
                <UiSymbol size="sm" icon="mail" tone="grape" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-body font-bold text-ink">{{ nombreInvitado(inv) ?? inv.email ?? t('platform.invs.openLink') }}</p>
                  <p class="mt-px truncate text-caption font-semibold text-muted">{{ inv.organizaciones?.nombre ?? '—' }} · {{ fechaCorta(inv.created_at, locale) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <EnlaceRecuperacion v-model:open="restableciendo" />
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { ResumenPlatform } from '~/composables/usePlatform'
import type { ActividadItem, AtencionItem, AtencionTipo } from '~/utils/platformResumen'

definePageMeta({ layout: 'dashboard', titleKey: 'nav.dashboard' })

const { t, locale } = useT()
// En dev sin Supabase el cliente no existe: se muestra un resumen de muestra.
const platform = isSupabaseConfigured() ? usePlatform() : null

const resumen = ref<ResumenPlatform | null>(null)
const loading = ref(true)
const restableciendo = ref(false)

const DEMO_RESUMEN: ResumenPlatform = {
  organizaciones: { total: 3, nuevas: 1, operando: 1, enAlta: 1, sinLicencia: 1 },
  licencias: { vigentes: 2, trials: 1, porVencer: 1, vencidas: 1 },
  atencion: [
    { tipo: 'lic_vencida_activa', orgId: 3, orgNombre: 'Colegio Andes', licenciaId: 3 },
    { tipo: 'lic_vence', orgId: 2, orgNombre: 'Fundación Crecer', dias: 8, licenciaId: 2 },
    { tipo: 'sin_admins', orgId: 3, orgNombre: 'Colegio Andes' },
    { tipo: 'cupo_lleno', orgId: 1, orgNombre: 'Nutrinación', licenciaId: 1 },
  ],
  actividad: [
    { tipo: 'admin', orgNombre: 'Fundación Crecer', orgId: 2, fecha: '2026-07-18T00:00:00Z', persona: 'Ana Pérez' },
    { tipo: 'renovacion', orgNombre: 'Nutrinación', orgId: 1, fecha: '2026-07-10T00:00:00Z', licenciaId: 1 },
    { tipo: 'org', orgNombre: 'Fundación Crecer', orgId: 2, fecha: '2026-07-01T00:00:00Z' },
  ],
  invitacionesPendientes: 1,
  invitacionesRecientes: [
    { id: 1, email: 'ana.perez@fundacioncrecer.org', nombre: 'Ana', apellido: 'Pérez', created_at: '2026-07-14T00:00:00Z', organizaciones: { nombre: 'Fundación Crecer' } },
  ],
}

// Cifras de las organizaciones: el símbolo lleva el tono de lo que mide (el total, neutro).
interface StatPlatform { label: string, value: number, sub: string, to: string, icon: UiIconName, tone: UiTone }
const stats = computed<StatPlatform[]>(() => {
  const o = resumen.value?.organizaciones
  return [
    { label: t('nav.organizations'), value: o?.total ?? 0, sub: t('platformHome.orgsNuevas', { n: o?.nuevas ?? 0 }), to: '/platform/organizaciones', icon: 'building', tone: 'neutral' },
    { label: t('platformHome.operando'), value: o?.operando ?? 0, sub: t('platformHome.operandoSub'), to: '/platform/organizaciones', icon: 'check-circle', tone: 'lime' },
    { label: t('platformHome.enAlta'), value: o?.enAlta ?? 0, sub: t('platformHome.enAltaSub'), to: '/platform/organizaciones', icon: 'user-plus', tone: 'sun' },
    { label: t('platformHome.sinLicencia'), value: o?.sinLicencia ?? 0, sub: t('platformHome.sinLicenciaSub'), to: '/platform/licencias', icon: 'license', tone: 'coral' },
  ]
})

// Licencias: vigente → lima, en prueba → cielo (información), por vencer → sol, vencida → coral.
const miniLicencias = computed<{ label: string, value: number, icon: UiIconName, tone: UiTone }[]>(() => [
  { label: t('platformHome.licVigentes'), value: resumen.value?.licencias.vigentes ?? 0, icon: 'check-circle', tone: 'lime' },
  { label: t('platformHome.licTrials'), value: resumen.value?.licencias.trials ?? 0, icon: 'license', tone: 'sky' },
  { label: t('platformHome.licPorVencer'), value: resumen.value?.licencias.porVencer ?? 0, icon: 'clock', tone: 'sun' },
  { label: t('platformHome.licVencidas'), value: resumen.value?.licencias.vencidas ?? 0, icon: 'warning', tone: 'coral' },
])

// Qué necesita atención, por severidad: lo roto o lo que falta en coral; lo pendiente (vence pronto,
// onboarding sin administradores) en sol; lo informativo (cupo lleno, oportunidad de venta) en cielo.
const ATENCION: Record<AtencionTipo, { icon: UiIconName, tone: UiTone }> = {
  lic_vencida_activa: { icon: 'warning', tone: 'coral' },
  sin_licencia: { icon: 'license', tone: 'coral' },
  lic_vence: { icon: 'clock', tone: 'sun' },
  sin_admins: { icon: 'user-plus', tone: 'sun' },
  cupo_lleno: { icon: 'chart', tone: 'sky' },
}

function labelAtencion(item: AtencionItem): string {
  switch (item.tipo) {
    case 'lic_vencida_activa': return t('platformHome.atLicVencidaActiva')
    case 'sin_licencia': return t('platformHome.atSinLicencia')
    case 'lic_vence':
      if ((item.dias ?? 0) <= 0) return t('platformHome.atLicVenceHoy')
      if (item.dias === 1) return t('platformHome.atLicVenceManana')
      return t('platformHome.atLicVence', { n: item.dias ?? 0 })
    case 'sin_admins': return t('platformHome.atSinAdmins')
    case 'cupo_lleno': return t('platformHome.atCupoLleno')
  }
}

const ACTIVIDAD_ICONO: Record<ActividadItem['tipo'], UiIconName> = {
  org: 'building',
  licencia: 'license',
  renovacion: 'retry',
  admin: 'user-plus',
}
function labelActividad(a: ActividadItem): string {
  switch (a.tipo) {
    case 'org': return t('platformHome.actividadOrg')
    case 'licencia': return t('platformHome.actividadLicencia')
    case 'renovacion': return t('platformHome.actividadRenovacion')
    case 'admin': return t('platformHome.actividadAdmin', { nombre: a.persona ?? '—' })
  }
}

// Lo de licencias aterriza en la licencia; el resto, en el detalle de la org.
function destinoAtencion(item: AtencionItem): string {
  if ((item.tipo === 'lic_vence' || item.tipo === 'lic_vencida_activa') && item.licenciaId) {
    return `/platform/licencias/${item.licenciaId}`
  }
  return `/platform/organizaciones/${item.orgId}`
}


onMounted(async () => {
  resumen.value = platform ? await platform.getResumenPlatform() : DEMO_RESUMEN
  loading.value = false
})
</script>
