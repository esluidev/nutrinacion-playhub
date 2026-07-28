<template>
  <div>
    <UiPageHeader title="Educadores" description="Tu equipo y sus grupos de trabajo">
      <template #actions>
        <UiButton variant="outline" @click="navigateTo('/dashboard/educators/grupo-nuevo')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Grupo
        </UiButton>
        <UiButton @click="navigateTo('/dashboard/educators/nuevo')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Agregar Educador
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Toolbar: segmented toggle + search + filters -->
    <div class="flex items-center justify-between gap-3.5 mb-[22px] flex-wrap">
      <div class="flex items-center bg-white border border-gray-200 rounded-[11px] p-[3px] gap-0.5">
        <button
          v-for="tab in tabItems"
          :key="tab.value"
          :class="[
            'h-[34px] px-4 rounded-[8px] text-[12.5px] font-bold transition-colors',
            activeTab === tab.value ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-800',
          ]"
          @click="activeTab = tab.value as 'educadores' | 'grupos'"
        >
          {{ tab.label }} · {{ tab.count }}
        </button>
      </div>
      <div v-if="activeTab === 'educadores'" class="flex items-center gap-2.5">
        <UiSearchInput v-model="searchQuery" placeholder="Buscar educador…" max-width="xs" class="!w-[220px]" />
        <UiSelect v-model="filterEstado" variant="toolbar" prefix="Estado" :options="estadoOptions" />
      </div>
    </div>

    <!-- EDUCADORES TAB -->
    <div v-if="activeTab === 'educadores'">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[22px]">
        <div
          v-for="educator in filteredEducators"
          :key="educator.id"
          class="card card-interactive p-[22px]"
        >
          <div class="flex items-center gap-3.5 mb-[18px]">
            <div :class="['w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 text-white font-extrabold text-[15px]', educator.avatarBg]">
              {{ educator.initials }}
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-[15px] font-extrabold text-gray-800 truncate">{{ educator.nombre }}</h3>
              <p class="text-[12.5px] font-semibold text-gray-500 mt-0.5">{{ educator.profesion }}</p>
            </div>
            <UiBadge :variant="educator.estado === 'activo' ? 'green' : 'gray'" dot class="shrink-0">
              {{ educator.estado === 'activo' ? 'Activo' : 'Inactivo' }}
            </UiBadge>
          </div>

          <div class="flex flex-col gap-2 p-3.5 bg-brand-tint rounded-[12px] border border-gray-100">
            <div class="flex items-center gap-2.5 text-[12.5px] font-semibold text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <span class="truncate">{{ educator.email }}</span>
            </div>
            <div class="flex items-center gap-2.5 text-[12.5px] font-semibold text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              {{ educator.telefono }}
            </div>
          </div>

          <div class="flex items-center gap-2 mt-3.5">
            <span class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-gray-100 text-gray-600">{{ educator.grupo }}</span>
            <span class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-brand-primary-50 text-brand-primary-800">{{ educator.talleres }} talleres</span>
          </div>
        </div>
      </div>

      <div v-if="!filteredEducators.length" class="card p-16 text-center">
        <p class="text-sm font-bold text-gray-600">No se encontraron educadores</p>
        <p class="text-xs text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
        <UiButton variant="ghost" size="sm" class="mt-4" @click="resetFilters">Limpiar filtros</UiButton>
      </div>
    </div>

    <!-- GRUPOS TAB -->
    <div v-if="activeTab === 'grupos'">
      <div v-if="grupos.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[22px]">
        <div
          v-for="grupo in grupos"
          :key="grupo.id"
          class="card card-interactive p-[22px]"
        >
          <div class="flex items-start gap-3.5 mb-3">
            <div :class="['w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0', grupo.iconBg]">
              <svg xmlns="http://www.w3.org/2000/svg" :class="['w-5 h-5', grupo.iconColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-[15px] font-extrabold text-gray-800 truncate">{{ grupo.nombre }}</h3>
                <UiBadge :variant="grupo.estado === 'activo' ? 'green' : 'gray'" dot class="shrink-0">
                  {{ grupo.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                </UiBadge>
              </div>
              <p class="text-[12.5px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{{ grupo.descripcion }}</p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-brand-purple-50 text-brand-purple-700">
            {{ grupo.miembros }} miembros
          </span>
        </div>
      </div>

      <div v-else class="card p-16 text-center">
        <h3 class="font-display font-semibold text-brand-dark text-lg mb-2">No hay grupos</h3>
        <p class="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
          Crea un grupo para organizar a los educadores por zona o especialidad.
        </p>
        <UiButton class="mt-5" @click="navigateTo('/dashboard/educators/grupo-nuevo')">Crear Grupo</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const activeTab = ref<'educadores' | 'grupos'>('educadores')
const searchQuery = ref('')
const filterEstado = ref('')

const estadoOptions = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'inactivo', label: 'Inactivos' },
]

const { educators, groups: grupos } = useEducators()

const tabItems = computed(() => [
  { value: 'educadores', label: 'Educadores', count: educators.value.length },
  { value: 'grupos', label: 'Grupos', count: grupos.value.length },
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
