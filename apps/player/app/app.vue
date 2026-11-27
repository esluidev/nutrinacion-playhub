<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToaster />
</template>

<script setup lang="ts">
// La versión nueva de la app instalada: el aviso con «Actualizar», solo en la gestión (nunca en el runner ni al unirse
// a un taller, donde está un niño).
useActualizacionApp(() => ({ mensaje: 'Hay una versión nueva de la app.', accion: 'Actualizar' }), ruta => ruta.startsWith('/play') || ruta.startsWith('/workshop'))
</script>
