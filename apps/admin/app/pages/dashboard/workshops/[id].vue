<template>
  <div v-if="workshop">
    <!-- Header Bar -->
    <div class="card mb-6">
      <div class="px-5 py-4 flex items-center gap-4">
        <button
          class="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          @click="$router.back()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <h1 class="font-display font-bold text-brand-dark text-lg leading-snug truncate">
            {{ workshop.title }}
          </h1>
        </div>
        <UiBadge :variant="statusVariant(workshop.status)" class="shrink-0">
          {{ workshop.statusLabel }}
        </UiBadge>
        <UiButton variant="outline" size="sm" class="shrink-0">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
          Editar
        </UiButton>
        <UiButton v-if="workshop.status === 'programado'" variant="danger" size="sm" class="shrink-0">
          Cancelar Taller
        </UiButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Single card with sections -->
      <div class="lg:col-span-2">
        <div class="card">
          <!-- Storyboard Section -->
          <div class="p-6">
            <h2 class="font-display font-bold text-brand-dark text-sm mb-4">Storyboard Vinculado</h2>
            <div v-if="storyboard" class="flex items-start gap-4">
              <div :class="['w-14 h-14 rounded-xl flex items-center justify-center shrink-0', storyboard.coverBg]">
                <svg class="w-7 h-7 text-white/80" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-brand-dark mb-1">{{ storyboard.title }}</p>
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span class="text-xs text-gray-400">{{ storyboard.category }}</span>
                  <span class="text-gray-200">·</span>
                  <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', planBadgeClass]">{{ storyboard.plan }}</span>
                  <span class="text-gray-200">·</span>
                  <span class="text-xs text-gray-400">{{ storyboard.duration }}</span>
                  <span class="text-gray-200">·</span>
                  <span class="text-xs text-gray-400">{{ storyboard.scenes.length }} escenas</span>
                </div>
                <UiButton variant="outline" size="sm" @click="navigateTo('/dashboard/storyboards/' + storyboard.id)">
                  <svg class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Ver Storyboard
                </UiButton>
              </div>
            </div>
            <div v-else class="text-sm text-gray-400">Storyboard no disponible</div>
          </div>

          <div class="border-t border-gray-100" />

          <!-- Educator Section -->
          <div class="p-6">
            <h2 class="font-display font-bold text-brand-dark text-sm mb-4">Educador Asignado</h2>
            <div v-if="educator" class="flex items-start gap-4">
              <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0', educator.avatarBg]">
                {{ educator.initials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-brand-dark mb-0.5">{{ educator.nombre }}</p>
                <p class="text-xs text-gray-400 mb-2">{{ educator.profesion }}</p>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <span>{{ educator.email }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <span>{{ educator.telefono }}</span>
                  </div>
                </div>
                <div v-if="educator.grupo" class="mt-3">
                  <span class="badge badge-purple">{{ educator.grupo }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-400">Educador no asignado</div>
          </div>

          <!-- Notes Section (conditional) -->
          <template v-if="workshop.notes">
            <div class="border-t border-gray-100" />
            <div class="p-6">
              <h2 class="font-display font-bold text-brand-dark text-sm mb-3">Notas</h2>
              <p class="text-sm text-gray-500 leading-relaxed">{{ workshop.notes }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Right Column: Single sidebar card -->
      <div>
        <div class="card">
          <!-- Information -->
          <div class="p-6 space-y-4">
            <h2 class="font-display font-bold text-brand-dark text-sm">Informacion</h2>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span class="text-xs">Fecha</span>
                </div>
                <span class="text-sm font-semibold text-brand-dark">{{ formattedDate }}</span>
              </div>

              <div class="divider" />

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span class="text-xs">Horario</span>
                </div>
                <span class="text-sm font-semibold text-brand-dark">{{ workshop.time || '--' }}</span>
              </div>

              <div class="divider" />

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span class="text-xs">Ubicacion</span>
                </div>
                <span class="text-sm font-semibold text-brand-dark text-right max-w-[160px]">{{ workshop.location }}</span>
              </div>

              <div class="divider" />

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  <span class="text-xs">Capacidad</span>
                </div>
                <span class="text-sm font-semibold text-brand-dark">{{ workshop.capacity || '--' }}</span>
              </div>

              <div class="divider" />

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <span class="text-xs">Estado</span>
                </div>
                <UiBadge :variant="statusVariant(workshop.status)">
                  {{ workshop.statusLabel }}
                </UiBadge>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-100" />

          <!-- Actions -->
          <div class="p-6">
            <h2 class="font-display font-bold text-brand-dark text-sm mb-4">Acciones</h2>
            <div class="space-y-2.5">
              <UiButton variant="outline" size="sm" class="w-full justify-center">
                <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.5a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
                Duplicar Taller
              </UiButton>
              <UiButton variant="danger" size="sm" class="w-full justify-center">
                <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Eliminar Taller
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Not Found -->
  <div v-else class="card p-16 flex flex-col items-center justify-center text-center">
    <div class="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
      <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    </div>
    <h3 class="font-display font-bold text-brand-dark text-lg mb-2">Taller no encontrado</h3>
    <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
      El taller que buscas no existe o ha sido eliminado.
    </p>
    <UiButton variant="outline" size="sm" class="mt-5" @click="navigateTo('/dashboard/workshops')">
      Volver a Talleres
    </UiButton>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { getWorkshop, statusVariant } = useWorkshops()
const { getStoryboard, planBadgeClass: getPlanBadgeClass } = useStoryboards()
const { getEducator } = useEducators()

const workshopId = Number(route.params.id)
const workshop = computed(() => getWorkshop(workshopId))
const storyboard = computed(() => workshop.value ? getStoryboard(workshop.value.storyboardId) : undefined)
const educator = computed(() => workshop.value ? getEducator(workshop.value.educatorId) : undefined)

const planBadgeClass = computed(() => {
  if (!storyboard.value) return ''
  return getPlanBadgeClass(storyboard.value.plan)
})

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const formattedDate = computed(() => {
  if (!workshop.value?.date) return '--'
  const parts = workshop.value.date.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  const dayName = DAY_NAMES[d.getDay()]
  const day = d.getDate()
  const month = MONTH_NAMES[d.getMonth()]
  const year = d.getFullYear()
  return `${dayName}, ${day} de ${month} ${year}`
})
</script>
