<template>
  <div>
    <UiPageHeader :title="t('educators.title')" :description="t('educators.desc')">
      <template #actions>
        <UiButton variant="outline" icon="plus" @click="navigateTo('/organizacion/educators/grupo-nuevo')">
          {{ t('educators.newGroup') }}
        </UiButton>
        <UiButton icon="user-plus" @click="navigateTo('/organizacion/educators/nuevo')">
          {{ t('educators.add') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Toolbar: selector de vista + búsqueda + filtros -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <UiTabs v-model="tabModel" :items="tabItems" fit />
      <!-- Ocupa lo que queda de la línea, a la derecha; si no le quedan 320 px, baja a la suya. El
           buscador se encoge (hasta 320) y el filtro conserva su ancho: nunca se sale de la pantalla. -->
      <div v-if="activeTab === 'educadores'" class="flex min-w-0 grow basis-80 items-center justify-end gap-3">
        <UiSearchInput v-model="searchQuery" :placeholder="t('educators.searchPh')" max-width="xs" class="min-w-0 flex-1" />
        <UiSelect v-model="filterEstado" variant="toolbar" :prefix="t('educators.state')" :options="estadoOptions" />
      </div>
    </div>

    <!-- EDUCADORES TAB -->
    <div v-if="activeTab === 'educadores'">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="educator in filteredEducators"
          :key="educator.id"
          class="ui-panel p-6"
        >
          <div class="mb-5 flex items-center gap-3">
            <UiAvatar :name="educator.nombre" :initials="educator.initials" size="lg" />
            <div class="min-w-0 flex-1">
              <h3 class="truncate text-body font-extrabold text-ink">{{ educator.nombre }}</h3>
              <p class="mt-0.5 text-caption font-semibold text-muted">{{ educator.profesion }}</p>
            </div>
            <UiBadge :tone="educator.estado === 'activo' ? 'lime' : 'neutral'" :dot="educator.estado === 'activo'" class="shrink-0">
              {{ educator.estado === 'activo' ? t('educators.active') : t('educators.inactive') }}
            </UiBadge>
          </div>

          <div class="flex flex-col gap-2 rounded-control-sm border border-line bg-canvas p-3.5">
            <div class="flex items-center gap-2.5 text-caption font-semibold text-muted">
              <UiIcon name="mail" class="size-3.5 shrink-0 text-subtle" />
              <span class="truncate">{{ educator.email }}</span>
            </div>
            <div class="flex items-center gap-2.5 text-caption font-semibold text-muted">
              <UiIcon name="phone" class="size-3.5 shrink-0 text-subtle" />
              {{ educator.telefono }}
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <!-- Etiquetas sin significado: neutras (un grupo en lima se leería como «Activo») -->
            <UiBadge v-if="educator.grupo" tone="neutral">{{ educator.grupo }}</UiBadge>
            <UiBadge tone="neutral">{{ tCount(t, 'orgHome.talleresCount', educator.talleres) }}</UiBadge>
            <!-- El acceso solo avisa lo pendiente o lo que falta: sin PIN con su enlace (sol) o sin él
                 (coral); con PIN, un enlace para restablecerlo sin usar (sol). -->
            <UiBadge v-if="educator.acceso !== 'pin'" :tone="enlacePendiente(educator) ? 'sun' : 'coral'">
              {{ enlacePendiente(educator) ? t('educators.notActivated') : t('educators.noAccess') }}
            </UiBadge>
            <UiBadge v-else-if="enlacePendiente(educator)" tone="sun">{{ t('educators.pinResetPending') }}</UiBadge>
          </div>

          <!-- Editar la ficha (si está activo y dar de baja, dentro) y su acceso: sin PIN, su enlace de
               acceso; con PIN, restablecerlo -->
          <div class="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
            <UiButton variant="outline" size="sm" icon="pencil" :to="`/organizacion/educators/${educator.id}/editar`">
              {{ t('common.edit') }}
            </UiButton>
            <UiButton variant="outline" size="sm" :icon="educator.acceso === 'pin' ? 'key' : 'link'" @click="educadorAcceso = educator.id">
              {{ educator.acceso === 'pin' ? t('educators.resetPin') : t('educators.accessLink') }}
            </UiButton>
          </div>
        </article>
      </div>

      <div v-if="!filteredEducators.length" class="ui-panel">
        <UiEmptyState
          icon="users"
          :title="educators.length ? t('educators.noResults') : t('educators.empty')"
          :text="educators.length ? t('educators.noResultsText') : t('educators.emptyText')"
        >
          <UiButton v-if="educators.length" variant="outline" size="sm" @click="resetFilters">{{ t('common.clearFilters') }}</UiButton>
          <UiButton v-else icon="user-plus" @click="navigateTo('/organizacion/educators/nuevo')">{{ t('educators.add') }}</UiButton>
        </UiEmptyState>
      </div>
    </div>

    <!-- Su acceso a Educators: el enlace de primer acceso o el de restablecer el PIN (0013) -->
    <EducadorAcceso :educador-id="educadorAcceso" @close="educadorAcceso = null" />

    <!-- GRUPOS TAB: cada tarjeta lleva a su detalle (miembros, edición y borrado) -->
    <div v-if="activeTab === 'grupos'">
      <div v-if="grupos.length" class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="grupo in grupos"
          :key="grupo.id"
          :to="`/organizacion/educators/grupos/${grupo.id}`"
          class="ui-panel ui-panel-interactive block p-6"
        >
          <div class="mb-3 flex items-start gap-3">
            <UiSymbol icon="users" size="md" :tone="uiToneFor(grupo.nombre)" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="truncate text-body font-extrabold text-ink">{{ grupo.nombre }}</h3>
                <UiBadge :tone="grupo.estado === 'activo' ? 'lime' : 'neutral'" :dot="grupo.estado === 'activo'" class="shrink-0">
                  {{ grupo.estado === 'activo' ? t('educators.active') : t('educators.inactive') }}
                </UiBadge>
              </div>
              <p class="ui-caption mt-1 line-clamp-2">{{ grupo.descripcion || t('educators.noDescription') }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <UiBadge tone="neutral">{{ tCount(t, 'educators.members', grupo.miembros) }}</UiBadge>
            <span class="ui-link text-caption" data-tone="sky">{{ t('educators.manage') }}<UiIcon name="chevron-right" class="size-3.5" /></span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="ui-panel">
        <UiEmptyState icon="users" :title="t('educators.noGroups')" :text="t('educators.noGroupsText')">
          <!-- La acción principal de la vista ya es «Agregar Educador»: esta va neutra -->
          <UiButton variant="outline" icon="plus" @click="navigateTo('/organizacion/educators/grupo-nuevo')">{{ t('educators.createGroup') }}</UiButton>
        </UiEmptyState>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Educator } from '~/composables/useEducators'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const activeTab = ref<'educadores' | 'grupos'>('educadores')
// Puente tipado: UiTabs habla en string; la pestaña es una unión cerrada.
const tabModel = computed({
  get: () => activeTab.value as string,
  set: v => (activeTab.value = v as 'educadores' | 'grupos'),
})
const searchQuery = ref('')
const filterEstado = ref('')

const estadoOptions = computed(() => [
  { value: '', label: t('common.all') },
  { value: 'activo', label: t('educators.actives') },
  { value: 'inactivo', label: t('educators.inactives') },
])

const { educators, groups: grupos } = useEducators()

// ── Su acceso: el educador del diálogo ────────────────────────────────────────
const educadorAcceso = ref<number | null>(null)
const enlacePendiente = (e: Educator) => !!e.enlace && !e.enlace.vencido

const tabItems = computed(() => [
  { value: 'educadores', label: `${t('educators.title')} · ${educators.value.length}` },
  { value: 'grupos', label: `${t('educators.groups')} · ${grupos.value.length}` },
])

function resetFilters() {
  searchQuery.value = ''
  filterEstado.value = ''
}

const filteredEducators = computed(() => {
  return educators.value.filter((educator) => {
    const matchesSearch = searchQuery.value === ''
      || educator.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())
      || educator.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesEstado = filterEstado.value === '' || educator.estado === filterEstado.value
    return matchesSearch && matchesEstado
  })
})
</script>
