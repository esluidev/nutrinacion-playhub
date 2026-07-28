<template>
  <div
    :draggable="!compact"
    :class="[
      'cursor-pointer transition-all duration-200',
      compact
        ? 'rounded-lg bg-white ring-1 ring-gray-100 px-2.5 py-1.5 flex items-center gap-2'
        : 'relative overflow-hidden rounded-[14px] bg-white border border-gray-200 p-3.5',
      isDragging ? 'opacity-50 scale-95' : (compact ? 'hover:shadow-md' : 'hover:shadow-lift hover:-translate-y-0.5 hover:border-brand-primary-100'),
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
      <!-- Barra de acento lateral -->
      <div :class="['absolute left-0 top-0 bottom-0 w-1', workshop.accentColor]" />
      <p class="text-[12.5px] font-extrabold text-gray-800 leading-[1.35] mb-2">{{ workshop.title }}</p>
      <p class="text-[11.5px] font-bold text-gray-600 mb-[7px]">{{ workshop.time }}</p>
      <div class="flex items-center gap-1.5">
        <div class="w-5 h-5 rounded-full bg-brand-primary-100 text-brand-primary-800 flex items-center justify-center text-[8px] font-extrabold shrink-0">
          {{ initials }}
        </div>
        <span class="text-[11px] text-gray-500 font-semibold truncate">{{ workshop.location }}</span>
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

const initials = computed(() =>
  props.workshop.educator
    .split(' ')
    .slice(0, 2)
    .map(p => p.charAt(0))
    .join('')
    .toUpperCase(),
)

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
