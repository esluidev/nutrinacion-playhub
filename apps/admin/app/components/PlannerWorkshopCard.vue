<template>
  <div
    :draggable="!compact"
    :class="[
      'rounded-xl cursor-pointer transition-all duration-200 ring-1 ring-gray-100 bg-white',
      isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md hover:-translate-y-0.5',
      compact ? 'px-2.5 py-1.5 flex items-center gap-2' : 'p-3',
    ]"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="onClick"
  >
    <template v-if="compact">
      <div :class="['w-2 h-2 rounded-full shrink-0', workshop.accentColor]" />
      <span class="text-[11px] font-semibold text-brand-dark truncate">{{ workshop.title }}</span>
      <span class="text-[10px] text-gray-400 shrink-0 ml-auto">{{ workshop.time.split(' - ')[0] }}</span>
    </template>

    <template v-else>
      <div :class="['w-full h-1.5 rounded-full mb-2.5', workshop.accentColor]" />
      <p class="text-xs font-bold text-brand-dark leading-snug mb-2">{{ workshop.title }}</p>
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="text-[11px] text-gray-500 font-medium">{{ workshop.time }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <span class="text-[11px] text-gray-500 truncate">{{ workshop.educator }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span class="text-[11px] text-gray-500 truncate">{{ workshop.location }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PlannerWorkshop } from '~/composables/usePlanner'

const props = defineProps<{
  workshop: PlannerWorkshop
  compact?: boolean
}>()

const isDragging = ref(false)
const didDrag = ref(false)

function onDragStart(e: DragEvent) {
  isDragging.value = true
  didDrag.value = true
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', String(props.workshop.id))
}

function onDragEnd() {
  isDragging.value = false
}

function onClick() {
  if (didDrag.value) {
    didDrag.value = false
    return
  }
  navigateTo('/dashboard/workshops/' + props.workshop.id)
}
</script>
