<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <UiLogo :show-text="false" />
        </div>
        <h1 class="text-2xl font-display font-bold text-brand-dark">
          {{ t('app.name') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ t('app.tagline') }}</p>
      </div>

      <div class="card p-8">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
</script>
