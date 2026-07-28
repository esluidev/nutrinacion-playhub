<template>
  <!-- El detalle de la org para SUS admins (titular o no): la misma vista que el
       superadmin tiene en Platform, pero de solo LECTURA — editar datos, licencias y
       titularidad siguen siendo del operador. -->
  <div class="max-w-[1120px] mx-auto">
    <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>

    <template v-else-if="org">
      <!-- Hero: identidad -->
      <div class="flex items-center gap-4 mb-6 min-w-0">
        <div class="w-[54px] h-[54px] rounded-[15px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center font-extrabold text-xl shrink-0">
          {{ org.nombre.charAt(0).toUpperCase() }}
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-2xl font-display font-semibold text-brand-dark tracking-[-0.01em]">{{ org.nombre }}</h1>
            <span v-if="tipoLabel" class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-gray-100 text-gray-600">{{ tipoLabel }}</span>
            <UiBadge v-if="lic" :variant="licenciaVariant(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
          </div>
          <p class="text-[13px] text-gray-500 font-semibold mt-1.5">
            {{ subtitulo }}<template v-if="org.telefono"> · {{ org.telefono }}</template><template v-if="org.website"> · <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ org.website }}</a></template>
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[22px] items-start">
        <!-- Columna principal: licencia vigente, comunidades y administradores -->
        <div class="flex flex-col gap-[22px] min-w-0">
          <div class="card overflow-hidden">
            <div class="flex items-center gap-2.5 px-6 py-[18px] border-b border-gray-100">
              <p class="text-[14.5px] font-extrabold text-gray-800">{{ t('platform.orgDetail.currentLicense') }}</p>
              <UiBadge v-if="lic" :variant="licenciaVariant(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
            </div>

            <template v-if="lic">
              <!-- Cupos -->
              <div class="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <div class="flex items-baseline gap-[5px]">
                    <span class="text-[22px] font-display font-semibold text-brand-dark">{{ org.comunidades.length }}</span>
                    <span class="text-[13px] font-bold text-gray-500">{{ t('orgHome.de') }} {{ lic.max_comunidades }}</span>
                  </div>
                  <p class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em] mt-1 mb-2">{{ t('platform.orgDetail.communitiesShort') }}</p>
                  <div class="h-[5px] rounded-full bg-gray-100 overflow-hidden">
                    <div class="h-full rounded-full bg-brand-primary" :style="{ width: usoComunidades + '%' }" />
                  </div>
                </div>
                <div>
                  <div class="flex items-baseline gap-[5px]">
                    <span class="text-[22px] font-display font-semibold text-brand-dark">{{ educadoresUsados }}</span>
                    <span class="text-[13px] font-bold text-gray-500">{{ t('orgHome.de') }} {{ lic.max_educadores }}</span>
                  </div>
                  <p class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em] mt-1 mb-2">{{ t('platform.orgDetail.educators') }}</p>
                  <div class="h-[5px] rounded-full bg-gray-100 overflow-hidden">
                    <div class="h-full rounded-full bg-brand-primary" :style="{ width: uso(educadoresUsados, lic.max_educadores) + '%' }" />
                  </div>
                </div>
                <div>
                  <div class="flex items-baseline gap-[5px]">
                    <span class="text-[22px] font-display font-semibold text-brand-dark">{{ org.personalizadosUsados }}</span>
                    <span class="text-[13px] font-bold text-gray-500">{{ t('orgHome.de') }} {{ lic.max_personalizados }}</span>
                  </div>
                  <p class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em] mt-1 mb-2">{{ t('platform.orgDetail.custom') }}</p>
                  <div class="h-[5px] rounded-full bg-gray-100 overflow-hidden">
                    <div class="h-full rounded-full bg-brand-primary" :style="{ width: uso(org.personalizadosUsados, lic.max_personalizados) + '%' }" />
                  </div>
                </div>
              </div>

              <!-- Vigencia / países -->
              <div class="flex items-center gap-7 px-6 py-3.5 bg-brand-tint border-t border-gray-100 flex-wrap">
                <div class="flex items-center gap-2 text-[12.5px] text-gray-600 font-semibold">
                  <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  {{ t('platform.orgDetail.validity') }}: <span class="text-gray-800 font-extrabold">{{ fechaCorta(lic.fecha_inicio) }} – {{ lic.fecha_fin ? fechaCorta(lic.fecha_fin) : t('platform.orgDetail.noEnd') }}</span>
                  <span
                    v-if="venceEn !== null"
                    :class="venceEn < 0 ? 'text-red-600' : venceEn <= 30 ? 'text-amber-600' : 'text-gray-400'"
                    class="font-extrabold"
                  >· {{ venceLabel }}</span>
                </div>
                <div class="flex items-center gap-2 text-[12.5px] text-gray-600 font-semibold">
                  <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
                  </svg>
                  {{ t('platform.orgDetail.countries') }}: <span class="text-gray-800 font-extrabold">{{ lic.paises?.length ? lic.paises.join(', ') : t('platform.orgDetail.global') }}</span>
                </div>
              </div>

              <p v-if="lic.notas" class="text-sm text-gray-500 px-6 py-3.5 border-t border-gray-100">{{ lic.notas }}</p>
            </template>

            <p v-else class="text-sm text-gray-400 px-6 py-5">{{ t('platform.orgDetail.noLicenseAssigned') }}</p>
          </div>

          <!-- Comunidades: el corazón de la org. Vacía = el siguiente paso es crear la
               primera; con datos = la puerta de entrada a operar cada una. -->
          <div class="card overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-6 py-[18px] border-b border-gray-100">
              <p class="text-[14.5px] font-extrabold text-gray-800">{{ t('platform.orgDetail.communities') }} <span class="text-gray-400 font-bold">· {{ org.comunidades.length }}</span></p>
              <button
                v-if="org.comunidades.length"
                class="inline-flex items-center gap-1.5 h-[33px] px-3 rounded-[9px] border-[1.5px] border-gray-200 text-gray-700 bg-white text-[12.5px] font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                :disabled="!puedeCrear"
                :title="puedeCrear ? undefined : motivoSinAlta"
                @click="navigateTo('/organizacion/comunidades/nueva')"
              >
                <UiIcon name="add" class="w-[13px] h-[13px]" stroke-width="2" />
                {{ t('coms.new') }}
              </button>
            </div>

            <div v-if="!org.comunidades.length" class="px-6 py-10 text-center">
              <p class="text-sm text-gray-500 max-w-sm mx-auto mb-5">{{ t('coms.empty') }}</p>
              <UiButton v-if="puedeCrear" @click="navigateTo('/organizacion/comunidades/nueva')">
                <UiIcon name="add" class="w-4 h-4" stroke-width="2.25" />
                {{ t('coms.new') }}
              </UiButton>
              <p v-else class="text-[13px] font-bold text-amber-600">{{ motivoSinAlta }}</p>
            </div>

            <button
              v-for="(c, i) in org.comunidades"
              :key="c.id"
              :class="['group w-full flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors text-left', i > 0 ? 'border-t border-gray-50' : '']"
              :title="t('coms.enter')"
              @click="entrar(c)"
            >
              <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
                {{ c.nombre.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13.5px] font-extrabold text-gray-800 truncate">{{ c.nombre }}</p>
                <p class="text-[12px] text-gray-500 font-semibold mt-px">{{ resumenComunidad(c) }}</p>
              </div>
              <UiIcon name="chevronRight" class="w-[15px] h-[15px] text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" stroke-width="2" />
            </button>
          </div>

          <!-- Administradores: quiénes gestionan la org (la gestión vive en su página) -->
          <div class="card overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-6 py-[18px] border-b border-gray-100">
              <p class="text-[14.5px] font-extrabold text-gray-800">{{ t('admins.title') }} <span class="text-gray-400 font-bold">· {{ org.administradores.length }}</span></p>
              <div class="flex items-center gap-3">
                <button
                  v-if="esTitularOrgActiva"
                  class="inline-flex items-center gap-1.5 h-[33px] px-3 rounded-[9px] border-[1.5px] border-gray-200 text-gray-700 bg-white text-[12.5px] font-bold hover:bg-gray-50 transition-colors"
                  @click="navigateTo('/organizacion/administradores/nuevo')"
                >
                  <UiIcon name="add" class="w-[13px] h-[13px]" stroke-width="2" />
                  {{ t('admins.invite') }}
                </button>
                <NuxtLink to="/organizacion/administradores" class="text-xs font-bold text-brand-primary-700 hover:underline shrink-0">
                  {{ t('admins.viewAll') }}
                </NuxtLink>
              </div>
            </div>
            <div
              v-for="(a, i) in org.administradores"
              :key="a.id"
              :class="['flex items-center gap-3 px-6 py-3.5', i > 0 ? 'border-t border-gray-50' : '']"
            >
              <div class="w-[34px] h-[34px] rounded-full bg-brand-primary text-white flex items-center justify-center font-extrabold text-[12px] shrink-0">
                {{ nombreAdmin(a).charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13.5px] font-extrabold text-gray-800">
                  {{ nombreAdmin(a) }}
                  <span v-if="a.titular" class="inline-flex items-center text-[10.5px] font-extrabold px-[9px] py-0.5 rounded-full bg-brand-primary-50 text-brand-primary-800 ml-1.5 align-[1px]">{{ t('admins.titular') }}</span>
                </p>
                <p class="text-[12px] text-gray-500 font-semibold mt-px truncate">{{ a.perfil?.email ?? '—' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar: información -->
        <div class="flex flex-col gap-[22px]">
          <div class="card px-[22px] py-5">
            <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400 mb-3.5">{{ t('platform.orgDetail.information') }}</p>
            <div class="flex flex-col gap-3">
              <div v-if="org.correo" class="flex items-center gap-2.5 text-[13px] text-gray-700 font-semibold">
                <svg class="w-[15px] h-[15px] text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span class="truncate">{{ org.correo }}</span>
              </div>
              <div v-if="org.telefono" class="flex items-center gap-2.5 text-[13px] text-gray-700 font-semibold">
                <svg class="w-[15px] h-[15px] text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                {{ org.telefono }}
              </div>
              <div v-if="org.website" class="flex items-center gap-2.5 text-[13px] font-semibold">
                <svg class="w-[15px] h-[15px] text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
                </svg>
                <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="text-brand-primary-700 hover:underline truncate">{{ org.website }}</a>
              </div>
              <div class="h-px bg-gray-100 my-0.5" />
              <div class="flex items-center justify-between text-[12.5px]">
                <span class="text-gray-500 font-semibold">{{ t('platform.orgs.colType') }}</span>
                <span class="text-gray-800 font-extrabold">{{ tipoLabel ?? t('platform.orgDetail.noType') }}</span>
              </div>
              <div class="flex items-center justify-between text-[12.5px]">
                <span class="text-gray-500 font-semibold">{{ t('platform.orgDetail.created') }}</span>
                <span class="text-gray-800 font-extrabold">{{ fechaCorta(org.created_at) }}</span>
              </div>
              <div class="flex items-center justify-between text-[12.5px]">
                <span class="text-gray-500 font-semibold">{{ t('platform.orgDetail.owner') }}</span>
                <span v-if="titular" class="text-gray-800 font-extrabold truncate max-w-[160px]">{{ nombreAdmin(titular) }}</span>
                <span v-else class="text-amber-600 font-bold">{{ t('platform.orgDetail.noOwner') }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AdminDeOrg, ComunidadDeOrg, OrgDetalle } from '~/composables/useOrganizacion'

definePageMeta({ layout: 'dashboard', titleKey: 'nav.dashboard' })

const { t, locale } = useT()
const { setContexto, esTitularOrgActiva } = useContexto()
const { getOrganizacion } = useOrganizacion()

const org = ref<OrgDetalle | null>(null)
const loading = ref(true)

const tipoLabel = computed(() => {
  const nombre = org.value?.tipo?.nombre
  return nombre ? (nombre[locale.value] ?? nombre.es ?? null) : null
})

// Subtítulo del hero: el correo reemplaza al tipo (cae al tipo si no hay correo).
const subtitulo = computed(() => org.value?.correo || tipoLabel.value || t('platform.orgDetail.noType'))

// Se muestra la más reciente; sin historial aquí (eso es gestión, vive en Platform).
const lic = computed(() => {
  const arr = [...(org.value?.licencias ?? [])]
  return arr.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null
})

// VIGENTE con el mismo criterio del trigger 0007 (fechas date → comparación lexicográfica).
const licVigente = computed(() => {
  const hoy = new Date().toISOString().slice(0, 10)
  return (org.value?.licencias ?? [])
    .filter(l => (l.estado === 'ACTIVA' || l.estado === 'TRIAL')
      && l.fecha_inicio.slice(0, 10) <= hoy
      && (!l.fecha_fin || l.fecha_fin.slice(0, 10) >= hoy))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null
})
const puedeCrear = computed(() =>
  !!licVigente.value && (org.value?.comunidades.length ?? 0) < licVigente.value.max_comunidades)
const motivoSinAlta = computed(() =>
  licVigente.value ? t('coms.cupoLleno') : t('coms.sinLicencia'))

const titular = computed(() => org.value?.administradores.find(a => a.titular) ?? null)

function nombreAdmin(a: AdminDeOrg) {
  const p = a.perfil
  const nombre = p ? `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() : ''
  return nombre || p?.email || '—'
}

function uso(usados: number, max: number) {
  if (!max) return 0
  return Math.min(100, Math.round((usados / max) * 100))
}

const usoComunidades = computed(() => uso(org.value?.comunidades.length ?? 0, lic.value?.max_comunidades ?? 0))

// Educadores de TODA la org: suma de los conteos por comunidad (mismos embeds que la
// página Comunidades — sin filtrar por activo, igual que allá).
const educadoresUsados = computed(() =>
  (org.value?.comunidades ?? []).reduce((total, c) => total + (c.educadores?.[0]?.count ?? 0), 0))

// Días para el vencimiento de la licencia vigente (negativo = ya vencida).
const venceEn = computed(() => {
  const fin = lic.value?.fecha_fin
  if (!fin) return null
  return Math.ceil((new Date(fin).getTime() - Date.now()) / 86_400_000)
})
const venceLabel = computed(() => {
  if (venceEn.value === null) return ''
  return venceEn.value < 0
    ? t('orgHome.expiredAgo', { n: -venceEn.value })
    : t('orgHome.expiresIn', { n: venceEn.value })
})

function resumenComunidad(c: ComunidadDeOrg) {
  const educadores = tCount(t, 'orgHome.educadoresCount', c.educadores?.[0]?.count ?? 0)
  const talleres = tCount(t, 'orgHome.talleresCount', c.talleres?.[0]?.count ?? 0)
  return `${educadores} · ${talleres}`
}

// Entrar a una comunidad = cambiar el contexto y bajar a su operación.
function entrar(c: ComunidadDeOrg) {
  if (!org.value) return
  setContexto(org.value.id, c.id)
  navigateTo('/dashboard')
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function licenciaVariant(estado?: string): 'green' | 'blue' | 'red' | 'gray' {
  const map: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
    ACTIVA: 'green', TRIAL: 'blue', VENCIDA: 'red', SUSPENDIDA: 'gray',
  }
  return map[estado ?? ''] ?? 'gray'
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  org.value = await getOrganizacion()
  loading.value = false
})
</script>
