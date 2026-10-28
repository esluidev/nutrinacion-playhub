<template>
  <!-- Acceso: fondo del kit sin decoración (el color se reserva para lo que significa algo). -->
  <div class="flex min-h-screen items-center justify-center bg-canvas p-6">
    <div class="w-full max-w-[420px]">
      <div class="mb-9 text-center">
        <div class="mb-5 flex justify-center">
          <UiLogo :show-text="false" size="lg" />
        </div>
        <h1 class="ui-heading">
          {{ t('app.name') }}
        </h1>
        <p class="ui-text mt-2">{{ t('app.tagline') }}</p>
      </div>

      <div class="ui-panel p-9">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
</script>
