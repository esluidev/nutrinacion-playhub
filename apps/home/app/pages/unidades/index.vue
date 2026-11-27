<template>
  <!-- Todas las unidades de estudio de su país y su edad, cada una con su collage de portadas. -->
  <div class="flex flex-col">
    <UiPageHeader :title="t('unidades.titulo')" />
    <div v-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
    <section v-else class="ui-panel">
      <UiEmptyState v-if="!catalogo.unidades.length" icon="layers" :title="t('inicio.vacio')" />
      <div v-else class="rejilla-unidades ui-panel-body">
        <TarjetaUnidad v-for="u in catalogo.unidades" :key="u.id" :unidad="u" :storyboards="catalogo.storyboards" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
const { catalogo, cargando } = useCatalogo()
useHead({ title: () => t('unidades.titulo') })
</script>
