<template>
  <div class="flex items-center justify-between gap-3.5 mb-[22px] flex-wrap">
    <div class="flex items-center gap-2.5 flex-wrap">
      <!-- Navegación de rango: mueve semanas o meses según la vista activa -->
      <div class="flex items-center bg-white border border-gray-200 rounded-[11px] overflow-hidden shrink-0">
        <button
          class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          @click="navigateRange(-1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span class="text-sm font-display font-semibold text-brand-dark px-2.5 border-x border-gray-100 leading-10 whitespace-nowrap">
          {{ rangeLabel }}
        </span>
        <button
          class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          @click="navigateRange(1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <button
        class="h-10 px-4 rounded-[10px] border-[1.5px] border-brand-primary-200 bg-brand-primary-50 text-brand-primary-800 text-[13px] font-bold hover:bg-brand-primary-100 transition-colors"
        @click="goToToday"
      >
        Hoy
      </button>

      <div class="w-px h-[22px] bg-[#dfe3e0] mx-1 hidden sm:block" />

      <!-- Filtro por estado -->
      <UiChips v-model="statusModel" :items="statusChips" class="hidden sm:flex" />
    </div>

    <div class="flex items-center gap-2.5">
      <!-- Toggle de vista -->
      <div class="flex items-center bg-white border border-gray-200 rounded-[11px] p-[3px] gap-0.5">
        <button
          :class="[
            'h-[34px] px-3.5 rounded-[8px] text-[12.5px] font-bold transition-colors',
            activeView === 'kanban' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-800',
          ]"
          @click="activeView = 'kanban'"
        >
          Semana
        </button>
        <button
          :class="[
            'h-[34px] px-3.5 rounded-[8px] text-[12.5px] font-bold transition-colors',
            activeView === 'calendar' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-800',
          ]"
          @click="activeView = 'calendar'"
        >
          Mes
        </button>
      </div>

      <UiButton class="!h-10" @click="navigateTo('/dashboard/workshops/new')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo Taller
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlannerStatus } from '~/composables/usePlanner'

const { rangeLabel, activeView, statusFilter, navigateRange, goToToday } = usePlanner()

// Puente tipado: UiChips habla en string; el filtro es una unión cerrada.
const statusModel = computed({
  get: () => statusFilter.value as string,
  set: v => (statusFilter.value = v as 'todos' | PlannerStatus),
})

const statusChips = [
  { value: 'todos', label: 'Todos' },
  { value: 'programado', label: 'Programados' },
  { value: 'completado', label: 'Completados' },
  { value: 'borrador', label: 'Borrador' },
]
</script>
