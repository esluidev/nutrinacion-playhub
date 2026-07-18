<template>
  <div>
    <!-- Desktop: 7 columns -->
    <div class="hidden lg:grid lg:grid-cols-7 gap-3">
      <div
        v-for="day in weekDays"
        :key="day.key"
        class="flex flex-col min-h-[440px] rounded-2xl shadow-sm overflow-hidden"
      >
        <!-- Day Header -->
        <div
          :class="[
            'px-3 py-3 text-center border border-b-0 transition-colors rounded-t-2xl',
            day.isToday
              ? 'bg-brand-primary border-brand-primary'
              : 'bg-white border-gray-100'
          ]"
        >
          <p
            :class="[
              'text-[10px] font-bold uppercase tracking-widest',
              day.isToday ? 'text-white/70' : 'text-gray-400'
            ]"
          >
            {{ day.shortName }}
          </p>
          <p
            :class="[
              'text-xl font-display font-bold mt-0.5',
              day.isToday ? 'text-white' : 'text-brand-dark'
            ]"
          >
            {{ day.date }}
          </p>
        </div>

        <!-- Day Column Body (Drop Zone) -->
        <div
          :class="[
            'flex-1 rounded-b-2xl border border-gray-100 border-t-0 p-2.5 space-y-2.5 transition-colors',
            dragOverDate === day.fecha ? 'bg-green-50 !border-green-300 border-dashed' : 'bg-white',
          ]"
          @dragover.prevent="onDragOver(day.fecha)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, day.fecha)"
        >
          <PlannerWorkshopCard
            v-for="ws in day.workshops"
            :key="ws.id"
            :workshop="ws"
          />

          <!-- Add Button -->
          <button
            v-if="day.workshops.length === 0"
            class="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 hover:border-brand-primary/40 hover:bg-brand-primary-50/50 transition-all duration-200 group"
            @click="navigateTo('/dashboard/workshops/new?date=' + day.fecha)"
          >
            <div class="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-primary-100 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span class="text-[10px] text-gray-400 group-hover:text-brand-primary font-semibold transition-colors">Agregar</span>
          </button>

          <!-- Small add button when column has workshops -->
          <button
            v-if="day.workshops.length > 0"
            class="w-full py-2 rounded-lg border border-dashed border-gray-200 flex items-center justify-center hover:border-brand-primary/40 hover:bg-brand-primary-50/50 transition-all group"
            @click="navigateTo('/dashboard/workshops/new?date=' + day.fecha)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile: Vertical List -->
    <div class="lg:hidden space-y-4">
      <div
        v-for="day in weekDays"
        :key="'m-' + day.key"
      >
        <!-- Day Header -->
        <div
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-t-2xl border border-b-0 shadow-sm',
            day.isToday
              ? 'bg-brand-primary border-brand-primary'
              : 'bg-white border-gray-100'
          ]"
        >
          <span
            :class="[
              'text-xl font-display font-bold',
              day.isToday ? 'text-white' : 'text-brand-dark'
            ]"
          >
            {{ day.date }}
          </span>
          <div>
            <p
              :class="[
                'text-sm font-semibold',
                day.isToday ? 'text-white' : 'text-brand-dark'
              ]"
            >
              {{ day.fullName }}
            </p>
            <p
              v-if="day.isToday"
              class="text-[11px] text-white/60 font-semibold"
            >
              Hoy
            </p>
          </div>
          <span
            v-if="day.workshops.length > 0"
            :class="[
              'ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full',
              day.isToday ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ day.workshops.length }}
          </span>
        </div>

        <!-- Day Body -->
        <div class="bg-white rounded-b-2xl border border-gray-100 border-t-0 p-3.5 space-y-3">
          <div
            v-for="ws in day.workshops"
            :key="'m-' + ws.id"
            class="rounded-xl ring-1 ring-gray-100 p-4 flex gap-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            @click="navigateTo('/dashboard/workshops/' + ws.id)"
          >
            <div :class="['w-1.5 rounded-full shrink-0', ws.accentColor]" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-brand-dark mb-1.5">{{ ws.title }}</p>
              <div class="flex flex-wrap gap-x-4 gap-y-1.5">
                <div class="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span class="text-xs text-gray-500">{{ ws.time }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span class="text-xs text-gray-500">{{ ws.educator }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span class="text-xs text-gray-500">{{ ws.location }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State + Add -->
          <button
            v-if="day.workshops.length === 0"
            class="w-full py-8 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2.5 hover:border-brand-primary/40 hover:bg-brand-primary-50/50 transition-all duration-200 group"
            @click="navigateTo('/dashboard/workshops/new?date=' + day.fecha)"
          >
            <div class="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-brand-primary-100 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span class="text-xs text-gray-400 group-hover:text-brand-primary font-semibold transition-colors">Agregar taller</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { weekDays, moveWorkshop, openAddModal } = usePlanner()

const dragOverDate = ref<string | null>(null)

function onDragOver(fecha: string) {
  dragOverDate.value = fecha
}

function onDragLeave() {
  dragOverDate.value = null
}

function onDrop(e: DragEvent, fecha: string) {
  dragOverDate.value = null
  const workshopId = Number(e.dataTransfer?.getData('text/plain'))
  if (workshopId) {
    moveWorkshop(workshopId, fecha)
  }
}
</script>
