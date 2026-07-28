<template>
  <div>
    <!-- Desktop: 7 columnas, cuerpo tintado por día (verde si es hoy) -->
    <div class="hidden lg:grid lg:grid-cols-7 gap-3.5">
      <div
        v-for="day in weekDays"
        :key="day.key"
        class="flex flex-col min-h-[460px]"
      >
        <!-- Day Header -->
        <div class="flex items-center gap-2 h-8 mb-2.5 px-1">
          <span
            v-if="day.isToday"
            class="w-[30px] h-[30px] rounded-[10px] bg-brand-primary text-white inline-flex items-center justify-center text-sm font-display font-semibold"
          >
            {{ day.date }}
          </span>
          <span v-else class="text-base font-display font-semibold text-brand-dark px-1">
            {{ day.date }}
          </span>
          <span
            :class="[
              'text-[11px] font-extrabold uppercase tracking-[0.08em]',
              day.isToday ? 'text-brand-primary-700' : 'text-gray-400',
            ]"
          >
            {{ day.shortName }}
          </span>
          <span
            v-if="day.isToday"
            class="ml-auto text-[10px] font-extrabold text-brand-primary-700 tracking-[0.06em]"
          >
            HOY
          </span>
        </div>

        <!-- Day Body (Drop Zone) -->
        <div
          :class="[
            'flex-1 rounded-2xl p-2.5 flex flex-col gap-2.5 transition-colors',
            dragOverDate === day.fecha
              ? 'bg-brand-primary-50 ring-[1.5px] ring-inset ring-brand-primary ring-dashed'
              : day.isToday
                ? 'bg-[#ecf7ee] ring-[1.5px] ring-inset ring-brand-primary-200'
                : 'bg-[#eceef0]',
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

          <!-- Agregar -->
          <button
            class="w-full py-[11px] rounded-[12px] border-[1.5px] border-dashed border-brand-primary-100 flex items-center justify-center gap-1.5 text-gray-400 hover:border-brand-primary hover:text-brand-primary-700 hover:bg-brand-primary-50/60 transition-all group"
            @click="navigateTo('/dashboard/workshops/new?date=' + day.fecha)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="text-[11.5px] font-bold">Agregar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile: lista vertical -->
    <div class="lg:hidden space-y-4">
      <div
        v-for="day in weekDays"
        :key="'m-' + day.key"
      >
        <!-- Day Header -->
        <div class="flex items-center gap-2.5 px-1 mb-2">
          <span
            v-if="day.isToday"
            class="w-[30px] h-[30px] rounded-[10px] bg-brand-primary text-white inline-flex items-center justify-center text-sm font-display font-semibold"
          >
            {{ day.date }}
          </span>
          <span v-else class="text-base font-display font-semibold text-brand-dark">
            {{ day.date }}
          </span>
          <p :class="['text-[11px] font-extrabold uppercase tracking-[0.08em]', day.isToday ? 'text-brand-primary-700' : 'text-gray-400']">
            {{ day.fullName }}
          </p>
          <span
            v-if="day.workshops.length > 0"
            class="ml-auto text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
          >
            {{ day.workshops.length }}
          </span>
        </div>

        <!-- Day Body -->
        <div
          :class="[
            'rounded-2xl p-2.5 flex flex-col gap-2.5',
            day.isToday ? 'bg-[#ecf7ee] ring-[1.5px] ring-inset ring-brand-primary-200' : 'bg-[#eceef0]',
          ]"
        >
          <PlannerWorkshopCard
            v-for="ws in day.workshops"
            :key="'m-' + ws.id"
            :workshop="ws"
          />

          <button
            class="w-full py-[11px] rounded-[12px] border-[1.5px] border-dashed border-brand-primary-100 flex items-center justify-center gap-1.5 text-gray-400 hover:border-brand-primary hover:text-brand-primary-700 transition-all"
            @click="navigateTo('/dashboard/workshops/new?date=' + day.fecha)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="text-[11.5px] font-bold">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { weekDays, moveWorkshop } = usePlanner()

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
