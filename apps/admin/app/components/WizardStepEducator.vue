<template>
  <div>
    <!-- Modo: selector de vista (educadores o grupos) -->
    <UiTabs v-model="modeModel" :items="modeTabs" fit class="mb-5" />

    <!-- MODO INDIVIDUAL: la selección en cielo (borde, marca y fondo); cada persona con su avatar -->
    <template v-if="mode === 'individual'">
      <div v-if="activeEducators.length" class="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <button
          v-for="edu in activeEducators"
          :key="edu.id"
          type="button"
          data-tone="sky"
          class="select-card flex-row justify-start gap-3 px-4 py-3.5 pr-10 text-left"
          :aria-pressed="isEducatorSelected(edu.id)"
          @click="toggleEducator(edu.id)"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          <UiAvatar :name="edu.nombre" :initials="edu.initials" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-body font-extrabold text-ink">{{ edu.nombre }}</span>
            <span class="ui-caption mt-px block">{{ [edu.profesion, edu.grupo].filter(Boolean).join(' · ') }}</span>
          </span>
        </button>
      </div>

      <!-- Sin educadores activos no hay a quién asignar: el camino es darlos de alta -->
      <div v-else class="ui-panel">
        <UiEmptyState icon="users" :title="t('wizard.noEducators')" :text="t('wizard.noEducatorsText')">
          <UiButton variant="outline" size="sm" icon="user-plus" to="/organizacion/educators/nuevo">{{ t('educators.add') }}</UiButton>
        </UiEmptyState>
      </div>
    </template>

    <!-- MODO GRUPO: un grupo no tiene significado propio, tono estable por nombre. Uno sin educadores
         activos no se puede elegir: no asignaría a nadie. -->
    <template v-if="mode === 'group'">
      <div v-if="activeGroups.length" class="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <button
          v-for="grupo in activeGroups"
          :key="grupo.id"
          type="button"
          data-tone="sky"
          class="select-card flex-row justify-start gap-3 px-4 py-3.5 pr-10 text-left"
          :aria-pressed="isGroupSelected(grupo.id)"
          :disabled="!miembrosActivos(grupo.id)"
          @click="toggleGroup(grupo.id)"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          <UiSymbol icon="users" size="md" :tone="uiToneFor(grupo.nombre)" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-body font-extrabold text-ink">{{ grupo.nombre }}</span>
            <span v-if="miembrosActivos(grupo.id)" class="ui-caption mt-px block">{{ tCount(t, 'wizard.groupMembers', miembrosActivos(grupo.id)) }}</span>
            <span v-else class="mt-px block text-caption font-bold text-(--tone-strong)" data-tone="coral">{{ t('wizard.groupEmpty') }}</span>
          </span>
        </button>
      </div>

      <p v-if="activeGroups.length" class="ui-caption mt-3">{{ t('wizard.groupNote') }}</p>

      <div v-else class="ui-panel">
        <UiEmptyState icon="users" :title="t('wizard.noGroups')" :text="t('wizard.noGroupsText')">
          <UiButton variant="outline" size="sm" icon="plus" to="/organizacion/educators/grupo-nuevo">{{ t('educators.newGroup') }}</UiButton>
        </UiEmptyState>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
const { activeEducators, activeGroups, getGroupMembers } = useEducators()
const { state, toggleEducator, toggleGroup } = useWorkshopWizard()

const mode = ref<'individual' | 'group'>(state.value.educatorMode || 'individual')

// Puente tipado: UiTabs habla en string; el modo es una unión cerrada.
const modeModel = computed({
  get: () => mode.value as string,
  set: v => (mode.value = v as 'individual' | 'group'),
})
const modeTabs = computed(() => [
  { value: 'individual', label: t('wizard.modeEducators') },
  { value: 'group', label: t('wizard.modeGroups') },
])

const isEducatorSelected = (id: number) => state.value.educatorIds.includes(id)
const isGroupSelected = (id: number) => state.value.groupIds.includes(id)
const miembrosActivos = (id: number) => getGroupMembers(id).length

watch(mode, (newMode) => {
  if (newMode === 'individual' && state.value.educatorMode === 'group') {
    state.value.educatorMode = 'individual'
    state.value.groupIds = []
  }
  else if (newMode === 'group' && state.value.educatorMode === 'individual') {
    state.value.educatorMode = 'group'
    state.value.educatorIds = []
  }
})
</script>
