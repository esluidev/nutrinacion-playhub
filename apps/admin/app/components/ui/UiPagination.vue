<template>
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <span class="text-xs text-gray-400">{{ t('table.showing', { desde, hasta, total }) }}</span>

    <div class="flex items-center gap-1">
      <button
        type="button"
        :disabled="page <= 1"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        @click="$emit('update:page', page - 1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      <template v-for="(it, i) in pageItems" :key="i">
        <span v-if="it === '...'" class="w-8 h-8 flex items-center justify-center text-gray-300 text-sm select-none">…</span>
        <button
          v-else
          type="button"
          :class="[
            'min-w-8 h-8 px-2 rounded-lg text-sm font-semibold transition-colors',
            it === page ? 'bg-brand-dark text-white' : 'text-gray-500 hover:bg-gray-100',
          ]"
          @click="$emit('update:page', it as number)"
        >
          {{ it }}
        </button>
      </template>

      <button
        type="button"
        :disabled="page >= totalPages"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        @click="$emit('update:page', page + 1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
const props = defineProps<{ page: number, total: number, pageSize: number }>()
defineEmits<{ 'update:page': [page: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const desde = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const hasta = computed(() => Math.min(props.page * props.pageSize, props.total))

// Botones de página con elipsis: 1 … (cur-1) cur (cur+1) … N
const pageItems = computed<(number | '...')[]>(() => {
  const tp = totalPages.value
  const cur = props.page
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)

  const items: (number | '...')[] = [1]
  const left = Math.max(2, cur - 1)
  const right = Math.min(tp - 1, cur + 1)
  if (left > 2) items.push('...')
  for (let i = left; i <= right; i++) items.push(i)
  if (right < tp - 1) items.push('...')
  items.push(tp)
  return items
})
</script>
