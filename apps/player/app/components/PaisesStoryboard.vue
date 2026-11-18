<template>
  <!-- Los países donde se ofrece un storyboard, con su bandera y el nombre al pasar el cursor. -->
  <span v-if="paises.length" class="text-body" :title="paises.map(c => paisDe(c).nombre).join(', ')">
    <span v-for="codigo in paises" :key="codigo" class="mr-1">{{ paisDe(codigo).bandera ?? codigo }}</span>
  </span>
  <span v-else class="ui-caption">Sin países</span>
</template>

<script setup lang="ts">
defineProps<{ paises: string[] }>()

const { paisDe } = useCatalogoBase()
</script>
