<template>
  <div class="app-main grid min-h-dvh place-items-center bg-canvas py-10">
    <div class="w-full max-w-[420px]">
      <div class="mb-8 flex justify-center"><UiLogo size="lg" :label="t('app.name')" /></div>
      <div class="ui-panel ui-panel-body"><slot /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
</script>
