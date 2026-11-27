<template>
  <!-- Editar el perfil de quien juega, desde su menú («Editar mi perfil»; Luis, 2026-11-27: dentro del perfil
       elegido): con su barra y el formulario en su card. Eliminarlo lleva a «¿Quién juega?». -->
  <div class="ui-panel ui-panel-body mx-auto w-full max-w-md">
    <PerfilForm v-if="perfil" :perfil="perfil" />
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
const { perfiles } = useHogar()
const route = useRoute()
const perfil = computed(() => perfiles.value.find(p => p.id === route.params.id) ?? null)
if (!perfil.value) navigateTo('/')
useHead({ title: () => t('perfil.editar') })
</script>
