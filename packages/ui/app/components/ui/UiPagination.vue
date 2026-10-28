<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <span class="ui-caption">{{ labels.showing(desde, hasta, total) }}</span>
    <nav class="ui-pagination" :aria-label="labels.next">
      <button type="button" class="ui-page" :disabled="page <= 1" :aria-label="labels.previous" @click="$emit('update:page', page - 1)">
        <UiIcon name="chevron-left" class="size-4" />
      </button>
      <template v-for="(it, i) in pageItems" :key="i">
        <span v-if="it === '...'" class="ui-page pointer-events-none" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="ui-page"
          :aria-current="it === page ? 'page' : undefined"
          @click="$emit('update:page', it)"
        >
          {{ it }}
        </button>
      </template>
      <button type="button" class="ui-page" :disabled="page >= totalPages" :aria-label="labels.next" @click="$emit('update:page', page + 1)">
        <UiIcon name="chevron-right" class="size-4" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ page: number, total: number, pageSize: number }>()
defineEmits<{ 'update:page': [page: number] }>()

const labels = useUiLabels()
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const desde = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const hasta = computed(() => Math.min(props.page * props.pageSize, props.total))

// 1 … (actual-1) actual (actual+1) … N
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
