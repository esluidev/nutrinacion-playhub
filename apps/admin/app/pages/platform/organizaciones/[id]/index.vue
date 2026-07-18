<template>
  <div>
    <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>

    <div v-else-if="!org" class="card p-10 text-center text-sm text-gray-500">
      {{ t('platform.orgDetail.notFound') }}
      <NuxtLink to="/platform/organizaciones" class="text-brand-primary-600 font-semibold ml-1">{{ t('platform.orgDetail.back') }}</NuxtLink>
    </div>

    <template v-else>
      <!-- Identidad + acciones -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-display font-bold text-brand-dark">{{ org.nombre }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ subtitulo }}</p>
          <div v-if="org.telefono || org.website" class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
            <span v-if="org.telefono">{{ org.telefono }}</span>
            <a v-if="org.website" :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ org.website }}</a>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UiButton variant="outline" size="sm" @click="navigateTo(`/platform/organizaciones/${org.id}/editar`)">{{ t('platform.orgDetail.edit') }}</UiButton>
          <UiButton v-if="!lic" variant="outline" size="sm" @click="navigateTo(`/platform/licencias/nueva?org=${org.id}`)">{{ t('platform.orgDetail.assignLicense') }}</UiButton>
          <UiButton size="sm" @click="navigateTo(`/platform/invitaciones/nueva?org=${org.id}`)">{{ t('platform.orgDetail.inviteAdmin') }}</UiButton>
        </div>
      </div>

      <!-- Resumen de estado -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card p-4">
          <p class="text-xs text-gray-400 mb-2">{{ t('platform.orgDetail.license') }}</p>
          <UiBadge v-if="lic" :variant="licenciaVariant(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
          <span v-else class="text-sm text-gray-400 font-medium">{{ t('platform.orgDetail.noLicense') }}</span>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-400 mb-2">{{ t('platform.orgDetail.owner') }}</p>
          <p v-if="titular" class="text-sm text-brand-dark font-semibold truncate">
            {{ nombreAdmin(titular) }}
          </p>
          <span v-else class="text-sm text-amber-600 font-medium">{{ t('platform.orgDetail.noOwner') }}</span>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-400 mb-2">{{ t('platform.orgDetail.communities') }}</p>
          <p class="text-lg font-display font-bold text-brand-dark leading-none">{{ org.comunidades.length }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-400 mb-2">{{ t('platform.orgDetail.created') }}</p>
          <p class="text-sm text-brand-dark font-semibold">{{ fechaCorta(org.created_at) }}</p>
        </div>
      </div>

      <!-- Licencia actual -->
      <div class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h2 class="section-title">{{ t('platform.orgDetail.currentLicense') }}</h2>
            <UiBadge v-if="lic" :variant="licenciaVariant(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
          </div>
          <div v-if="lic" class="flex items-center gap-4">
            <NuxtLink :to="`/platform/licencias/${lic.id}`" class="text-xs text-brand-primary-600 font-semibold hover:underline">{{ t('platform.orgDetail.edit') }}</NuxtLink>
            <NuxtLink :to="`/platform/licencias/nueva?org=${org.id}`" class="text-xs text-gray-500 font-semibold hover:underline">{{ t('platform.orgDetail.renew') }}</NuxtLink>
          </div>
        </div>

        <template v-if="lic">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div><p class="text-xl font-display font-bold text-brand-dark">{{ lic.max_comunidades }}</p><p class="text-xs text-gray-400">{{ t('platform.orgDetail.communitiesShort') }}</p></div>
            <div><p class="text-xl font-display font-bold text-brand-dark">{{ lic.max_educadores }}</p><p class="text-xs text-gray-400">{{ t('platform.orgDetail.educators') }}</p></div>
            <div><p class="text-xl font-display font-bold text-brand-dark">{{ lic.max_personalizados }}</p><p class="text-xs text-gray-400">{{ t('platform.orgDetail.custom') }}</p></div>
            <div>
              <p class="text-sm text-brand-dark font-medium leading-tight">{{ fechaCorta(lic.fecha_inicio) }}<br>{{ lic.fecha_fin ? fechaCorta(lic.fecha_fin) : t('platform.orgDetail.noEnd') }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ t('platform.orgDetail.validity') }}</p>
            </div>
            <div>
              <p class="text-sm text-brand-dark font-medium leading-tight">{{ lic.paises?.length ? lic.paises.join(', ') : t('platform.orgDetail.global') }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ t('platform.orgDetail.countries') }}</p>
            </div>
          </div>
          <p v-if="lic.notas" class="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-50">{{ lic.notas }}</p>

          <div v-if="historial.length" class="mt-4 pt-4 border-t border-gray-50">
            <p class="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-2">{{ t('platform.orgDetail.history') }}</p>
            <NuxtLink
              v-for="h in historial"
              :key="h.id"
              :to="`/platform/licencias/${h.id}`"
              class="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors max-w-md"
            >
              <UiBadge :variant="licenciaVariant(h.estado)">{{ t('state.' + h.estado) }}</UiBadge>
              <span class="text-xs text-gray-400">{{ fechaCorta(h.fecha_inicio) }} — {{ h.fecha_fin ? fechaCorta(h.fecha_fin) : t('platform.orgDetail.noEnd') }}</span>
            </NuxtLink>
          </div>
        </template>

        <p v-else class="text-sm text-gray-400 py-2">{{ t('platform.orgDetail.noLicenseAssigned') }}</p>
      </div>

      <!-- Administradores -->
      <div class="mb-6">
        <h2 class="section-title mb-3">{{ t('platform.orgDetail.admins') }}</h2>
        <UiDataTable :columns="adminCols" :rows="administradores" :row-key="(a) => a.id" :empty-text="t('platform.orgDetail.noAdmins')">
          <template #cell-nombre="{ row }">
            <span class="font-medium text-brand-dark">{{ nombreAdmin(row) }}</span>
            <UiBadge v-if="row.titular" variant="purple" class="ml-2">{{ t('platform.orgDetail.titular') }}</UiBadge>
          </template>
          <template #cell-email="{ row }">
            <span class="text-gray-600">{{ row.perfil?.email ?? '—' }}</span>
          </template>
          <template #cell-acciones="{ row }">
            <button v-if="!row.titular" class="text-xs text-brand-primary-600 font-semibold hover:underline" @click="marcarTitular(row)">
              {{ t('platform.orgDetail.setTitular') }}
            </button>
          </template>
        </UiDataTable>
      </div>

      <!-- Invitaciones -->
      <div class="mb-6">
        <h2 class="section-title mb-3">{{ t('platform.orgDetail.invitations') }}</h2>
        <UiDataTable :columns="invCols" :rows="org.invitaciones" :row-key="(i) => i.id" :empty-text="t('platform.orgDetail.noInvitations')">
          <template #cell-role="{ row }">
            <UiBadge :variant="row.role === 'ADMIN' ? 'purple' : 'blue'">{{ roleLabel(row.role) }}</UiBadge>
          </template>
          <template #cell-email="{ row }">
            <span class="text-gray-600">{{ row.email ?? t('platform.invs.openLink') }}</span>
          </template>
          <template #cell-estado="{ row }">
            <UiBadge :variant="invitacionVariant(row.estado)">{{ t('state.' + row.estado) }}</UiBadge>
          </template>
          <template #cell-vence="{ row }">
            <span class="text-gray-400 text-xs">{{ row.expira_en ? fechaCorta(row.expira_en) : '—' }}</span>
          </template>
          <template #cell-acciones="{ row }">
            <button class="text-xs text-brand-primary-600 font-semibold hover:underline" @click="copiarLink(row.token)">
              {{ copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink') }}
            </button>
            <button v-if="row.estado === 'PENDIENTE'" class="text-xs text-red-500 font-semibold hover:underline ml-3" @click="revocar(row.id)">{{ t('platform.invs.revoke') }}</button>
          </template>
        </UiDataTable>
      </div>

      <!-- Comunidades -->
      <div v-if="org.comunidades.length">
        <h2 class="section-title mb-3">{{ t('platform.orgDetail.communities') }}</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="c in org.comunidades" :key="c.id" class="inline-flex items-center gap-1.5 text-sm text-brand-dark bg-white border border-gray-100 rounded-lg px-3 py-1.5">
            {{ c.nombre }}<span v-if="c.pais" class="text-xs text-gray-400">· {{ c.pais }}</span>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgDetail.title' })

const { t, locale } = useT()
const route = useRoute()
const id = Number(route.params.id)
const { getOrganizacion, revokeInvitacion, setTitular } = usePlatform()

const org = ref<any>(null)
const loading = ref(true)
const copiado = ref<string | null>(null)

const invCols = computed(() => [
  { key: 'role', label: t('platform.invs.colRole') },
  { key: 'email', label: t('platform.invs.colEmail') },
  { key: 'estado', label: t('platform.invs.colState') },
  { key: 'vence', label: t('platform.invs.colExpires') },
  { key: 'acciones', label: t('platform.invs.colActions'), align: 'right' as const },
])

const adminCols = computed(() => [
  { key: 'nombre', label: t('platform.orgDetail.adminName') },
  { key: 'email', label: t('platform.invs.colEmail') },
  { key: 'acciones', label: '', align: 'right' as const },
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

onMounted(cargar)

async function revocar(invId: number) {
  await revokeInvitacion(invId)
  await cargar()
}

async function copiarLink(token: string) {
  await navigator.clipboard.writeText(`${window.location.origin}/invitacion/${token}`)
  copiado.value = token
  setTimeout(() => (copiado.value = null), 1500)
}

function licenciaVariant(estado?: string): 'green' | 'blue' | 'red' | 'gray' {
  const map: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
    ACTIVA: 'green', TRIAL: 'blue', VENCIDA: 'red', SUSPENDIDA: 'gray',
  }
  return map[estado ?? ''] ?? 'gray'
}

function invitacionVariant(estado?: string): 'green' | 'blue' | 'red' | 'gray' {
  const map: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
    PENDIENTE: 'blue', USADA: 'green', EXPIRADA: 'gray', REVOCADA: 'red',
  }
  return map[estado ?? ''] ?? 'gray'
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
