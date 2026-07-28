<template>
  <!-- Dashboard del operador: el corazón de la plataforma. Negocio (licencias y su
       desglose), lo que NECESITA ATENCIÓN (reglas en utils/platformResumen), adopción
       real (comunidades/educadores/talleres) y el pulso de altas recientes. -->
  <div>
    <UiPageHeader title="Platform" :description="t('platformHome.desc')" />

    <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>

    <template v-else-if="resumen">
      <!-- Stat tiles -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-7">
        <NuxtLink
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.to"
          class="card card-hover px-6 py-[22px] flex flex-col gap-3.5"
        >
          <div class="flex items-center justify-between">
            <span class="text-[12.5px] font-bold text-[#7d8d81]">{{ stat.label }}</span>
            <div :class="['w-[34px] h-[34px] rounded-[10px] flex items-center justify-center', stat.iconBg, stat.iconColor]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" :d="stat.icon" />
              </svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-[34px] font-display font-semibold text-brand-dark leading-none">{{ stat.value }}</span>
            <span v-if="stat.sub" class="text-xs font-semibold text-gray-400">{{ stat.sub }}</span>
          </div>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-[22px] items-start">
        <!-- Columna principal -->
        <div class="lg:col-span-2 space-y-[22px]">
          <!-- Parque de licencias -->
          <div class="card overflow-hidden">
            <div class="px-6 py-5 flex items-center justify-between">
              <h3 class="text-base font-display font-semibold text-brand-dark">{{ t('nav.licenses') }}</h3>
              <NuxtLink to="/platform/licencias" class="inline-flex items-center gap-1 text-[13px] font-bold text-brand-primary-700 hover:text-brand-primary-800">
                {{ t('common.viewAll') }}
                <svg xmlns="http://www.w3.org/2000/svg" class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </NuxtLink>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
              <div v-for="m in miniLicencias" :key="m.label" class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span :class="['w-2 h-2 rounded-full shrink-0', m.dot]" />
                  <span class="text-[22px] font-display font-semibold text-brand-dark leading-none">{{ m.value }}</span>
                </div>
                <p class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em] mt-1.5">{{ m.label }}</p>
              </div>
            </div>
          </div>

          <!-- Necesita atención -->
          <div class="card overflow-hidden">
            <div class="px-6 py-5">
              <h3 class="text-base font-display font-semibold text-brand-dark">
                {{ t('platformHome.atencion') }}
                <span v-if="resumen.atencion.length" class="text-gray-400 font-bold text-[14px]">· {{ resumen.atencion.length }}</span>
              </h3>
            </div>
            <p v-if="!resumen.atencion.length" class="px-6 pb-6 text-sm text-gray-400">
              {{ t('platformHome.atencionEmpty') }}
            </p>
            <NuxtLink
              v-for="(item, i) in resumen.atencion"
              :key="`${item.tipo}-${item.orgId}`"
              :to="destinoAtencion(item)"
              :class="['px-6 py-[13px] flex items-center gap-3.5 hover:bg-gray-50 transition-colors', i > 0 || true ? 'border-t border-gray-100' : '']"
            >
              <span :class="['w-2 h-2 rounded-full shrink-0', DOT_ATENCION[item.tipo]]" />
              <div class="min-w-0 flex-1">
                <p class="text-[13.5px] font-extrabold text-gray-800 truncate">{{ item.orgNombre }}</p>
                <p class="text-[12px] text-gray-500 font-semibold mt-px">{{ labelAtencion(item) }}</p>
              </div>
              <svg class="w-[14px] h-[14px] text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- Columna derecha -->
        <div class="space-y-[22px]">
          <!-- Actividad reciente -->
          <div class="card overflow-hidden">
            <div class="px-6 py-5">
              <h3 class="text-base font-display font-semibold text-brand-dark">{{ t('platformHome.actividad') }}</h3>
            </div>
            <p v-if="!resumen.actividad.length" class="px-6 pb-6 text-sm text-gray-400">—</p>
            <NuxtLink
              v-for="a in resumen.actividad"
              :key="`${a.tipo}-${a.nombre}-${a.fecha}`"
              :to="`/platform/organizaciones/${a.orgId}`"
              class="px-6 py-3 flex items-center gap-3 border-t border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div
                :class="[
                  'w-[32px] h-[32px] rounded-[10px] flex items-center justify-center shrink-0',
                  a.tipo === 'org' ? 'bg-brand-primary-50 text-brand-primary-700' : 'bg-[#eff6ff] text-[#2563eb]',
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="a.tipo === 'org' ? IC.org : IC.com" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-extrabold text-gray-800 truncate">{{ a.nombre }}</p>
                <p class="text-[11.5px] text-gray-500 font-semibold mt-px truncate">
                  {{ a.tipo === 'org' ? t('platformHome.actividadOrg') : t('platformHome.actividadComunidad', { org: a.orgNombre ?? '' }) }} · {{ fechaCorta(a.fecha) }}
                </p>
              </div>
            </NuxtLink>
          </div>

          <!-- Invitaciones ADMIN pendientes -->
          <div class="card overflow-hidden">
            <div class="px-6 py-5 flex items-center justify-between">
              <h3 class="text-base font-display font-semibold text-brand-dark">
                {{ t('platformHome.pendingInvites') }}
                <span v-if="resumen.invitacionesPendientes" class="text-gray-400 font-bold text-[14px]">· {{ resumen.invitacionesPendientes }}</span>
              </h3>
              <NuxtLink to="/platform/invitaciones" class="text-[13px] font-bold text-brand-primary-700 hover:text-brand-primary-800">
                {{ t('common.viewAll') }}
              </NuxtLink>
            </div>
            <p v-if="!resumen.invitacionesRecientes.length" class="px-6 pb-6 text-sm text-gray-400">
              {{ t('platformHome.invitesEmpty') }}
            </p>
            <div
              v-for="inv in resumen.invitacionesRecientes"
              :key="inv.id"
              class="px-6 py-3 border-t border-gray-100"
            >
              <p class="text-[13px] font-bold text-gray-800 truncate">{{ inv.email ?? t('platform.invs.openLink') }}</p>
              <p class="text-[11.5px] text-gray-500 font-semibold mt-px truncate">{{ inv.organizaciones?.nombre ?? '—' }} · {{ fechaCorta(inv.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ResumenPlatform } from '~/composables/usePlatform'
import type { AtencionItem, AtencionTipo } from '~/utils/platformResumen'

definePageMeta({ layout: 'dashboard', titleKey: 'nav.dashboard' })

const { t, locale } = useT()
// En dev sin Supabase el cliente no existe: se muestra un resumen de muestra.
const platform = isSupabaseConfigured() ? usePlatform() : null

const resumen = ref<ResumenPlatform | null>(null)
const loading = ref(true)

const DEMO_RESUMEN: ResumenPlatform = {
  organizaciones: 3,
  orgsConLicenciaVigente: 2,
  comunidades: 5,
  educadores: 14,
  talleres: 12,
  talleresProgramados: 4,
  licencias: { vigentes: 2, trials: 1, porVencer: 1, vencidas: 1 },
  atencion: [
    { tipo: 'lic_vencida_activa', orgId: 3, orgNombre: 'Colegio Andes', licenciaId: 3 },
    { tipo: 'lic_vence', orgId: 2, orgNombre: 'Fundación Crecer', dias: 8, licenciaId: 2 },
    { tipo: 'sin_admins', orgId: 3, orgNombre: 'Colegio Andes' },
    { tipo: 'cupo_lleno', orgId: 1, orgNombre: 'Nutrinación', licenciaId: 1 },
  ],
  actividad: [
    { tipo: 'comunidad', nombre: 'Comunidad Norte', orgNombre: 'Nutrinación', orgId: 1, fecha: '2026-07-18T00:00:00Z' },
    { tipo: 'org', nombre: 'Fundación Crecer', orgId: 2, fecha: '2026-07-01T00:00:00Z' },
    { tipo: 'comunidad', nombre: 'Comunidad Centro', orgNombre: 'Nutrinación', orgId: 1, fecha: '2026-06-20T00:00:00Z' },
  ],
  invitacionesPendientes: 1,
  invitacionesRecientes: [
    { id: 1, email: 'ana.perez@fundacioncrecer.org', created_at: '2026-07-14T00:00:00Z', organizaciones: { nombre: 'Fundación Crecer' } },
  ],
}

const IC = {
  org: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z',
  com: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21',
  edu: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
  tall: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
}

const stats = computed(() => [
  {
    label: t('nav.organizations'),
    value: resumen.value?.organizaciones ?? 0,
    sub: t('platformHome.conLicencia', { n: resumen.value?.orgsConLicenciaVigente ?? 0 }),
    to: '/platform/organizaciones',
    icon: IC.org,
    iconBg: 'bg-brand-primary-50',
    iconColor: 'text-brand-primary-700',
  },
  {
    label: t('nav.communities'),
    value: resumen.value?.comunidades ?? 0,
    sub: '',
    to: '/platform/organizaciones',
    icon: IC.com,
    iconBg: 'bg-[#eff6ff]',
    iconColor: 'text-[#2563eb]',
  },
  {
    label: t('platform.orgDetail.educators'),
    value: resumen.value?.educadores ?? 0,
    sub: '',
    to: '/platform/organizaciones',
    icon: IC.edu,
    iconBg: 'bg-[#edfffe]',
    iconColor: 'text-[#2E9D95]',
  },
  {
    label: t('nav.workshops'),
    value: resumen.value?.talleres ?? 0,
    sub: t('platformHome.programados', { n: resumen.value?.talleresProgramados ?? 0 }),
    to: '/platform/organizaciones',
    icon: IC.tall,
    iconBg: 'bg-brand-purple-50',
    iconColor: 'text-brand-purple-600',
  },
])

const miniLicencias = computed(() => [
  { label: t('platformHome.licVigentes'), value: resumen.value?.licencias.vigentes ?? 0, dot: 'bg-brand-primary-500' },
  { label: t('platformHome.licTrials'), value: resumen.value?.licencias.trials ?? 0, dot: 'bg-blue-500' },
  { label: t('platformHome.licPorVencer'), value: resumen.value?.licencias.porVencer ?? 0, dot: 'bg-amber-500' },
  { label: t('platformHome.licVencidas'), value: resumen.value?.licencias.vencidas ?? 0, dot: 'bg-red-500' },
])

const DOT_ATENCION: Record<AtencionTipo, string> = {
  lic_vencida_activa: 'bg-red-500',
  sin_licencia: 'bg-red-400',
  lic_vence: 'bg-amber-500',
  sin_admins: 'bg-amber-400',
  cupo_lleno: 'bg-blue-500',
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

// Lo de licencias aterriza en la licencia; el resto, en el detalle de la org.
function destinoAtencion(item: AtencionItem): string {
  if ((item.tipo === 'lic_vence' || item.tipo === 'lic_vencida_activa') && item.licenciaId) {
    return `/platform/licencias/${item.licenciaId}`
  }
  return `/platform/organizaciones/${item.orgId}`
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  resumen.value = platform ? await platform.getResumenPlatform() : DEMO_RESUMEN
  loading.value = false
})
</script>
