<template>
  <div>
    <h2 class="text-lg font-display font-bold text-brand-dark mb-1">Fecha, Hora y Ubicacion</h2>
    <p class="text-sm text-gray-500 mb-5">Configura cuando y donde se impartira el taller</p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Title -->
        <UiInput
          id="wizard-title"
          v-model="state.title"
          label="Nombre del Taller"
          placeholder="Ej: El Plato Saludable - Grupo A"
          required
        />

        <!-- Date & Time -->
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Fecha y Hora
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UiInput
              id="wizard-date"
              v-model="state.date"
              label="Fecha"
              type="date"
              required
            />
            <UiInput
              id="wizard-time-start"
              :model-value="state.timeStart"
              label="Hora Inicio"
              type="time"
              required
              @update:model-value="onTimeStartChange($event)"
            />
            <UiInput
              id="wizard-time-end"
              v-model="state.timeEnd"
              label="Hora Fin"
              type="time"
            />
          </div>

          <!-- Notes about auto-filled values -->
          <div v-if="hasPreselectedDate" class="mt-3 flex items-center gap-2 text-xs text-brand-primary-600">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            Fecha pre-seleccionada desde el planner
          </div>

          <div v-if="state.timeEnd && selectedStoryboard" class="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Hora fin calculada automaticamente ({{ selectedStoryboard.duration }})
          </div>
        </div>

        <!-- Location -->
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Ubicacion
          </h3>

          <div class="space-y-4">
            <UiInput
              id="wizard-location"
              v-model="state.location"
              label="Lugar"
              placeholder="Ej: Aula 3A, Centro Comunitario"
            />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Capacidad Maxima</label>
                <input
                  v-model="state.capacity"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="25"
                  class="input w-full"
                >
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Notas Adicionales</label>
              <textarea
                v-model="state.notes"
                rows="3"
                placeholder="Instrucciones especiales, materiales necesarios, etc."
                class="input w-full !h-auto py-2.5 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Preview sidebar -->
      <div class="space-y-4">
        <!-- Storyboard preview -->
        <div v-if="selectedStoryboard" class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Storyboard</span>
            <button
              class="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-800 transition-colors"
              @click="goToStep(1)"
            >
              Cambiar
            </button>
          </div>
          <div class="flex items-center gap-3">
            <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0', selectedStoryboard.coverBg]">
              <svg class="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-brand-dark truncate">{{ selectedStoryboard.title }}</p>
              <p class="text-xs text-gray-400">{{ selectedStoryboard.category }} · {{ selectedStoryboard.duration }}</p>
            </div>
          </div>
        </div>

        <!-- Educators preview (individual) -->
        <div v-if="selectedEducators.length > 0" class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Educadores
              <span v-if="selectedEducators.length > 1" class="text-brand-primary">({{ selectedEducators.length }})</span>
            </span>
            <button
              class="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-800 transition-colors"
              @click="goToStep(2)"
            >
              Cambiar
            </button>
          </div>
          <div class="space-y-2.5">
            <div v-for="edu in selectedEducators" :key="edu.id" class="flex items-center gap-3">
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-bold text-[10px] shrink-0', edu.avatarBg]">
                {{ edu.initials }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-brand-dark truncate">{{ edu.nombre }}</p>
                <p class="text-xs text-gray-400">{{ edu.profesion }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Groups preview -->
        <div v-else-if="selectedGroups.length > 0" class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Grupos
              <span v-if="selectedGroups.length > 1" class="text-brand-primary">({{ selectedGroups.length }})</span>
            </span>
            <button
              class="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-800 transition-colors"
              @click="goToStep(2)"
            >
              Cambiar
            </button>
          </div>
          <div class="space-y-2.5">
            <div v-for="grupo in selectedGroups" :key="grupo.id" class="flex items-center gap-3">
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', grupo.iconBg]">
                <svg :class="['w-4 h-4', grupo.iconColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-brand-dark truncate">{{ grupo.nombre }}</p>
                <p class="text-xs text-gray-400">{{ grupo.miembros }} miembros</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { state, selectedStoryboard, selectedEducators, selectedGroups, hasPreselectedDate, onTimeStartChange, goToStep } = useWorkshopWizard()
</script>
