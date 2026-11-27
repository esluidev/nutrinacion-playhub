<template>
  <!-- La misma entrada que Admin, Player y Educators (UiAuthShell, DESIGN.md «Entrada»): el logo con el nombre de la
       app y una tarjeta. Aquí va lo que se hace antes de jugar: el país, «¿Quién juega?» y crear o editar un perfil. -->
  <UiAuthShell :label="t('app.corto')"><slot /></UiAuthShell>
</template>

<script setup lang="ts">
const { t } = useT()
</script>
