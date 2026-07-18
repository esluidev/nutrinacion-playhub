<template>
  <div>
    <!-- Toolbar -->
    <UiPageToolbar>
      <template #tabs>
        <UiChips v-model="activeTab" :items="tabItems" />
      </template>

      <template #actions>
        <UiButton v-if="activeTab === 'educadores'" variant="primary" size="sm" @click="showAddEducator = true">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Agregar Educador
        </UiButton>
        <UiButton v-else variant="primary" size="sm" @click="showCreateGroup = true">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear Grupo
        </UiButton>
      </template>

      <template v-if="activeTab === 'educadores'" #filters>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <UiSearchInput v-model="searchQuery" placeholder="Buscar educador..." max-width="full" />

          <select v-model="filterProfesion" class="input">
            <option value="">Todas las profesiones</option>
            <option value="Nutriologa">Nutriologa</option>
            <option value="Educador en Salud">Educador en Salud</option>
            <option value="Psicologa Infantil">Psicologa Infantil</option>
            <option value="Chef Educativo">Chef Educativo</option>
            <option value="Pedagoga">Pedagoga</option>
          </select>

          <select v-model="filterEstado" class="input">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <select v-model="filterGrupo" class="input">
            <option value="">Todos los grupos</option>
            <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.nombre">{{ grupo.nombre }}</option>
          </select>
        </div>
      </template>
    </UiPageToolbar>

    <!-- EDUCADORES TAB -->
    <div v-if="activeTab === 'educadores'">

      <!-- Educators Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="educator in paginatedEducators"
          :key="educator.id"
          class="card card-hover overflow-hidden group"
        >
          <!-- Colored top accent -->
          <div :class="['h-1', educator.accentColor]" />

          <!-- Card Body -->
          <div class="p-5">
            <div class="flex items-start gap-4">
              <!-- Avatar -->
              <div
                :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white font-display font-bold text-sm', educator.avatarBg]"
              >
                {{ educator.initials }}
              </div>

              <!-- Info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h3 class="text-sm font-bold text-brand-dark truncate">{{ educator.nombre }}</h3>
                    <p class="text-xs text-gray-400 mt-0.5">{{ educator.profesion }}</p>
                  </div>
                  <!-- Status Badge -->
                  <UiBadge :variant="educator.estado === 'activo' ? 'green' : 'gray'" dot class="shrink-0">
                    {{ educator.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                  </UiBadge>
                </div>
              </div>
            </div>

            <!-- Contact & Details -->
            <div class="mt-4 space-y-2">
              <div class="flex items-center gap-2.5 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span class="truncate">{{ educator.email }}</span>
              </div>
              <div class="flex items-center gap-2.5 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                <span>{{ educator.telefono }}</span>
              </div>

              <div class="flex items-center gap-3 pt-2">
                <UiBadge v-if="educator.grupo" variant="blue">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  {{ educator.grupo }}
                </UiBadge>
                <UiBadge variant="purple">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  {{ educator.talleres }} talleres
                </UiBadge>
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
            <UiButton variant="outline" size="sm">Ver Perfil</UiButton>
            <div class="flex items-center gap-0.5">
              <button
                class="p-2 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary-50 transition-colors"
                title="Editar"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
              </button>
              <button
                class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="paginatedEducators.length === 0"
        class="card p-16 text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-gray-600">No se encontraron educadores</p>
        <p class="text-xs text-gray-400 mt-1">Intenta ajustar los filtros de busqueda</p>
        <UiButton variant="ghost" size="sm" class="mt-4" @click="resetFilters">Limpiar filtros</UiButton>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
        <p class="text-xs text-gray-400">
          Pagina <span class="font-semibold text-brand-dark">{{ educatorPage }}</span> de <span class="font-semibold text-brand-dark">{{ educatorTotalPages }}</span>
          · {{ filteredEducators.length }} educadores
        </p>
        <div class="flex items-center gap-1.5">
          <UiButton variant="outline" size="sm" :disabled="educatorPage === 1" @click="educatorPage--">Anterior</UiButton>
          <button
            v-for="page in educatorVisiblePages"
            :key="page"
            :class="[
              'w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors',
              page === educatorPage
                ? 'bg-brand-dark text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            ]"
            @click="educatorPage = page"
          >
            {{ page }}
          </button>
          <UiButton variant="outline" size="sm" :disabled="educatorPage === educatorTotalPages" @click="educatorPage++">Siguiente</UiButton>
        </div>
      </div>
    </div>

    <!-- GRUPOS TAB -->
    <div v-if="activeTab === 'grupos'">
      <!-- Groups Card Grid -->
      <div v-if="paginatedGroups.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="grupo in paginatedGroups"
          :key="grupo.id"
          class="card card-hover overflow-hidden group"
        >
          <!-- Card Body -->
          <div class="p-5">
            <!-- Header: Icon + Name + Status -->
            <div class="flex items-start gap-3.5 mb-3">
              <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', grupo.iconBg]">
                <svg xmlns="http://www.w3.org/2000/svg" :class="['w-5 h-5', grupo.iconColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-bold text-brand-dark truncate">{{ grupo.nombre }}</h3>
                  <UiBadge :variant="grupo.estado === 'activo' ? 'green' : 'gray'" dot class="shrink-0">
                    {{ grupo.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                  </UiBadge>
                </div>
                <p class="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{{ grupo.descripcion }}</p>
              </div>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-3 mb-4">
              <UiBadge variant="purple">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {{ grupo.miembros }} miembros
              </UiBadge>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
            <UiButton variant="outline" size="sm">Ver Grupo</UiButton>
            <div class="flex items-center gap-0.5">
              <button
                class="p-2 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary-50 transition-colors"
                title="Editar"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
              </button>
              <button
                class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="card p-16 flex flex-col items-center justify-center text-center"
      >
        <div class="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <h3 class="font-display font-bold text-brand-dark text-lg mb-2">No hay grupos</h3>
        <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
          Crea un grupo para organizar a los educadores por zona o especialidad.
        </p>
        <UiButton variant="primary" size="sm" class="mt-5" @click="showCreateGroup = true">
          Crear Grupo
        </UiButton>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
        <p class="text-xs text-gray-400">
          Pagina <span class="font-semibold text-brand-dark">{{ groupPage }}</span> de <span class="font-semibold text-brand-dark">{{ groupTotalPages }}</span>
          · {{ grupos.length }} grupos
        </p>
        <div class="flex items-center gap-1.5">
          <UiButton variant="outline" size="sm" :disabled="groupPage === 1" @click="groupPage--">Anterior</UiButton>
          <button
            v-for="page in groupVisiblePages"
            :key="page"
            :class="[
              'w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors',
              page === groupPage
                ? 'bg-brand-dark text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            ]"
            @click="groupPage = page"
          >
            {{ page }}
          </button>
          <UiButton variant="outline" size="sm" :disabled="groupPage === groupTotalPages" @click="groupPage++">Siguiente</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const activeTab = ref<'educadores' | 'grupos'>('educadores')
const searchQuery = ref('')
const filterProfesion = ref('')
const filterEstado = ref('')
const filterGrupo = ref('')
const showAddEducator = ref(false)
const showCreateGroup = ref(false)
const perPage = 12

// Educator pagination
const educatorPage = ref(1)
// Group pagination
const groupPage = ref(1)

const tabItems = computed(() => [
  { value: 'educadores', label: 'Educadores', count: educators.value.length },
  { value: 'grupos', label: 'Grupos', count: grupos.value.length },
])

function resetFilters() {
  searchQuery.value = ''
  filterProfesion.value = ''
  filterEstado.value = ''
  filterGrupo.value = ''
  educatorPage.value = 1
}

const { educators, groups: grupos } = useEducators()

const filteredEducators = computed(() => {
  return educators.value.filter((educator) => {
    const matchesSearch = searchQuery.value === ''
      || educator.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())
      || educator.email.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesProfesion = filterProfesion.value === ''
      || educator.profesion === filterProfesion.value

    const matchesEstado = filterEstado.value === ''
      || educator.estado === filterEstado.value

    const matchesGrupo = filterGrupo.value === ''
      || educator.grupo === filterGrupo.value

    return matchesSearch && matchesProfesion && matchesEstado && matchesGrupo
  })
})

// Educator pagination computeds
const educatorTotalPages = computed(() => Math.max(1, Math.ceil(filteredEducators.value.length / perPage)))

const educatorVisiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, educatorPage.value - 2)
  const end = Math.min(educatorTotalPages.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const paginatedEducators = computed(() => {
  const start = (educatorPage.value - 1) * perPage
  return filteredEducators.value.slice(start, start + perPage)
})

watch([searchQuery, filterProfesion, filterEstado, filterGrupo], () => {
  educatorPage.value = 1
})

// Group pagination computeds
const groupTotalPages = computed(() => Math.max(1, Math.ceil(grupos.value.length / perPage)))

const groupVisiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, groupPage.value - 2)
  const end = Math.min(groupTotalPages.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const paginatedGroups = computed(() => {
  const start = (groupPage.value - 1) * perPage
  return grupos.value.slice(start, start + perPage)
})
</script>
