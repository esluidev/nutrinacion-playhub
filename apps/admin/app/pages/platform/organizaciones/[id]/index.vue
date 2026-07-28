<template>
  <div class="max-w-[1120px] mx-auto">
    <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>

    <div v-else-if="!org" class="card p-10 text-center text-sm text-gray-500">
      {{ t('platform.orgDetail.notFound') }}
      <NuxtLink to="/platform/organizaciones" class="text-brand-primary-700 font-semibold ml-1">{{ t('platform.orgDetail.back') }}</NuxtLink>
    </div>

    <template v-else>
      <!-- Hero: identidad + acciones -->
      <div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-[54px] h-[54px] rounded-[15px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center font-extrabold text-xl shrink-0">
            {{ org.nombre.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-2xl font-display font-semibold text-brand-dark tracking-[-0.01em]">{{ org.nombre }}</h1>
              <span v-if="org.tipo?.nombre?.es" class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-gray-100 text-gray-600">{{ org.tipo.nombre.es }}</span>
              <UiBadge v-if="lic" :variant="licenciaVariant(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
            </div>
            <p class="text-[13px] text-gray-500 font-semibold mt-1.5">
              {{ subtitulo }}<template v-if="org.telefono"> · {{ org.telefono }}</template><template v-if="org.website"> · <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ org.website }}</a></template>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-[9px] shrink-0">
          <UiButton variant="outline" class="!h-10" @click="navigateTo(`/platform/organizaciones/${org.id}/editar`)">
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            {{ t('platform.orgDetail.edit') }}
          </UiButton>
          <UiButton v-if="!lic" variant="outline" class="!h-10" @click="navigateTo(`/platform/licencias/nueva?org=${org.id}`)">{{ t('platform.orgDetail.assignLicense') }}</UiButton>
          <UiButton class="!h-10" @click="navigateTo(`/platform/invitaciones/nueva?org=${org.id}`)">
            <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
            {{ t('platform.orgDetail.inviteAdmin') }}
          </UiButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[22px] items-start">
        <!-- Columna principal -->
        <div class="flex flex-col gap-[22px] min-w-0">
          <!-- Licencia actual -->
          <div class="card overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-6 py-[18px] border-b border-gray-100">
              <div class="flex items-center gap-2.5">
                <p class="text-[14.5px] font-extrabold text-gray-800">{{ t('platform.orgDetail.currentLicense') }}</p>
                <UiBadge v-if="lic" :variant="licenciaVariant(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
              </div>
              <div v-if="lic" class="flex items-center gap-2">
                <button class="inline-flex items-center gap-1.5 h-[33px] px-3 rounded-[9px] border-[1.5px] border-gray-200 text-gray-700 bg-white text-[12.5px] font-bold hover:bg-gray-50 transition-colors" @click="navigateTo(`/platform/licencias/${lic.id}`)">
                  {{ t('platform.orgDetail.edit') }}
                </button>
                <button class="inline-flex items-center gap-1.5 h-[33px] px-3 rounded-[9px] border-[1.5px] border-gray-200 text-gray-700 bg-white text-[12.5px] font-bold hover:bg-gray-50 transition-colors" @click="navigateTo(`/platform/licencias/nueva?org=${org.id}`)">
                  <svg class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  {{ t('platform.orgDetail.renew') }}
                </button>
              </div>
            </div>

            <template v-if="lic">
              <!-- Cupos -->
              <div class="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <div class="flex items-baseline gap-[5px]">
                    <span class="text-[22px] font-display font-semibold text-brand-dark">{{ org.comunidades.length }}</span>
                    <span class="text-[13px] font-bold text-gray-500">de {{ lic.max_comunidades }}</span>
                  </div>
                  <p class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em] mt-1 mb-2">{{ t('platform.orgDetail.communitiesShort') }}</p>
                  <div class="h-[5px] rounded-full bg-gray-100 overflow-hidden">
                    <div class="h-full rounded-full bg-brand-primary" :style="{ width: usoComunidades + '%' }" />
                  </div>
                </div>
                <div>
                  <span class="text-[22px] font-display font-semibold text-brand-dark">{{ lic.max_educadores }}</span>
                  <p class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em] mt-1">{{ t('platform.orgDetail.educators') }} (cupo)</p>
                </div>
                <div>
                  <span class="text-[22px] font-display font-semibold text-brand-dark">{{ lic.max_personalizados }}</span>
                  <p class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em] mt-1">{{ t('platform.orgDetail.custom') }} (cupo)</p>
                </div>
              </div>

              <!-- Vigencia / países -->
              <div class="flex items-center gap-7 px-6 py-3.5 bg-brand-tint border-t border-gray-100 flex-wrap">
                <div class="flex items-center gap-2 text-[12.5px] text-gray-600 font-semibold">
                  <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  {{ t('platform.orgDetail.validity') }}: <span class="text-gray-800 font-extrabold">{{ fechaCorta(lic.fecha_inicio) }} – {{ lic.fecha_fin ? fechaCorta(lic.fecha_fin) : t('platform.orgDetail.noEnd') }}</span>
                </div>
                <div class="flex items-center gap-2 text-[12.5px] text-gray-600 font-semibold">
                  <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
                  </svg>
                  {{ t('platform.orgDetail.countries') }}: <span class="text-gray-800 font-extrabold">{{ lic.paises?.length ? lic.paises.join(', ') : t('platform.orgDetail.global') }}</span>
                </div>
              </div>

              <p v-if="lic.notas" class="text-sm text-gray-500 px-6 py-3.5 border-t border-gray-100">{{ lic.notas }}</p>

              <div v-if="historial.length" class="px-6 py-3.5 border-t border-gray-100">
                <p class="text-[10px] font-extrabold tracking-[0.1em] text-gray-400 uppercase mb-2">{{ t('platform.orgDetail.history') }} ({{ historial.length }})</p>
                <NuxtLink
                  v-for="h in historial"
                  :key="h.id"
                  :to="`/platform/licencias/${h.id}`"
                  class="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors max-w-md"
                >
                  <UiBadge :variant="licenciaVariant(h.estado)">{{ t('state.' + h.estado) }}</UiBadge>
                  <span class="text-xs text-gray-400 font-semibold">{{ fechaCorta(h.fecha_inicio) }} — {{ h.fecha_fin ? fechaCorta(h.fecha_fin) : t('platform.orgDetail.noEnd') }}</span>
                </NuxtLink>
              </div>
            </template>

            <p v-else class="text-sm text-gray-400 px-6 py-5">{{ t('platform.orgDetail.noLicenseAssigned') }}</p>
          </div>

          <!-- Administradores -->
          <div class="card overflow-hidden">
            <div class="px-6 py-[18px] border-b border-gray-100">
              <p class="text-[14.5px] font-extrabold text-gray-800">{{ t('platform.orgDetail.admins') }} <span class="text-gray-400 font-bold">· {{ administradores.length }}</span></p>
            </div>
            <p v-if="!administradores.length" class="px-6 py-6 text-sm text-gray-400">{{ t('platform.orgDetail.noAdmins') }}</p>
            <div
              v-for="(a, i) in administradores"
              :key="a.id"
              :class="['flex items-center gap-3 px-6 py-3.5', i > 0 ? 'border-t border-gray-50' : '']"
            >
              <div class="w-[34px] h-[34px] rounded-full bg-brand-primary text-white flex items-center justify-center font-extrabold text-[12px] shrink-0">
                {{ inicialesAdmin(a) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13.5px] font-extrabold text-gray-800">
                  {{ nombreAdmin(a) }}
                  <span v-if="a.titular" class="inline-flex items-center text-[10.5px] font-extrabold px-[9px] py-0.5 rounded-full bg-brand-purple-50 text-brand-purple-600 ml-1.5 align-[1px]">{{ t('platform.orgDetail.titular') }}</span>
                </p>
                <p class="text-[12px] text-gray-500 font-semibold mt-px">{{ a.perfil?.email ?? '—' }}</p>
              </div>
              <button
                v-if="!a.titular"
                class="inline-flex items-center gap-1.5 h-[30px] px-[11px] rounded-[8px] text-[12px] font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                @click="marcarTitular(a)"
              >
                <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                {{ t('platform.orgDetail.setTitular') }}
              </button>
            </div>
          </div>

          <!-- Invitaciones -->
          <div class="card overflow-hidden">
            <div class="flex items-center justify-between px-6 py-[18px] border-b border-gray-100">
              <p class="text-[14.5px] font-extrabold text-gray-800">{{ t('platform.orgDetail.invitations') }} <span class="text-gray-400 font-bold">· {{ org.invitaciones?.length ?? 0 }}</span></p>
              <button class="inline-flex items-center gap-1.5 h-[33px] px-3 rounded-[9px] border-[1.5px] border-gray-200 text-gray-700 bg-white text-[12.5px] font-bold hover:bg-gray-50 transition-colors" @click="navigateTo(`/platform/invitaciones/nueva?org=${org.id}`)">
                <svg class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {{ t('platform.invs.new') }}
              </button>
            </div>
            <UiDataTable flat :columns="invCols" :rows="org.invitaciones" :row-key="(i) => i.id" :empty-text="t('platform.orgDetail.noInvitations')">
              <template #cell-role="{ row }">
                <UiBadge :variant="row.role === 'ADMIN' ? 'purple' : 'blue'">{{ roleLabel(row.role) }}</UiBadge>
              </template>
              <template #cell-email="{ row }">
                <span v-if="row.email" class="text-[13px] text-gray-700 font-semibold">{{ row.email }}</span>
                <span v-else class="text-[13px] text-gray-500 font-semibold italic">{{ t('platform.invs.openLink') }}</span>
              </template>
              <template #cell-estado="{ row }">
                <UiBadge :variant="invitacionVariant(row.estado)" dot>{{ t('state.' + row.estado) }}</UiBadge>
              </template>
              <template #cell-vence="{ row }">
                <span class="text-gray-500 text-xs font-semibold">{{ row.expira_en ? fechaCorta(row.expira_en) : '—' }}</span>
              </template>
              <template #cell-acciones="{ row }">
                <div class="flex items-center justify-end gap-1">
                  <button
                    :class="[
                      'w-[30px] h-[30px] rounded-[8px] flex items-center justify-center transition-colors',
                      copiado === row.token ? 'bg-brand-primary-50 text-brand-primary-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
                    ]"
                    :title="copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink')"
                    @click="copiarLink(row.token)"
                  >
                    <svg v-if="copiado === row.token" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <svg v-else class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                  </button>
                  <button
                    v-if="row.estado === 'PENDIENTE'"
                    class="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    :title="t('platform.invs.revoke')"
                    @click="revocar(row.id)"
                  >
                    <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636l12.728 12.728Z" />
                    </svg>
                  </button>
                </div>
              </template>
            </UiDataTable>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-[22px]">
          <!-- Información -->
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
                <span class="text-gray-800 font-extrabold">{{ org.tipo?.nombre?.es ?? t('platform.orgDetail.noType') }}</span>
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

          <!-- Comunidades -->
          <div class="card px-[22px] py-5">
            <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400 mb-3.5">{{ t('platform.orgDetail.communities') }} · {{ org.comunidades.length }}</p>
            <p v-if="!org.comunidades.length" class="text-sm text-gray-400">—</p>
            <div class="flex flex-col gap-1">
              <div
                v-for="c in org.comunidades"
                :key="c.id"
                class="flex items-center gap-[11px] px-2.5 py-2 -mx-2.5 rounded-[10px]"
              >
                <div class="w-[30px] h-[30px] rounded-[9px] bg-brand-primary-100 text-brand-primary-800 flex items-center justify-center font-extrabold text-[11.5px] shrink-0">
                  {{ c.nombre.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[13px] font-extrabold text-gray-800 truncate">{{ c.nombre }}</p>
                  <p v-if="c.pais" class="text-[11.5px] text-gray-500 font-semibold mt-px">{{ c.pais }}</p>
                </div>
              </div>
            </div>
          </div>
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

// % de uso del cupo de comunidades (dato real: las comunidades ya existen en la org).
const usoComunidades = computed(() => {
  const max = lic.value?.max_comunidades ?? 0
  if (!max) return 0
  return Math.min(100, Math.round(((org.value?.comunidades.length ?? 0) / max) * 100))
})

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
