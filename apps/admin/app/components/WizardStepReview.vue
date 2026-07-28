<template>
  <div>
    <!-- Success State -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div v-if="isSuccess" class="text-center py-16">
        <div class="w-20 h-20 rounded-full bg-brand-primary-100 flex items-center justify-center mx-auto mb-5 animate-bounce-once">
          <svg class="w-10 h-10 text-brand-primary animate-draw-check" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 class="text-xl font-display font-semibold text-brand-dark mb-2">Taller creado exitosamente</h2>
        <p class="text-sm text-gray-400 mb-8">El taller ha sido programado correctamente</p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <UiButton class="w-full sm:w-auto" @click="navigateTo('/dashboard/planner')">
            Ir al Planificador
          </UiButton>
          <UiButton variant="outline" class="w-full sm:w-auto" @click="navigateTo('/dashboard/workshops')">
            Ver Talleres
          </UiButton>
        </div>
      </div>
    </Transition>

    <!-- Resumen -->
    <div v-if="!isSuccess" class="max-w-[760px] mx-auto">
      <div class="card overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-5 flex items-center justify-between gap-3.5 border-b border-gray-100">
          <div>
            <h3 class="text-[17px] font-display font-semibold text-brand-dark">Resumen del taller</h3>
            <p class="text-[12.5px] text-gray-500 font-semibold mt-0.5">Revisa los datos antes de crear el taller</p>
          </div>
          <UiBadge :variant="state.estado === 'PROGRAMADO' ? 'blue' : 'gray'" dot>
            {{ state.estado === 'PROGRAMADO' ? 'Programado' : 'Borrador' }}
          </UiBadge>
        </div>

        <!-- Storyboard -->
        <div class="px-6 py-[18px]">
          <div class="flex items-center justify-between mb-3.5">
            <span class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400">Storyboard</span>
            <a class="text-[11.5px] font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer" @click="goToStep(1)">Editar</a>
          </div>
          <div v-if="selectedStoryboard" class="flex items-center gap-[15px]">
            <div :class="['w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0', selectedStoryboard.coverBg]">
              <svg class="w-[22px] h-[22px] text-white/90" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-[15px] font-extrabold text-gray-800">{{ selectedStoryboard.title }}</p>
              <p class="text-[12.5px] font-semibold text-gray-500 mt-0.5">
                {{ selectedStoryboard.category }} · {{ selectedStoryboard.plan }} · {{ selectedStoryboard.duration }} · {{ selectedStoryboard.scenesCount }} escenas
              </p>
            </div>
          </div>
        </div>

        <!-- Educadores / Grupos -->
        <div class="border-t border-gray-100 px-6 py-[18px]">
          <div class="flex items-center justify-between mb-3.5">
            <span class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400">
              {{ state.educatorMode === 'group' ? `Grupos (${selectedGroups.length})` : `Educadores (${selectedEducators.length})` }}
            </span>
            <a class="text-[11.5px] font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer" @click="goToStep(2)">Editar</a>
          </div>
          <div class="flex flex-col gap-3">
            <template v-if="selectedEducators.length > 0">
              <div v-for="edu in selectedEducators" :key="edu.id" class="flex items-center gap-3">
                <div :class="['w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-white text-[13px] font-extrabold shrink-0', edu.avatarBg]">
                  {{ edu.initials }}
                </div>
                <div class="min-w-0">
                  <p class="text-[13.5px] font-extrabold text-gray-800">{{ edu.nombre }}</p>
                  <p class="text-[12px] font-semibold text-gray-500 mt-px">{{ edu.profesion }} · {{ edu.email }}</p>
                </div>
              </div>
            </template>
            <template v-else-if="selectedGroups.length > 0">
              <div v-for="grupo in selectedGroups" :key="grupo.id" class="flex items-center gap-3">
                <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-800 flex items-center justify-center font-extrabold text-[13px] shrink-0">
                  G
                </div>
                <div class="min-w-0">
                  <p class="text-[13.5px] font-extrabold text-gray-800">{{ grupo.nombre }}</p>
                  <p class="text-[12px] font-semibold text-gray-500 mt-px">{{ grupo.miembros }} educadores · una asignación por educador</p>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Horario y ubicación -->
        <div class="border-t border-gray-100 px-6 py-[18px]">
          <div class="flex items-center justify-between mb-3.5">
            <span class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400">Horario y ubicación</span>
            <a class="text-[11.5px] font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer" @click="goToStep(3)">Editar</a>
          </div>
          <div class="flex flex-col gap-[11px]">
            <div class="flex items-start gap-[11px]">
              <svg class="w-4 h-4 text-gray-400 mt-px shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <div>
                <p class="text-[13.5px] font-extrabold text-gray-800">{{ formatDateLong(state.date) }}</p>
                <p class="text-[12px] font-semibold text-gray-500 mt-0.5">
                  {{ state.timeStart || '—' }}{{ state.timeEnd ? ` – ${state.timeEnd}` : '' }} · fin calculado por la duración del storyboard
                </p>
              </div>
            </div>
            <div v-if="state.location" class="flex items-center gap-[11px]">
              <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <p class="text-[13px] font-semibold text-gray-700">{{ state.location }}</p>
            </div>
            <div v-if="state.notes" class="flex items-center gap-[11px]">
              <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              <p class="text-[13px] font-semibold text-gray-500 italic">{{ state.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Footer strip -->
        <div class="border-t border-gray-100 px-6 py-[15px] flex items-center gap-7 flex-wrap bg-brand-tint">
          <div class="flex items-baseline gap-[7px]">
            <span class="text-[11.5px] text-gray-400 font-bold">Modalidad</span>
            <span class="text-[12.5px] font-extrabold text-gray-700">{{ state.modalidad === 'PRESENCIAL' ? 'Presencial' : 'Asignado' }}</span>
          </div>
          <div class="flex items-baseline gap-[7px]">
            <span class="text-[11.5px] text-gray-400 font-bold">Asignaciones</span>
            <span class="text-[12.5px] font-extrabold text-gray-700">{{ assignmentCount }}</span>
          </div>
          <div v-if="state.capacity" class="flex items-baseline gap-[7px]">
            <span class="text-[11.5px] text-gray-400 font-bold">Capacidad</span>
            <span class="text-[12.5px] font-extrabold text-gray-700">{{ state.capacity }} participantes</span>
          </div>
          <div v-if="selectedStoryboard" class="flex items-baseline gap-[7px]">
            <span class="text-[11.5px] text-gray-400 font-bold">Duración</span>
            <span class="text-[12.5px] font-extrabold text-gray-700">{{ selectedStoryboard.duration }}</span>
          </div>
        </div>
      </div>

      <!-- Nota según estado -->
      <div
        :class="[
          'flex items-start gap-[11px] mt-3.5 px-4 py-[13px] rounded-[13px] text-[12.5px] font-semibold leading-relaxed',
          state.estado === 'PROGRAMADO' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600',
        ]"
      >
        <svg class="w-[17px] h-[17px] shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <p>
          {{ state.estado === 'PROGRAMADO'
            ? 'Al programar el taller, los educadores asignados recibirán la sesión en su app de StoryPlay.'
            : 'El borrador se guarda en Talleres; podrás completar fecha y educadores más adelante.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { state, selectedStoryboard, selectedEducators, selectedGroups, selectedGroupsMembers, isSuccess, goToStep, formatDateLong } = useWorkshopWizard()

// Un grupo genera una asignación por cada miembro.
const assignmentCount = computed(() =>
  state.value.educatorMode === 'group' ? selectedGroupsMembers.value.length : selectedEducators.value.length,
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
