<template>
  <!-- El detalle de la org para SUS admins (titular o no): la misma vista que el
       superadmin tiene en Platform, pero de solo LECTURA — editar datos, licencias y
       titularidad siguen siendo del operador. -->
  <div class="max-w-[1120px] mx-auto">
    <div v-if="loading" class="ui-panel p-10 text-center text-body font-semibold text-subtle">{{ t('common.loading') }}</div>

    <template v-else-if="org">
      <!-- Hero: identidad. La organización no significa nada por sí misma: tono estable según su nombre -->
      <div class="mb-6 flex min-w-0 items-center gap-4">
        <UiSymbol :tone="uiToneFor(org.nombre)" class="text-title font-black text-(--tone-strong)">
          {{ org.nombre.charAt(0).toUpperCase() }}
        </UiSymbol>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="ui-heading">{{ org.nombre }}</h1>
            <UiBadge v-if="tipoLabel" tone="neutral">{{ tipoLabel }}</UiBadge>
            <UiBadge v-if="lic" :tone="licenciaTone(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
          </div>
          <p class="ui-text mt-1.5">
            {{ subtitulo }}<template v-if="org.telefono"> · {{ org.telefono }}</template><template v-if="org.website"> · <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="ui-link" data-tone="sky">{{ org.website }}</a></template>
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
        <!-- Columna principal: licencia vigente, comunidades y administradores -->
        <div class="flex min-w-0 flex-col gap-6">
          <div class="ui-panel overflow-hidden">
            <div class="ui-panel-header">
              <h2 class="ui-title">{{ t('platform.orgDetail.currentLicense') }}</h2>
              <UiBadge v-if="lic" :tone="licenciaTone(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
            </div>

            <template v-if="lic">
              <!-- Cupos: cifras sin tono propio (neutras); el uso, con el progreso del kit -->
              <div class="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-3">
                <div>
                  <div class="flex items-center gap-4">
                    <UiSymbol size="md" icon="home" tone="neutral" />
                    <div class="min-w-0">
                      <p class="flex items-baseline gap-1.5">
                        <span class="ui-stat-value">{{ org.comunidades.length }}</span>
                        <span class="text-body font-bold text-muted">{{ t('orgHome.de') }} {{ lic.max_comunidades }}</span>
                      </p>
                      <p class="ui-stat-label">{{ t('platform.orgDetail.communitiesShort') }}</p>
                    </div>
                  </div>
                  <UiProgress :value="usoComunidades" :label="t('platform.orgDetail.communitiesShort')" class="mt-4" />
                </div>
                <div>
                  <div class="flex items-center gap-4">
                    <UiSymbol size="md" icon="users" tone="neutral" />
                    <div class="min-w-0">
                      <p class="flex items-baseline gap-1.5">
                        <span class="ui-stat-value">{{ educadoresUsados }}</span>
                        <span class="text-body font-bold text-muted">{{ t('orgHome.de') }} {{ lic.max_educadores }}</span>
                      </p>
                      <p class="ui-stat-label">{{ t('platform.orgDetail.educators') }}</p>
                    </div>
                  </div>
                  <UiProgress :value="uso(educadoresUsados, lic.max_educadores)" :label="t('platform.orgDetail.educators')" class="mt-4" />
                </div>
                <div>
                  <div class="flex items-center gap-4">
                    <UiSymbol size="md" icon="book" tone="neutral" />
                    <div class="min-w-0">
                      <p class="flex items-baseline gap-1.5">
                        <span class="ui-stat-value">{{ org.personalizadosUsados }}</span>
                        <span class="text-body font-bold text-muted">{{ t('orgHome.de') }} {{ lic.max_personalizados }}</span>
                      </p>
                      <p class="ui-stat-label">{{ t('platform.orgDetail.custom') }}</p>
                    </div>
                  </div>
                  <UiProgress :value="uso(org.personalizadosUsados, lic.max_personalizados)" :label="t('platform.orgDetail.custom')" class="mt-4" />
                </div>
              </div>

              <!-- Vigencia / países -->
              <div class="flex flex-wrap items-center gap-7 border-t border-line bg-canvas px-6 py-3.5">
                <div class="flex items-center gap-2 text-caption font-semibold text-muted">
                  <UiIcon name="calendar" class="size-3.5 text-subtle" />
                  {{ t('platform.orgDetail.validity') }}: <span class="font-extrabold text-ink">{{ fechaCorta(lic.fecha_inicio, locale) }} – {{ lic.fecha_fin ? fechaCorta(lic.fecha_fin, locale) : t('platform.orgDetail.noEnd') }}</span>
                  <!-- Ya vencida → coral; vence en 30 días o menos → sol; si falta más, sin tono -->
                  <span
                    v-if="venceEn !== null"
                    :data-tone="venceEn < 0 ? 'coral' : venceEn <= 30 ? 'sun' : undefined"
                    :class="['font-extrabold', venceEn <= 30 ? 'text-(--tone-strong)' : 'text-subtle']"
                  >· {{ venceLabel }}</span>
                </div>
                <div class="flex items-center gap-2 text-caption font-semibold text-muted">
                  <UiIcon name="globe" class="size-3.5 text-subtle" />
                  {{ t('platform.orgDetail.countries') }}: <span class="font-extrabold text-ink">{{ lic.paises?.length ? lic.paises.join(', ') : t('platform.orgDetail.global') }}</span>
                </div>
              </div>

              <p v-if="lic.notas" class="ui-text border-t border-line px-6 py-3.5">{{ lic.notas }}</p>
            </template>

            <!-- Sin licencia: le falta lo necesario para operar (coral) -->
            <p v-else class="px-6 py-5 text-body font-bold text-(--tone-strong)" data-tone="coral">{{ t('platform.orgDetail.noLicenseAssigned') }}</p>
          </div>

          <!-- Comunidades: el corazón de la org. Vacía = el siguiente paso es crear la
               primera; con datos = la puerta de entrada a operar cada una. -->
          <div class="ui-panel overflow-hidden">
            <div class="ui-panel-header flex-wrap">
              <h2 class="ui-title">{{ t('platform.orgDetail.communities') }} <span class="text-body font-bold text-subtle">· {{ org.comunidades.length }}</span></h2>
              <UiButton
                v-if="org.comunidades.length"
                tone="neutral"
                size="sm"
                icon="plus"
                :disabled="!puedeCrear"
                :title="puedeCrear ? undefined : motivoSinAlta"
                @click="navigateTo('/organizacion/comunidades/nueva')"
              >
                {{ t('coms.new') }}
              </UiButton>
            </div>

            <!-- Vacía: crear la primera es la acción principal de la vista (lima) -->
            <div v-if="!org.comunidades.length" class="px-6 py-10 text-center">
              <p class="ui-text mx-auto mb-5 max-w-sm">{{ t('coms.empty') }}</p>
              <UiButton v-if="puedeCrear" icon="plus" @click="navigateTo('/organizacion/comunidades/nueva')">
                {{ t('coms.new') }}
              </UiButton>
              <!-- Sin alta posible: queda pendiente de la licencia (sol) -->
              <p v-else class="text-body font-bold text-(--tone-strong)" data-tone="sun">{{ motivoSinAlta }}</p>
            </div>

            <!-- La comunidad no significa nada por sí misma: tono estable según su nombre -->
            <div v-else class="divide-y divide-line">
              <button
                v-for="c in org.comunidades"
                :key="c.id"
                type="button"
                class="group flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-canvas"
                :title="t('coms.enter')"
                @click="entrar(c)"
              >
                <UiSymbol size="sm" :tone="uiToneFor(c.nombre)">{{ c.nombre.charAt(0).toUpperCase() }}</UiSymbol>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-body font-extrabold text-ink">{{ c.nombre }}</p>
                  <p class="mt-px text-caption font-semibold text-muted">{{ resumenComunidad(c) }}</p>
                </div>
                <UiIcon name="chevron-right" class="size-4 shrink-0 text-disabled opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
          </div>

          <!-- Administradores: quiénes gestionan la org (la gestión vive en su página) -->
          <div class="ui-panel overflow-hidden">
            <div class="ui-panel-header flex-wrap">
              <h2 class="ui-title">{{ t('admins.title') }} <span class="text-body font-bold text-subtle">· {{ org.administradores.length }}</span></h2>
              <div class="flex items-center gap-3">
                <UiButton
                  v-if="esTitularOrgActiva"
                  tone="neutral"
                  size="sm"
                  icon="user-plus"
                  @click="navigateTo('/organizacion/administradores/nuevo')"
                >
                  {{ t('admins.invite') }}
                </UiButton>
                <NuxtLink to="/organizacion/administradores" class="ui-link shrink-0 text-caption" data-tone="sky">
                  {{ t('admins.viewAll') }}
                </NuxtLink>
              </div>
            </div>
            <div class="divide-y divide-line">
              <div
                v-for="a in org.administradores"
                :key="a.id"
                class="flex items-center gap-3 px-6 py-3.5"
              >
                <UiAvatar :name="nombreAdmin(a)" />
                <div class="min-w-0 flex-1">
                  <p class="flex min-w-0 items-center gap-1.5 text-body font-extrabold text-ink">
                    <span class="truncate">{{ nombreAdmin(a) }}</span>
                    <!-- El rol no es un estado: titular es información (cielo) -->
                    <UiBadge v-if="a.titular" tone="sky" class="shrink-0">{{ t('admins.titular') }}</UiBadge>
                  </p>
                  <p class="mt-px truncate text-caption font-semibold text-muted">{{ a.perfil?.email ?? '—' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar: información -->
        <div class="flex flex-col gap-6">
          <div class="ui-panel px-6 py-5">
            <p class="eyebrow mb-4">{{ t('platform.orgDetail.information') }}</p>
            <div class="flex flex-col gap-3">
              <div v-if="org.correo" class="flex items-center gap-2.5 text-body font-semibold text-muted">
                <UiIcon name="mail" class="size-4 shrink-0 text-subtle" />
                <span class="truncate">{{ org.correo }}</span>
              </div>
              <div v-if="org.telefono" class="flex items-center gap-2.5 text-body font-semibold text-muted">
                <UiIcon name="phone" class="size-4 shrink-0 text-subtle" />
                {{ org.telefono }}
              </div>
              <div v-if="org.website" class="flex min-w-0 items-center gap-2.5 text-body">
                <UiIcon name="globe" class="size-4 shrink-0 text-subtle" />
                <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="ui-link min-w-0" data-tone="sky">
                  <span class="min-w-0 truncate">{{ org.website }}</span>
                </a>
              </div>
              <div class="my-0.5 h-px bg-line" />
              <div class="flex items-center justify-between text-caption">
                <span class="font-semibold text-muted">{{ t('platform.orgs.colType') }}</span>
                <span class="font-extrabold text-ink">{{ tipoLabel ?? t('platform.orgDetail.noType') }}</span>
              </div>
              <div class="flex items-center justify-between text-caption">
                <span class="font-semibold text-muted">{{ t('platform.orgDetail.created') }}</span>
                <span class="font-extrabold text-ink">{{ fechaCorta(org.created_at, locale) }}</span>
              </div>
              <div class="flex items-center justify-between text-caption">
                <span class="font-semibold text-muted">{{ t('platform.orgDetail.owner') }}</span>
                <span v-if="titular" class="max-w-40 truncate font-extrabold text-ink">{{ nombreAdmin(titular) }}</span>
                <!-- Sin titular: pendiente de designarlo (sol), igual que «sin administradores» en Platform -->
                <span v-else class="font-bold text-(--tone-strong)" data-tone="sun">{{ t('platform.orgDetail.noOwner') }}</span>
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

// VIGENTE con el mismo criterio del trigger (fechas date → comparación lexicográfica). «Hoy» en UTC
// a propósito: la base compara con `current_date` (UTC) y este gate no debe prometer lo que rechaza.
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
  return diasHasta(fin)
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


onMounted(async () => {
  org.value = await getOrganizacion()
  loading.value = false
})
</script>
