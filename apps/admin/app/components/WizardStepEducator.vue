<template>
  <div>
    <!-- Modo: selector de vista (educadores o grupos) -->
    <UiTabs v-model="modeModel" :items="modeTabs" fit class="mb-5" />

    <!-- MODO INDIVIDUAL: la selección en cielo (borde, marca y fondo); cada persona con su avatar -->
    <template v-if="mode === 'individual'">
      <div class="grid grid-cols-1 gap-3.5 md:grid-cols-2">
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
    </template>

    <!-- MODO GRUPO: un grupo no tiene significado propio, tono estable por nombre -->
    <template v-if="mode === 'group'">
      <div class="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <button
          v-for="grupo in activeGroups"
          :key="grupo.id"
          type="button"
          data-tone="sky"
          class="select-card flex-row justify-start gap-3 px-4 py-3.5 pr-10 text-left"
          :aria-pressed="isGroupSelected(grupo.id)"
          @click="toggleGroup(grupo.id)"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          <UiSymbol icon="users" size="md" :tone="uiToneFor(grupo.nombre)" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-body font-extrabold text-ink">{{ grupo.nombre }}</span>
            <span class="ui-caption mt-px block">{{ grupo.miembros }} educadores</span>
          </span>
        </button>
      </div>

      <p class="ui-caption mt-3">Al asignar un grupo se crea una asignación por cada educador del grupo.</p>

      <UiEmptyState
        v-if="activeGroups.length === 0"
        icon="users"
        title="No hay grupos activos"
        text="Crea grupos en la sección de Educadores"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
const { activeEducators, activeGroups } = useEducators()
const { state, toggleEducator, toggleGroup } = useWorkshopWizard()

const mode = ref<'individual' | 'group'>(state.value.educatorMode || 'individual')

// Puente tipado: UiTabs habla en string; el modo es una unión cerrada.
const modeModel = computed({
  get: () => mode.value as string,
  set: v => (mode.value = v as 'individual' | 'group'),
})
const modeTabs = [
  { value: 'individual', label: 'Educadores' },
  { value: 'group', label: 'Grupos' },
]

const isEducatorSelected = (id: number) => state.value.educatorIds.includes(id)
const isGroupSelected = (id: number) => state.value.groupIds.includes(id)

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
