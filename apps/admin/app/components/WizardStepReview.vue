<template>
  <div>
    <!-- Success State -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div v-if="isSuccess" class="text-center py-16">
        <!-- Animated checkmark -->
        <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 animate-bounce-once">
          <svg class="w-10 h-10 text-green-500 animate-draw-check" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 class="text-xl font-display font-bold text-brand-dark mb-2">Taller creado exitosamente</h2>
        <p class="text-sm text-gray-400 mb-8">El taller ha sido programado correctamente</p>

        <!-- Navigation buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <UiButton variant="primary" class="w-full sm:w-auto" @click="navigateTo('/dashboard/planner')">
            <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Ir al Planner
          </UiButton>
          <UiButton variant="outline" class="w-full sm:w-auto" @click="navigateTo('/dashboard/workshops')">
            <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Ver Talleres
          </UiButton>
        </div>
      </div>
    </Transition>

    <!-- Review Content -->
    <div v-if="!isSuccess">
      <h2 class="text-lg font-display font-bold text-brand-dark mb-1">Resumen del Taller</h2>
      <p class="text-sm text-gray-500 mb-5">Revisa los detalles antes de crear el taller</p>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <!-- Storyboard Section -->
        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Storyboard</span>
            <button class="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-800 transition-colors" @click="goToStep(1)">
              Editar
            </button>
          </div>
          <div v-if="selectedStoryboard" class="flex items-center gap-4">
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shrink-0', selectedStoryboard.coverBg]">
              <svg class="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-brand-dark">{{ selectedStoryboard.title }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <span class="text-xs text-gray-400">{{ selectedStoryboard.category }}</span>
                <span class="text-gray-300">·</span>
                <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', planBadgeClass(selectedStoryboard.plan)]">{{ selectedStoryboard.plan }}</span>
                <span class="text-gray-300">·</span>
                <span class="text-xs text-gray-400">{{ selectedStoryboard.duration }}</span>
                <span class="text-gray-300">·</span>
                <span class="text-xs text-gray-400">{{ selectedStoryboard.scenes.length }} escenas</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100" />

        <!-- Educators/Groups Section -->
        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {{ state.educatorMode === 'group' ? 'Grupos' : 'Educadores' }}
              <span v-if="assignmentCount > 1" class="text-brand-primary">({{ assignmentCount }})</span>
            </span>
            <button class="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-800 transition-colors" @click="goToStep(2)">
              Editar
            </button>
          </div>
          <!-- Individual educators -->
          <div v-if="selectedEducators.length > 0" class="space-y-3">
            <div v-for="edu in selectedEducators" :key="edu.id" class="flex items-center gap-4">
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm shrink-0', edu.avatarBg]">
                {{ edu.initials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-brand-dark">{{ edu.nombre }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-0.5">
                  <span class="text-xs text-gray-400">{{ edu.profesion }}</span>
                  <span class="text-gray-300">·</span>
                  <span class="text-xs text-gray-400">{{ edu.email }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Groups -->
          <div v-else-if="selectedGroups.length > 0" class="space-y-3">
            <div v-for="grupo in selectedGroups" :key="grupo.id" class="flex items-center gap-4">
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', grupo.iconBg]">
                <svg :class="['w-5 h-5', grupo.iconColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-brand-dark">{{ grupo.nombre }}</p>
                <span class="text-xs text-gray-400">{{ grupo.miembros }} miembros</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100" />

        <!-- Schedule Section -->
        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horario y Ubicacion</span>
            <button class="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-800 transition-colors" @click="goToStep(3)">
              Editar
            </button>
          </div>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <div>
                <p class="text-sm font-semibold text-brand-dark">{{ formatDateLong(state.date) }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ state.timeStart || '--' }}{{ state.timeEnd ? ` - ${state.timeEnd}` : '' }}
                </p>
              </div>
            </div>

            <div v-if="state.title" class="flex items-start gap-3">
              <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <p class="text-sm text-gray-600">{{ state.title }}</p>
            </div>

            <div v-if="state.location" class="flex items-start gap-3">
              <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <p class="text-sm text-gray-600">{{ state.location }}</p>
            </div>

            <div v-if="state.capacity" class="flex items-start gap-3">
              <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <p class="text-sm text-gray-600">{{ state.capacity }} participantes</p>
            </div>

            <div v-if="state.notes" class="flex items-start gap-3">
              <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              <p class="text-sm text-gray-500 italic">{{ state.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Button -->
      <div class="mt-6">
        <UiButton
          variant="primary"
          size="lg"
          class="w-full"
          :loading="isSubmitting"
          @click="submit"
        >
          <svg v-if="!isSubmitting" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear Taller
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { planBadgeClass } = useStoryboards()
const { state, selectedStoryboard, selectedEducators, selectedGroups, isSubmitting, isSuccess, goToStep, submit, formatDateLong } = useWorkshopWizard()

const assignmentCount = computed(() =>
  state.value.educatorMode === 'individual' ? selectedEducators.value.length : selectedGroups.value.length,
)
</script>

<style scoped>
@keyframes bounce-once {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes draw-check {
  0% { stroke-dashoffset: 30; }
  100% { stroke-dashoffset: 0; }
}

.animate-bounce-once {
  animation: bounce-once 0.5s ease-out;
}

.animate-draw-check {
  stroke-dasharray: 30;
  animation: draw-check 0.5s ease-out 0.2s forwards;
  stroke-dashoffset: 30;
}
</style>
