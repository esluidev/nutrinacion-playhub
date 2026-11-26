<template>
  <!-- El runner del taller, con el mismo patrón que el del dispositivo (`/play/…?mode=device`): un modo en inglés.
       `?mode=live`, ejecutar el taller con el grupo, el día del taller; `?mode=rehearsal`, ensayarlo, cualquier día, sin
       que nada quede anotado (RunnerDelTaller). Sin modo, o uno desconocido, es un ensayo: lo que no anota nada. -->
  <RunnerDelTaller :id="String(route.params.id)" :ensayo="route.query.mode !== 'live'" />
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
</script>
