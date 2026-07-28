<template>
  <div>
    <!-- Toggle de modo -->
    <div class="flex items-center bg-white border border-gray-200 rounded-[11px] p-[3px] gap-0.5 w-fit mb-[18px]">
      <button
        :class="[
          'h-[34px] px-4 rounded-[8px] text-[12.5px] font-bold transition-colors',
          mode === 'individual' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-800',
        ]"
        @click="mode = 'individual'"
      >
        Educadores
      </button>
      <button
        :class="[
          'h-[34px] px-4 rounded-[8px] text-[12.5px] font-bold transition-colors',
          mode === 'group' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-800',
        ]"
        @click="mode = 'group'"
      >
        Grupos
      </button>
    </div>

    <!-- MODO INDIVIDUAL -->
    <template v-if="mode === 'individual'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <button
          v-for="edu in activeEducators"
          :key="edu.id"
          :class="[
            'flex items-center gap-3 rounded-[14px] px-4 py-3.5 border-[1.5px] text-left transition-all duration-150',
            isEducatorSelected(edu.id)
              ? 'bg-brand-primary-50 border-brand-primary'
              : 'bg-white border-gray-200 hover:border-brand-primary-200',
          ]"
          @click="toggleEducator(edu.id)"
        >
          <div :class="['w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold shrink-0', edu.avatarBg]">
            {{ edu.initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[13.5px] font-extrabold text-gray-800 truncate">{{ edu.nombre }}</p>
            <p class="text-[12px] font-semibold text-gray-500 mt-px">{{ edu.profesion }} · {{ edu.grupo }}</p>
          </div>
          <!-- Checkbox -->
          <div
            :class="[
              'w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-all',
              isEducatorSelected(edu.id) ? 'bg-brand-primary' : 'border-2 border-[#dfe3e0]',
            ]"
          >
            <svg v-if="isEducatorSelected(edu.id)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </button>
      </div>
    </template>

    <!-- MODO GRUPO -->
    <template v-if="mode === 'group'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <button
          v-for="grupo in activeGroups"
          :key="grupo.id"
          :class="[
            'flex items-center gap-3 rounded-[14px] px-4 py-3.5 border-[1.5px] text-left transition-all duration-150',
            isGroupSelected(grupo.id)
              ? 'bg-brand-primary-50 border-brand-primary'
              : 'bg-white border-gray-200 hover:border-brand-primary-200',
          ]"
          @click="toggleGroup(grupo.id)"
        >
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-800 flex items-center justify-center shrink-0">
            <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[13.5px] font-extrabold text-gray-800 truncate">{{ grupo.nombre }}</p>
            <p class="text-[12px] font-semibold text-gray-500 mt-px">{{ grupo.miembros }} educadores</p>
          </div>
          <!-- Checkbox -->
          <div
            :class="[
              'w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-all',
              isGroupSelected(grupo.id) ? 'bg-brand-primary' : 'border-2 border-[#dfe3e0]',
            ]"
          >
            <svg v-if="isGroupSelected(grupo.id)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </button>
      </div>

      <p class="text-[12px] text-gray-400 font-semibold mt-3">Al asignar un grupo se crea una asignación por cada educador del grupo.</p>

      <div v-if="activeGroups.length === 0" class="text-center py-12">
        <p class="text-sm font-bold text-gray-600">No hay grupos activos</p>
        <p class="text-xs text-gray-400 mt-1">Crea grupos en la sección de Educadores</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { activeEducators, activeGroups } = useEducators()
const { state, toggleEducator, toggleGroup } = useWorkshopWizard()

const mode = ref<'individual' | 'group'>(state.value.educatorMode || 'individual')

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
