<template>
  <!-- Todo lo de su país y su edad, los más nuevos primero, en un card: arriba se busca por el título y se filtra por
       tema (siempre los cuatro); debajo, los juegos. -->
  <div class="flex flex-col">
    <UiPageHeader :title="t('explorar.titulo')" />
    <section class="ui-panel overflow-hidden">
      <div class="ui-panel-header flex-wrap">
        <UiSearchInput v-model="busqueda" :placeholder="t('explorar.buscar')" />
        <UiChips v-model="categoria" :items="categorias" />
      </div>
      <div v-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
      <UiEmptyState v-else-if="!lista.length" icon="search" :title="t('explorar.vacio')" />
      <div v-else class="rejilla-juegos ui-panel-body">
        <TarjetaStoryboard v-for="s in lista" :key="s.clave" :storyboard="s" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { explorar } from '~/utils/catalogo'
import { TEMAS } from '~/utils/temas'

const { t, locale } = useT()
const { catalogo, cargando } = useCatalogo()
useHead({ title: () => t('explorar.titulo') })

const route = useRoute()
const busqueda = ref('')
// Desde «Explora por tema» llega con su tema elegido (?tema=).
const categoria = ref(typeof route.query.tema === 'string' ? route.query.tema : '')
// Siempre los cuatro temas, aunque alguno no tenga juegos todavía.
const categorias = computed(() => [
  { value: '', label: t('explorar.todas') },
  ...TEMAS.map(tema => ({ value: tema.categoria, label: t(`categoria.${tema.categoria}`) })),
])
const lista = computed(() => explorar(catalogo.value.storyboards, { categoria: categoria.value || null, busqueda: busqueda.value }, locale.value))
</script>
