<template>
  <div class="card mb-6">
    <!-- Row 1: Tabs/Navigation + Action Button -->
    <div class="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <slot name="tabs" />
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <!-- Row 2: Filters (optional, with divider) -->
    <div v-if="$slots.filters" class="px-4 pb-3 pt-0">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-gray-100">
        <slot name="filters" />
      </div>
    </div>
  </div>
</template>
