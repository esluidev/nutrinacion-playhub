<template>
  <!-- La misma entrada que Admin y Player (UiAuthShell, DESIGN.md «Entrada»). -->
  <UiAuthShell :label="t('app.name')"><slot /></UiAuthShell>
</template>

<script setup lang="ts">
const { t } = useT()
</script>
