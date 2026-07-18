<template>
  <div>
    <h2 class="text-lg font-display font-bold text-brand-dark mb-1">Asignar Educadores</h2>
    <p class="text-sm text-gray-500 mb-5">Selecciona uno o mas educadores individuales o grupos completos</p>

    <!-- Mode toggle -->
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
        <button
          :class="[
            'px-4 py-2 rounded-md text-xs font-semibold transition-all duration-200',
            mode === 'individual'
              ? 'bg-white text-brand-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ]"
          @click="mode = 'individual'"
        >
          <svg class="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          Individual
        </button>
        <button
          :class="[
            'px-4 py-2 rounded-md text-xs font-semibold transition-all duration-200',
            mode === 'group'
              ? 'bg-white text-brand-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ]"
          @click="mode = 'group'"
        >
          <svg class="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          Grupo
        </button>
      </div>

      <!-- Selection count badge -->
      <div v-if="selectionCount > 0" class="flex items-center gap-2">
        <span class="text-xs font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">
          {{ selectionCount }} seleccionado{{ selectionCount > 1 ? 's' : '' }}
        </span>
        <button
          class="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          @click="clearSelection"
        >
          Limpiar
        </button>
      </div>
    </div>

    <!-- Selected chips -->
    <div v-if="selectionCount > 0" class="flex flex-wrap gap-2 mb-5">
      <!-- Educator chips -->
      <template v-if="mode === 'individual'">
        <div
          v-for="edu in selectedEducators"
          :key="edu.id"
          class="flex items-center gap-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg px-3 py-1.5"
        >
          <div :class="['w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold', edu.avatarBg]">
            {{ edu.initials }}
          </div>
          <span class="text-xs font-semibold text-brand-dark">{{ edu.nombre }}</span>
          <button class="text-gray-400 hover:text-brand-primary transition-colors ml-0.5" @click="toggleEducator(edu.id)">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </template>
      <!-- Group chips -->
      <template v-else>
        <div
          v-for="grupo in selectedGroups"
          :key="grupo.id"
          class="flex items-center gap-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg px-3 py-1.5"
        >
          <div :class="['w-5 h-5 rounded flex items-center justify-center', grupo.iconBg]">
            <svg :class="['w-3 h-3', grupo.iconColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <span class="text-xs font-semibold text-brand-dark">{{ grupo.nombre }}</span>
          <UiBadge variant="blue" class="!text-[9px] !px-1.5 !py-0">{{ grupo.miembros }}</UiBadge>
          <button class="text-gray-400 hover:text-brand-primary transition-colors ml-0.5" @click="toggleGroup(grupo.id)">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </template>
    </div>

    <!-- INDIVIDUAL MODE -->
    <template v-if="mode === 'individual'">
      <!-- Search -->
      <UiSearchInput v-model="search" placeholder="Buscar por nombre, profesion..." max-width="full" class="mb-5" />

      <!-- Educator Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="edu in filteredEducators"
          :key="edu.id"
          :class="[
            'text-left card overflow-hidden group relative',
            isEducatorSelected(edu.id)
              ? '!border-brand-primary ring-1 ring-brand-primary/30'
              : 'card-interactive',
          ]"
          @click="toggleEducator(edu.id)"
        >
          <!-- Accent top bar -->
          <div :class="['h-1', edu.accentColor]" />

          <div class="bg-white p-5">
            <div class="flex items-start gap-4">
              <!-- Avatar -->
              <div class="relative shrink-0">
                <div
                  :class="['w-10 h-10 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm', edu.avatarBg]"
                >
                  {{ edu.initials }}
                </div>
                <!-- Selected checkmark on avatar -->
                <div
                  v-if="isEducatorSelected(edu.id)"
                  class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center border-2 border-white"
                >
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-brand-dark truncate">{{ edu.nombre }}</h3>
                <p class="text-xs text-gray-400 mt-0.5">{{ edu.profesion }}</p>

                <!-- Contact -->
                <div class="mt-3 space-y-1.5">
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <span class="truncate">{{ edu.email }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <span>{{ edu.telefono }}</span>
                  </div>
                </div>

                <!-- Badges -->
                <div class="flex items-center gap-2 mt-3">
                  <UiBadge v-if="edu.grupo" variant="blue">
                    {{ edu.grupo }}
                  </UiBadge>
                  <UiBadge variant="purple">
                    {{ edu.talleres }} talleres
                  </UiBadge>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="filteredEducators.length === 0" class="text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-600">No se encontraron educadores</p>
        <p class="text-xs text-gray-400 mt-1">Intenta con otros terminos de busqueda</p>
        <button class="text-xs font-semibold text-brand-primary hover:text-brand-primary-800 mt-3" @click="search = ''">
          Limpiar busqueda
        </button>
      </div>
    </template>

    <!-- GROUP MODE -->
    <template v-if="mode === 'group'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="grupo in activeGroups"
          :key="grupo.id"
          :class="[
            'w-full text-left card overflow-hidden group/card',
            isGroupSelected(grupo.id)
              ? '!border-brand-primary ring-1 ring-brand-primary/30'
              : 'card-interactive',
          ]"
          @click="toggleGroup(grupo.id)"
        >
          <div class="bg-white p-5">
            <div class="flex items-start gap-4">
              <!-- Group Icon -->
              <div class="relative shrink-0">
                <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', grupo.iconBg]">
                  <svg :class="['w-5 h-5', grupo.iconColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <!-- Selected checkmark -->
                <div
                  v-if="isGroupSelected(grupo.id)"
                  class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center border-2 border-white"
                >
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              </div>

              <!-- Group Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-brand-dark">{{ grupo.nombre }}</h3>
                  <UiBadge variant="blue">
                    {{ grupo.miembros }} miembros
                  </UiBadge>
                </div>
                <p class="text-xs text-gray-400 mt-1 line-clamp-2">{{ grupo.descripcion }}</p>

                <!-- Members preview -->
                <div class="flex items-center gap-1.5 mt-3">
                  <div
                    v-for="member in getGroupMembers(grupo.nombre).slice(0, 4)"
                    :key="member.id"
                    :class="['w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold', member.avatarBg]"
                    :title="member.nombre"
                  >
                    {{ member.initials }}
                  </div>
                  <span
                    v-if="getGroupMembers(grupo.nombre).length > 4"
                    class="text-[10px] text-gray-400 font-semibold ml-1"
                  >
                    +{{ getGroupMembers(grupo.nombre).length - 4 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- Empty state for groups -->
      <div v-if="activeGroups.length === 0" class="text-center py-12">
        <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-600">No hay grupos activos</p>
        <p class="text-xs text-gray-400 mt-1">Crea grupos en la seccion de Educadores</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { activeEducators, activeGroups, getGroupMembers } = useEducators()
const { state, selectedEducators, selectedGroups, toggleEducator, toggleGroup } = useWorkshopWizard()

const search = ref('')
const mode = ref<'individual' | 'group'>(state.value.educatorMode || 'individual')

const isEducatorSelected = (id: number) => state.value.educatorIds.includes(id)
const isGroupSelected = (id: number) => state.value.groupIds.includes(id)

const selectionCount = computed(() =>
  mode.value === 'individual' ? state.value.educatorIds.length : state.value.groupIds.length,
)

function clearSelection() {
  if (mode.value === 'individual') {
    state.value.educatorIds = []
  }
  else {
    state.value.groupIds = []
  }
}

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

const filteredEducators = computed(() => {
  if (!search.value.trim()) return activeEducators.value
  const q = search.value.toLowerCase()
  return activeEducators.value.filter(edu =>
    edu.nombre.toLowerCase().includes(q)
    || edu.profesion.toLowerCase().includes(q),
  )
})
</script>
